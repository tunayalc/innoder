import { z } from 'zod';
import type { FastifyRequest } from 'fastify';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public issues?: unknown,
  ) {
    super(message);
  }
}
export const checkRevision = (
  request: FastifyRequest,
  row: Record<string, unknown>,
) => {
  const body = request.body as { revision?: unknown } | undefined;
  const raw = request.headers['if-match'] ?? body?.revision;
  if (raw === undefined) return; // Older clients remain compatible.
  const revision = Number(String(raw).replace(/^"|"$/g, ''));
  if (!Number.isInteger(revision) || revision !== Number(row.revision)) {
    throw new HttpError(
      409,
      'Kayıt başka bir işlemde güncellendi. Güncel kaydı yükleyip tekrar deneyin.',
      'REVISION_CONFLICT',
      { revision: row.revision, applicationId:row.application_id||('personal_info' in row ? row.id : undefined) },
    );
  }
};
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export const pagination = (query: unknown) => {
  const parsed = pageQuery.safeParse(query);
  if (!parsed.success)
    throw new HttpError(400, 'Sayfalama bilgileri geçersiz.');
  return {
    ...parsed.data,
    paged: parsed.data.page !== undefined,
    page: parsed.data.page ?? 1,
  };
};
export const stageForType = (type?: string) =>
  [
    'boarding_pass_outbound',
    'boarding_pass_return',
    'photo_activity_report',
  ].includes(type || '')
    ? 'erasmus_stage'
    : 'application_stage';
export const normalizeChecklist = (items: Array<Record<string, unknown>>) =>
  items.flatMap(item =>
    item.documentType === 'boarding_pass'
      ? ['outbound', 'return'].map(direction => ({
          ...item,
          id: `${item.id || 'boarding'}-${direction}`,
          documentType: `boarding_pass_${direction}`,
          requiredStage: 'erasmus_stage',
          title:
            direction === 'outbound'
              ? 'Gidiş Biniş Kartı'
              : 'Dönüş Biniş Kartı',
        }))
      : [item],
  );

const text = z.string().max(10000);
const entry = z.object({
  role: text,
  organization: text,
  startDate: text,
  endDate: text,
  responsibilities: text,
});
const education = z.object({
  qualification: text,
  institution: text,
  startDate: text,
  endDate: text,
  description: text,
});
const level = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const cvSchema = z.object({
  profileTitle: text,
  summary: text,
  keySkills: text,
  digitalSkills: text,
  workExperiences: z.array(entry).max(40),
  educationEntries: z.array(education).max(40),
  languageSkills: z
    .array(
      z.object({
        language: text,
        listening: level,
        reading: level,
        spokenInteraction: level,
        spokenProduction: level,
        writing: level,
      }),
    )
    .max(40),
});
export const letterSchema = z.object({
  addressee: text,
  subject: text,
  openingParagraph: text,
  motivationParagraph: text,
  contributionParagraph: text,
  closingParagraph: text,
});
const min = (value: string, length: number) => value.trim().length >= length;
const words = (value: string) =>
  value.trim() ? value.trim().split(/\s+/).length : 0;
export const cvComplete = (value: unknown) => {
  const parsed = cvSchema.safeParse(value);
  if (!parsed.success) return false;
  const cv = parsed.data;
  return (
    min(cv.profileTitle, 3) &&
    min(cv.summary, 40) &&
    min(cv.keySkills, 20) &&
    cv.workExperiences.some(
      item =>
        min(item.role, 2) &&
        min(item.organization, 2) &&
        min(item.startDate, 4),
    ) &&
    cv.educationEntries.some(
      item =>
        min(item.qualification, 2) &&
        min(item.institution, 2) &&
        min(item.startDate, 4),
    ) &&
    cv.languageSkills.some(item => min(item.language, 2))
  );
};
export const letterComplete = (value: unknown) => {
  const parsed = letterSchema.safeParse(value);
  if (!parsed.success) return false;
  const letter = parsed.data;
  return (
    min(letter.addressee, 3) &&
    min(letter.subject, 5) &&
    words(letter.openingParagraph) >= 20 &&
    words(letter.motivationParagraph) >= 40 &&
    words(letter.contributionParagraph) >= 40 &&
    words(letter.closingParagraph) >= 20
  );
};
export const birthDate = z
  .string()
  .refine(
    value =>
      !value ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value &&
        value <= new Date().toISOString().slice(0, 10)),
    'Geçerli bir doğum tarihi girin.',
  );
export const personalInfoSchema = z.object({
  fullName: z.string().trim().max(160).optional(),
  birthDate: birthDate.optional(),
  nationality: z.string().max(100).optional(),
  identityType: z.enum(['turkish_id', 'passport']).optional(),
  identityNumber: z.string().max(40).optional(),
  passportNumber: z.string().max(40).optional(),
  pnrNumber: z.string().max(60).optional(),
  programSelection: z.string().max(160).optional(),
  europassCv: cvSchema.optional(),
  motivationLetter: letterSchema.optional(),
  revision: z.number().int().positive().optional(),
});
export const missingFields = (personal: Record<string, unknown>) =>
  [
    !(typeof personal.fullName==='string'&&personal.fullName.trim()) && 'fullName',
    !(personal.birthDate&&birthDate.safeParse(personal.birthDate).success) && 'birthDate',
    !(typeof personal.nationality==='string'&&personal.nationality.trim()) && 'nationality',
    !(personal.identityType === 'passport'
      ? personal.passportNumber
      : personal.identityNumber) && 'identity',
    !cvComplete(personal.europassCv) && 'europassCv',
    !letterComplete(personal.motivationLetter) && 'motivationLetter',
  ].filter((field): field is string => Boolean(field));
export const csvCell = (value: unknown) => {
  let textValue = String(value ?? '');
  if (
    /^[\s\u0000-\u001f]*[=+@\-]/.test(textValue) ||
    /^[\t\r\n]/.test(textValue)
  )
    textValue = `'${textValue}`;
  return `"${textValue.replaceAll('"', '""')}"`;
};
