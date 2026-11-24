// Run via stdin inside the API container to use its installed mailer and config.
import nodemailer from 'nodemailer';
import { loadConfig } from './dist/config.js';

const c = loadConfig();
const to = process.argv[2];
if (!c.SMTP_HOST || !c.SMTP_USER || !c.SMTP_PASSWORD || !to || !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(to)) {
  console.error('A configured SMTP account and one test recipient are required.');
  process.exit(1);
}
const mail = nodemailer.createTransport({
  host: c.SMTP_HOST, port: c.SMTP_PORT, secure: c.SMTP_PORT === 465, requireTLS: true,
  auth: { user: c.SMTP_USER, pass: c.SMTP_PASSWORD },
  connectionTimeout: 10000, socketTimeout: 15000,
});
try {
  await mail.verify();
  const result = await mail.sendMail({ from: c.SMTP_FROM, to, subject: 'Inno e-posta teslimat testi',
    text: 'Bu bir teslimat testidir. Hesap veya parola degisikligi yapilmadi.' });
  if (!result.accepted.length) throw new Error();
  console.log('SMTP accepted the test message. Confirm arrival in the test inbox.');
} catch {
  console.error('SMTP verification or test delivery failed.');
  process.exitCode = 1;
} finally {
  mail.close();
}
