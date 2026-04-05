import type {
  AssignedProgram,
  DocumentType,
  ProgramChecklistItem,
  ProgramDeadline,
  ProgramDraftInput,
} from '../types';
import { DOCUMENT_TYPES } from '../constants';

const DEFAULT_YEAR = new Date().getFullYear();

export const ACTIVE_DOCUMENT_TYPES: DocumentType[] = [
  'identity',
  'form',
  'visa_payment_receipt_original',
  'boarding_pass',
  'photo_activity_report',
  'extra',
];

export const DOCUMENT_PRESETS: Record<DocumentType, Omit<ProgramChecklistItem, 'documentType'>> = {
  identity: {
    expectedFormat: 'JPG/PDF (net, tüm köşeler görünür)',
    description: 'Kimlik belgesi ön ve arka yüz.',
    exampleHint: 'Işığı iyi ayarlayın, yansıma olmasın.',
  },
  form: {
    expectedFormat: 'PDF (imzalı)',
    description: 'Başvuru formu çıktısı ve imza.',
    exampleHint: 'Tek PDF içinde tüm sayfalar.',
  },
  agreement: {
    expectedFormat: 'PDF (imzalı)',
    description: 'Anlaşma belgesi.',
    exampleHint: 'İmza görünür olmalı.',
  },
  photo_activity_report: {
    expectedFormat: 'JPG/PDF',
    description: 'Fotoğraflı faaliyet raporu.',
    exampleHint: 'Fotoğraflar okunur ve açık seçik olmalı.',
  },
  visa_payment_receipt_original: {
    expectedFormat: 'JPG/PDF',
    description: 'Vize ödeme dekontunun aslı.',
    exampleHint: 'Banka bilgileri ve tutar net görünmeli.',
  },
  boarding_pass: {
    expectedFormat: 'JPG/PDF (QR/Barkod net)',
    description: 'Biniş kartı veya ulaşım belgesi.',
    exampleHint: 'QR/Barkod alanı net ve kadraj içinde olmalı.',
  },
  extra: {
    expectedFormat: 'JPG/PDF',
    description: 'Programa özel ek belge.',
    exampleHint: 'Gerekli tüm sayfaları birlikte ekleyin.',
  },
};

export const DEFAULT_PROGRAM_STEPS = [
  'Kişisel bilgileri tamamla',
  'Program içeriklerini gözden geçir',
  'Motivasyon mektubunu hazırla',
  'Belgeleri yükle ve mesajları takip et',
] as const;

export const DEFAULT_COMMON_MISTAKES = [
  'Eksik belge yüklenmesi',
  'Yanlış format kullanılması',
  'Okunmayan veya bulanık belge',
] as const;

export const DEFAULT_REQUIRED_DOCUMENT_TYPES: DocumentType[] = ['identity', 'form'];

export const DOCUMENT_TYPE_OPTIONS = ACTIVE_DOCUMENT_TYPES.map((key) => ({
  key,
  label: DOCUMENT_TYPES[key],
}));

export const normalizeDocumentTypes = (documentTypes: DocumentType[]): DocumentType[] => {
  const seen = new Set<DocumentType>();
  const normalized = documentTypes.filter(
    (documentType) => ACTIVE_DOCUMENT_TYPES.includes(documentType) && !seen.has(documentType) && seen.add(documentType),
  );
  return normalized.length > 0 ? normalized : [...DEFAULT_REQUIRED_DOCUMENT_TYPES];
};

export const createChecklistFromDocumentTypes = (
  documentTypes: DocumentType[],
): ProgramChecklistItem[] =>
  normalizeDocumentTypes(documentTypes).map((documentType) => ({
    documentType,
    ...DOCUMENT_PRESETS[documentType],
  }));

export const createProgramDraftInput = (params: {
  name: string;
  year: number;
  documentTypes: DocumentType[];
  steps?: string[];
  deadlines?: AssignedProgram['deadlines'];
  commonMistakes?: string[];
}): ProgramDraftInput => ({
  name: params.name.trim(),
  year: params.year || DEFAULT_YEAR,
  steps:
    params.steps && params.steps.length > 0
      ? params.steps
      : [...DEFAULT_PROGRAM_STEPS],
  deadlines: params.deadlines || [],
  checklist: createChecklistFromDocumentTypes(params.documentTypes),
  commonMistakes:
    params.commonMistakes && params.commonMistakes.length > 0
      ? params.commonMistakes
      : [...DEFAULT_COMMON_MISTAKES],
});

export const materializeAssignedProgram = (params: {
  id: string;
  input: ProgramDraftInput;
  createdAt: string;
  createdByUserId?: string;
}): AssignedProgram => ({
  id: params.id,
  name: params.input.name.trim(),
  year: params.input.year,
  steps: [...(params.input.steps || DEFAULT_PROGRAM_STEPS)],
  deadlines: (params.input.deadlines || []).map((deadline) => ({ ...deadline })),
  checklist: (params.input.checklist || createChecklistFromDocumentTypes(DEFAULT_REQUIRED_DOCUMENT_TYPES)).map((item) => ({ ...item })),
  commonMistakes: [...(params.input.commonMistakes || DEFAULT_COMMON_MISTAKES)],
  createdAt: params.createdAt,
  updatedAt: params.createdAt,
  createdByUserId: params.createdByUserId,
});

export const parseTextLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const parseDeadlines = (value: string): ProgramDeadline[] =>
  parseTextLines(value)
    .map((line) => {
      const [label, dateISO] = line.split('|').map((part) => part.trim());
      if (!label || !dateISO) return null;
      return { label, dateISO };
    })
    .filter((item): item is ProgramDeadline => Boolean(item));
