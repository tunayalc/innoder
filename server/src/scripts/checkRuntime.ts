import '../app.js';
import jpeg from 'jpeg-js';
import pngjs from 'pngjs';
import { validateImage } from '../imageValidation.js';

const data = Buffer.alloc(120 * 120 * 4, 255);
await validateImage(
  jpeg.encode({ data, width: 120, height: 120 }, 70).data,
  'image/jpeg',
);
await validateImage(
  pngjs.PNG.sync.write({ data, width: 120, height: 120 } as pngjs.PNG),
  'image/png',
);
process.stdout.write('API import and JPEG/PNG runtime checks passed.\n');
