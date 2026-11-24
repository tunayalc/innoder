import type { PublicUser } from './types.js';

export const mapUser = (row: Record<string, unknown>): PublicUser => ({
  revision: Number(row.revision || 1),
  id: String(row.id),
  email: String(row.email),
  username: row.username ? String(row.username) : undefined,
  name: String(row.name),
  role: row.role as PublicUser['role'],
  status: String(row.status),
  mustChangePassword: Boolean(row.must_change_password),
  credentialRequestPending: row.status === 'pending',
  credentialRequestedAt: row.credential_requested_at ? new Date(String(row.credential_requested_at)).toISOString() : undefined,
  credentialSentAt: row.credential_sent_at ? new Date(String(row.credential_sent_at)).toISOString() : undefined,
  eventLink: row.event_link ? String(row.event_link) : undefined,
  phone: row.phone ? String(row.phone) : undefined,
  country: row.country ? String(row.country) : undefined,
  city: row.city ? String(row.city) : undefined,
  birthDate: row.birth_date ? String(row.birth_date).slice(0, 10) : undefined,
  nationality: row.nationality ? String(row.nationality) : undefined,
  identityType: row.identity_type ? String(row.identity_type) : undefined,
  identityNumber: row.identity_number ? String(row.identity_number) : undefined,
  passportNumber: row.passport_number ? String(row.passport_number) : undefined,
  pnrNumber: row.pnr_number ? String(row.pnr_number) : undefined,
  kvkkAccepted: Boolean(row.kvkk_accepted),
  consentVersion: row.consent_version ? String(row.consent_version) : undefined,
  consentedAt: row.consented_at ? new Date(String(row.consented_at)).toISOString() : undefined,
  noticeVersion: row.notice_version ? String(row.notice_version) : undefined,
  noticeAcceptedAt: row.notice_accepted_at ? new Date(String(row.notice_accepted_at)).toISOString() : undefined,
  createdAt: new Date(String(row.created_at)).toISOString(),
  updatedAt: new Date(String(row.updated_at)).toISOString(),
});

const publicPersonalInfo = (value: unknown) => {
  const result = { ...(value as Record<string, unknown> | null) };
  delete result.bloodGroup;
  return result;
};

export const mapApplication = (row: Record<string, unknown>, documents: unknown[] = []) => ({
  revision: Number(row.revision || 1),
  id: row.id,
  userId: row.user_id,
  programId: row.program_id,
  programName: row.program_name,
  candidateEmail: row.candidate_email,
  candidatePhone: row.candidate_phone,
  program: row.program,
  status: row.stage,
  decisionStatus: row.decision_status,
  decisionReason: row.decision_reason ?? undefined,
  personalInfo: publicPersonalInfo(row.personal_info),
  documents,
  createdAt: new Date(String(row.created_at)).toISOString(),
  updatedAt: new Date(String(row.updated_at)).toISOString(),
  submittedAt: row.submitted_at ? new Date(String(row.submitted_at)).toISOString() : undefined,
});

export const mapDocument = (row: Record<string, unknown>) => ({
  revision: Number(row.revision || 1),
  version: Number(row.version || 1),
  isCurrent: row.is_current !== false,
  id: row.id,
  applicationId: row.application_id,
  type: row.type,
  fileName: row.file_name,
  fileUrl: `/api/documents/${row.id}/download`,
  pageCount: row.page_count ?? undefined,
  mimeType: row.mime_type,
  sizeBytes: Number(row.size_bytes ?? 0),
  status: row.status,
  physicalDeliveryStatus: row.physical_delivery_status,
  physicalDeliveredAt: row.physical_delivered_at ? new Date(String(row.physical_delivered_at)).toISOString() : undefined,
  physicalDeliveredByUserId: row.physical_delivered_by_user_id ?? undefined,
  uploadedAt: new Date(String(row.uploaded_at)).toISOString(),
  verifiedAt: row.verified_at ? new Date(String(row.verified_at)).toISOString() : undefined,
  verifiedByUserId: row.verified_by_user_id ?? undefined,
  verifyNote: row.verify_note ?? undefined,
});
