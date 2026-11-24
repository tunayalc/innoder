import { createHash, randomBytes, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import type { Config } from './config.js';
import type { AuthUser } from './types.js';

export const hashPassword = (password: string) =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password);
export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');
export const createOpaqueToken = () =>
  `${randomUUID()}.${randomBytes(32).toString('base64url')}`;

const secret = (config: Config) => new TextEncoder().encode(config.JWT_SECRET);

export const signAccessToken = (config: Config, user: AuthUser) =>
  new SignJWT({
    role: user.role,
    tokenVersion: user.tokenVersion,
    ...(user.sessionId ? { sid: user.sessionId } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${config.ACCESS_TOKEN_MINUTES}m`)
    .sign(secret(config));

export const verifyAccessToken = async (
  config: Config,
  token: string,
): Promise<AuthUser> => {
  const { payload } = await jwtVerify(token, secret(config), {
    algorithms: ['HS256'],
  });
  if (
    !payload.sub ||
    typeof payload.role !== 'string' ||
    typeof payload.tokenVersion !== 'number'
  ) {
    throw new Error('Invalid token payload');
  }
  return {
    id: payload.sub,
    role: payload.role as AuthUser['role'],
    tokenVersion: payload.tokenVersion,
    ...(typeof payload.sid === 'string' ? { sessionId: payload.sid } : {}),
  };
};

export const passwordPolicy = (password: string) =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password);
