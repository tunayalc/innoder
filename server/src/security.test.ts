import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from './config.js';
import { hashPassword, passwordPolicy, signAccessToken, verifyAccessToken, verifyPassword } from './security.js';

const config = loadConfig({
  NODE_ENV: 'test', DATABASE_URL: 'postgres://test:test@localhost/test',
  JWT_SECRET: '01234567890123456789012345678901',
});

test('passwords are hashed and verified with Argon2id', async () => {
  const hash = await hashPassword('StrongPassword123');
  assert.notEqual(hash, 'StrongPassword123');
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, 'StrongPassword123'), true);
  assert.equal(await verifyPassword(hash, 'wrong'), false);
});

test('password policy requires length, mixed case and a number', () => {
  assert.equal(passwordPolicy('StrongPassword123'), true);
  assert.equal(passwordPolicy('short1A'), false);
  assert.equal(passwordPolicy('alllowercase123'), false);
});

test('access token preserves the authorization claims', async () => {
  const token = await signAccessToken(config, { id: 'user-1', role: 'super_admin', tokenVersion: 4 });
  assert.deepEqual(await verifyAccessToken(config, token), { id: 'user-1', role: 'super_admin', tokenVersion: 4 });
});

test('SMTP password is decoded without dotenv interpolation', () => {
  const password = "P@ss'$word# 1";
  const smtpConfig = loadConfig({
    DATABASE_URL: 'postgres://test:test@localhost/test',
    JWT_SECRET: '01234567890123456789012345678901',
    SMTP_PASSWORD_BASE64: Buffer.from(password).toString('base64'),
  });
  assert.equal(smtpConfig.SMTP_PASSWORD, password);
});
