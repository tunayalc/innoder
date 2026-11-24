import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Db } from '../db.js';
import type { AuthGuard } from '../auth.js';
import { authUser } from '../auth.js';
import { appendAudit } from '../audit.js';
import { HttpError, pagination } from '../workflow.js';

const mapMessage = (row: Record<string, unknown>) => ({
  id: row.id,
  applicationId: row.thread_key,
  senderId: row.sender_id,
  senderRole: row.sender_role,
  content: row.content,
  relatedDocumentId: row.related_document_id ?? undefined,
  readBy: row.read_by,
  createdAt: new Date(String(row.created_at)).toISOString(),
});

const authorizeThread = async (
  db: Db,
  threadId: string,
  user: ReturnType<typeof authUser>,
) => {
  if (threadId.startsWith('general:')) {
    const owner = threadId.slice('general:'.length);
    if (
      !z.uuid().safeParse(owner).success ||
      (user.role === 'candidate' && owner !== user.id)
    )
      return false;
    return Boolean(
      (
        await db.query(
          "SELECT 1 FROM users WHERE id=$1 AND role='candidate' AND status NOT IN ('anonymized','disabled')",
          [owner],
        )
      ).rowCount,
    );
  }
  if (!z.uuid().safeParse(threadId).success) return false;
  const result = await db.query(
    `SELECT 1 FROM applications WHERE id = $1 ${
      user.role === 'candidate' ? 'AND user_id = $2' : ''
    }`,
    user.role === 'candidate' ? [threadId, user.id] : [threadId],
  );
  return Boolean(result.rowCount);
};

export const registerMessageRoutes = (
  app: FastifyInstance,
  deps: { db: Db; guard: AuthGuard },
) => {
  const { db, guard } = deps;
  app.get(
    '/api/messages/unread-count',
    { preHandler: guard.authenticate },
    async request => {
      const user = authUser(request);
      const result = await db.query(
        `SELECT count(*)::integer AS unread FROM messages m LEFT JOIN applications a ON a.id=m.application_id
      WHERE m.sender_id<>$1::uuid AND NOT(m.read_by ? $1::text) ${
        user.role === 'candidate'
          ? "AND (a.user_id=$1::uuid OR m.thread_key='general:' || $1::text)"
          : ''
      }`,
        [user.id],
      );
      return { unread: result.rows[0].unread };
    },
  );
  app.get(
    '/api/messages/summary',
    { preHandler: guard.authenticate },
    async request => {
      const user = authUser(request),
        page = pagination(request.query);
      const clause =
        user.role === 'candidate'
          ? 'WHERE (a.user_id=$1 OR m.thread_key=$2)'
          : '';
      const values =
        user.role === 'candidate' ? [user.id, `general:${user.id}`] : [];
      const result = await db.query(
        `SELECT m.thread_key AS "threadId",max(m.created_at) AS "updatedAt",
      count(*) FILTER(WHERE m.sender_id<>$${
        values.length + 1
      }::uuid AND NOT (m.read_by ? $${
          values.length + 1
        }::text))::integer AS unread,
      COALESCE(max(u.name), max(c.name)) AS name, max(a.program_snapshot->>'name') AS "programName"
      FROM messages m LEFT JOIN applications a ON a.id=m.application_id LEFT JOIN users u ON u.id=a.user_id
      LEFT JOIN users c ON m.thread_key='general:' || c.id::text ${clause}
      GROUP BY m.thread_key ORDER BY max(m.created_at) DESC LIMIT $${
        values.length + 2
      } OFFSET $${values.length + 3}`,
        [...values, user.id, page.pageSize, (page.page - 1) * page.pageSize],
      );
      if (!page.paged) return result.rows;
      const total = Number(
        (
          await db.query(
            `SELECT count(DISTINCT m.thread_key) FROM messages m LEFT JOIN applications a ON a.id=m.application_id ${clause}`,
            values,
          )
        ).rows[0].count,
      );
      return {
        items: result.rows,
        total,
        page: page.page,
        pageSize: page.pageSize,
      };
    },
  );
  app.get(
    '/api/messages/:threadId',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const params = z
        .object({ threadId: z.string().min(1).max(100) })
        .safeParse(request.params);
      if (
        !params.success ||
        !(await authorizeThread(db, params.data.threadId, authUser(request)))
      )
        return reply.code(404).send({ message: 'Mesaj dizisi bulunamadı.' });
      const page = pagination(request.query);
      const result = await db.query(
        `SELECT * FROM messages WHERE thread_key = $1 ORDER BY created_at ${
          page.paged ? 'DESC,id DESC LIMIT $2 OFFSET $3' : ''
        }`,
        page.paged
          ? [
              params.data.threadId,
              page.pageSize,
              (page.page - 1) * page.pageSize,
            ]
          : [params.data.threadId],
      );
      const items = result.rows.map(mapMessage);
      if (!page.paged) return items;
      const total = Number(
        (
          await db.query('SELECT count(*) FROM messages WHERE thread_key=$1', [
            params.data.threadId,
          ])
        ).rows[0].count,
      );
      return {
        items: items.reverse(),
        total,
        page: page.page,
        pageSize: page.pageSize,
      };
    },
  );
  app.post(
    '/api/messages/:threadId',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const params = z
        .object({ threadId: z.string().min(1).max(100) })
        .safeParse(request.params);
      const body = z
        .object({
          content: z.string().trim().min(1).max(4000),
          relatedDocumentId: z.uuid().optional(),
        })
        .safeParse(request.body);
      const user = authUser(request);
      if (
        !params.success ||
        !body.success ||
        !(await authorizeThread(db, params.data.threadId, user))
      )
        return reply.code(400).send({ message: 'Mesaj gönderilemedi.' });
      const applicationId = z.uuid().safeParse(params.data.threadId).success
        ? params.data.threadId
        : null;
      if (
        body.data.relatedDocumentId &&
        (!applicationId ||
          !(
            await db.query(
              'SELECT 1 FROM documents WHERE id=$1 AND application_id=$2',
              [body.data.relatedDocumentId, applicationId],
            )
          ).rowCount)
      )
        throw new HttpError(400, 'İlgili belge bu başvuruya ait değil.');
      const result = await db.query(
        `INSERT INTO messages(application_id, thread_key, sender_id, sender_role, content, related_document_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          applicationId,
          params.data.threadId,
          user.id,
          user.role === 'candidate' ? 'candidate' : 'admin',
          body.data.content,
          body.data.relatedDocumentId ?? null,
        ],
      );
      await appendAudit(db, request, {
        actorUserId: user.id,
        action: 'message_sent',
        entityType: 'message',
        entityId: result.rows[0].id,
        metadata: { threadId: params.data.threadId },
      });
      return reply.code(201).send(mapMessage(result.rows[0]));
    },
  );
  app.post(
    '/api/messages/:threadId/read',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const params = z
        .object({ threadId: z.string().min(1).max(100) })
        .safeParse(request.params);
      const user = authUser(request);
      if (
        !params.success ||
        !(await authorizeThread(db, params.data.threadId, user))
      )
        return reply.code(404).send({ message: 'Mesaj dizisi bulunamadı.' });
      await db.query(
        `UPDATE messages SET read_by = CASE WHEN read_by ? $1 THEN read_by ELSE read_by || to_jsonb($1::text) END
       WHERE thread_key = $2`,
        [user.id, params.data.threadId],
      );
      return reply.code(204).send();
    },
  );
};
