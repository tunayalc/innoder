import * as XLSX from 'xlsx';
import {
  buildYouthpassWorkbookBase64,
  buildYouthpassWorkbookDataUri,
  XLSX_MIME_TYPE,
  YOUTHPASS_SHEET_NAME,
} from './youthpassExcel';

describe('youthpassExcel', () => {
  const rows = [
    ['Alan', 'Değer'],
    ['Program Kodu', 'ESC-2026'],
    ['Aday Ad Soyad', 'Ada Lovelace'],
  ] as const;

  it('builds a real xlsx workbook payload', () => {
    const base64 = buildYouthpassWorkbookBase64(rows);

    expect(base64.startsWith('UEsDB')).toBe(true);

    const workbook = XLSX.read(base64, { type: 'base64' });
    expect(workbook.SheetNames).toContain(YOUTHPASS_SHEET_NAME);

    const sheet = workbook.Sheets[YOUTHPASS_SHEET_NAME];
    expect(sheet.A1?.v).toBe('Alan');
    expect(sheet.B2?.v).toBe('ESC-2026');
    expect(sheet.B3?.v).toBe('Ada Lovelace');
  });

  it('builds a data uri with the xlsx mime type', () => {
    const dataUri = buildYouthpassWorkbookDataUri(rows);

    expect(dataUri.startsWith(`data:${XLSX_MIME_TYPE};base64,UEsDB`)).toBe(true);
  });
});
