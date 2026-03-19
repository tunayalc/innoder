import * as XLSX from 'xlsx';

export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const YOUTHPASS_SHEET_NAME = 'Youthpass';

const DEFAULT_COLUMN_WIDTHS = [28, 44] as const;

const normalizeRows = (rows: readonly (readonly string[])[]) =>
  rows.map((row) => row.map((cell) => String(cell)));

export const buildYouthpassWorkbookBase64 = (
  rows: readonly (readonly string[])[],
) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(normalizeRows(rows));

  worksheet['!cols'] = DEFAULT_COLUMN_WIDTHS.map((width) => ({ wch: width }));

  XLSX.utils.book_append_sheet(workbook, worksheet, YOUTHPASS_SHEET_NAME);

  return XLSX.write(workbook, {
    type: 'base64',
    bookType: 'xlsx',
    compression: true,
  });
};

export const buildYouthpassWorkbookDataUri = (
  rows: readonly (readonly string[])[],
) => `data:${XLSX_MIME_TYPE};base64,${buildYouthpassWorkbookBase64(rows)}`;
