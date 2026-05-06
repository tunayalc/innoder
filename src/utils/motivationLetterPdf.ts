import type { MotivationLetterDraft } from '../types';
import { wordCount } from './europass';

export const A4_PAGE_WIDTH = 595;
export const A4_PAGE_HEIGHT = 842;
export const MOTIVATION_LETTER_PDF_MAX_WORDS = 420;

interface MotivationLetterPdfInput {
  letter: MotivationLetterDraft;
  applicantName?: string;
  programName?: string;
  generatedAt?: Date;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderTextBlock = (value: string): string =>
  escapeHtml(value.trim())
    .split(/\n+/)
    .filter(Boolean)
    .join('<br />');

const stripFileAccents = (value: string): string =>
  value
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const createMotivationLetterPdfFileName = (
  applicantName?: string,
  programName?: string,
): string => {
  const base = [applicantName, programName, 'motivasyon_mektubu']
    .filter((part): part is string => Boolean(part?.trim()))
    .join('_');

  const safeName = stripFileAccents(base || 'motivasyon_mektubu')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return safeName || 'motivasyon_mektubu';
};

export const getMotivationLetterPdfWordCount = (letter: MotivationLetterDraft): number =>
  [
    letter.openingParagraph,
    letter.motivationParagraph,
    letter.contributionParagraph,
    letter.closingParagraph,
  ].reduce((total, part) => total + wordCount(part), 0);

export const hasMotivationLetterPdfContent = (letter: MotivationLetterDraft): boolean =>
  Boolean(
    letter.addressee.trim() ||
      letter.subject.trim() ||
      letter.openingParagraph.trim() ||
      letter.motivationParagraph.trim() ||
      letter.contributionParagraph.trim() ||
      letter.closingParagraph.trim(),
  );

const getPdfTextScale = (letter: MotivationLetterDraft) => {
  const totalWords = getMotivationLetterPdfWordCount(letter);

  if (totalWords > 360) {
    return { bodyFontSize: 9.4, bodyLineHeight: 1.34, paragraphGap: 7 };
  }

  if (totalWords > 280) {
    return { bodyFontSize: 10.2, bodyLineHeight: 1.4, paragraphGap: 8 };
  }

  return { bodyFontSize: 11, bodyLineHeight: 1.48, paragraphGap: 10 };
};

export const buildMotivationLetterPdfHtml = ({
  letter,
  applicantName,
  programName,
  generatedAt = new Date(),
}: MotivationLetterPdfInput): string => {
  const { bodyFontSize, bodyLineHeight, paragraphGap } = getPdfTextScale(letter);
  const formattedDate = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(generatedAt);

  const addressee = renderTextBlock(letter.addressee) || 'Seçim Ekibi';
  const subject = renderTextBlock(letter.subject) || 'Motivasyon Mektubu';
  const paragraphs = [
    letter.openingParagraph,
    letter.motivationParagraph,
    letter.contributionParagraph,
    letter.closingParagraph,
  ]
    .map(renderTextBlock)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('');

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: ${A4_PAGE_WIDTH}pt;
        height: ${A4_PAGE_HEIGHT}pt;
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #1f2937;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      }

      .page {
        width: ${A4_PAGE_WIDTH}pt;
        height: ${A4_PAGE_HEIGHT}pt;
        padding: 46pt 52pt 42pt;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .topline {
        border-top: 4pt solid #376b21;
        padding-top: 14pt;
        margin-bottom: 20pt;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        gap: 24pt;
        align-items: flex-start;
      }

      .applicant {
        color: #111827;
        font-size: 15pt;
        font-weight: 700;
      }

      .program {
        color: #4b5563;
        font-size: 9pt;
        margin-top: 4pt;
      }

      .date {
        color: #6b7280;
        font-size: 9pt;
        text-align: right;
        white-space: nowrap;
      }

      .addressee {
        color: #374151;
        font-size: 10.5pt;
        line-height: 1.45;
        margin-bottom: 14pt;
      }

      .subject {
        background: #f9fafb;
        border: 1pt solid #d1d5db;
        color: #111827;
        font-size: 11pt;
        font-weight: 700;
        margin-bottom: 18pt;
        padding: 10pt 12pt;
      }

      .body {
        color: #1f2937;
        flex: 1;
        font-size: ${bodyFontSize}pt;
        line-height: ${bodyLineHeight};
      }

      p {
        margin: 0 0 ${paragraphGap}pt;
      }

      .signature {
        color: #1f2937;
        font-size: ${bodyFontSize}pt;
        line-height: 1.35;
        margin-top: 10pt;
      }

      .footer {
        border-top: 1pt solid #e5e7eb;
        color: #9ca3af;
        display: flex;
        font-size: 8pt;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 10pt;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="topline">
        <div class="meta">
          <div>
            <div class="applicant">${escapeHtml(applicantName?.trim() || 'Aday')}</div>
            <div class="program">${escapeHtml(programName?.trim() || 'Program başvurusu')}</div>
          </div>
          <div class="date">${escapeHtml(formattedDate)}</div>
        </div>
      </section>

      <section class="addressee">${addressee}</section>
      <section class="subject">${subject}</section>
      <section class="body">${paragraphs}</section>
      <section class="signature">Saygılarımla,<br />${escapeHtml(applicantName?.trim() || 'Aday')}</section>
      <footer class="footer">
        <span>Motivasyon mektubu</span>
        <span>Tek sayfa A4 PDF</span>
      </footer>
    </main>
  </body>
</html>`;
};
