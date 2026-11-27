import { language, translate as tr } from './locale';
import type { Application, ChecklistItem, Document, Program } from './types';

export const STAGES = {
  application_stage: tr('Başvuru Aşaması'),
  erasmus_stage: tr('Hareketlilik / Erasmus Aşaması'),
  returned_home: tr('Ülkeye Dönüş Tamamlandı'),
} as const;
export const DOCUMENTS: Record<string, string> = {
  identity: tr('Kimlik Belgesi'),
  form: tr('Başvuru Formu'),
  extra: tr('Ek Belge'),
  agreement: tr('Anlaşma Belgesi'),
  activity_agreement: 'Activity Agreement',
  commitment_letter: tr('Taahhütname'),
  photo_activity_report: tr('Fotoğraflı Faaliyet / Etkinlik Belgesi'),
  visa_payment_receipt_original: tr('Vize Ödeme Dekontu'),
  boarding_pass: tr('Biniş Kartı (Eski Kayıt)'),
  boarding_pass_outbound: tr('Gidiş Biniş Kartı'),
  boarding_pass_return: tr('Dönüş Biniş Kartı'),
  cv: tr('Özgeçmiş'),
  motivation_letter: tr('Motivasyon Mektubu'),
  passport: tr('Pasaport'),
  residence_permit: tr('İkamet İzni'),
  insurance: tr('Sigorta Belgesi'),
  youthpass: 'Youthpass',
};
export const UPLOADABLE_DOCUMENT_TYPES = [
  'identity',
  'form',
  'extra',
  'agreement',
  'activity_agreement',
  'commitment_letter',
  'photo_activity_report',
  'visa_payment_receipt_original',
  'boarding_pass_outbound',
  'boarding_pass_return',
] as const;
// A slot is what a member uploads against: a fixed document type, or
// "extra:<key>" for a document the admin named in the program checklist.
export const itemSlot = (item: ChecklistItem) =>
  item.key ? `extra:${item.key}` : item.documentType;
export const documentSlot = (doc: Pick<Document, 'type' | 'requirementKey'>) =>
  doc.requirementKey ? `extra:${doc.requirementKey}` : doc.type;
export const parseSlot = (slot: string) =>
  slot.startsWith('extra:')
    ? { type: 'extra', requirementKey: slot.slice(6) }
    : { type: slot, requirementKey: undefined };
export const slotLabel = (slot: string, program?: Program) => {
  const { type, requirementKey } = parseSlot(slot);
  if (requirementKey)
    return (
      program?.checklist.find(item => item.key === requirementKey)?.label ||
      DOCUMENTS.extra
    );
  return DOCUMENTS[type] || type;
};
export const documentLabel = (
  doc: Pick<Document, 'type' | 'requirementKey'>,
  program?: Program,
) => slotLabel(documentSlot(doc), program);
// What a named document accepts; the text is shown to members as the format.
export const FILE_KINDS = {
  any: { label: tr('PDF ya da fotoğraf'), format: 'PDF / JPG / PNG', accept: '.pdf,.jpg,.jpeg,.png' },
  pdf: { label: tr('Sadece PDF'), format: 'PDF', accept: '.pdf' },
  image: { label: tr('Sadece fotoğraf (JPG/PNG)'), format: 'JPG / PNG', accept: '.jpg,.jpeg,.png' },
} as const;
export type FileKind = keyof typeof FILE_KINDS;
export const newRequirementKey = () =>
  `custom_${Array.from(crypto.getRandomValues(new Uint8Array(6)), byte =>
    byte.toString(36).padStart(2, '0'),
  )
    .join('')
    .slice(0, 12)}`;
export const USER_STATUS: Record<string, string> = {
  active: tr('Aktif'),
  pending: tr('Onay bekliyor'),
  pending_approval: tr('Onay bekliyor'),
  pending_credentials: tr('Şifre bekliyor'),
  disabled: tr('Pasif'),
  deletion_requested: tr('Silme talebi'),
  anonymized: tr('Anonimleştirildi'),
};
export const AUDIT_ACTIONS: Record<string, string> = {
  registration_requested: tr('Kayıt talebi alındı'),
  login: tr('Oturum açıldı'),
  logout: tr('Oturum kapatıldı'),
  password_changed: tr('Şifre değiştirildi'),
  password_reset_completed: tr('Şifre sıfırlandı'),
  profile_updated: tr('Profil güncellendi'),
  candidate_temporary_password_set: tr('Geçici şifre oluşturuldu'),
  admin_created: tr('Yönetici eklendi'),
  admin_status_changed: tr('Yönetici durumu değişti'),
  admin_password_reset: tr('Yönetici şifresi sıfırlandı'),
  application_created: tr('Başvuru oluşturuldu'),
  personal_info_updated: tr('Kişisel bilgiler güncellendi'),
  application_submitted: tr('Başvuru gönderildi'),
  application_stage_changed: tr('Başvuru aşaması değişti'),
  application_decision_changed: tr('Başvuru kararı değişti'),
  document_uploaded: tr('Belge yüklendi'),
  document_verified: tr('Belge incelendi'),
  document_physical_delivery_changed: tr('Asıl teslim durumu değişti'),
  account_deletion_requested: tr('Hesap silme talebi alındı'),
  account_anonymized: tr('Hesap anonimleştirildi'),
  program_created: tr('Program oluşturuldu'),
  message_sent: tr('Mesaj gönderildi'),
};
export const ENTITIES: Record<string, string> = {
  user: tr('Kullanıcı'),
  application: tr('Başvuru'),
  document: tr('Belge'),
  session: tr('Oturum'),
  program: tr('Program'),
  message: tr('Mesaj'),
};
const dateFormatter = new Intl.DateTimeFormat(
  language === 'en' ? 'en-GB' : 'tr-TR',
  {
    dateStyle: 'medium',
    timeStyle: 'short',
  },
);
export const formatDate = (value?: string) =>
  value && !Number.isNaN(Date.parse(value))
    ? dateFormatter.format(new Date(value))
    : '—';
/** Only http(s) links may be rendered as clickable anchors. */
export const safeHttpUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};
export const CONTACT_EMAIL = 'innodernegi@gmail.com';
export const CONTACT_LINKS: ReadonlyArray<readonly [string, string]> = [
  [CONTACT_EMAIL, `mailto:${CONTACT_EMAIL}`],
  ['Instagram', 'https://www.instagram.com/innodernegi/'],
];
export const formatBytes = (value: number) =>
  value < 1024 * 1024
    ? `${Math.ceil(value / 1024)} KB`
    : `${(value / 1024 / 1024).toFixed(1)} MB`;
export const matches = (query: string, ...values: unknown[]) =>
  values.some(
    value =>
      typeof value === 'string' &&
      value
        .toLocaleLowerCase('tr')
        .includes(query.trim().toLocaleLowerCase('tr')),
  );
export const applicantName = (item: Application) =>
  typeof item.personalInfo?.fullName === 'string' &&
  item.personalInfo.fullName.trim()
    ? item.personalInfo.fullName
    : tr('İsimsiz aday');
export const normalizeApplication = (item: Application): Application => ({
  ...item,
  personalInfo: Object.fromEntries(
    Object.entries(item.personalInfo || {}).filter(
      ([, value]) => typeof value === 'string',
    ),
  ),
});
export const passwordHint = tr(
  'En az 12 karakter; büyük harf, küçük harf ve rakam.',
);
export const dateBoundaryISO = (day: string, end = false) =>
  new Date(`${day}T${end ? '23:59:59.999' : '00:00:00.000'}`).toISOString();
export const validPassword = (value: string) =>
  value.length >= 12 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value);
