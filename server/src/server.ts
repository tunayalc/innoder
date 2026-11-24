import { loadConfig } from './config.js';
import { createDb } from './db.js';
import { buildApp } from './app.js';

const config = loadConfig();
const db = createDb(config);
const app = await buildApp(config, db);

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Shutting down');
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ host: config.HOST, port: config.PORT });
