import type { FastifyRequest } from 'fastify';
import type { QueryDb } from './db.js';

export const appendAudit = async (
  db: QueryDb,
  request: FastifyRequest,
  entry: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
) => {
  await db.query(
    `INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      entry.actorUserId ?? null,
      entry.action,
      entry.entityType,
      entry.entityId ?? null,
      JSON.stringify(entry.metadata ?? {}),
      request.ip,
    ],
  );
};
