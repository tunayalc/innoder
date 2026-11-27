export type ApplicationStatus =
  | 'application_stage'
  | 'erasmus_stage'
  | 'returned_home';

export type ApplicationDecisionStatus = 'active' | 'rejected';

export type DocumentStatus = 'ok' | 'missing' | 'wrong_format' | 'unread';
export type PhysicalDeliveryStatus =
  | 'not_required'
  | 'awaiting_original'
  | 'delivered';
export type IdentityType = 'turkish_id' | 'passport';
import type { EuropassCvProfile, MotivationLetterDraft } from '../../admin-web/src/shared/europass';
export type { CefrLevel, EuropassWorkExperience, EuropassEducationEntry, EuropassLanguageSkill, EuropassCvProfile, MotivationLetterDraft } from '../../admin-web/src/shared/europass';

export type DocumentType =
  | 'identity'
  | 'form'
  | 'extra'
  | 'agreement'
  | 'photo_activity_report'
  | 'visa_payment_receipt_original'
  | 'boarding_pass'
  | 'boarding_pass_outbound'
  | 'boarding_pass_return'
  | 'activity_agreement'
  | 'commitment_letter';

export interface Document {
  revision?: number;
  version?: number;
  isCurrent?: boolean;
  id: string;
  applicationId: string;
  type: DocumentType;
  // Set when the document answers a checklist item the admin named.
  requirementKey?: string;
  fileName: string;
  fileUrl?: string;
  pageCount?: number;
  mimeType?: string;
  sizeBytes?: number;
  status: DocumentStatus;
  physicalDeliveryStatus?: PhysicalDeliveryStatus;
  physicalDeliveredAt?: string;
  physicalDeliveredByUserId?: string;
  parseResult?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
  verifyNote?: string;
}

export interface ProgramDeadline {
  label: string;
  dateISO: string;
}

export interface ProgramChecklistItem {
  documentType: DocumentType;
  // A key marks a document the admin named; it is uploaded as 'extra'.
  key?: string;
  label?: string;
  requiredStage?: ApplicationStatus;
  expectedFormat: string;
  description?: string;
  exampleHint?: string;
}

export interface AssignedProgram {
  programKind?: 'other' | 'esc';
  collectBloodGroup?: boolean;
  revision?: number;
  active?: boolean;
  id: string;
  name: string;
  year: number;
  steps: string[];
  deadlines: ProgramDeadline[];
  checklist: ProgramChecklistItem[];
  commonMistakes: string[];
  createdAt?: string;
  updatedAt?: string;
  createdByUserId?: string;
}

export interface ProgramDraftInput {
  programKind?: AssignedProgram['programKind'];
  collectBloodGroup?: boolean;
  id?: string;
  name: string;
  year: number;
  steps?: string[];
  deadlines?: ProgramDeadline[];
  checklist?: ProgramChecklistItem[];
  commonMistakes?: string[];
}

export interface Application {
  revision?: number;
  id: string;
  userId: string;
  programId: string;
  programName: string;
  program: AssignedProgram;
  status: ApplicationStatus;
  decisionStatus: ApplicationDecisionStatus;
  decisionReason?: string;
  personalInfo: PersonalInfo;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface PersonalInfo {
  fullName: string;
  birthDate?: string;
  nationality?: string;
  identityType?: IdentityType;
  identityNumber?: string;
  passportNumber?: string;
  pnrNumber?: string;
  programSelection?: string;
  europassCv?: EuropassCvProfile;
  motivationLetter?: MotivationLetterDraft;
}

export interface ApplicationState {
  page?: number;
  total?: number;
  hasMore?: boolean;
  applications: Application[];
  currentApplication: Application | null;
  isLoading: boolean;
  error: string | null;
}
