const { parentPort, workerData } = require('node:worker_threads');
const { imageSize } = require('image-size');
const jpeg = require('jpeg-js');
const zlib = require('node:zlib');
const inflateSync = zlib.inflateSync;
zlib.inflateSync = (bytes, options) =>
  inflateSync(bytes, { ...options, maxOutputLength: 192 * 1024 * 1024 });
const { PNG } = require('pngjs');

try {
  const bytes = Buffer.from(workerData.bytes);
  const metadata = imageSize(bytes);
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width < 100 ||
    metadata.height < 100 ||
    metadata.width * metadata.height >
      (workerData.mime === 'image/png' ? 20000000 : 40000000)
  )
    throw new Error('dimensions');
  if (metadata.type !== (workerData.mime === 'image/jpeg' ? 'jpg' : 'png'))
    throw new Error('format');
  if (workerData.mime === 'image/png') {
    // Reject duplicate IHDR chunks before the decoder can allocate from conflicting dimensions.
    let offset = 8,
      headers = 0;
    while (offset + 12 <= bytes.length) {
      const size = bytes.readUInt32BE(offset),
        type = bytes.toString('ascii', offset + 4, offset + 8);
      if (size > bytes.length - offset - 12) throw new Error('chunk');
      if (type === 'IHDR' && (++headers !== 1 || offset !== 8 || size !== 13))
        throw new Error('header');
      offset += size + 12;
      if (type === 'IEND') break;
    }
    if (headers !== 1) throw new Error('header');
  }
  const decoded =
    workerData.mime === 'image/jpeg'
      ? jpeg.decode(bytes, {
          useTArray: true,
          tolerantDecoding: false,
          maxResolutionInMP: 40,
          maxMemoryUsageInMB: 256,
        })
      : PNG.sync.read(bytes, { checkCRC: true });
  if (
    decoded.width !== metadata.width ||
    decoded.height !== metadata.height ||
    decoded.data.length !== decoded.width * decoded.height * 4
  )
    throw new Error('pixels');
  parentPort.postMessage({ ok: true });
} catch {
  parentPort.postMessage({ ok: false });
}
