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
  loginCandidate(params: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<User>;
  registerCandidate(params: {
    fullName: string;
    email: string;
    eventLink?: string;
    kvkkAccepted: boolean;
    noticeAccepted: boolean;
    noticeVersion: string;
    consentVersion: string;
  }): Promise<User>;
  requestCandidatePassword(params: {
    fullName: string;
    email: string;
  }): Promise<User>;
  loginAdmin(params: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<User>;
  logout(): Promise<void>;
  changePassword(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void>;
  updateProfile(params: {
    userId: string;
    patch: Partial<User>;
  }): Promise<User>;
  listCandidates(): Promise<User[]>;
  sendCandidatePassword(params: {
    candidateUserId: string;
    password: string;
    adminUserId: string;
  }): Promise<User>;
}

export interface ProgramBackend {
  save?(
    input: ProgramDraftInput & {
      id?: string;
      revision?: number;
      active?: boolean;
    },
  ): Promise<AssignedProgram>;
  listPrograms(): Promise<ProgramInfo[]>;
  getProgram(programId: string): Promise<ProgramInfo>;
}

export interface ApplicationBackend {
  listPage?(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    programId?: string;
    hasIssues?: boolean;
    createdAfterISO?: string;
    query?: string;
  }): Promise<{
    items: Application[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  listForAdmin(filters: {
    status?: Application['status'];
    programId?: string;
    hasIssues?: boolean;
    createdAfterISO?: string;
    query?: string;
  }): Promise<Application[]>;
  listForCandidate(params: { userId: string }): Promise<Application[]>;
  getForCandidate(params: { userId: string }): Promise<Application | null>;
  ensureDraft(params: {
    userId: string;
    program: ProgramDraftInput;
    fullName: string;
  }): Promise<Application>;
  assignProgram(params: {
    userId: string;
    program: ProgramDraftInput;
    fullName: string;
  }): Promise<Application>;
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
    adminUserId?: string; // Used by the mock; the API reads the authenticated actor.
    qualityScore?: number; // Only legacy mock fixtures use this field.
    idempotencyKey?: string;
    signal?: AbortSignal;
    onProgress?: (percent: number) => void;
    parseResult?: string;
  }): Promise<{ application: Application; document: Document }>;

  verifyDocument(params: {
    applicationId: string;
    documentId: string;
    status: Document['status'];
    note: string;
    verifiedByUserId: string;
  }): Promise<{ application: Application; document: Document }>;

  approve(params: {
    applicationId: string;
    adminUserId: string;
  }): Promise<Application>;
  setStage(params: {
    applicationId: string;
    adminUserId: string;
    stage: Application['status'];
  }): Promise<Application>;
  reject(params: {
    applicationId: string;
    adminUserId: string;
    reason: string;
  }): Promise<Application>;
  setDecision(params: {
    applicationId: string;
    adminUserId: string;
    status: 'active' | 'rejected';
    reason?: string;
  }): Promise<Application>;
  setPhysicalDelivery(params: {
    applicationId: string;
    documentId: string;
    adminUserId: string;
    status: 'awaiting_original' | 'delivered';
  }): Promise<{ application: Application; document: Document }>;
}

export interface MessageBackend {
  listPage?(params: {
    applicationId: string;
    page: number;
    pageSize?: number;
  }): Promise<{
    items: Message[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  listByApplicationId(params: { applicationId: string }): Promise<Message[]>;
  send(params: {
    applicationId: string;
    senderId: string;
    senderRole: Message['senderRole'];
    content: string;
    relatedDocumentId?: string;
  }): Promise<Message>;
  markThreadRead(params: {
    applicationId: string;
    readerId: string;
  }): Promise<void>;
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
