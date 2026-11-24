import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Config } from '../config.js';
import { withTransaction, type Db, type QueryDb } from '../db.js';
import type { AuthGuard } from '../auth.js';
import { authUser } from '../auth.js';
import { appendAudit } from '../audit.js';
import { mapUser } from '../mappers.js';
import {
  createOpaqueToken,
  hashPassword,
  hashToken,
  passwordPolicy,
  signAccessToken,
  verifyPassword,
} from '../security.js';
import { sendEmailChangeEmail, sendPasswordResetEmail } from '../email.js';
import { HttpError } from '../workflow.js';
import { randomUUID } from 'node:crypto';

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.email().transform(value => value.toLowerCase()),
  eventLink: z.string().url().max(500).optional().or(z.literal('')),
  noticeAccepted: z.literal(true),
  noticeVersion: z.string().min(1).max(40),
  consentAccepted: z.literal(true),
  consentVersion: z.string().min(1).max(40),
});

const issueTokens = async (
  db: QueryDb,
  config: Config,
  row: Record<string, unknown>,
) => {
  const sessionId = randomUUID();
  const auth = {
    id: String(row.id),
    role: row.role as 'candidate' | 'admin' | 'super_admin',
    tokenVersion: Number(row.token_version),
    sessionId,
  };
  const accessToken = await signAccessToken(config, auth);
  const refreshToken = createOpaqueToken();
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 86400000);
  await db.query(
    'INSERT INTO sessions(id,user_id, refresh_token_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [sessionId, row.id, hashToken(refreshToken), expiresAt],
  );
  return { accessToken, refreshToken, expiresAt: expiresAt.toISOString() };
};

