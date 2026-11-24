import {
  buildYouthpassCsv,
  buildYouthpassCsvBase64,
  buildYouthpassCsvDataUri,
  CSV_MIME_TYPE,
} from './youthpassExcel';

describe('youthpassCsv', () => {
  const rows = [
    ['Alan', 'Değer'],
    ['Program Kodu', 'ESC-2026'],
    ['Aday Ad Soyad', 'Ada Lovelace'],
  ] as const;

  it('builds an Excel-compatible UTF-8 CSV payload', () => {
    const csv = buildYouthpassCsv(rows);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Program Kodu","ESC-2026"');
    expect(csv).toContain('"Alan","Değer"');
  });

  it('builds a base64 data URI', () => {
    expect(buildYouthpassCsvBase64(rows)).toBeTruthy();
    expect(buildYouthpassCsvDataUri(rows)).toMatch(new RegExp(`^data:${CSV_MIME_TYPE};base64,`));
  });
});
