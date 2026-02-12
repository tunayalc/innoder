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
  endDate?: string;
  responsibilities?: string;
}

export interface EuropassEducationEntry {
  qualification: string;
  institution: string;
  startDate: string;
  endDate?: string;
  description?: string;
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
  digitalSkills?: string;
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

export interface Document {
  id: string;
  applicationId: string;
  type: 'identity' | 'form' | 'extra';
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
  europassCv?: EuropassCvProfile;
  motivationLetter?: MotivationLetterDraft;
}

export interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  isLoading: boolean;
  error: string | null;
}
