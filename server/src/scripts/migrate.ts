import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../config.js';
import { createDb, withTransaction } from '../db.js';

const config = loadConfig();
const db = createDb(config);
const migrationDirectory = fileURLToPath(new URL('../../migrations', import.meta.url));

const files = (await readdir(migrationDirectory))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();
try {
  const applied=await withTransaction(db,async client=>{
    await client.query("SELECT pg_advisory_xact_lock(hashtext('inno-schema-migrations'))");
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())');
    const names:string[]=[];
    for(const name of files){
      if((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name])).rowCount)continue;
      await client.query(await readFile(join(migrationDirectory,name),'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);names.push(name);
    }
    return names;
  });
  for(const name of applied)process.stdout.write(`Applied ${name}\n`);
} finally { await db.end(); }