export const registerAuthRoutes = (
  app: FastifyInstance,
  deps: { db: Db; config: Config; guard: AuthGuard },
) => {
  const { db, config, guard } = deps;

  app.post('/api/auth/register', async (request, reply) => {
    const parsed = registrationSchema.safeParse(request.body);
    if (!parsed.success)
      return reply
        .code(400)
        .send({
          message: 'Kayıt bilgileri geçersiz.',
          issues: parsed.error.issues,
        });
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [
      parsed.data.email,
    ]);
    if (existing.rowCount)
      return reply
        .code(409)
        .send({ message: 'Bu e-posta adresi zaten kayıtlı.' });
    const result = await db.query(
      `INSERT INTO users(
        email, name, event_link, role, status, kvkk_accepted, consent_version, consented_at,
        notice_version, notice_accepted_at, credential_requested_at
      ) VALUES ($1, $2, $3, 'candidate', 'pending', true, $4, now(), $5, now(), now()) RETURNING *`,
      [
        parsed.data.email,
        parsed.data.name,
        parsed.data.eventLink || null,
        parsed.data.consentVersion,
        parsed.data.noticeVersion,
      ],
    );
    await appendAudit(db, request, {
      action: 'registration_requested',
      entityType: 'user',
      entityId: result.rows[0].id,
      metadata: {
        consentVersion: parsed.data.consentVersion,
        noticeVersion: parsed.data.noticeVersion,
      },
    });
    return reply
      .code(201)
      .send({
        user: mapUser(result.rows[0]),
        message: 'Kayıt talebiniz yönetici onayına gönderildi.',
      });
  });

  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: 8, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success)
        return reply
          .code(400)
          .send({ message: 'E-posta/kullanıcı adı ve şifre zorunludur.' });
      const login = parsed.data.email.toLowerCase();
      const result = await db.query(
        'SELECT * FROM users WHERE lower(email) = $1 OR lower(username) = $1',
        [login],
      );
      const row = result.rows[0];
      const invalid = async () => {
        if (row) {
          await db.query(
            `UPDATE users SET failed_login_count = failed_login_count + 1,
           locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
           WHERE id = $1`,
            [row.id],
          );
        }
        return reply
          .code(401)
          .send({ message: 'Kullanıcı adı/e-posta veya şifre yanlış.' });
      };
      if (!row?.password_hash || row.status !== 'active') return invalid();
      if (row.locked_until && new Date(row.locked_until) > new Date()) {
        return reply
          .code(429)
          .send({
            message:
              'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
          });
      }
      if (!(await verifyPassword(row.password_hash, parsed.data.password)))
        return invalid();
    const updatedUser=await db.query(
      'UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1 RETURNING *',
        [row.id],
      );
    const tokens = await issueTokens(db, config, updatedUser.rows[0]);
      await appendAudit(db, request, {
        actorUserId: row.id,
        action: 'login',
        entityType: 'session',
      });
    return { user: mapUser(updatedUser.rows[0]), token: tokens.accessToken, ...tokens };
    },
  );

  app.post('/api/auth/refresh', async (request, reply) => {
    const parsed = z
      .object({ refreshToken: z.string().min(20) })
      .safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ message: 'Yenileme anahtarı eksik.' });
    const refreshed = await withTransaction(db, async client => {
      const result = await client.query(
        `SELECT s.id AS session_id, u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.status = 'active' FOR UPDATE OF s, u`,
        [hashToken(parsed.data.refreshToken)],
      );
      const row = result.rows[0];
      if (!row) return null;
      await client.query(
        'UPDATE sessions SET revoked_at = now() WHERE id = $1',
        [row.session_id],
      );
      const tokens = await issueTokens(client, config, row);
      return { user: mapUser(row), token: tokens.accessToken, ...tokens };
    });
    if (!refreshed)
      return reply.code(401).send({ message: 'Oturum yenilenemedi.' });
    return refreshed;
  });

  app.post(
    '/api/auth/logout',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const parsed = z
        .object({ refreshToken: z.string().optional() })
        .safeParse(request.body);
      if (authUser(request).sessionId) {
        await db.query(
          'UPDATE sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2',
          [authUser(request).sessionId, authUser(request).id],
        );
      } else if (parsed.success && parsed.data.refreshToken) {
        await db.query(
          'UPDATE sessions SET revoked_at = now() WHERE refresh_token_hash = $1 AND user_id = $2',
          [hashToken(parsed.data.refreshToken), authUser(request).id],
        );
      } else {
        await db.query(
          'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
          [authUser(request).id],
        );
      }
      await appendAudit(db, request, {
        actorUserId: authUser(request).id,
        action: 'logout',
        entityType: 'session',
      });
      return reply.code(204).send();
    },
  );

  app.get(
    '/api/auth/me',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [
        authUser(request).id,
      ]);
      if (!result.rows[0])
        return reply.code(404).send({ message: 'Kullanıcı bulunamadı.' });
      return mapUser(result.rows[0]);
    },
  );

  app.post(
    '/api/auth/change-password',
    { preHandler: guard.authenticate },
    async (request, reply) => {
      const parsed = z
        .object({ currentPassword: z.string(), newPassword: z.string() })
        .safeParse(request.body);
      if (!parsed.success || !passwordPolicy(parsed.data.newPassword)) {
        return reply
          .code(400)
          .send({
            message:
              'Yeni şifre en az 12 karakter, büyük/küçük harf ve rakam içermelidir.',
          });
      }
      const result = await db.query('SELECT * FROM users WHERE id = $1', [
        authUser(request).id,
      ]);
      const row = result.rows[0];
      if (
        !row?.password_hash ||
        !(await verifyPassword(row.password_hash, parsed.data.currentPassword))
      ) {
        return reply.code(401).send({ message: 'Mevcut şifre yanlış.' });
      }
      const passwordHash = await hashPassword(parsed.data.newPassword);
      const updated = await withTransaction(db, async client => {
        const current = (
          await client.query(
            'SELECT token_version,password_hash FROM users WHERE id=$1 FOR UPDATE',
            [row.id],
          )
        ).rows[0];
        if (
          current.token_version !== row.token_version ||
          current.password_hash !== row.password_hash
        )
          throw new HttpError(
            409,
            'Şifre başka bir işlemde güncellendi. Yeniden giriş yapın.',
          );
        const changed = await client.query(
          `UPDATE users SET password_hash = $1, must_change_password = false, token_version = token_version + 1
       WHERE id = $2 RETURNING *`,
          [passwordHash, row.id],
        );
        await client.query(
          'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
          [row.id],
        );
        await appendAudit(client, request, {
          actorUserId: row.id,
          action: 'password_changed',
          entityType: 'user',
          entityId: row.id,
        });
        return changed;
      });
      return { user: mapUser(updated.rows[0]), requiresLogin: true };
    },
  );

  app.post(
    '/api/auth/forgot-password',
    { config: { rateLimit: { max: 3, timeWindow: '1 hour' } } },
    async request => {
      const parsed = z.object({ email: z.email() }).safeParse(request.body);
      if (parsed.success) {
        const result = await db.query(
          "SELECT id FROM users WHERE lower(email) = lower($1) AND status = 'active'",
          [parsed.data.email],
        );
        if (result.rows[0]) {
          const token = createOpaqueToken();
          await db.query(
            `INSERT INTO password_reset_tokens(user_id, token_hash, expires_at)
           VALUES ($1, $2, now() + interval '30 minutes')`,
            [result.rows[0].id, hashToken(token)],
          );
          try {
            await sendPasswordResetEmail(config, parsed.data.email, token);
          } catch (error) {
            app.log.error(
              { err: error, userId: result.rows[0].id },
              'Password reset email could not be delivered.',
            );
          }
        }
      }
      return {
        message:
          'Hesap bulunuyorsa şifre sıfırlama talimatları gönderilecektir.',
      };
    },
  );

  app.post(
    '/api/auth/reset-password',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = z
        .object({ token: z.string().min(20), newPassword: z.string() })
        .safeParse(request.body);
      if (!parsed.success || !passwordPolicy(parsed.data.newPassword)) {
        return reply
          .code(400)
          .send({ message: 'Yeni şifre güvenlik koşullarını karşılamıyor.' });
      }
      const passwordHash = await hashPassword(parsed.data.newPassword);
      await withTransaction(db, async client => {
        const result = await client.query(
          `SELECT p.id AS reset_id, p.user_id FROM password_reset_tokens p
       JOIN users u ON u.id = p.user_id
       WHERE p.token_hash = $1 AND p.used_at IS NULL AND p.expires_at > now() AND u.status = 'active' FOR UPDATE OF p,u`,
          [hashToken(parsed.data.token)],
        );
        const row = result.rows[0];
        if (!row)
          throw new HttpError(
            400,
            'Sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
          );
        await client.query(
          'UPDATE users SET password_hash = $1, must_change_password = false, token_version = token_version + 1 WHERE id = $2',
          [passwordHash, row.user_id],
        );
        await client.query(
          'UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL',
          [row.user_id],
        );
        await client.query(
          'UPDATE sessions SET revoked_at = now() WHERE user_id = $1',
          [row.user_id],
        );
        await appendAudit(client, request, {
          actorUserId: row.user_id,
          action: 'password_reset_completed',
          entityType: 'user',
          entityId: row.user_id,
        });
      });
      return {
        message: 'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
      };
    },
  );
  app.post(
    '/api/auth/request-email-change',
    {
      preHandler: guard.authenticate,
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const parsed = z
        .object({
          email: z.email().transform(value => value.toLowerCase()),
          currentPassword: z.string().min(1),
        })
        .safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(
          400,
          'Yeni e-posta adresi ve mevcut şifre gereklidir.',
        );
      const user = (
        await db.query('SELECT * FROM users WHERE id=$1', [
          authUser(request).id,
        ])
      ).rows[0];
      if (
        !(await verifyPassword(user.password_hash, parsed.data.currentPassword))
      )
        return reply.code(400).send({ message: 'Mevcut şifre yanlış.' });
      if (
        (
          await db.query('SELECT 1 FROM users WHERE lower(email)=lower($1)', [
            parsed.data.email,
          ])
        ).rowCount
      )
        throw new HttpError(409, 'Bu e-posta adresi kullanılıyor.');
      const token = createOpaqueToken();
      await db.query(
        "INSERT INTO email_change_tokens(user_id,new_email,token_hash,token_version,expires_at) VALUES($1,$2,$3,$4,now()+interval '30 minutes')",
        [user.id, parsed.data.email, hashToken(token), user.token_version],
      );
      try {
        await sendEmailChangeEmail(config, parsed.data.email, token);
      } catch (error) {
        await db.query('DELETE FROM email_change_tokens WHERE token_hash=$1', [
          hashToken(token),
        ]);
        request.log.error({ err: error }, 'Email verification failed');
        throw new HttpError(
          503,
          'Doğrulama e-postası gönderilemedi. Mevcut adresiniz değiştirilmedi.',
        );
      }
      return {
        message:
          'Yeni adrese doğrulama bağlantısı gönderildi. Adresiniz doğrulama tamamlandığında değişir.',
      };
    },
  );
  app.post('/api/auth/confirm-email-change', async request => {
    const parsed = z
      .object({ token: z.string().min(20).max(200) })
      .safeParse(request.body);
    if (!parsed.success)
      throw new HttpError(400, 'Doğrulama bağlantısı geçersiz.');
    await withTransaction(db, async client => {
      const token = (
        await client.query(
          "SELECT t.*,u.token_version AS current_version FROM email_change_tokens t JOIN users u ON u.id=t.user_id WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() AND u.status='active' FOR UPDATE OF t,u",
          [hashToken(parsed.data.token)],
        )
      ).rows[0];
      if (!token || token.token_version !== token.current_version)
        throw new HttpError(
          400,
          'Doğrulama bağlantısı geçersiz veya süresi dolmuş.',
        );
      if (
        (
          await client.query(
            'SELECT 1 FROM users WHERE lower(email)=lower($1)',
            [token.new_email],
          )
        ).rowCount
      )
        throw new HttpError(409, 'E-posta adresi artık kullanılıyor.');
      await client.query(
        'UPDATE users SET email=$1,token_version=token_version+1 WHERE id=$2',
        [token.new_email, token.user_id],
      );
      await client.query(
        'UPDATE email_change_tokens SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',
        [token.user_id],
      );
      await client.query(
        'UPDATE sessions SET revoked_at=now() WHERE user_id=$1',
        [token.user_id],
      );
      await appendAudit(client, request, {
        actorUserId: token.user_id,
        action: 'email_changed',
        entityType: 'user',
        entityId: token.user_id,
      });
    });
    return {
      message:
        'E-posta adresiniz doğrulandı. Yeni adresinizle yeniden giriş yapın.',
      requiresLogin: true,
    };
  });
  app.get('/confirm-email-change', async (request, reply) => {
    const query = z
      .object({ token: z.string().regex(/^[a-zA-Z0-9_.-]{20,200}$/) })
      .safeParse(request.query);
    if (!query.success)
      throw new HttpError(400, 'Doğrulama bağlantısı geçersiz.');
    return reply
      .type('text/html')
      .header('Cache-Control', 'no-store')
      .header('Referrer-Policy', 'no-referrer')
      .send(
        `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>E-posta Doğrulama | Inno Derneği</title><body><main><h1>Inno Derneği</h1><p id="message">Yeni e-posta adresinizi onaylayın.</p><button id="confirm">E-posta adresini doğrula</button></main><script>document.getElementById('confirm').onclick=async function(){this.disabled=true;try{const r=await fetch('/api/auth/confirm-email-change',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:${JSON.stringify(
          query.data.token,
        )}})});const d=await r.json();document.getElementById('message').textContent=d.message;if(!r.ok)this.disabled=false;}catch{document.getElementById('message').textContent='Bağlantı kurulamadı. Tekrar deneyin.';this.disabled=false;}};</script></body></html>`,
      );
  });
};
