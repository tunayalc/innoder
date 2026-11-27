import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ZipArchive } from 'archiver';
import ExcelJS from 'exceljs';
import type { Config } from '../config.js';
import { withTransaction, type Db, type QueryDb } from '../db.js';
import { authUser, type AuthGuard } from '../auth.js';
import { appendAudit } from '../audit.js';
import { mapApplication, mapDocument } from '../mappers.js';
import {
  readStoredFile,
  removeStoredFile,
  storeUpload,
  sanitizeFileName,
} from '../storage.js';
import {
  checkRevision,
  csvCell,
  HttpError,
  missingFields,
  pagination,
  personalInfoSchema,
  stageForType,
} from '../workflow.js';
import { applicationPdf } from '../pdf.js';

const stages = z.enum(['application_stage', 'erasmus_stage', 'returned_home']);
const documentTypes = z.enum([
  'identity',
  'form',
  'extra',
  'agreement',
  'activity_agreement',
  'commitment_letter',
  'photo_activity_report',
  'visa_payment_receipt_original',
  'boarding_pass_outbound',
  'boarding_pass_return',
]);
const physicalTypes = new Set([
  'activity_agreement',
  'commitment_letter',
  'boarding_pass_outbound',
  'boarding_pass_return',
]);
const appSelect = `SELECT a.*, a.program_snapshot->>'name' AS program_name, a.program_snapshot AS program,
  (SELECT u.email FROM users u WHERE u.id=a.user_id) AS candidate_email,
  (SELECT u.phone FROM users u WHERE u.id=a.user_id) AS candidate_phone,
  (SELECT u.event_link FROM users u WHERE u.id=a.user_id) AS candidate_event_link FROM applications a`;
const canAccess = (request: FastifyRequest, owner: string) =>
  authUser(request).role !== 'candidate' || authUser(request).id === owner;
