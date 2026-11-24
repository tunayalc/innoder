import type {
  EuropassCvProfile,
  MotivationLetterDraft,
} from './shared/europass';

export type Role = 'candidate' | 'admin' | 'super_admin';
export type Stage = 'application_stage' | 'erasmus_stage' | 'returned_home';

export interface User {
  revision?: number;
  id: string;
  email: string;
  username?: string;
  phone?: string;
  country?: string;
  city?: string;
  birthDate?: string;
  nationality?: string;
  identityType?: 'passport' | 'turkish_id';
  passportNumber?: string;
  identityNumber?: string;
  pnrNumber?: string;
  name: string;
  role: Role;
  status: string;
  mustChangePassword: boolean;
  eventLink?: string;
  credentialRequestedAt?: string;
  createdAt: string;
}

export interface Document {
  revision?: number;
  version?: number;
  isCurrent?: boolean;
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'ok' | 'missing' | 'wrong_format' | 'unread';
  physicalDeliveryStatus: 'not_required' | 'awaiting_original' | 'delivered';
  verifyNote?: string;
  uploadedAt: string;
}

export interface Application {
  revision?: number;
  program?: Program;
  id: string;
  userId: string;
  programId: string;
  programName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateEventLink?: string;
  status: Stage;
  decisionStatus: 'active' | 'rejected';
  decisionReason?: string;
  personalInfo: {
    fullName?: string;
    birthDate?: string;
    nationality?: string;
    identityType?: string;
    identityNumber?: string;
    passportNumber?: string;
    pnrNumber?: string;
    phone?: string;
    email?: string;
    europassCv?: EuropassCvProfile;
    motivationLetter?: MotivationLetterDraft;
  };
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  stageCounts?: Record<string, number>;
}
export interface Program {
  programKind?: 'other' | 'esc';
  collectBloodGroup?: boolean;
  id: string;
  revision: number;
  name: string;
  year: number;
  active: boolean;
  steps: string[];
  deadlines: Array<{ label: string; dateISO: string }>;
  checklist: Array<{
    documentType: string;
    expectedFormat: string;
    requiredStage?: string;
    description?: string;
  }>;
  commonMistakes: string[];
}
export interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
  readBy: string[];
}
export interface ThreadSummary {
  programName?: string;
  threadId: string;
  name: string;
  unread: number;
  updatedAt: string;
}
export interface DeletionRequest {
  id: string;
  name: string;
  email: string;
  reason?: string;
  status: string;
  requestedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
}
