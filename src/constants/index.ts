import { INNO_CONTACT_EMAIL, INNO_INSTAGRAM_URL } from './contact';

export * from './labels';
export * from './layout';
export * from './contact';

export const CONTACT_LINKS = {
  email: INNO_CONTACT_EMAIL,
  instagram: INNO_INSTAGRAM_URL,
} as const;
