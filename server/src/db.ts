import pg from 'pg';
import type { Config } from './config.js';

// PostgreSQL DATE is a calendar date, not an instant in the server timezone.
pg.types.setTypeParser(1082,value=>value);

export type Db = pg.Pool;
export type QueryDb = Pick<pg.Pool, 'query'>;

export const createDb = (config: Config): Db =>
  new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: config.NODE_ENV === 'test' ? 4 : 20,
    ssl: config.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
  });

export const withTransaction = async <T>(db: Db, run: (client: pg.PoolClient) => Promise<T>) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