const idParam = (params: unknown) => {
  const result = z.object({ id: z.uuid() }).safeParse(params);
  if (!result.success) throw new HttpError(400, 'Başvuru kimliği geçersiz.');
  return result.data.id;
};
const loadDocuments = async (db: QueryDb, ids: string[]) => {
  const result = ids.length
    ? await db.query(
        'SELECT * FROM documents WHERE application_id = ANY($1::uuid[]) AND is_current ORDER BY uploaded_at',
        [ids],
      )
    : { rows: [] };
  const grouped = new Map<string, ReturnType<typeof mapDocument>[]>();
  for (const row of result.rows)
    grouped.set(row.application_id, [
      ...(grouped.get(row.application_id) || []),
      mapDocument(row),
    ]);
  return grouped;
};
const loadApplication = async (db: QueryDb, id: string) => {
  const result = await db.query(`${appSelect} WHERE a.id = $1`, [id]);
  if (!result.rows[0]) throw new HttpError(404, 'Başvuru bulunamadı.');
  return mapApplication(
    result.rows[0],
    (await loadDocuments(db, [id])).get(id) || [],
  );
};
const lockedApplication = async (
  db: QueryDb,
  request: FastifyRequest,
  id: string,
) => {
  const result = await db.query(
    'SELECT * FROM applications WHERE id = $1 FOR UPDATE',
    [id],
  );
  const row = result.rows[0];
  if (!row || !canAccess(request, row.user_id))
    throw new HttpError(404, 'Başvuru bulunamadı.');
  checkRevision(request, row);
  return row;
};
const requiredMissing = async (
  db: QueryDb,
  row: Record<string, any>,
  stage: string,
) => {
  const uploaded = await db.query(
    "SELECT DISTINCT type, requirement_key FROM documents WHERE application_id = $1 AND is_current AND status NOT IN ('missing', 'wrong_format')",
    [row.id],
  );
  const types = new Set(uploaded.rows.map(item => item.type));
  const keys = new Set(uploaded.rows.map(item => item.requirement_key));
  return (
    row.program_snapshot.checklist as Array<{
      documentType?: string;
      key?: string;
      label?: string;
      requiredStage?: string;
    }>
  )
    .filter(
      item =>
        (item.documentType !== 'extra' || item.key) &&
        (item.requiredStage || stageForType(item.documentType)) === stage,
    )
    .filter(item =>
      item.key ? !keys.has(item.key) : !types.has(item.documentType),
    )
    .map(item => (item.key ? item.label || item.key : item.documentType))
    .filter((type): type is string => Boolean(type));
};
const filters = (query: unknown, user?: ReturnType<typeof authUser>) => {
  const parsed = z
    .object({
      status: stages.optional(),
      decisionStatus: z.enum(['active', 'rejected']).optional(),
      programId: z.uuid().optional(),
      userId: z.uuid().optional(),
      q: z.string().max(200).optional(),
      applicationIds: z.string().optional(),
      hasIssues: z.enum(['true', 'false']).optional(),
      createdAfterISO: z.iso.datetime().optional(),
      createdBeforeISO: z.iso.datetime().optional(),
    })
    .safeParse(query);
  if (!parsed.success) throw new HttpError(400, 'Filtreler geçersiz.');
  const values: unknown[] = [],
    where: string[] = [];
  const add = (value: unknown, expression: (position: number) => string) => {
    values.push(value);
    where.push(expression(values.length));
  };
  if (user?.role === 'candidate') add(user.id, p => `a.user_id = $${p}`);
  else if (parsed.data.userId) add(parsed.data.userId, p => `a.user_id=$${p}`);
  if (parsed.data.status) add(parsed.data.status, p => `a.stage = $${p}`);
  if (parsed.data.decisionStatus)
    add(parsed.data.decisionStatus, p => `a.decision_status = $${p}`);
  if (parsed.data.programId)
    add(parsed.data.programId, p => `a.program_id = $${p}`);
  if (parsed.data.q)
    add(
      `%${parsed.data.q}%`,
      p =>
        `(a.id::text ILIKE $${p} OR a.program_snapshot->>'name' ILIKE $${p} OR EXISTS(SELECT 1 FROM users u WHERE u.id = a.user_id AND (u.name ILIKE $${p} OR u.email ILIKE $${p})))`,
    );
  if (parsed.data.createdAfterISO)
    add(parsed.data.createdAfterISO, p => `a.created_at >= $${p}`);
  if (parsed.data.createdBeforeISO)
    add(parsed.data.createdBeforeISO, p => `a.created_at <= $${p}`);
  if (parsed.data.hasIssues !== undefined) {
    const issues = `(EXISTS(SELECT 1 FROM documents d WHERE d.application_id=a.id AND d.is_current AND d.status IN ('missing','wrong_format'))
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(a.program_snapshot->'checklist') AS required(item)
        WHERE (item->>'documentType'<>'extra' OR item ? 'key') AND (a.stage<>'application_stage' OR COALESCE(item->>'requiredStage',CASE WHEN item->>'documentType' IN ('boarding_pass_outbound','boarding_pass_return','photo_activity_report') THEN 'erasmus_stage' ELSE 'application_stage' END)='application_stage')
        AND NOT EXISTS(SELECT 1 FROM documents d WHERE d.application_id=a.id AND d.is_current AND d.status='ok'
          AND (CASE WHEN item ? 'key' THEN d.requirement_key=item->>'key' ELSE d.type=item->>'documentType' END))))`;
    where.push(parsed.data.hasIssues === 'true' ? issues : `NOT ${issues}`);
  }
  if (parsed.data.applicationIds) {
    const ids = parsed.data.applicationIds.split(',');
    if (
      !ids.length ||
      ids.length > 100 ||
      ids.some(id => !z.uuid().safeParse(id).success)
    )
      throw new HttpError(400, 'Başvuru seçimi geçersiz.');
    add(ids, p => `a.id = ANY($${p}::uuid[])`);
  }
  return { values, clause: where.length ? `WHERE ${where.join(' AND ')}` : '' };
};

