import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Config } from './config.js';
import type { Db } from './db.js';
import type { AuthUser, Role } from './types.js';
import { verifyAccessToken } from './security.js';
import { errors } from 'jose';

export const createAuthGuard = (config: Config, db: Db) => {
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Oturum açmanız gerekiyor.' });
    }
    try {
      const authUser = await verifyAccessToken(config, header.slice(7));
      const result = await db.query(
        'SELECT role, status, token_version, must_change_password FROM users WHERE id = $1',
        [authUser.id],
      );
      const row = result.rows[0];
      if (
        !row ||
        row.status !== 'active' ||
        row.token_version !== authUser.tokenVersion
      ) {
        return reply
          .code(401)
          .send({ message: 'Oturum geçersiz veya süresi dolmuş.' });
      }
      if (
        authUser.sessionId &&
        !(
          await db.query(
            'SELECT 1 FROM sessions WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>now()',
            [authUser.sessionId, authUser.id],
          )
        ).rowCount
      ) {
        return reply
          .code(401)
          .send({ message: 'Oturum kapatılmış. Yeniden giriş yapın.' });
      }
      const route = request.routeOptions.url;
      if (
        row.must_change_password &&
        ![
          '/api/auth/me',
          '/api/auth/change-password',
          '/api/auth/logout',
        ].includes(route || '')
      ) {
        return reply
          .code(403)
          .send({
            code: 'PASSWORD_CHANGE_REQUIRED',
            message: 'Devam etmeden önce geçici şifrenizi değiştirin.',
          });
      }
      (request as FastifyRequest & { authUser: AuthUser }).authUser = {
        ...authUser,
        role: row.role as Role,
      };
    } catch (error) {
      if (
        error instanceof errors.JOSEError ||
        (error instanceof Error && error.message === 'Invalid token payload')
      )
        return reply
          .code(401)
          .send({ message: 'Oturum geçersiz veya süresi dolmuş.' });
      throw error;
    }
  };

  const authorize =
    (...roles: Role[]) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
      await authenticate(request, reply);
      if (reply.sent) return;
      const user = (request as FastifyRequest & { authUser: AuthUser })
        .authUser;
      if (!roles.includes(user.role)) {
        return reply
          .code(403)
          .send({ message: 'Bu işlem için yetkiniz bulunmuyor.' });
      }
    };

  return { authenticate, authorize };
};

export type AuthGuard = ReturnType<typeof createAuthGuard>;

export const authUser = (request: FastifyRequest) =>
  (request as FastifyRequest & { authUser: AuthUser }).authUser;

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthUser;
  }
}
