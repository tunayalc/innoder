import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import { cvSchema, letterSchema, HttpError } from './workflow.js';

const font = fileURLToPath(
  new URL('../assets/fonts/NotoSans-Regular.ttf', import.meta.url),
);
export const applicationPdf = async (
  personal: Record<string, unknown>,
  kind: 'cv' | 'motivation',
) => {
  const pdf = new PDFDocument({
    size: 'A4',
    margin: 48,
    info: {
      Title: kind === 'cv' ? 'Europass CV' : 'Motivasyon Mektubu',
      Author: String(personal.fullName || ''),
    },
  });
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    pdf.on('data', chunk => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
  pdf.font(font);
  const heading = (text: string) => {
    pdf
      .moveDown(0.7)
      .fontSize(13)
      .fillColor('#413b70')
      .text(text)
      .moveDown(0.3);
  };
  const paragraph = (text: string) => {
    pdf.fontSize(10).fillColor('#202327').text(text, { lineGap: 4 });
  };
  pdf
    .fontSize(21)
    .fillColor('#202327')
    .text(String(personal.fullName || ''));
  if (kind === 'cv') {
    const parsed = cvSchema.safeParse(personal.europassCv);
    if (!parsed.success) {
      pdf.end();
      throw new HttpError(400, 'CV taslağı bulunamadı veya geçersiz.');
    }
    const cv = parsed.data;
    heading(cv.profileTitle);
    paragraph(cv.summary);
    heading('İş Deneyimi');
    for (const item of cv.workExperiences) {
      paragraph(
        `${item.role} | ${item.organization}\n${item.startDate} - ${item.endDate}\n${item.responsibilities}`,
      );
      pdf.moveDown(0.5);
    }
    heading('Eğitim');
    for (const item of cv.educationEntries) {
      paragraph(
        `${item.qualification} | ${item.institution}\n${item.startDate} - ${item.endDate}\n${item.description}`,
      );
      pdf.moveDown(0.5);
    }
    heading('Dil Becerileri');
    for (const item of cv.languageSkills)
      paragraph(
        `${item.language}: Dinleme ${item.listening}, Okuma ${item.reading}, Konuşma ${item.spokenInteraction}/${item.spokenProduction}, Yazma ${item.writing}`,
      );
    heading('Beceriler');
    paragraph(cv.keySkills);
    heading('Dijital Beceriler');
    paragraph(cv.digitalSkills);
  } else {
    const parsed = letterSchema.safeParse(personal.motivationLetter);
    if (!parsed.success) {
      pdf.end();
      throw new HttpError(400, 'Motivasyon taslağı bulunamadı veya geçersiz.');
    }
    const letter = parsed.data;
    heading(letter.subject);
    paragraph(letter.addressee);
    pdf.moveDown();
    for (const text of [
      letter.openingParagraph,
      letter.motivationParagraph,
      letter.contributionParagraph,
      letter.closingParagraph,
    ]) {
      paragraph(text);
      pdf.moveDown();
    }
  }
  pdf.end();
  return finished;
};
