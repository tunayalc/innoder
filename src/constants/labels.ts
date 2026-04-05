// Application Status Labels
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  submitted: 'Gönderildi',
  under_review: 'İnceleniyor',
  needs_fix: 'Düzeltme Gerekli',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

// Document Status Labels
export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  ok: 'OK',
  missing: 'EKSİK',
  wrong_format: 'YANLIŞ FORMAT',
  unread: 'OKUNMADI',
};

// Document Types
export const DOCUMENT_TYPES = {
  identity: 'Kimlik Belgesi',
  form: 'Başvuru Formu',
  agreement: 'Anlaşma Belgesi',
  photo_activity_report: 'Fotoğraflı Faaliyet Raporu',
  visa_payment_receipt_original: 'Vize Ödeme Dekontu (Asıl)',
  boarding_pass: 'Biniş Kartı',
  extra: 'Ek Belge',
} as const;

// Audit Actions
export const AUDIT_ACTIONS = {
  USER_REGISTERED: 'Kullanıcı Kaydı',
  DOCUMENT_UPLOADED: 'Belge Yükleme',
  APPLICATION_SUBMITTED: 'Başvuru Gönderme',
  ADMIN_VERIFIED: 'Admin Doğrulaması',
  MESSAGE_SENT: 'Mesaj Gönderme',
  STATUS_CHANGED: 'Durum Değişikliği',
} as const;
