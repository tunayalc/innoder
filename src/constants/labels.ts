// Application Status Labels
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  application_stage: 'Başvuru Aşaması',
  erasmus_stage: 'Hareketlilik / Erasmus Aşaması',
  returned_home: 'Ülkeye Dönüş Tamamlandı',
};

export const APPLICATION_DECISION_LABELS: Record<string, string> = {
  active: 'Aktif',
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
  boarding_pass_outbound: 'Gidiş Biniş Kartı',
  boarding_pass_return: 'Dönüş Biniş Kartı',
  activity_agreement: 'Activity Agreement',
  commitment_letter: 'Taahhütname',
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
