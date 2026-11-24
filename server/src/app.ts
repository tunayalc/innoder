import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import type { Config } from './config.js';
import type { Db } from './db.js';
import { createAuthGuard } from './auth.js';
import { registerAuthRoutes } from './routes/authRoutes.js';
import { registerUserRoutes } from './routes/userRoutes.js';
import { registerProgramRoutes } from './routes/programRoutes.js';
import { registerApplicationRoutes } from './routes/applicationRoutes.js';
import { registerBloodGroupRoutes } from './routes/bloodGroupRoutes.js';
import { registerPublicRoutes } from './routes/publicRoutes.js';
import { registerMessageRoutes } from './routes/messageRoutes.js';
import { HttpError } from './workflow.js';
import { runCleanupJobs } from './cleanup.js';

export const buildApp = async (config: Config, db: Db) => {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            level: config.NODE_ENV === 'production' ? 'info' : 'debug',
            redact: [
              'req.headers.authorization',
              'req.body.password',
              'req.body.currentPassword',
              'req.body.newPassword',
              'req.body.temporaryPassword',
              'req.body.refreshToken',
            ],
            serializers: {
              req: request => ({
                method: request.method,
                url: request.url?.split('?')[0],
                remoteAddress: request.socket?.remoteAddress,
              }),
            },
          },
    trustProxy: ['loopback', 'linklocal', 'uniquelocal'],
    bodyLimit: 1024 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  await app.register(rateLimit, {
    global: true,
    max: 180,
    timeWindow: '1 minute',
  });
  await app.register(multipart, {
    limits: { files: 1, fileSize: config.MAX_FILE_BYTES, fields: 5 },
  });
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/'))
      reply.header('Cache-Control', 'private, no-store');
  });

  const guard = createAuthGuard(config, db);

  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async (_request, reply) => {
    try {
      await db.query('SELECT 1');
      return { status: 'ok', database: 'ready' };
    } catch {
      return reply.code(503).send({ status: 'error', database: 'unavailable' });
    }
  });

  registerAuthRoutes(app, { db, config, guard });
  registerUserRoutes(app, { db, guard, config });
  registerProgramRoutes(app, { db, guard, config });
  registerApplicationRoutes(app, { db, config, guard });
  registerBloodGroupRoutes(app, { db, guard, config });
  registerPublicRoutes(app);
  registerMessageRoutes(app, { db, guard });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError)
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
        issues: error.issues,
      });
    if ((error as { code?: string }).code === '23505')
      return reply
        .code(409)
        .send({ message: 'Bu kayıt zaten mevcut. Güncel listeyi yenileyin.' });
    request.log.error({ err: error }, 'Unhandled request error');
    if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.code(413).send({ message: 'Dosya 20 MB sınırını aşıyor.' });
    }
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500)
      return reply
        .code(status)
        .send({
          message:
            status === 429
              ? 'Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.'
              : status === 413
              ? 'İstek boyutu sınırı aşıldı.'
              : status === 415
              ? 'İstek içerik türü desteklenmiyor.'
              : 'İstek geçersiz. Lütfen alanları kontrol edin.',
        });
    return reply.code(500).send({ message: 'İşlem tamamlanamadı.' });
  });

  let cleanupRunning = false;
  const cleanup = async () => {
    if (cleanupRunning) return;
    cleanupRunning = true;
    try {
      await runCleanupJobs(db, config.FILE_STORAGE_PATH);
    } catch (error) {
      app.log.error({ err: error }, 'File cleanup worker failed');
    } finally {
      cleanupRunning = false;
    }
  };
  const timer =
    config.NODE_ENV !== 'test'
      ? setInterval(() => {
          void cleanup();
        }, 60000)
      : undefined;
  timer?.unref();
  app.addHook('onClose', async () => {
    if (timer) clearInterval(timer);
    await db.end();
  });
  return app;
};
