import type { ProgramInfo } from './backend/types';

/**
 * Mock program catalog.
 *
 * In the real system this comes from the backend/DB (program_checklists etc.).
 */
export const PROGRAM_CATALOG: ProgramInfo[] = [
  {
    id: 'prog-a',
    name: 'Program A',
    year: 2026,
    steps: [
      'Kayit formunu tamamla',
      'Katilim bilgilendirmesini oku ve checklisti takip et',
      'Kisisel bilgi formunu doldur ve basvuruyu gonder',
      'Belgeleri kamera ile tara ve yukle',
      'Admin dogrulamasi ve mesajlara gore duzeltme yap',
    ],
    deadlines: [
      { label: 'Basvuru kapanis', dateISO: '2026-03-15' },
      { label: 'Belge yukleme son', dateISO: '2026-03-20' },
    ],
    checklist: [
      {
        documentType: 'identity',
        expectedFormat: 'JPG/PDF (net, tum koseler gorunur)',
        description: 'Kimlik belgesi on ve arka yuz (gerekirse).',
        exampleHint: 'Isigi iyi ayarla, yansima olmasin.',
      },
      {
        documentType: 'form',
        expectedFormat: 'PDF (imzali)',
        description: 'Basvuru formu ciktisi ve imza.',
        exampleHint: 'Tek PDF icinde tum sayfalar.',
      },
      {
        documentType: 'agreement',
        expectedFormat: 'PDF (imzali)',
        description: 'Anlasma belgesi.',
        exampleHint: 'Imza gorunur olmali.',
      },
      {
        documentType: 'photo_activity_report',
        expectedFormat: 'JPG/PDF',
        description: 'Fotolu faaliyet raporu.',
        exampleHint: 'Fotolar okunur ve acik secik olmali.',
      },
      {
        documentType: 'visa_payment_receipt_original',
        expectedFormat: 'JPG/PDF',
        description: 'Vize odeme dekontunun asli.',
        exampleHint: 'Banka bilgileri ve tutar net gorunmeli.',
      },
      {
        documentType: 'boarding_pass',
        expectedFormat: 'JPG/PDF (QR/Barkod net)',
        description: 'Boarding pass.',
        exampleHint: 'QR/Barkod kadrajda ve okunur olmali.',
      },
    ],
    commonMistakes: [
      'Bulanik/karanlik fotograf (OKUNMADI)',
      'PDF yerine fotograf (YANLIS FORMAT)',
      'Eksik sayfa (EKSIK)',
      'Yanlis belge turu secimi',
    ],
  },
  {
    id: 'prog-b',
    name: 'Program B',
    year: 2026,
    steps: [
      'Kayit formunu tamamla',
      'Program B adimlarini incele',
      'Kisisel bilgi formunu doldur ve basvuruyu gonder',
      'Zorunlu belgeleri yukle',
    ],
    deadlines: [{ label: 'Basvuru kapanis', dateISO: '2026-04-01' }],
    checklist: [
      {
        documentType: 'identity',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'form',
        expectedFormat: 'PDF',
      },
      {
        documentType: 'agreement',
        expectedFormat: 'PDF',
      },
      {
        documentType: 'photo_activity_report',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'visa_payment_receipt_original',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'boarding_pass',
        expectedFormat: 'JPG/PDF',
      },
    ],
    commonMistakes: [
      'Eksik sayfa',
      'Yanlis format',
      'Dusuk kalite cekim',
    ],
  },
  {
    id: 'prog-c',
    name: 'Program C',
    year: 2026,
    steps: [
      'Kayit formunu tamamla',
      'Program C bilgilendirmesini oku',
      'Kisisel bilgi formunu doldur',
      'Belgeleri yukle ve mesajlari takip et',
    ],
    deadlines: [
      { label: 'Basvuru kapanis', dateISO: '2026-05-10' },
      { label: 'Belge guncelleme son', dateISO: '2026-05-15' },
    ],
    checklist: [
      {
        documentType: 'identity',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'form',
        expectedFormat: 'PDF',
      },
      {
        documentType: 'agreement',
        expectedFormat: 'PDF',
      },
      {
        documentType: 'photo_activity_report',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'visa_payment_receipt_original',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'boarding_pass',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'extra',
        expectedFormat: 'JPG/PDF',
      },
    ],
    commonMistakes: [
      'Eksik belge',
      'Okunmayan belge',
      'Yanlis belge turu',
    ],
  },
];

export const getProgramById = (programId: string): ProgramInfo => {
  const p = PROGRAM_CATALOG.find((x) => x.id === programId);
  if (!p) {
    // Should never happen in mock mode; keep a stable fallback.
    return PROGRAM_CATALOG[0];
  }
  return p;
};
