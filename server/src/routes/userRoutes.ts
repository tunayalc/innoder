import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { withTransaction, type Db } from '../db.js';
import type { AuthGuard } from '../auth.js';
import type { Config } from '../config.js';
import { authUser } from '../auth.js';
import { appendAudit } from '../audit.js';
import { mapUser } from '../mappers.js';
import { hashPassword, passwordPolicy } from '../security.js';
import {
  birthDate,
  checkRevision,
  HttpError,
  pagination,
} from '../workflow.js';
import { protectLastSuperAdmin } from '../accountSafety.js';
import { runCleanupJobs } from '../cleanup.js';

const profileSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  birthDate: birthDate.optional(),
  nationality: z.string().trim().max(100).optional(),
  identityType: z.enum(['turkish_id', 'passport']).optional(),
  identityNumber: z.string().trim().max(32).optional(),
  passportNumber: z.string().trim().max(32).optional(),
  pnrNumber: z.string().trim().max(32).optional(),
});

export const registerUserRoutes = (
  app: FastifyInstance,
  deps: { db: Db; guard: AuthGuard; config: Config },
) => {
  const { db, guard, config } = deps;

  app.patch(
    '/api/users/me',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const parsed = profileSchema.safeParse(request.body);
      if (!parsed.success)
        return reply
          .code(400)
          .send({
            message: 'Profil bilgileri geçersiz.',
            issues: parsed.error.issues,
          });
      return withTransaction(db, async client => {
        const data = parsed.data;
        const current = (
          await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [
            authUser(request).id,
          ])
        ).rows[0];
        checkRevision(request, current);
        const field = (name: keyof typeof data, column: string) =>
          data[name] === undefined ? current[column] : data[name] || null;
        const identityType = field('identityType', 'identity_type');
        if (
          (identityType === 'turkish_id' &&
            !field('identityNumber', 'identity_number')) ||
          (identityType === 'passport' &&
            !field('passportNumber', 'passport_number'))
        )
          throw new HttpError(
            400,
            'Seçilen kimlik belgesinin numarası zorunludur.',
          );
        const result = await client.query(
          `UPDATE users SET name = $1, phone = $2, country = $3, city = $4, birth_date = $5,
       nationality = $6, identity_type = $7, identity_number = $8, passport_number = $9,
       pnr_number = $10 WHERE id = $11 RETURNING *`,
          [
            field('name', 'name'),
            field('phone', 'phone'),
            field('country', 'country'),
            field('city', 'city'),
            field('birthDate', 'birth_date'),
            field('nationality', 'nationality'),
            identityType,
            field('identityNumber', 'identity_number'),
            field('passportNumber', 'passport_number'),
            field('pnrNumber', 'pnr_number'),
            authUser(request).id,
          ],
        );
        const user = mapUser(result.rows[0]);
        const shared = {
          fullName: user.name,
          birthDate: user.birthDate || '',
          nationality: user.nationality || '',
          identityType: user.identityType || 'turkish_id',
          identityNumber: user.identityNumber || '',
          passportNumber: user.passportNumber || '',
          pnrNumber: user.pnrNumber || '',
        };
        await client.query(
          'UPDATE applications SET personal_info=personal_info || $1::jsonb WHERE user_id=$2',
          [JSON.stringify(shared), user.id],
        );
        await appendAudit(client, request, {
          actorUserId: user.id,
          action: 'profile_updated',
          entityType: 'user',
          entityId: user.id,
        });
        return user;
      });
    },
  );

  app.delete(
    '/api/users/me',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const parsed = z
        .object({ reason: z.string().max(1000).optional() })
        .safeParse(request.body);
      const userId = authUser(request).id;
      await withTransaction(db, async client => {
        await protectLastSuperAdmin(client, userId);
        const existing = await client.query(
          "SELECT id FROM account_deletion_requests WHERE user_id = $1 AND status = 'pending'",
          [userId],
        );
        if (!existing.rowCount) {
          await client.query(
            'INSERT INTO account_deletion_requests(user_id, reason) VALUES ($1, $2)',
            [userId, parsed.success ? parsed.data.reason ?? null : null],
          );
        }
        await client.query(
          "UPDATE users SET status = 'deletion_requested', token_version = token_version + 1 WHERE id = $1",
          [userId],
        );
        await client.query(
          'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
          [userId],
        );
        await appendAudit(client, request, {
          actorUserId: userId,
          action: 'account_deletion_requested',
          entityType: 'user',
          entityId: userId,
        });
      });
      return reply.code(202).send({ message: 'Hesap silme talebiniz alındı.' });
    },
  );

  app.get(
    '/api/admin/candidates',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async request => {
      const query = z
        .object({ status: z.string().optional(), q: z.string().optional() })
        .safeParse(request.query);
      const values: unknown[] = [];
      const where = ["role = 'candidate'"];
      if (query.success && query.data.status) {
        values.push(query.data.status);
        where.push(`status = $${values.length}`);
      }
      if (query.success && query.data.q) {
        values.push(`%${query.data.q}%`);
        where.push(
          `(name ILIKE $${values.length} OR email ILIKE $${values.length})`,
        );
      }
      const page = pagination(request.query);
      const total = page.paged
        ? Number(
            (
              await db.query(
                `SELECT count(*) FROM users WHERE ${where.join(' AND ')}`,
                values,
              )
            ).rows[0].count,
          )
        : 0;
      const result = await db.query(
        `SELECT id, revision, email, username, name, role, status, must_change_password,
          credential_requested_at, credential_sent_at, event_link, phone, country,
          city, birth_date, nationality, identity_type, kvkk_accepted, consent_version,
          consented_at, notice_version, notice_accepted_at, created_at, updated_at
        FROM users WHERE ${where.join(
          ' AND ',
        )} ORDER BY created_at DESC,id ${
          page.paged
            ? `LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
            : ''
        }`,
        page.paged
          ? [...values, page.pageSize, (page.page - 1) * page.pageSize]
          : values,
      );
      const items = result.rows.map(mapUser);
      return page.paged
        ? { items, total, page: page.page, pageSize: page.pageSize }
        : items;
    },
  );

  app.post(
    '/api/admin/candidates/:id/temporary-password',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async (request, reply) => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      const body = z
        .object({
          password: z.string(),
          // Sent by the web panel once the admin has checked the event link.
          // Older clients (the store-reviewed mobile app) omit it.
          eventLinkApproved: z.boolean().optional(),
        })
        .safeParse(request.body);
      if (body.success && body.data.eventLinkApproved === false)
        return reply.code(400).send({
          message: 'Etkinlik bağlantısı onaylanmadan hesap etkinleştirilemez.',
        });
      if (
        !params.success ||
        !body.success ||
        !passwordPolicy(body.data.password)
      ) {
        return reply
          .code(400)
          .send({
            message:
              'Geçici şifre en az 12 karakter, büyük/küçük harf ve rakam içermelidir.',
          });
      }
      const passwordHash = await hashPassword(body.data.password);
      const result = await db.query(
        `UPDATE users SET password_hash = $1, status = 'active', must_change_password = true,
       credential_sent_at = now(), token_version = token_version + 1
       WHERE id = $2 AND role = 'candidate' AND status IN ('active','pending') RETURNING *`,
        [passwordHash, params.data.id],
      );
      if (!result.rows[0])
        return reply.code(404).send({ message: 'Aday bulunamadı.' });
      await db.query(
        'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
        [params.data.id],
      );
      await appendAudit(db, request, {
        actorUserId: authUser(request).id,
        action: 'candidate_temporary_password_set',
        entityType: 'user',
        entityId: params.data.id,
        metadata: {
          eventLinkApproved: body.data.eventLinkApproved === true,
          eventLink: result.rows[0].event_link ?? null,
        },
      });
      return { user: mapUser(result.rows[0]), mustChangePassword: true };
    },
  );

  app.get(
    '/api/admin/admins',
    { preHandler: guard.authorize('super_admin') },
    async () => {
      const result = await db.query(
        "SELECT * FROM users WHERE role IN ('admin', 'super_admin') ORDER BY created_at DESC",
      );
      return result.rows.map(mapUser);
    },
  );

  app.post(
    '/api/admin/admins',
    { preHandler: guard.authorize('super_admin') },
    async (request, reply) => {
      const parsed = z
        .object({
          name: z.string().trim().min(2).max(160),
          email: z.email(),
          username: z.string().trim().min(3).max(80),
          temporaryPassword: z.string(),
          role: z.enum(['admin', 'super_admin']).default('admin'),
        })
        .safeParse(request.body);
      if (!parsed.success || !passwordPolicy(parsed.data.temporaryPassword)) {
        return reply
          .code(400)
          .send({ message: 'Admin bilgileri veya geçici şifre geçersiz.' });
      }
      const passwordHash = await hashPassword(parsed.data.temporaryPassword);
      try {
        const result = await db.query(
          `INSERT INTO users(email, username, name, role, status, password_hash, must_change_password, kvkk_accepted)
         VALUES (lower($1), lower($2), $3, $4, 'active', $5, true, false) RETURNING *`,
          [
            parsed.data.email,
            parsed.data.username,
            parsed.data.name,
            parsed.data.role,
            passwordHash,
          ],
        );
        await appendAudit(db, request, {
          actorUserId: authUser(request).id,
          action: 'admin_created',
          entityType: 'user',
          entityId: result.rows[0].id,
          metadata: { role: parsed.data.role },
        });
        return reply.code(201).send(mapUser(result.rows[0]));
      } catch (error) {
        if ((error as { code?: string }).code === '23505')
          return reply
            .code(409)
            .send({
              message: 'E-posta veya kullanıcı adı zaten kullanılıyor.',
            });
        throw error;
      }
    },
  );

  app.patch(
    '/api/admin/admins/:id/status',
    { preHandler: guard.authorize('super_admin') },
    async (request, reply) => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      const body = z
        .object({ status: z.enum(['active', 'disabled']) })
        .safeParse(request.body);
      if (!params.success || !body.success)
        return reply.code(400).send({ message: 'İstek geçersiz.' });
      if (
        params.data.id === authUser(request).id &&
        body.data.status === 'disabled'
      ) {
        return reply
          .code(400)
          .send({ message: 'Kendi hesabınızı pasifleştiremezsiniz.' });
      }
      const result = await withTransaction(db, async client => {
        if (body.data.status === 'disabled')
          await protectLastSuperAdmin(client, params.data.id);
        const updated = await client.query(
          `UPDATE users SET status = $1, token_version = token_version + 1
       WHERE id = $2 AND role IN ('admin', 'super_admin') RETURNING *`,
          [body.data.status, params.data.id],
        );
        await client.query(
          'UPDATE sessions SET revoked_at=now() WHERE user_id=$1',
          [params.data.id],
        );
        return updated;
      });
      if (!result.rows[0])
        return reply.code(404).send({ message: 'Admin bulunamadı.' });
      await db.query(
        'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
        [params.data.id],
      );
      await appendAudit(db, request, {
        actorUserId: authUser(request).id,
        action: 'admin_status_changed',
        entityType: 'user',
        entityId: params.data.id,
        metadata: body.data,
      });
      return mapUser(result.rows[0]);
    },
  );

  app.post(
    '/api/admin/admins/:id/reset-password',
    { preHandler: guard.authorize('super_admin') },
    async (request, reply) => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      const body = z
        .object({ temporaryPassword: z.string() })
        .safeParse(request.body);
      if (
        !params.success ||
        !body.success ||
        !passwordPolicy(body.data.temporaryPassword)
      ) {
        return reply
          .code(400)
          .send({ message: 'Geçici şifre güvenlik koşullarını karşılamıyor.' });
      }
      const passwordHash = await hashPassword(body.data.temporaryPassword);
      const result = await db.query(
        `UPDATE users SET password_hash = $1, must_change_password = true, token_version = token_version + 1
       WHERE id = $2 AND role IN ('admin', 'super_admin') RETURNING *`,
        [passwordHash, params.data.id],
      );
      if (!result.rows[0])
        return reply.code(404).send({ message: 'Admin bulunamadı.' });
      await db.query(
        'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
        [params.data.id],
      );
      await appendAudit(db, request, {
        actorUserId: authUser(request).id,
        action: 'admin_password_reset',
        entityType: 'user',
        entityId: params.data.id,
      });
      return { user: mapUser(result.rows[0]), mustChangePassword: true };
    },
  );

  app.get(
    '/api/admin/audit',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async request => {
      const parsed = z
        .object({ limit: z.coerce.number().int().min(1).max(500).default(100) })
        .safeParse(request.query);
      const result = await db.query(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
        [parsed.success ? parsed.data.limit : 100],
      );
      return result.rows.map(row => ({
        id: row.id,
        actorUserId: row.actor_user_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        metadata: row.metadata,
        createdAt: new Date(row.created_at).toISOString(),
      }));
    },
  );

  app.get(
    '/api/admin/deletion-requests',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async () => {
      const result = await db.query(
        `SELECT r.*, u.name, u.email FROM account_deletion_requests r JOIN users u ON u.id = r.user_id
       WHERE r.status IN ('pending','approved') ORDER BY r.requested_at`,
      );
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        reason: row.reason,
        status: row.status,
        requestedAt: new Date(row.requested_at).toISOString(),
      }));
    },
  );

  app.post(
    '/api/admin/deletion-requests/:id/complete',
    { preHandler: guard.authorize('admin', 'super_admin') },
    async (request, reply) => {
      const params = z.object({ id: z.uuid() }).safeParse(request.params);
      if (!params.success)
        return reply.code(400).send({ message: 'Talep kimliği geçersiz.' });
      const requestResult = await db.query(
        "SELECT * FROM account_deletion_requests WHERE id = $1 AND status IN ('pending','approved')",
        [params.data.id],
      );
      const deletion = requestResult.rows[0];
      if (!deletion)
        return reply
          .code(404)
          .send({ message: 'Bekleyen silme talebi bulunamadı.' });
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await protectLastSuperAdmin(client, deletion.user_id);
        await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [
          deletion.user_id,
        ]);
        await client.query(
          `INSERT INTO file_cleanup_jobs(request_id,storage_path)
        SELECT $1,d.storage_path FROM documents d JOIN applications a ON a.id=d.application_id WHERE a.user_id=$2
        ON CONFLICT DO NOTHING`,
          [deletion.id, deletion.user_id],
        );
        await client.query(
          'DELETE FROM documents WHERE application_id IN (SELECT id FROM applications WHERE user_id = $1)',
          [deletion.user_id],
        );
        await client.query(
          'DELETE FROM application_blood_groups WHERE application_id IN (SELECT id FROM applications WHERE user_id = $1)',
          [deletion.user_id],
        );
        await client.query(
          'UPDATE applications SET personal_info = \'{"fullName":"Anonim Kullanıcı"}\'::jsonb WHERE user_id = $1',
          [deletion.user_id],
        );
        await client.query(
          'DELETE FROM messages WHERE sender_id = $1 OR thread_key = $2 OR application_id IN (SELECT id FROM applications WHERE user_id=$1)',
          [deletion.user_id, `general:${deletion.user_id}`],
        );
        await client.query(
          `UPDATE users SET email = $1, username = NULL, name = 'Anonim Kullanıcı', status = 'anonymized', password_hash = NULL,
         event_link = NULL, phone = NULL, country = NULL, city = NULL, birth_date = NULL, nationality = NULL,
         identity_type = NULL, identity_number = NULL, passport_number = NULL, pnr_number = NULL, blood_group = NULL,
         token_version = token_version + 1 WHERE id = $2`,
          [`deleted+${deletion.user_id}@invalid.local`, deletion.user_id],
        );
        await client.query(
          "UPDATE account_deletion_requests SET status = 'approved', resolved_by_user_id = $1,reason=NULL WHERE id = $2",
          [authUser(request).id, deletion.id],
        );
        await client.query(
          'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
          [deletion.user_id],
        );
        await client.query('DELETE FROM email_change_tokens WHERE user_id=$1', [
          deletion.user_id,
        ]);
        await client.query(
          'DELETE FROM password_reset_tokens WHERE user_id=$1',
          [deletion.user_id],
        );
        await appendAudit(client, request, {
          actorUserId: authUser(request).id,
          action: 'account_anonymized_cleanup_queued',
          entityType: 'user',
          entityId: deletion.user_id,
        });
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      await runCleanupJobs(db, config.FILE_STORAGE_PATH);
      const status = (
        await db.query(
          'SELECT status FROM account_deletion_requests WHERE id=$1',
          [deletion.id],
        )
      ).rows[0].status;
      return reply
        .code(status === 'completed' ? 200 : 202)
        .send({
          status,
          message:
            status === 'completed'
              ? 'Hesap anonimleştirildi ve belge dosyaları silindi.'
              : 'Hesap anonimleştirildi. Belge temizliği sürüyor; başarısız dosyalar otomatik yeniden denenecek.',
        });
    },
  );
};
