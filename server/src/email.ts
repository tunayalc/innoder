import nodemailer from 'nodemailer';
import type { Config } from './config.js';

export const sendPasswordResetEmail = async (config: Config, to: string, token: string) => {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD) {
    throw new Error('SMTP is not configured.');
  }
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
  });
  const resetUrl = `${config.PASSWORD_RESET_URL}?token=${encodeURIComponent(token)}`;
  await transport.sendMail({
    from: config.SMTP_FROM,
    to,
    subject: 'Inno Association şifre sıfırlama',
    text: `Şifrenizi 30 dakika içinde yenilemek için bu bağlantıyı açın: ${resetUrl}`,
    html: `<p>Şifrenizi yenilemek için aşağıdaki bağlantıyı 30 dakika içinde açın.</p><p><a href="${resetUrl}">Şifremi yenile</a></p><p>Bu talebi siz oluşturmadıysanız bu mesajı yok sayabilirsiniz.</p>`,
  });
};

export const sendEmailChangeEmail = async (config: Config, to: string, token: string) => {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD) throw new Error('E-posta doğrulama hizmeti yapılandırılmamış.');
  const transport = nodemailer.createTransport({ host:config.SMTP_HOST,port:config.SMTP_PORT,secure:config.SMTP_PORT===465,auth:{user:config.SMTP_USER,pass:config.SMTP_PASSWORD} });
  const url = `${config.PUBLIC_API_URL}/confirm-email-change?token=${encodeURIComponent(token)}`;
  await transport.sendMail({ from:config.SMTP_FROM,to,subject:'Inno Derneği e-posta değişikliği',text:`Yeni e-posta adresinizi 30 dakika içinde doğrulayın: ${url}\nTalebi siz oluşturmadıysanız bu bağlantıyı kullanmayın.` });
};
