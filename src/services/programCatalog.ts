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
      'Kişisel bilgileri tamamla',
      'Katılım bilgilendirmesini oku ve kontrol listesini takip et',
      'CV ve motivasyon mektubunu programa göre hazırla',
      'Belgeleri belge yükleme ekranından tara ve yükle',
      'Admin doğrulaması ve mesajlara göre düzeltme yap',
    ],
    deadlines: [
      { label: 'Başvuru kapanışı', dateISO: '2026-03-15' },
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
        description: 'Programa özel başvuru formu çıktısı ve imza.',
        exampleHint: 'Tek PDF içinde tüm sayfalar yer almalı.',
      },
      {
        documentType: 'visa_payment_receipt_original',
        expectedFormat: 'JPG/PDF',
        description: 'Vize ödeme dekontunun aslı.',
        exampleHint: 'Tutar ve banka bilgileri net görünmeli.',
      },
      {
        documentType: 'boarding_pass',
        expectedFormat: 'PDF/JPG (QR/Barcode net görünür)',
        description: 'Ulaşım belgesi / biniş kartı.',
        exampleHint: 'PNR ve QR/Barcode alanı kadrajda olmalı.',
      },
      {
        documentType: 'photo_activity_report',
        expectedFormat: 'JPG/PDF',
        description: 'Fotoğraflı faaliyet raporu.',
        exampleHint: 'Fotoğraflar açık ve okunur olmalı.',
      },
      {
        documentType: 'extra',
        expectedFormat: 'JPG/PDF (varsa QR/Barcode)',
        description: 'Ek belge (davetiye, sertifika, bilet vb.).',
        exampleHint: 'QR/Barcode kadrajda ve net olmalı.',
      },
    ],
    commonMistakes: [
      'Bulanık veya karanlık fotoğraf (OKUNMADI)',
      'PDF yerine fotoğraf yüklemek (YANLIŞ FORMAT)',
      'Eksik sayfa bırakmak (EKSİK)',
      'QR/Barcode alanını kadraj dışında bırakmak',
      'Yanlış belge türü seçmek',
    ],
  },
  {
    id: 'prog-b',
    name: 'Program B',
    year: 2026,
    steps: [
      'Kişisel bilgileri tamamla',
      'Program B adımlarını incele',
      'CV ve motivasyon mektubunu hazırla',
      'Zorunlu belgeleri belge yükleme ekranından yükle',
    ],
    deadlines: [{ label: 'Başvuru kapanışı', dateISO: '2026-04-01' }],
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
      'Eksik sayfa yüklemek',
      'Yanlış format kullanmak',
      'Düşük kalite çekim göndermek',
    ],
  },
  {
    id: 'prog-c',
    name: 'Program C',
    year: 2026,
    steps: [
      'Kişisel bilgileri tamamla',
      'Program C bilgilendirmesini oku',
      'Programa özel içerikleri hazırla',
      'Belgeleri yükle ve mesajları takip et',
    ],
    deadlines: [
      { label: 'Başvuru kapanışı', dateISO: '2026-05-10' },
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
      'Eksik belge yüklemek',
      'Okunmayan belge göndermek',
      'Yanlış belge türü seçmek',
    ],
  },
];

export const getProgramById = (programId: string): ProgramInfo => {
  const program = PROGRAM_CATALOG.find((item) => item.id === programId);
  if (!program) {
    return PROGRAM_CATALOG[0];
  }
  return program;
};
