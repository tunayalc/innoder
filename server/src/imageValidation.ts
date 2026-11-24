import { Worker } from 'node:worker_threads';
import { HttpError } from './workflow.js';

let active = false;
const waiting: Array<() => void> = [];
const acquire = async () => {
  if (active) {
    if (waiting.length >= 3)
      throw new HttpError(
        429,
        'Belge doğrulama yoğun. Lütfen biraz sonra tekrar deneyin.',
      );
    await new Promise<void>(resolve => waiting.push(resolve));
  }
  active = true;
};
const release = () => {
  const next = waiting.shift();
  if (next) next();
  else active = false;
};

// Decode away from the API event loop, with bounded memory, concurrency and time.
export const validateImage = async (contents: Buffer, mime: string) => {
  await acquire();
  let worker: Worker | undefined;
  try {
    const bytes = Uint8Array.from(contents);
    worker = new Worker(
      new URL('../assets/image-validator.cjs', import.meta.url),
      {
        workerData: { bytes, mime },
        transferList: [bytes.buffer],
        resourceLimits: {
          maxOldGenerationSizeMb: 128,
          maxYoungGenerationSizeMb: 16,
        },
      },
    );
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Image validation timed out')),
        10000,
      );
      const done = (error?: Error) => {
        clearTimeout(timer);
        error ? reject(error) : resolve();
      };
      worker!.once('message', (result: { ok: boolean }) =>
        done(result.ok ? undefined : new Error('Invalid image')),
      );
      worker!.once('error', error => done(error));
      worker!.once('exit', () =>
        done(new Error('Image validation interrupted')),
      );
    });
  } finally {
    if (worker) await worker.terminate();
    release();
  }
};
