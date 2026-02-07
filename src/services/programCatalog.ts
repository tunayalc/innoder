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
      'Kayıt formunu tamamla',
      'Katılım bilgilendirmesini oku ve checklist’i takip et',
      'Kişisel bilgi formunu doldur ve başvuruyu gönder',
      'Belgeleri kamera ile tara ve yükle',
      'Admin doğrulaması ve mesajlara göre düzeltme yap',
    ],
    deadlines: [
      { label: 'Başvuru kapanış', dateISO: '2026-03-15' },
      { label: 'Belge yükleme son', dateISO: '2026-03-20' },
    ],
    checklist: [
      {
        documentType: 'identity',
        expectedFormat: 'JPG/PDF (net, tüm köşeler görünür)',
        description: 'Kimlik belgesi ön ve arka yüz (gerekirse).',
        exampleHint: 'Işığı iyi ayarla, yansıma olmasın.',
      },
      {
        documentType: 'form',
        expectedFormat: 'PDF (imzalı)',
        description: 'Başvuru formu çıktısı ve imza.',
        exampleHint: 'Tek PDF içinde tüm sayfalar.',
      },
      {
        documentType: 'extra',
        expectedFormat: 'JPG/PDF (varsa QR/Barcode)',
        description: 'Ek belge (davetiye, sertifika, bilet vb.).',
        exampleHint: 'QR/Barcode kadrajda ve net olmalı.',
      },
    ],
    commonMistakes: [
      'Bulanık/karanlık fotoğraf (OKUNMADI)',
      'PDF yerine fotoğraf (YANLIŞ FORMAT)',
      'Eksik sayfa (EKSİK)',
      'Yanlış belge türü seçimi',
    ],
  },
  {
    id: 'prog-b',
    name: 'Program B',
    year: 2026,
    steps: [
      'Kayıt formunu tamamla',
      'Program B adımlarını incele',
      'Kişisel bilgi formunu doldur ve başvuruyu gönder',
      'Zorunlu belgeleri yükle',
    ],
    deadlines: [{ label: 'Başvuru kapanış', dateISO: '2026-04-01' }],
    checklist: [
      {
        documentType: 'identity',
        expectedFormat: 'JPG/PDF',
      },
      {
        documentType: 'form',
        expectedFormat: 'PDF',
      },
    ],
    commonMistakes: [
      'Eksik sayfa',
      'Yanlış format',
      'Düşük kalite çekim',
    ],
  },
  {
    id: 'prog-c',
    name: 'Program C',
    year: 2026,
    steps: [
      'Kayıt formunu tamamla',
      'Program C bilgilendirmesini oku',
      'Kişisel bilgi formunu doldur',
      'Belgeleri yükle ve mesajları takip et',
    ],
    deadlines: [
      { label: 'Başvuru kapanış', dateISO: '2026-05-10' },
      { label: 'Belge güncelleme son', dateISO: '2026-05-15' },
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
        documentType: 'extra',
        expectedFormat: 'JPG/PDF',
      },
    ],
    commonMistakes: [
      'Eksik belge',
      'Okunmayan belge',
      'Yanlış belge türü',
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

