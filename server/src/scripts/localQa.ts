import EmbeddedPostgres from 'embedded-postgres';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { buildApp } from '../app.js';
import { loadConfig } from '../config.js';
import { hashPassword } from '../security.js';
import {applicationPdf} from '../pdf.js';
import {storeUpload} from '../storage.js';

if (process.env.NODE_ENV === 'production')
  throw new Error('Local QA must not run in production.');
const directory = await mkdtemp(join(tmpdir(), 'inno-local-qa-'));
const postgres = new EmbeddedPostgres({
  databaseDir: join(directory, 'pg'),
  port: 54862,
  user: 'postgres',
  password: 'local-qa-only',
  persistent: false,
  onLog: () => undefined,
  onError: () => undefined,
});
await postgres.initialise();
await postgres.start();
const db = new pg.Pool({
  connectionString:
    'postgresql://postgres:local-qa-only@127.0.0.1:54862/postgres',
});
for (const file of (await readdir(new URL('../../migrations', import.meta.url)))
  .filter(name => /^\d+_.+\.sql$/.test(name))
  .sort())
  await db.query(
    await readFile(
      new URL(`../../migrations/${file}`, import.meta.url),
      'utf8',
    ),
  );
const hash = await hashPassword('LocalQaPassword123');
const users=await db.query(
  `INSERT INTO users(name,email,role,status,password_hash,must_change_password) VALUES ('QA Yönetici','qa-admin@inno.test','super_admin','active',$1,false),('QA Aday','qa-candidate@inno.test','candidate','active',$1,false) RETURNING *`,
  [hash],
);
const admin=users.rows[0],candidate=users.rows[1];
const program=(await db.query(`INSERT INTO programs(name,year,checklist,deadlines,created_by_user_id) VALUES('QA ESC Programı',2026,$1,$2,$3) RETURNING *`,[JSON.stringify([{documentType:'identity',requiredStage:'application_stage',expectedFormat:'PDF / JPG / PNG'},{documentType:'activity_agreement',requiredStage:'application_stage',expectedFormat:'PDF'},{documentType:'boarding_pass_outbound',requiredStage:'erasmus_stage',expectedFormat:'PDF / JPG / PNG'},{documentType:'boarding_pass_return',requiredStage:'erasmus_stage',expectedFormat:'PDF / JPG / PNG'}]),JSON.stringify([{label:'QA belge teslimi',dateISO:new Date(Date.now()+7*86400000).toISOString()}]),admin.id])).rows[0];
const personal={fullName:'QA Aday',birthDate:'2000-01-01',nationality:'Germany',identityType:'passport',passportNumber:'QA123456',europassCv:{profileTitle:'QA Gönüllüsü',summary:'Toplum yararına projelerde gönüllü olarak çalışıyorum. Uluslararası ekiplerde iletişim ve iş birliği deneyimimi geliştirmeyi hedefliyorum.',keySkills:'Ekip çalışması, etkinlik planlama, sorumluluk alma ve kültürlerarası iletişim.',digitalSkills:'Ofis uygulamaları',workExperiences:[{role:'Gönüllü',organization:'QA Derneği',startDate:'2024',endDate:'2026',responsibilities:'QA etkinlikleri'}],educationEntries:[{qualification:'Lisans',institution:'QA Üniversitesi',startDate:'2021',endDate:'2025',description:'Öğrenim'}],languageSkills:[{language:'İngilizce',listening:'B2',reading:'B2',spokenInteraction:'B2',spokenProduction:'B2',writing:'B2'}]},motivationLetter:{addressee:'Dear QA team',subject:'QA ESC application',openingParagraph:'QA word '.repeat(20),motivationParagraph:'QA word '.repeat(40),contributionParagraph:'QA word '.repeat(40),closingParagraph:'QA word '.repeat(20)}};
const application=(await db.query('INSERT INTO applications(user_id,program_id,personal_info) VALUES($1,$2,$3) RETURNING *',[candidate.id,program.id,JSON.stringify(personal)])).rows[0];
const pdf=await applicationPdf(personal,'cv');
const stored=await storeUpload(join(directory,'documents'),application.id,{filename:'qa-test.pdf',mimetype:'application/pdf',toBuffer:async()=>pdf} as never);
await db.query("INSERT INTO documents(application_id,type,file_name,storage_path,mime_type,size_bytes,page_count,status) VALUES($1,'identity',$2,$3,'application/pdf',$4,$5,'ok')",[application.id,stored.safeFileName,stored.relativePath,stored.sizeBytes,stored.pageCount]);
await db.query("INSERT INTO messages(application_id,thread_key,sender_id,sender_role,content) VALUES($1,$2,$3,'candidate','QA başvuru mesajı'),(NULL,$4,$3,'candidate','QA genel mesajı')",[application.id,application.id,candidate.id,`general:${candidate.id}`]);
await db.query(`WITH people AS (INSERT INTO users(name,email,role,status) SELECT 'QA Aday '||n,'qa-'||n||'@inno.test','candidate','pending' FROM generate_series(1,49) n RETURNING id,name)
  INSERT INTO applications(user_id,program_id,personal_info) SELECT id,$1,jsonb_build_object('fullName',name) FROM people`,[program.id]);
const app = await buildApp(
  loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL:
      'postgresql://postgres:local-qa-only@127.0.0.1:54862/postgres',
    JWT_SECRET: 'local-qa-secret-is-not-a-production-secret',
    FILE_STORAGE_PATH: join(directory, 'documents'),
    ALLOWED_ORIGINS: 'http://127.0.0.1:5175,http://127.0.0.1:5177',
  }),
  db,
);
await app.listen({ host: '127.0.0.1', port: 3107 });
process.stdout.write(
  'Local QA API: http://127.0.0.1:3107\nLocal QA account: qa-admin@inno.test / LocalQaPassword123\n',
);
const stop = async () => {
  await app.close();
  await postgres.stop();
  await rm(directory, { recursive: true, force: true });
  process.exit(0);
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
