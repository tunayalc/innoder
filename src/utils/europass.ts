import type {
  CefrLevel,
  EuropassCvProfile,
  EuropassEducationEntry,
  EuropassLanguageSkill,
  EuropassWorkExperience,
  MotivationLetterDraft,
} from '../types';

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const emptyWorkExperience = (): EuropassWorkExperience => ({
  role: '',
  organization: '',
  startDate: '',
  endDate: '',
  responsibilities: '',
});

const emptyEducationEntry = (): EuropassEducationEntry => ({
  qualification: '',
  institution: '',
  startDate: '',
  endDate: '',
  description: '',
});

const emptyLanguageSkill = (): EuropassLanguageSkill => ({
  language: '',
  listening: 'A1',
  reading: 'A1',
  spokenInteraction: 'A1',
  spokenProduction: 'A1',
  writing: 'A1',
});

export const createEmptyEuropassCv = (): EuropassCvProfile => ({
  profileTitle: '',
  summary: '',
  keySkills: '',
  digitalSkills: '',
  workExperiences: [emptyWorkExperience()],
  educationEntries: [emptyEducationEntry()],
  languageSkills: [emptyLanguageSkill()],
});

export const createEmptyMotivationLetter = (): MotivationLetterDraft => ({
  addressee: '',
  subject: '',
  openingParagraph: '',
  motivationParagraph: '',
  contributionParagraph: '',
  closingParagraph: '',
});

export const wordCount = (input: string): number => {
  const cleaned = input.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
};

const hasMinLength = (input: string, minLength: number) =>
  input.trim().length >= minLength;

export const isEuropassCvComplete = (cv?: EuropassCvProfile): boolean => {
  if (!cv) return false;
  if (!hasMinLength(cv.profileTitle, 3)) return false;
  if (!hasMinLength(cv.summary, 40)) return false;
  if (!hasMinLength(cv.keySkills, 20)) return false;
  if (!cv.workExperiences.length || !cv.educationEntries.length || !cv.languageSkills.length) {
    return false;
  }

  const hasWork = cv.workExperiences.some(
    (item) =>
      hasMinLength(item.role, 2) &&
      hasMinLength(item.organization, 2) &&
      hasMinLength(item.startDate, 4),
  );
  if (!hasWork) return false;

  const hasEducation = cv.educationEntries.some(
    (item) =>
      hasMinLength(item.qualification, 2) &&
      hasMinLength(item.institution, 2) &&
      hasMinLength(item.startDate, 4),
  );
  if (!hasEducation) return false;

  const hasLanguage = cv.languageSkills.some((item) => hasMinLength(item.language, 2));
  return hasLanguage;
};

export const isMotivationLetterComplete = (letter?: MotivationLetterDraft): boolean => {
  if (!letter) return false;

  return (
    hasMinLength(letter.addressee, 3) &&
    hasMinLength(letter.subject, 5) &&
    wordCount(letter.openingParagraph) >= 20 &&
    wordCount(letter.motivationParagraph) >= 40 &&
    wordCount(letter.contributionParagraph) >= 40 &&
    wordCount(letter.closingParagraph) >= 20
  );
};

