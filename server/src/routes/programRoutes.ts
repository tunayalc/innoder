import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { withTransaction, type Db } from '../db.js';
import type { Config } from '../config.js';
import { checkRevision, HttpError, normalizeChecklist } from '../workflow.js';
import { readStoredFile, removeStoredFile, storeUpload } from '../storage.js';
import type { AuthGuard } from '../auth.js';
import { authUser } from '../auth.js';
import { appendAudit } from '../audit.js';

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
  'boarding_pass',
]);

// A checklist item with a key is a document the admin named themselves. It is
// uploaded as an 'extra' document tied to that key and is required like the others.
const checklistItem = z
  .object({
    documentType: documentTypes,
    key: z
      .string()
      .regex(/^custom_[a-z0-9]{6,32}$/)
      .optional(),
    label: z.string().trim().min(2).max(120).optional(),
    requiredStage: z.enum(['application_stage', 'erasmus_stage']).optional(),
    expectedFormat: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    exampleHint: z.string().max(1000).optional(),
  })
  .refine(
    item =>
      !item.key === !item.label &&
      (!item.key || item.documentType === 'extra'),
    'Özel belge için ad gerekir.',
  );
const checklist = z
  .array(checklistItem)
  .min(1)
  .refine(items => {
    const keys = items.flatMap(item => (item.key ? [item.key] : []));
    return new Set(keys).size === keys.length;
  }, 'Özel belge anahtarları benzersiz olmalıdır.');

const programSchema = z.object({
  name: z.string().trim().min(2).max(200),
  year: z.number().int().min(2020).max(2100),
  programKind: z.enum(['other', 'esc']).optional(),
  collectBloodGroup: z.boolean().optional(),
  steps: z.array(z.string().min(1).max(500)).default([]),
  deadlines: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        dateISO: z.union([z.iso.datetime(), z.iso.date()]),
      }),
    )
    .default([]),
  checklist,
  commonMistakes: z.array(z.string().min(1).max(500)).default([]),
});

