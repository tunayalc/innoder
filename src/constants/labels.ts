// Application Status Labels
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  submitted: 'Gonderildi',
  under_review: 'Inceleniyor',
  needs_fix: 'Duzeltme Gerekli',
  approved: 'Onaylandi',
  rejected: 'Reddedildi',
};

// Document Status Labels
export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  ok: 'OK',
  missing: 'EKSIK',
  wrong_format: 'YANLIS FORMAT',
  unread: 'OKUNMADI',
};

// Document Types
export const DOCUMENT_TYPES = {
  identity: 'Kimlik Belgesi',
  form: 'Basvuru Formu',
  extra: 'Ek Belge',
  agreement: 'Anlasma',
  photo_activity_report: 'Fotolu Faaliyet Raporu',
  visa_payment_receipt_original: 'Vize Odeme Dekontu (Asli)',
  boarding_pass: 'Boarding Pass',
} as const;

// Audit Actions
export const AUDIT_ACTIONS = {
  USER_REGISTERED: 'Kullanici Kaydi',
  DOCUMENT_UPLOADED: 'Belge Yukleme',
  APPLICATION_SUBMITTED: 'Basvuru Gonderme',
  ADMIN_VERIFIED: 'Admin Dogrulamasi',
  MESSAGE_SENT: 'Mesaj Gonderme',
  STATUS_CHANGED: 'Durum Degisikligi',
} as const;
