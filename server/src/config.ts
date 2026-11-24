import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  JWT_SECRET: z.string().min(32),
  ESC_BLOOD_GROUP_KEY: z.preprocess(
    value => value === '' ? undefined : value,
    z.string().refine(value => {
      const decoded = Buffer.from(value, 'base64');
      return decoded.length === 32 && decoded.toString('base64') === value;
    }, 'Must be a base64-encoded 32-byte key.').optional(),
  ),
  ACCESS_TOKEN_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  FILE_STORAGE_PATH: z.string().default('./data/documents'),
  MAX_FILE_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_PASSWORD_BASE64: z.string().optional(),
  SMTP_FROM: z.string().default('Inno Association <noreply@example.org>'),
  PASSWORD_RESET_URL: z.string().url().default('http://localhost:3000/reset-password'),
}).superRefine((config, context) => {
  if (!config.SMTP_PASSWORD_BASE64) return;
  const canonical = Buffer.from(config.SMTP_PASSWORD_BASE64, 'base64').toString('base64');
  if (canonical !== config.SMTP_PASSWORD_BASE64) {
    context.addIssue({ code: 'custom', path: ['SMTP_PASSWORD_BASE64'], message: 'Must be canonical base64.' });
  }
}).transform((config) => ({
  ...config,
  SMTP_PASSWORD: config.SMTP_PASSWORD_BASE64
    ? Buffer.from(config.SMTP_PASSWORD_BASE64, 'base64').toString('utf8')
    : config.SMTP_PASSWORD,
}));

export type Config = z.infer<typeof schema>;

export const loadConfig = (source: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  return parsed.data;
};
