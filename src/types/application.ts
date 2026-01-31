export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_fix'
  | 'approved'
  | 'rejected';

export type DocumentStatus = 'ok' | 'missing' | 'wrong_format' | 'unread';

export interface Document {
  id: string;
  applicationId: string;
  type: 'identity' | 'form' | 'extra';
  fileName: string;
  fileUrl?: string;
  status: DocumentStatus;
  parseResult?: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface Application {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  status: ApplicationStatus;
  personalInfo: PersonalInfo;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface PersonalInfo {
  fullName: string;
  birthDate?: string;
  identityNumber?: string;
  programSelection?: string;
}

export interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  isLoading: boolean;
  error: string | null;
}
