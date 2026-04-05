import type {
  Application,
  AssignedProgram,
  AuditLog,
  Document,
  Message,
  PersonalInfo,
  ProgramDraftInput,
  User,
} from '../../types';

export type BackendErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'NETWORK'
  | 'UNKNOWN';

export class BackendError extends Error {
  code: BackendErrorCode;
  details: unknown;

  constructor(code: BackendErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'BackendError';
    this.code = code;
    this.details = details;
  }
}

export const isBackendError = (err: unknown): err is BackendError =>
  err instanceof BackendError;

export type ProgramInfo = AssignedProgram;

export interface AuthBackend {
  loginCandidate(params: { email: string; password: string }): Promise<User>;
  registerCandidate(params: {
    fullName: string;
    email: string;
    eventLink?: string;
    kvkkAccepted: boolean;
  }): Promise<User>;
  requestCandidatePassword(params: {
    fullName: string;
    email: string;
  }): Promise<User>;
  loginAdmin(params: { username: string; password: string }): Promise<User>;
  logout(): Promise<void>;
  updateProfile(params: { userId: string; patch: Partial<User> }): Promise<User>;
  listCandidates(): Promise<User[]>;
  sendCandidatePassword(params: {
    candidateUserId: string;
    password: string;
    adminUserId: string;
  }): Promise<User>;
}

export interface ProgramBackend {
  listPrograms(): Promise<ProgramInfo[]>;
  getProgram(programId: string): Promise<ProgramInfo>;
}

export interface ApplicationBackend {
  listForAdmin(filters: {
    status?: Application['status'];
    programId?: string;
    hasIssues?: boolean;
    createdAfterISO?: string;
    query?: string;
  }): Promise<Application[]>;
  listForCandidate(params: { userId: string }): Promise<Application[]>;
  getForCandidate(params: { userId: string }): Promise<Application | null>;
  ensureDraft(params: { userId: string; program: ProgramDraftInput; fullName: string }): Promise<Application>;
  assignProgram(params: { userId: string; program: ProgramDraftInput; fullName: string }): Promise<Application>;
  updatePersonalInfo(params: {
    applicationId: string;
    patch: Partial<PersonalInfo>;
    programId: string;
  }): Promise<Application>;
  submit(params: { applicationId: string }): Promise<Application>;

  uploadDocument(params: {
    applicationId: string;
    documentType: Document['type'];
    fileName: string;
    fileUrl?: string;
    pageCount: number;
    mimeType: string;
    qualityScore: number; // 1..3 (mock)
    idempotencyKey?: string;
    parseResult?: string;
  }): Promise<{ application: Application; document: Document }>;

  verifyDocument(params: {
    applicationId: string;
    documentId: string;
    status: Document['status'];
    note: string;
    verifiedByUserId: string;
  }): Promise<{ application: Application; document: Document }>;

  approve(params: { applicationId: string; adminUserId: string }): Promise<Application>;
  reject(params: {
    applicationId: string;
    adminUserId: string;
    reason: string;
  }): Promise<Application>;
}

export interface MessageBackend {
  listByApplicationId(params: { applicationId: string }): Promise<Message[]>;
  send(params: {
    applicationId: string;
    senderId: string;
    senderRole: Message['senderRole'];
    content: string;
    relatedDocumentId?: string;
  }): Promise<Message>;
  markThreadRead(params: { applicationId: string; readerId: string }): Promise<void>;
}

export interface AuditBackend {
  list(): Promise<AuditLog[]>;
  append(log: AuditLog): Promise<void>;
}

export interface InnoBackend {
  auth: AuthBackend;
  programs: ProgramBackend;
  applications: ApplicationBackend;
  messages: MessageBackend;
  audit: AuditBackend;
}