export const registerApplicationRoutes = (
  app: FastifyInstance,
  { db, config, guard }: { db: Db; config: Config; guard: AuthGuard },
) => {
  app.get(
    '/api/applications',
    { preHandler: guard.authenticate },
    async request => {
      const { values, clause } = filters(request.query, authUser(request));
      const page = pagination(request.query);
      const counts = page.paged
        ? (
            await db.query(
              `SELECT count(*)::integer AS total,
      count(*) FILTER(WHERE stage='application_stage')::integer AS application_stage,
      count(*) FILTER(WHERE stage='erasmus_stage')::integer AS erasmus_stage,
      count(*) FILTER(WHERE stage='returned_home')::integer AS returned_home FROM applications a ${clause}`,
              values,
            )
          ).rows[0]
        : null;
      const total = counts?.total || 0;
      const result = await db.query(
        `${appSelect} ${clause} ORDER BY a.updated_at DESC, a.id ${
          page.paged
            ? `LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
            : ''
        }`,
        page.paged
          ? [...values, page.pageSize, (page.page - 1) * page.pageSize]
          : values,
      );
      const documents = await loadDocuments(
        db,
        result.rows.map(row => row.id),
      );
      const items = result.rows.map(row =>
        mapApplication(row, documents.get(row.id) || []),
      );
      return page.paged
        ? {
            items,
            total,
            page: page.page,
            pageSize: page.pageSize,
            stageCounts: {
              application_stage: counts.application_stage,
              erasmus_stage: counts.erasmus_stage,
              returned_home: counts.returned_home,
            },
          }
        : items;
    },
  );
  app.get(
    '/api/applications/:id',
    { preHandler: guard.authenticate },
    async request => {
      const application = await loadApplication(db, idParam(request.params));
      if (!canAccess(request, String(application.userId)))
        throw new HttpError(404, 'Başvuru bulunamadı.');
      return application;
    },
  );
  app.post(
    '/api/applications',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const body = z
        .object({ programId: z.uuid(), userId: z.uuid().optional() })
        .safeParse(request.body);
      if (!body.success) throw new HttpError(400, 'Program bilgisi geçersiz.');
      const actor = authUser(request),
        owner = actor.role === 'candidate' ? actor.id : body.data.userId;
      if (!owner) throw new HttpError(400, 'Aday seçilmelidir.');
      const id = await withTransaction(db, async client => {
        const candidate = (
          await client.query(
            "SELECT * FROM users WHERE id = $1 AND role = 'candidate' AND status IN ('active','pending') FOR SHARE",
            [owner],
          )
        ).rows[0];
        const program = (
          await client.query(
            'SELECT * FROM programs WHERE id = $1 AND active FOR SHARE',
            [body.data.programId],
          )
        ).rows[0];
        if (!candidate || !program)
          throw new HttpError(404, 'Aday veya program bulunamadı.');
        const personal = {
          fullName: candidate.name,
          birthDate: candidate.birth_date,
          nationality: candidate.nationality,
          identityType: candidate.identity_type,
          identityNumber: candidate.identity_number,
          passportNumber: candidate.passport_number,
          pnrNumber: candidate.pnr_number,
          programSelection: program.id,
        };
        const snapshot = {
          id: program.id,
          name: program.name,
          year: program.year,
          steps: program.steps,
          deadlines: program.deadlines,
          checklist: program.checklist,
          commonMistakes: program.common_mistakes,
          revision: program.revision,
          createdAt: program.created_at,
          updatedAt: program.updated_at,
          createdByUserId: program.created_by_user_id,
        };
        const result = await client.query(
          `INSERT INTO applications(user_id, program_id, personal_info, program_snapshot) VALUES ($1,$2,$3,$4) ON CONFLICT(user_id, program_id) DO UPDATE SET updated_at = applications.updated_at RETURNING id`,
          [
            owner,
            program.id,
            JSON.stringify(personal),
            JSON.stringify(snapshot),
          ],
        );
        await appendAudit(client, request, {
          actorUserId: actor.id,
          action: 'application_created',
          entityType: 'application',
          entityId: result.rows[0].id,
        });
        return result.rows[0].id as string;
      });
      return reply.code(201).send(await loadApplication(db, id));
    },
  );
  app.patch(
    '/api/applications/:id/personal-info',
    { preHandler: guard.authenticate },
    async request => {
      const id = idParam(request.params),
        parsed = personalInfoSchema.safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(
          400,
          'Kişisel bilgiler geçersiz.',
          'VALIDATION',
          parsed.error.issues,
        );
      await withTransaction(db, async client => {
        await lockedApplication(client, request, id);
        const { revision: _revision, ...patch } = parsed.data;
        await client.query(
          'UPDATE applications SET personal_info = personal_info || $1::jsonb WHERE id = $2',
          [JSON.stringify(patch), id],
        );
        await appendAudit(client, request, {
          actorUserId: authUser(request).id,
          action: 'personal_info_updated',
          entityType: 'application',
          entityId: id,
        });
      });
      return loadApplication(db, id);
    },
  );
  app.post(
    '/api/applications/:id/submit',
    { preHandler: guard.authenticate },
    async request => {
      const id = idParam(request.params);
      await withTransaction(db, async client => {
        const row = await lockedApplication(client, request, id);
        if (
          row.stage !== 'application_stage' ||
          row.decision_status === 'rejected'
        )
          throw new HttpError(
            409,
            'Bu başvuru mevcut aşamasında gönderilemez.',
          );
        const fields = missingFields(row.personal_info),
          documents = await requiredMissing(client, row, 'application_stage');
        if (fields.length || documents.length)
          throw new HttpError(
            400,
            'Başvuru için eksik bilgileri ve belgeleri tamamlayın.',
            'APPLICATION_INCOMPLETE',
            { missingFields: fields, missingDocumentTypes: documents },
          );
        await client.query(
          'UPDATE applications SET submitted_at = COALESCE(submitted_at, now()) WHERE id = $1',
          [id],
        );
        await appendAudit(client, request, {
          actorUserId: authUser(request).id,
          action: 'application_submitted',
          entityType: 'application',
          entityId: id,
        });
      });
      return loadApplication(db, id);
    },
  );
  app.patch(
    '/api/applications/:id/stage',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async request => {
      const id = idParam(request.params),
        body = z.object({ stage: stages }).safeParse(request.body);
      if (!body.success) throw new HttpError(400, 'Aşama bilgisi geçersiz.');
      await withTransaction(db, async client => {
        const row = await lockedApplication(client, request, id);
        const next: Record<string, string> = {
          application_stage: 'erasmus_stage',
          erasmus_stage: 'returned_home',
        };
        if (
          next[row.stage] !== body.data.stage ||
          !row.submitted_at ||
          row.decision_status === 'rejected'
        )
          throw new HttpError(
            409,
            'Gönderilmiş ve aktif başvurular yalnızca sırasıyla ilerletilebilir.',
          );
        const missing = await requiredMissing(
          client,
          row,
          body.data.stage === 'returned_home'
            ? 'erasmus_stage'
            : 'application_stage',
        );
        if (missing.length)
          throw new HttpError(
            409,
            'İlgili aşamanın belgeleri tamamlanmalıdır.',
            'DOCUMENTS_INCOMPLETE',
            { missingDocumentTypes: missing },
          );
        await client.query('UPDATE applications SET stage = $1 WHERE id = $2', [
          body.data.stage,
          id,
        ]);
        if (body.data.stage === 'returned_home')
          await client.query('DELETE FROM application_blood_groups WHERE application_id = $1', [id]);
        await appendAudit(client, request, {
          actorUserId: authUser(request).id,
          action: 'application_stage_changed',
          entityType: 'application',
          entityId: id,
          metadata: body.data,
        });
      });
      return loadApplication(db, id);
    },
  );
  app.patch(
    '/api/applications/:id/decision',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async request => {
      const id = idParam(request.params),
        body = z
          .object({
            status: z.enum(['active', 'rejected']),
            reason: z.string().trim().max(2000).optional(),
          })
          .safeParse(request.body);
      if (
        !body.success ||
        (body.data.status === 'rejected' && !body.data.reason)
      )
        throw new HttpError(400, 'Ret kararı için gerekçe zorunludur.');
      await withTransaction(db, async client => {
        await lockedApplication(client, request, id);
        await client.query(
          'UPDATE applications SET decision_status = $1, decision_reason = $2 WHERE id = $3',
          [
            body.data.status,
            body.data.status === 'rejected' ? body.data.reason : null,
            id,
          ],
        );
        if (body.data.status === 'rejected')
          await client.query('DELETE FROM application_blood_groups WHERE application_id = $1', [id]);
        await appendAudit(client, request, {
          actorUserId: authUser(request).id,
          action: 'application_decision_changed',
          entityType: 'application',
          entityId: id,
          metadata: body.data,
        });
      });
      return loadApplication(db, id);
    },
  );
  app.post(
    '/api/applications/:id/request-fix',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async request => {
      const id = idParam(request.params),
        parsed = z
          .object({ message: z.string().trim().min(1).max(4000) })
          .safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(400, 'Düzeltme açıklaması gereklidir.');
      await withTransaction(db, async client => {
        await lockedApplication(client, request, id);
        await client.query(
          'INSERT INTO messages(application_id, thread_key, sender_id, sender_role, content) VALUES($1::uuid,$1::text,$2,$3,$4)',
          [id, authUser(request).id, 'admin', parsed.data.message],
        );
        await appendAudit(client, request, {
          actorUserId: authUser(request).id,
          action: 'application_fix_requested',
          entityType: 'application',
          entityId: id,
        });
      });
      return loadApplication(db, id);
    },
  );
  app.post(
    '/api/applications/:id/documents/:type',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const params = z
        .object({ id: z.uuid(), type: documentTypes })
        .safeParse(request.params);
      const query = z
        .object({
          requirement: z
            .string()
            .regex(/^custom_[a-z0-9]{6,32}$/)
            .optional(),
        })
        .safeParse(request.query);
      if (
        !params.success ||
        !query.success ||
        (query.data.requirement && params.data.type !== 'extra')
      )
        throw new HttpError(400, 'Belge türü geçersiz.');
      const requirement = query.data.requirement;
      const owner = (
        await db.query('SELECT user_id FROM applications WHERE id = $1', [
          params.data.id,
        ])
      ).rows[0];
      if (!owner || !canAccess(request, owner.user_id))
        throw new HttpError(404, 'Başvuru bulunamadı.');
      const key = request.headers['idempotency-key'];
      if (
        key !== undefined &&
        (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{12,100}$/.test(key))
      )
        throw new HttpError(400, 'Yükleme anahtarı geçersiz.');
      const file = await request.file();
      if (!file) throw new HttpError(400, 'Dosya seçilmedi.');
      let stored: Awaited<ReturnType<typeof storeUpload>> | undefined,
        retained = false;
      try {
        stored = await storeUpload(
          config.FILE_STORAGE_PATH,
          params.data.id,
          file,
        );
        const saved = stored;
        const result = await withTransaction(db, async client => {
          const application = await lockedApplication(
            client,
            request,
            params.data.id,
          );
          if (
            requirement &&
            !(
              application.program_snapshot.checklist as Array<{ key?: string }>
            ).some(item => item.key === requirement)
          )
            throw new HttpError(400, 'Bu belge artık istenmiyor.');
          if (key) {
            const previous = (
              await client.query(
                'SELECT * FROM documents WHERE application_id = $1 AND type = $2 AND upload_key = $3',
                [params.data.id, params.data.type, key],
              )
            ).rows[0];
            if (previous) {
              if (previous.content_hash !== saved.contentHash)
                throw new HttpError(
                  409,
                  'Bu yükleme anahtarı başka bir dosya için kullanıldı.',
                );
              return previous;
            }
          }
          const version = Number(
            (
              await client.query(
                'SELECT COALESCE(max(version),0) + 1 AS next FROM documents WHERE application_id = $1 AND type = $2',
                [params.data.id, params.data.type],
              )
            ).rows[0].next,
          );
          if (params.data.type !== 'extra')
            await client.query(
              'UPDATE documents SET is_current = false WHERE application_id = $1 AND type = $2 AND is_current',
              [params.data.id, params.data.type],
            );
          if (requirement)
            await client.query(
              'UPDATE documents SET is_current = false WHERE application_id = $1 AND requirement_key = $2 AND is_current',
              [params.data.id, requirement],
            );
          const inserted = await client.query(
            `INSERT INTO documents(application_id,type,file_name,storage_path,mime_type,size_bytes,page_count,physical_delivery_status,version,upload_key,content_hash,requirement_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
            [
              params.data.id,
              params.data.type,
              saved.safeFileName,
              saved.relativePath,
              file.mimetype,
              saved.sizeBytes,
              saved.pageCount,
              physicalTypes.has(params.data.type)
                ? 'awaiting_original'
                : 'not_required',
              version,
              key || null,
              saved.contentHash,
              requirement || null,
            ],
          );
          await appendAudit(client, request, {
            actorUserId: authUser(request).id,
            action: 'document_uploaded',
            entityType: 'document',
            entityId: inserted.rows[0].id,
            metadata: { type: params.data.type, version, requirement },
          });
          return inserted.rows[0];
        });
        retained = result.storage_path === stored.relativePath;
        return reply.code(retained ? 201 : 200).send(mapDocument(result));
      } catch (error) {
        if (error instanceof HttpError) throw error;
        if (
          (error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE' ||
          (error as { statusCode?: number }).statusCode === 413
        )
          throw new HttpError(413, 'Dosya 20 MB sınırını aşıyor.');
        request.log.warn({ err: error }, 'Document upload failed');
        throw new HttpError(
          400,
          error instanceof Error ? error.message : 'Dosya yüklenemedi.',
        );
      } finally {
        if (stored && !retained)
          await removeStoredFile(config.FILE_STORAGE_PATH, stored.relativePath);
      }
    },
  );
  app.get(
    '/api/applications/:id/documents/history',
    { preHandler: guard.authenticate },
    async request => {
      const id = idParam(request.params),
        application = await loadApplication(db, id);
      if (!canAccess(request, String(application.userId)))
        throw new HttpError(404, 'Başvuru bulunamadı.');
      const result = await db.query(
        'SELECT * FROM documents WHERE application_id = $1 ORDER BY uploaded_at DESC, id DESC',
        [id],
      );
      return result.rows.map(mapDocument);
    },
  );
  for (const action of ['verify', 'physical-delivery'] as const)
    app.patch(
      `/api/applications/:applicationId/documents/:documentId/${action}`,
      { preHandler: guard.authorize('admin', 'super_admin') },
      async request => {
        const params = z
          .object({ applicationId: z.uuid(), documentId: z.uuid() })
          .safeParse(request.params);
        if (!params.success)
          throw new HttpError(400, 'Belge kimliği geçersiz.');
        return withTransaction(db, async client => {
          const row = (
            await client.query(
              'SELECT * FROM documents WHERE id = $1 AND application_id = $2 FOR UPDATE',
              [params.data.documentId, params.data.applicationId],
            )
          ).rows[0];
          if (!row) throw new HttpError(404, 'Belge bulunamadı.');
          checkRevision(request, row);
          let result;
          if (action === 'verify') {
            const body = z
              .object({
                status: z.enum(['ok', 'missing', 'wrong_format', 'unread']),
                note: z.string().max(2000).default(''),
              })
              .safeParse(request.body);
            if (!body.success)
              throw new HttpError(400, 'Doğrulama bilgisi geçersiz.');
            result = await client.query(
              'UPDATE documents SET status=$1,verify_note=$2,verified_at=now(),verified_by_user_id=$3 WHERE id=$4 RETURNING *',
              [body.data.status, body.data.note, authUser(request).id, row.id],
            );
          } else {
            const body = z
              .object({ status: z.enum(['awaiting_original', 'delivered']) })
              .safeParse(request.body);
            if (
              !body.success ||
              row.physical_delivery_status === 'not_required'
            )
              throw new HttpError(
                400,
                'Asıl teslimi gereken belge seçilmelidir.',
              );
            result = await client.query(
              "UPDATE documents SET physical_delivery_status=$1,physical_delivered_at=CASE WHEN $1='delivered' THEN now() ELSE NULL END,physical_delivered_by_user_id=CASE WHEN $1='delivered' THEN $2::uuid ELSE NULL END WHERE id=$3 RETURNING *",
              [body.data.status, authUser(request).id, row.id],
            );
          }
          await appendAudit(client, request, {
            actorUserId: authUser(request).id,
            action: `document_${action}`,
            entityType: 'document',
            entityId: row.id,
          });
          return mapDocument(result.rows[0]);
        });
      },
    );
  app.get(
    '/api/documents/:id/download',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const result = await db.query(
        'SELECT d.*,a.user_id FROM documents d JOIN applications a ON a.id=d.application_id WHERE d.id=$1',
        [idParam(request.params)],
      );
      const row = result.rows[0];
      if (!row || !canAccess(request, row.user_id))
        throw new HttpError(404, 'Belge bulunamadı.');
      return reply
        .header('Cache-Control', 'private, no-store')
        .type(row.mime_type)
        .header(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`,
        )
        .send(readStoredFile(config.FILE_STORAGE_PATH, row.storage_path));
    },
  );
  app.get(
    '/api/applications/:id/pdf/:kind',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const params = z
        .object({ id: z.uuid(), kind: z.enum(['cv', 'motivation']) })
        .safeParse(request.params);
      if (!params.success) throw new HttpError(400, 'PDF türü geçersiz.');
      const application = await loadApplication(db, params.data.id);
      if (!canAccess(request, String(application.userId)))
        throw new HttpError(404, 'Başvuru bulunamadı.');
      return reply
        .header('Cache-Control', 'private, no-store')
        .type('application/pdf')
        .header(
          'Content-Disposition',
          `attachment; filename="${params.data.kind}.pdf"`,
        )
        .send(
          await applicationPdf(
            application.personalInfo as Record<string, unknown>,
            params.data.kind,
          ),
        );
    },
  );
  for (const format of ['csv', 'xlsx'] as const)
    app.get(
      `/api/admin/exports/applications.${format}`,
      { preHandler: guard.authorize('admin', 'super_admin') },
      async (request, reply) => {
        const { clause, values } = filters(request.query);
        const rows = (
          await db.query(
            `SELECT a.id,a.personal_info->>'fullName' AS name,u.email,a.program_snapshot->>'name' AS program_name,a.stage,a.decision_status,a.updated_at FROM applications a JOIN users u ON u.id=a.user_id ${clause} ORDER BY a.updated_at DESC`,
            values,
          )
        ).rows;
        const header = [
          'Başvuru ID',
          'Aday',
          'E-posta',
          'Program',
          'Aşama',
          'Karar',
          'Güncellenme',
        ];
        const items = rows.map(row => [
          row.id,
          row.name,
          row.email,
          row.program_name,
          row.stage,
          row.decision_status,
          new Date(row.updated_at).toISOString(),
        ]);
        reply
          .header('Cache-Control', 'private, no-store')
          .header(
            'Content-Disposition',
            `attachment; filename="basvurular.${format}"`,
          );
        await appendAudit(db, request, {
          actorUserId: authUser(request).id,
          action: 'applications_exported',
          entityType: 'export',
          metadata: { format, count: rows.length },
        });
        if (format === 'csv')
          return reply
            .type('text/csv; charset=utf-8')
            .send(
              `\uFEFF${[header, ...items]
                .map(row => row.map(csvCell).join(','))
                .join('\r\n')}`,
            );
        const workbook = new ExcelJS.Workbook(),
          sheet = workbook.addWorksheet('Başvurular');
        sheet.addRows([header, ...items]);
        sheet.getRow(1).font = { bold: true };
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        sheet.columns.forEach(column => {
          column.width = 28;
        });
        sheet.autoFilter = { from: 'A1', to: 'G1' };
        return reply
          .type(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          )
          .send(Buffer.from(await workbook.xlsx.writeBuffer()));
      },
    );
  app.get(
    '/api/admin/exports/documents.zip',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async (request, reply) => {
      const query = z
        .object({ applicationIds: z.string().min(1) })
        .safeParse(request.query);
      if (!query.success) throw new HttpError(400, 'Başvuru seçilmelidir.');
      const { clause, values } = filters(query.data);
      const rows = (
        await db.query(
          `SELECT d.*,a.id AS app_id FROM documents d JOIN applications a ON a.id=d.application_id ${clause} AND d.is_current ORDER BY a.id,d.uploaded_at`,
          values,
        )
      ).rows;
      const archive = new ZipArchive({ zlib: { level: 6 } });
      archive.on('error', error => {
        request.log.error({ err: error }, 'ZIP export failed');
        archive.destroy(error);
      });
      for (const row of rows)
        archive.append(
          readStoredFile(config.FILE_STORAGE_PATH, row.storage_path),
          {
            name: `${row.app_id}/${row.id}-${sanitizeFileName(row.file_name)}`,
          },
        );
      void archive.finalize().catch(error => archive.destroy(error));
      return reply
        .header('Cache-Control', 'private, no-store')
        .type('application/zip')
        .header(
          'Content-Disposition',
          'attachment; filename="basvuru-belgeleri.zip"',
        )
        .send(archive);
    },
  );
};
