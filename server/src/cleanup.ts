import type { Db } from './db.js';
import { withTransaction } from './db.js';
import { removeStoredFile } from './storage.js';

export const runCleanupJobs = async (db: Db, basePath: string) => {
  await withTransaction(db, async client => {
    const jobs = await client.query(
      'SELECT * FROM file_cleanup_jobs WHERE completed_at IS NULL AND next_attempt_at <= now() ORDER BY created_at LIMIT 25 FOR UPDATE SKIP LOCKED',
    );
    for (const job of jobs.rows) {
      try {
        await removeStoredFile(basePath, job.storage_path);
        await client.query(
          'UPDATE file_cleanup_jobs SET completed_at=now(),last_error=NULL WHERE id=$1',
          [job.id],
        );
      } catch {
        await client.query(
          "UPDATE file_cleanup_jobs SET attempts=attempts+1,next_attempt_at=now()+interval '5 minutes',last_error='File cleanup failed' WHERE id=$1",
          [job.id],
        );
      }
    }
    await client.query(`UPDATE account_deletion_requests r SET status='completed',resolved_at=now() WHERE r.status='approved'
      AND NOT EXISTS(SELECT 1 FROM file_cleanup_jobs j WHERE j.request_id=r.id AND j.completed_at IS NULL)`);
  });
};
