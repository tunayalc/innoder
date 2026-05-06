import {
  A4_PAGE_HEIGHT,
  A4_PAGE_WIDTH,
  buildMotivationLetterPdfHtml,
  createMotivationLetterPdfFileName,
  getMotivationLetterPdfWordCount,
  hasMotivationLetterPdfContent,
} from './motivationLetterPdf';
import type { MotivationLetterDraft } from '../types';

const letter: MotivationLetterDraft = {
  addressee: 'Selection Team',
  subject: 'Motivation Letter',
  openingParagraph: 'Opening paragraph with clear context.',
  motivationParagraph: 'Motivation paragraph with a focused programme reason.',
  contributionParagraph: 'Contribution paragraph with experience and concrete value.',
  closingParagraph: 'Closing paragraph with thanks and availability.',
};

describe('motivation letter pdf helpers', () => {
  it('builds A4 html with escaped letter content', () => {
    const html = buildMotivationLetterPdfHtml({
      letter: {
        ...letter,
        subject: 'Motivation <Letter>',
      },
      applicantName: 'Elif Yilmaz',
      programName: 'ESC Italy',
      generatedAt: new Date('2026-05-06T12:00:00Z'),
    });

    expect(html).toContain(`width: ${A4_PAGE_WIDTH}pt`);
    expect(html).toContain(`height: ${A4_PAGE_HEIGHT}pt`);
    expect(html).toContain('Elif Yilmaz');
    expect(html).toContain('ESC Italy');
    expect(html).toContain('Motivation &lt;Letter&gt;');
    expect(html).toContain('Tek sayfa A4 PDF');
  });

  it('creates a native-safe pdf file name', () => {
    expect(createMotivationLetterPdfFileName('Çağla İleri', 'ESC / Italy')).toBe(
      'Cagla_Ileri_ESC_Italy_motivasyon_mektubu',
    );
  });

  it('detects content and counts body words', () => {
    expect(hasMotivationLetterPdfContent(letter)).toBe(true);
    expect(getMotivationLetterPdfWordCount(letter)).toBe(25);
  });
});
