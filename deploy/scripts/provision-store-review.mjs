// Run once in the API container, piping stdout to a protected local file.
// The reserved .example account owns only a synthetic application.
import { randomBytes } from 'node:crypto';
import { loadConfig } from './dist/config.js';
import { createDb, withTransaction } from './dist/db.js';
import { hashPassword } from './dist/security.js';

const name = 'Inno Store Review';
const email = 'apple-review@inno.example';
const password = `Review9${randomBytes(24).toString('base64url')}`;
const passwordHash = await hashPassword(password);
const db = createDb(loadConfig());

try {
  const result = await withTransaction(db, async client => {
    const year = new Date().getUTCFullYear();
    const title = 'Magaza Incelemesi / Sample Program';
    const steps = ['Upload a sample PDF', 'Check the document status'];
    const checklist = [{ documentType: 'form', requiredStage: 'application_stage', expectedFormat: 'PDF' }];
    const user = (await client.query(
      `INSERT INTO users(email, name, role, status, password_hash)
       VALUES ($1, $2, 'candidate', 'active', $3) RETURNING id`,
      [email, name, passwordHash],
    )).rows[0];
    const program = (await client.query(
      `INSERT INTO programs(name, year, steps, checklist, active)
       VALUES ($1, $2, $3, $4, false) RETURNING id`,
      [title, year, JSON.stringify(steps), JSON.stringify(checklist)],
    )).rows[0];
    const snapshot = { name: title, year, steps, deadlines: [], checklist, commonMistakes: [] };
    const application = (await client.query(
      `INSERT INTO applications(user_id, program_id, personal_info, program_snapshot)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, program.id, { fullName: name, email }, snapshot],
    )).rows[0];
    await client.query(
      `INSERT INTO audit_logs(action, entity_type, entity_id, metadata)
       VALUES ('store_review_provisioned', 'user', $1, $2)`,
      [user.id, { applicationId: application.id, synthetic: true }],
    );
    return { applicationId: application.id };
  });
  console.log(JSON.stringify({ email, password, ...result }));
} finally {
  await db.end();
}
