import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { type AuthGuard, authUser } from '../auth.js';
import { appendAudit } from '../audit.js';
import { type Db, type QueryDb, withTransaction } from '../db.js';
import type { Config } from '../config.js';
import { HttpError } from '../workflow.js';

const consentVersion = 'esc-blood-group-v1';
const form = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']),
  consentAccepted: z.literal(true),
  consentVersion: z.literal(consentVersion),
});

export const registerBloodGroupRoutes = (
  app: FastifyInstance,
  { db, guard, config }: { db: Db; guard: AuthGuard; config: Config },
) => {
  const path = '/api/applications/:id/blood-group';
  const key = config.ESC_BLOOD_GROUP_KEY && Buffer.from(config.ESC_BLOOD_GROUP_KEY, 'base64');
  const associatedData = (id: string) => Buffer.from(`inno:esc-blood-group:${id}`);
  const seal = (id: string, value: string) => {
    if (!key) throw new HttpError(503, 'Kan grubu kaydı şu anda kullanılamıyor.');
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    cipher.setAAD(associatedData(id));
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64');
  };
  const open = (id: string, value: string) => {
    if (!key) throw new HttpError(503, 'Kan grubu kaydı şu anda kullanılamıyor.');
    const packed = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, packed.subarray(0, 12));
    decipher.setAAD(associatedData(id));
    decipher.setAuthTag(packed.subarray(12, 28));
    return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8');
  };
  const parseId = (params: unknown) => {
    const parsed = z.object({ id: z.uuid() }).safeParse(params);
    if (!parsed.success) throw new HttpError(400, 'Başvuru kimliği geçersiz.');
    return parsed.data.id;
  };
  const load = async (client: QueryDb, id: string, actorId?: string, lock = false) => {
    const row = (await client.query(
      `SELECT a.id, a.stage, a.decision_status, p.active, p.program_kind, p.collect_blood_group,
              b.sealed_value, b.consented_at
       FROM applications a JOIN programs p ON p.id = a.program_id
       JOIN users u ON u.id = a.user_id AND u.status = 'active'
       LEFT JOIN application_blood_groups b ON b.application_id = a.id
       WHERE a.id = $1 AND ($2::uuid IS NULL OR a.user_id = $2)
       ${lock ? 'FOR UPDATE OF a FOR SHARE OF p' : ''}`,
      [id, actorId ?? null],
    )).rows[0];
    if (!row) throw new HttpError(404, 'Başvuru bulunamadı.');
    const available = row.active && row.program_kind === 'esc' && row.collect_blood_group &&
      row.stage !== 'returned_home' && row.decision_status !== 'rejected';
    return { row, available: Boolean(available) };
  };
  const view = ({ row, available }: Awaited<ReturnType<typeof load>>) => ({
    available,
    consentVersion,
    ...(available && row.sealed_value
      ? { bloodGroup: open(row.id, row.sealed_value), consentedAt: row.consented_at as Date }
      : {}),
  });
  const lockActiveCandidate = async (client: QueryDb, candidateId: string) => {
    const result = await client.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'candidate' AND status = 'active' FOR SHARE",
      [candidateId],
    );
    if (!result.rowCount) throw new HttpError(404, 'Başvuru bulunamadı.');
  };

  app.get(path, { preHandler: guard.authenticate }, async (request, reply) => {
    const actor = authUser(request);
    const id = parseId(request.params);
    const result = await load(db, id, actor.role === 'candidate' ? actor.id : undefined);
    if (actor.role !== 'candidate' && result.available && result.row.sealed_value)
      await appendAudit(db, request, {
        actorUserId: actor.id, action: 'esc_blood_group_viewed',
        entityType: 'application', entityId: id,
      });
    return reply.header('Cache-Control', 'private, no-store').send(view(result));
  });

  app.put(path, { preHandler: guard.authorize('candidate') }, async (request, reply) => {
    const id = parseId(request.params), actor = authUser(request);
    const parsed = form.safeParse(request.body);
    if (!parsed.success)
      throw new HttpError(400, 'Kan grubu seçimi ve bu projeye özel açık rıza gerekli.');
    await withTransaction(db, async client => {
      await lockActiveCandidate(client, actor.id);
      const { available } = await load(client, id, actor.id, true);
      if (!available) throw new HttpError(409, 'Bu proje kan grubu bilgisi istemiyor.');
      await client.query(
        `INSERT INTO application_blood_groups(application_id, sealed_value, consent_version)
         VALUES ($1, $2, $3) ON CONFLICT(application_id)
         DO UPDATE SET sealed_value=EXCLUDED.sealed_value, consent_version=EXCLUDED.consent_version, consented_at=now()`,
        [id, seal(id, parsed.data.bloodGroup), consentVersion],
      );
      await appendAudit(client, request, {
        actorUserId: actor.id, action: 'esc_blood_group_consent_granted',
        entityType: 'application', entityId: id, metadata: { consentVersion },
      });
    });
    return reply.header('Cache-Control', 'private, no-store').send(view(await load(db, id, actor.id)));
  });

  app.delete(path, { preHandler: guard.authorize('candidate') }, async (request, reply) => {
    const id = parseId(request.params), actor = authUser(request);
    await withTransaction(db, async client => {
      await lockActiveCandidate(client, actor.id);
      await load(client, id, actor.id, true);
      const result = await client.query('DELETE FROM application_blood_groups WHERE application_id = $1', [id]);
      if (result.rowCount) await appendAudit(client, request, {
        actorUserId: actor.id, action: 'esc_blood_group_consent_revoked',
        entityType: 'application', entityId: id, metadata: { consentVersion },
      });
    });
    return reply.header('Cache-Control', 'private, no-store').send(view(await load(db, id, actor.id)));
  });
};
