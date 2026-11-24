import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { validateImage } from './imageValidation.js';
import { HttpError } from './workflow.js';
import type { MultipartFile } from '@fastify/multipart';

const ALLOWED_MIME_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
]);

export const validateUpload = (file: MultipartFile) => {
  const extension = ALLOWED_MIME_TYPES.get(file.mimetype);
  if (!extension)
    throw new Error('Yalnızca PDF, JPG ve PNG dosyaları yüklenebilir.');
  const incomingExtension = extname(file.filename).toLowerCase();
  if (
    !(
      incomingExtension === extension ||
      (extension === '.jpg' && incomingExtension === '.jpeg')
    )
  ) {
    throw new Error('Dosya uzantısı içerik türüyle uyumlu değil.');
  }
  return extension;
};

export const sanitizeFileName = (fileName: string) =>
  basename(fileName.replaceAll('\\', '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 240) || 'document';

export const storeUpload = async (
  basePath: string,
  applicationId: string,
  file: MultipartFile,
) => {
  const extension = validateUpload(file);
  const contents = await file.toBuffer();
  if (!contents.length) throw new Error('Dosya boş.');
  if (contents.length > 20 * 1024 * 1024 || file.file?.truncated)
    throw Object.assign(new Error('Dosya boş veya 20 MB sınırını aşıyor.'), {
      statusCode: 413,
    });
  const validSignature =
    (file.mimetype === 'application/pdf' &&
      contents.subarray(0, 5).toString() === '%PDF-') ||
    (file.mimetype === 'image/jpeg' &&
      contents[0] === 0xff &&
      contents[1] === 0xd8 &&
      contents[2] === 0xff) ||
    (file.mimetype === 'image/png' &&
      contents
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  if (!validSignature)
    throw new Error(
      'Dosya içeriği belirtilen biçimle uyumlu değil veya dosya bozuk.',
    );
  let pageCount = 1;
  try {
    if (file.mimetype === 'application/pdf') {
      const pdf = await PDFDocument.load(contents, {
        throwOnInvalidObject: true,
      });
      pageCount = pdf.getPageCount();
      if (pageCount < 1 || pageCount > 200) throw new Error('Sayfa sınırı');
    } else {
      await validateImage(contents, file.mimetype);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new Error(
      'Dosya okunamıyor. Şifresiz, geçerli bir PDF veya okunabilir JPG/PNG yükleyin (PDF: 200 sayfa, JPG: 40 MP, PNG: 20 MP).',
    );
  }
  const relativePath = join(applicationId, `${randomUUID()}${extension}`);
  const absolutePath = join(basePath, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true, mode: 0o700 });
  await writeFile(absolutePath, contents, { mode: 0o600, flag: 'wx' });
  return {
    relativePath,
    absolutePath,
    sizeBytes: contents.byteLength,
    pageCount,
    contentHash: createHash('sha256').update(contents).digest('hex'),
    safeFileName: sanitizeFileName(file.filename),
  };
};

export const removeStoredFile = (basePath: string, relativePath: string) =>
  rm(join(basePath, relativePath), { force: true });

export const readStoredFile = (basePath: string, relativePath: string) =>
  createReadStream(join(basePath, relativePath));
