import BlobUtil from 'react-native-blob-util';
import { generatePDF } from 'react-native-html-to-pdf';
import type { Asset } from 'react-native-image-picker';

export const createScanPdf = async (pages: Asset[]) => {
  if (!pages.length || pages.length > 20)
    throw new Error('Bir belgede 1–20 taranmış sayfa bulunabilir.');
  let total = 0;
  const images: string[] = [];
  for (const page of pages) {
    if (!page.uri) throw new Error('Sayfa dosyası bulunamadı.');
    const base64 = await BlobUtil.fs.readFile(
      page.uri.replace(/^file:\/\//, ''),
      'base64',
    );
    total += base64.length;
    if (total > 40 * 1024 * 1024)
      throw new Error(
        'Taranan sayfalar çok büyük. Daha az sayfa veya daha düşük çözünürlük kullanın.',
      );
    images.push(
      `<section><img src="data:${
        page.type === 'image/png' ? 'image/png' : 'image/jpeg'
      };base64,${base64}" /></section>`,
    );
  }
  const result = await generatePDF({
    fileName: `inno-scan-${Date.now()}`,
    width: 595,
    height: 842,
    html: `<html><head><meta charset="UTF-8"><style>@page{size:A4;margin:24px}body{margin:0}section{height:780px;page-break-after:always;display:flex;align-items:center;justify-content:center}section:last-child{page-break-after:auto}img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body>${images.join(
      '',
    )}</body></html>`,
  });
  if (!result.filePath)
    throw new Error('Taranan sayfalardan PDF oluşturulamadı.');
  return {
    uri: `file://${result.filePath}`,
    size: Number((await BlobUtil.fs.stat(result.filePath)).size),
  };
};
