import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { storeUpload, validateUpload } from './storage.js';
import { PDFDocument } from 'pdf-lib';
import jpeg from 'jpeg-js';
import pngjs from 'pngjs';
import { validateImage } from './imageValidation.js';

const fakeFile = (filename: string, mimetype: string, contents: Buffer) =>
  ({
    filename,
    mimetype,
    toBuffer: async () => contents,
  } as never);

test('accepts only PDF, JPEG and PNG uploads', () => {
  assert.doesNotThrow(() =>
    validateUpload(
      fakeFile('form.pdf', 'application/pdf', Buffer.from('%PDF-1.7')),
    ),
  );
  assert.throws(() =>
    validateUpload(fakeFile('video.mp4', 'video/mp4', Buffer.from('video'))),
  );
  assert.throws(() =>
    validateUpload(
      fakeFile('renamed.exe', 'application/pdf', Buffer.from('%PDF-1.7')),
    ),
  );
});

test('rejects a file whose signature does not match its MIME type', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'inno-storage-'));
  await assert.rejects(() =>
    storeUpload(
      directory,
      'application-1',
      fakeFile('fake.pdf', 'application/pdf', Buffer.from('not a pdf')),
    ),
  );
  await rm(directory, { recursive: true, force: true });
});

test('stores a valid file outside the public web root', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'inno-storage-'));
  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.addPage();
  const stored = await storeUpload(
    directory,
    'application-1',
    fakeFile('form.pdf', 'application/pdf', Buffer.from(await pdf.save())),
  );
  assert.equal(stored.pageCount, 2);
  assert.equal(
    (await readFile(stored.absolutePath)).subarray(0, 5).toString(),
    '%PDF-',
  );
  assert.match(stored.relativePath, /^application-1\//);
  await rm(directory, { recursive: true, force: true });
});

test('decodes JPEG and PNG pixels without a native CPU dependency and rejects broken image data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'inno-images-'));
  try {
    const pixels = Buffer.alloc(120 * 120 * 4, 255);
    const jpg = jpeg.encode({ data: pixels, width: 120, height: 120 }, 70).data;
    const png = pngjs.PNG.sync.write({
      width: 120,
      height: 120,
      data: pixels,
    } as pngjs.PNG);
    for (const [name, mime, bytes] of [
      ['photo.jpg', 'image/jpeg', jpg],
      ['photo.png', 'image/png', png],
    ] as const) {
      assert.equal(
        (await storeUpload(directory, 'images', fakeFile(name, mime, bytes)))
          .pageCount,
        1,
      );
      await assert.rejects(() =>
        storeUpload(
          directory,
          'images',
          fakeFile(name, mime, bytes.subarray(0, 40)),
        ),
      );
    }
    const small = pngjs.PNG.sync.write({
      width: 20,
      height: 20,
      data: Buffer.alloc(20 * 20 * 4),
    } as pngjs.PNG);
    await assert.rejects(() =>
      storeUpload(
        directory,
        'images',
        fakeFile('small.png', 'image/png', small),
      ),
    );
    const duplicateHeader = Buffer.concat([
      png.subarray(0, 33),
      png.subarray(8),
    ]);
    await assert.rejects(() => validateImage(duplicateHeader, 'image/png'));
    const hugeHeader = Buffer.from(png);
    hugeHeader.writeUInt32BE(100000, 16);
    await assert.rejects(() => validateImage(hugeHeader, 'image/png'));
    const corrupt = Buffer.from(png);
    corrupt[corrupt.length - 16] = corrupt[corrupt.length - 16]! ^ 255;
    await assert.rejects(() => validateImage(corrupt, 'image/png'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('image workers bound the queue instead of allowing unbounded parallel decoding', async () => {
  const png = pngjs.PNG.sync.write({
    width: 120,
    height: 120,
    data: Buffer.alloc(120 * 120 * 4, 255),
  } as pngjs.PNG);
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () => validateImage(png, 'image/png')),
  );
  assert.equal(
    results.filter(result => result.status === 'fulfilled').length,
    4,
  );
  const rejected = results.find(
    result => result.status === 'rejected',
  ) as PromiseRejectedResult;
  assert.equal(rejected.reason.statusCode, 429);
});
