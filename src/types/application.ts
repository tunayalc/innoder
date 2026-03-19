export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_fix'
  | 'approved'
  | 'rejected';

export type DocumentStatus = 'ok' | 'missing' | 'wrong_format' | 'unread';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface EuropassWorkExperience {
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export interface EuropassEducationEntry {
  qualification: string;
  institution: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface EuropassLanguageSkill {
  language: string;
  listening: CefrLevel;
  reading: CefrLevel;
  spokenInteraction: CefrLevel;
  spokenProduction: CefrLevel;
  writing: CefrLevel;
}

export interface EuropassCvProfile {
  profileTitle: string;
  summary: string;
  keySkills: string;
  digitalSkills: string;
  workExperiences: EuropassWorkExperience[];
  educationEntries: EuropassEducationEntry[];
  languageSkills: EuropassLanguageSkill[];
}

export interface MotivationLetterDraft {
  addressee: string;
  subject: string;
  openingParagraph: string;
  motivationParagraph: string;
  contributionParagraph: string;
  closingParagraph: string;
}

export type DocumentType =
  | 'identity'
  | 'form'
  | 'extra'
  | 'agreement'
  | 'photo_activity_report'
  | 'visa_payment_receipt_original'
  | 'boarding_pass';

export interface Document {
  id: string;
  applicationId: string;
  type: DocumentType;
  fileName: string;
  fileUrl?: string;
  pageCount?: number;
  mimeType?: string;
  status: DocumentStatus;
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
  expectedFormat: string;
  description?: string;
  exampleHint?: string;
}

export interface AssignedProgram {
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
  name: string;
  year: number;
  steps?: string[];
  deadlines?: ProgramDeadline[];
  checklist?: ProgramChecklistItem[];
  commonMistakes?: string[];
}

export interface Application {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  program: AssignedProgram;
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
  pnrNumber?: string;
  programSelection?: string;
  europassCv?: EuropassCvProfile;
  motivationLetter?: MotivationLetterDraft;
}

export interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  isLoading: boolean;
  error: string | null;
}
