/* eslint-disable no-bitwise */
export const CSV_MIME_TYPE = 'text/csv;charset=utf-8';

const escapeCsvCell = (value: string) => `"${String(value).replaceAll('"', '""')}"`;

const encodeUtf8 = (value: string) => {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    let codePoint = value.charCodeAt(index);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
        index += 1;
      }
    }
    if (codePoint <= 0x7f) bytes.push(codePoint);
    else if (codePoint <= 0x7ff) bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 63));
    else if (codePoint <= 0xffff) bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 63), 0x80 | (codePoint & 63));
    else bytes.push(0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 63), 0x80 | ((codePoint >> 6) & 63), 0x80 | (codePoint & 63));
  }
  return bytes;
};

const encodeBase64 = (value: string) => {
  const bytes = encodeUtf8(value);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] || 0;
    const second = bytes[index + 1] || 0;
    const third = bytes[index + 2] || 0;
    const packed = (first << 16) | (second << 8) | third;
    output += alphabet[(packed >> 18) & 63];
    output += alphabet[(packed >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(packed >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? alphabet[packed & 63] : '=';
  }
  return output;
};

export const buildYouthpassCsv = (rows: readonly (readonly string[])[]) =>
  `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;

export const buildYouthpassCsvBase64 = (rows: readonly (readonly string[])[]) =>
  encodeBase64(buildYouthpassCsv(rows));

export const buildYouthpassCsvDataUri = (rows: readonly (readonly string[])[]) =>
  `data:${CSV_MIME_TYPE};base64,${buildYouthpassCsvBase64(rows)}`;