const mapProgram = (row: Record<string, unknown>) => ({
  id: row.id,
  revision: row.revision,
  name: row.name,
  year: row.year,
  programKind: row.program_kind,
  collectBloodGroup: row.collect_blood_group,
  steps: row.steps,
  deadlines: row.deadlines,
  checklist: row.checklist,
  commonMistakes: row.common_mistakes,
  active: row.active,
  createdByUserId: row.created_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const registerProgramRoutes = (
  app: FastifyInstance,
  deps: { db: Db; guard: AuthGuard; config: Config },
) => {
  const { db, guard, config } = deps;
  app.get(
    '/api/programs',
    { preHandler: guard.authenticate },
    async request => {
      const archived =
        authUser(request).role !== 'candidate' &&
        (request.query as { includeArchived?: string }).includeArchived ===
          'true';
      const result = await db.query(
        `SELECT * FROM programs ${
          archived ? '' : 'WHERE active = true'
        } ORDER BY year DESC, name`,
      );
      return result.rows.map(mapProgram);
    },
  );
  app.get(
    '/api/programs/:id',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      if (!params.success)
        return reply.code(400).send({ message: 'Program kimliği geçersiz.' });
      const result = await db.query('SELECT * FROM programs WHERE id = $1', [
        params.data.id,
      ]);
      if (!result.rows[0])
        return reply.code(404).send({ message: 'Program bulunamadı.' });
      return mapProgram(result.rows[0]);
    },
  );
  app.post(
    '/api/programs',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async (request, reply) => {
      const parsed = programSchema.safeParse(request.body);
      if (!parsed.success)
        return reply
          .code(400)
          .send({
            message: 'Program bilgileri geçersiz.',
            issues: parsed.error.issues,
          });
      const data = parsed.data;
      if (data.collectBloodGroup && data.programKind !== 'esc')
        throw new HttpError(400, 'Kan grubu yalnız ESC projelerinde istenebilir.');
      if (data.collectBloodGroup && !config.ESC_BLOOD_GROUP_KEY)
        throw new HttpError(503, 'Kan grubu kaydı şu anda kullanılamıyor.');
      const result = await db.query(
        `INSERT INTO programs(name, year, steps, deadlines, checklist, common_mistakes, created_by_user_id, program_kind, collect_blood_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          data.name,
          data.year,
          JSON.stringify(data.steps),
          JSON.stringify(data.deadlines),
          JSON.stringify(normalizeChecklist(data.checklist)),
          JSON.stringify(data.commonMistakes),
          authUser(request).id,
          data.programKind ?? 'other',
          data.collectBloodGroup ?? false,
        ],
      );
      await appendAudit(db, request, {
        actorUserId: authUser(request).id,
        action: 'program_created',
        entityType: 'program',
        entityId: result.rows[0].id,
      });
      return reply.code(201).send(mapProgram(result.rows[0]));
    },
  );
  app.patch(
    '/api/programs/:id',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async request => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      const parsed = programSchema
        .partial()
        .extend({ active: z.boolean().optional() })
        .safeParse(request.body);
      if (!params.success || !parsed.success)
        throw new HttpError(400, 'Program bilgileri geçersiz.');
      return withTransaction(db, async client => {
        const current = (
          await client.query('SELECT * FROM programs WHERE id=$1 FOR UPDATE', [
            params.data.id,
          ])
        ).rows[0];
        if (!current) throw new HttpError(404, 'Program bulunamadı.');
        checkRevision(request, current);
        const data = parsed.data;
        const programKind = data.programKind ?? current.program_kind;
        if (data.collectBloodGroup && programKind !== 'esc')
          throw new HttpError(400, 'Kan grubu yalnız ESC projelerinde istenebilir.');
        const active = data.active ?? current.active;
        const collectBloodGroup = active && programKind === 'esc' &&
          (data.collectBloodGroup ?? current.collect_blood_group);
        if (data.collectBloodGroup === true && collectBloodGroup && !config.ESC_BLOOD_GROUP_KEY)
          throw new HttpError(503, 'Kan grubu kaydı şu anda kullanılamıyor.');
        const result = await client.query(
          'UPDATE programs SET name=$1,year=$2,steps=$3,deadlines=$4,checklist=$5,common_mistakes=$6,active=$7,program_kind=$8,collect_blood_group=$9 WHERE id=$10 RETURNING *',
          [
            data.name ?? current.name,
            data.year ?? current.year,
            JSON.stringify(data.steps ?? current.steps),
            JSON.stringify(data.deadlines ?? current.deadlines),
            JSON.stringify(
              normalizeChecklist(data.checklist ?? current.checklist),
            ),
            JSON.stringify(data.commonMistakes ?? current.common_mistakes),
            active,
            programKind,
            collectBloodGroup,
            current.id,
          ],
        );
        // Applications keep a frozen copy of the program, but documents the admin
        // names later must reach the people who are already in the program.
        if (data.checklist)
          await client.query(
            `UPDATE applications a SET program_snapshot = jsonb_set(a.program_snapshot, '{checklist}',
               COALESCE((SELECT jsonb_agg(item) FROM jsonb_array_elements(a.program_snapshot->'checklist') item
                 WHERE NOT item ? 'key'), '[]'::jsonb) || $2::jsonb)
             WHERE a.program_id = $1 AND a.decision_status = 'active' AND a.stage <> 'returned_home'`,
            [
              current.id,
              JSON.stringify(data.checklist.filter(item => item.key)),
            ],
          );
        if (current.collect_blood_group && !collectBloodGroup)
          await client.query(
            'DELETE FROM application_blood_groups b USING applications a WHERE b.application_id=a.id AND a.program_id=$1',
            [current.id],
          );
        await appendAudit(client, request, {
          actorUserId: authUser(request).id,
          action: 'program_updated',
          entityType: 'program',
          entityId: current.id,
        });
        return mapProgram(result.rows[0]);
      });
    },
  );
  app.get(
    '/api/programs/:id/templates',
    { preHandler: guard.authenticate },
    async request => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      if (!params.success)
        throw new HttpError(400, 'Program kimliği geçersiz.');
      const rows = (
        await db.query(
          'SELECT id,type,file_name,page_count,created_at FROM program_templates WHERE program_id=$1 AND is_current ORDER BY type',
          [params.data.id],
        )
      ).rows;
      return rows.map(row => ({
        id: row.id,
        type: row.type,
        fileName: row.file_name,
        pageCount: row.page_count,
        createdAt: row.created_at,
        fileUrl: `/api/program-templates/${row.id}/download`,
      }));
    },
  );
  app.post(
    '/api/programs/:id/templates/:type',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async (request, reply) => {
      const params = z
        .object({
          id: z.uuid(),
          type: z.enum(['activity_agreement', 'commitment_letter']),
        })
        .safeParse(request.params);
      if (!params.success) throw new HttpError(400, 'Şablon bilgisi geçersiz.');
      const file = await request.file();
      if (!file || file.mimetype !== 'application/pdf')
        throw new HttpError(400, 'Kurum şablonu PDF olmalıdır.');
      let stored: Awaited<ReturnType<typeof storeUpload>> | undefined,
        retained = false;
      try {
        stored = await storeUpload(
          config.FILE_STORAGE_PATH,
          `templates/${params.data.id}`,
          file,
        );
        const saved = stored;
        const result = await withTransaction(db, async client => {
          if (
            !(
              await client.query(
                'SELECT id FROM programs WHERE id=$1 FOR UPDATE',
                [params.data.id],
              )
            ).rowCount
          )
            throw new HttpError(404, 'Program bulunamadı.');
          await client.query(
            'UPDATE program_templates SET is_current=false WHERE program_id=$1 AND type=$2',
            [params.data.id, params.data.type],
          );
          const row = (
            await client.query(
              'INSERT INTO program_templates(program_id,type,file_name,storage_path,size_bytes,page_count,uploaded_by_user_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
              [
                params.data.id,
                params.data.type,
                saved.safeFileName,
                saved.relativePath,
                saved.sizeBytes,
                saved.pageCount,
                authUser(request).id,
              ],
            )
          ).rows[0];
          await appendAudit(client, request, {
            actorUserId: authUser(request).id,
            action: 'program_template_uploaded',
            entityType: 'program',
            entityId: params.data.id,
          });
          return row;
        });
        retained = true;
        return reply
          .code(201)
          .send({
            id: result.id,
            fileName: saved.safeFileName,
            fileUrl: `/api/program-templates/${result.id}/download`,
          });
      } finally {
        if (stored && !retained)
          await removeStoredFile(config.FILE_STORAGE_PATH, stored.relativePath);
      }
    },
  );
  app.get(
    '/api/program-templates/:id/download',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      if (!params.success) throw new HttpError(400, 'Şablon kimliği geçersiz.');
      const row = (
        await db.query('SELECT * FROM program_templates WHERE id=$1', [
          params.data.id,
        ])
      ).rows[0];
      if (!row) throw new HttpError(404, 'Şablon bulunamadı.');
      return reply
        .header('Cache-Control', 'private, no-store')
        .type('application/pdf')
        .header(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`,
        )
        .send(readStoredFile(config.FILE_STORAGE_PATH, row.storage_path));
    },
  );
};
