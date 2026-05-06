import type { EuropassCvProfile } from '../types';

export const A4_CV_PAGE_WIDTH = 595;
export const A4_CV_PAGE_HEIGHT = 842;

interface EuropassCvPdfInput {
  cv: EuropassCvProfile;
  applicantName?: string;
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

export const createEuropassCvPdfFileName = (applicantName?: string): string => {
  const base = [applicantName, 'europass_cv']
    .filter((part): part is string => Boolean(part?.trim()))
    .join('_');

  const safeName = stripFileAccents(base || 'europass_cv')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return safeName || 'europass_cv';
};

export const hasEuropassCvPdfContent = (cv: EuropassCvProfile): boolean =>
  Boolean(
    cv.profileTitle.trim() ||
      cv.summary.trim() ||
      cv.keySkills.trim() ||
      cv.workExperiences.some(we => we.role.trim() || we.organization.trim()) ||
      cv.educationEntries.some(ee => ee.qualification.trim() || ee.institution.trim()) ||
      cv.languageSkills.some(ls => ls.language.trim()),
  );

export const buildEuropassCvPdfHtml = ({
  cv,
  applicantName,
  generatedAt = new Date(),
}: EuropassCvPdfInput): string => {
  const formattedDate = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(generatedAt);

  const profileTitle = renderTextBlock(cv.profileTitle) || 'Profesyonel Profil';
  const summary = renderTextBlock(cv.summary) || '';
  const keySkills = renderTextBlock(cv.keySkills) || '';
  const digitalSkills = renderTextBlock(cv.digitalSkills) || '';

  const workExperiences = cv.workExperiences
    .filter(we => we.role.trim() || we.organization.trim())
    .map(we => `
      <div class="experience-item">
        <div class="experience-header">
          <strong>${escapeHtml(we.role)}</strong>
          <span class="experience-dates">${escapeHtml(we.startDate)} - ${escapeHtml(we.endDate || 'Devam ediyor')}</span>
        </div>
        <div class="experience-org">${escapeHtml(we.organization)}</div>
        ${we.responsibilities ? `<div class="experience-desc">${renderTextBlock(we.responsibilities)}</div>` : ''}
      </div>
    `).join('');

  const educationEntries = cv.educationEntries
    .filter(ee => ee.qualification.trim() || ee.institution.trim())
    .map(ee => `
      <div class="experience-item">
        <div class="experience-header">
          <strong>${escapeHtml(ee.qualification)}</strong>
          <span class="experience-dates">${escapeHtml(ee.startDate)} - ${escapeHtml(ee.endDate || 'Devam ediyor')}</span>
        </div>
        <div class="experience-org">${escapeHtml(ee.institution)}</div>
        ${ee.description ? `<div class="experience-desc">${renderTextBlock(ee.description)}</div>` : ''}
      </div>
    `).join('');

  const languageSkills = cv.languageSkills
    .filter(ls => ls.language.trim())
    .map(ls => `
      <div class="language-item">
        <strong>${escapeHtml(ls.language)}</strong>
        <span class="language-levels">
          Dinleme: ${ls.listening}, Okuma: ${ls.reading}, Konuşma: ${ls.spokenInteraction}, Yazma: ${ls.writing}
        </span>
      </div>
    `).join('');

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
        width: ${A4_CV_PAGE_WIDTH}pt;
        height: auto;
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #1f2937;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        line-height: 1.4;
      }

      .page {
        width: ${A4_CV_PAGE_WIDTH}pt;
        min-height: ${A4_CV_PAGE_HEIGHT}pt;
        padding: 40pt 45pt;
        display: block;
      }

      .header {
        border-top: 4pt solid #1e40af;
        padding-top: 12pt;
        margin-bottom: 24pt;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .applicant {
        color: #111827;
        font-size: 18pt;
        font-weight: 700;
      }

      .date {
        color: #6b7280;
        font-size: 9pt;
        text-align: right;
      }

      .profile-title {
        color: #1e40af;
        font-size: 14pt;
        font-weight: 600;
        margin-bottom: 12pt;
      }

      .section {
        margin-bottom: 20pt;
      }

      .section-title {
        color: #1e40af;
        font-size: 12pt;
        font-weight: 700;
        margin-bottom: 8pt;
        border-bottom: 1pt solid #e5e7eb;
        padding-bottom: 4pt;
      }

      .section-content {
        font-size: 10pt;
        line-height: 1.5;
        margin-bottom: 8pt;
      }

      .experience-item {
        margin-bottom: 12pt;
        padding-bottom: 8pt;
        border-bottom: 0.5pt solid #f3f4f6;
      }

      .experience-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4pt;
      }

      .experience-header strong {
        font-weight: 600;
        color: #111827;
      }

      .experience-dates {
        font-size: 9pt;
        color: #6b7280;
        font-style: italic;
      }

      .experience-org {
        color: #4b5563;
        font-size: 9.5pt;
        margin-bottom: 4pt;
      }

      .experience-desc {
        font-size: 9pt;
        color: #6b7280;
        line-height: 1.4;
      }

      .language-item {
        margin-bottom: 6pt;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .language-levels {
        font-size: 8pt;
        color: #6b7280;
      }

      .footer {
        border-top: 1pt solid #e5e7eb;
        color: #9ca3af;
        display: flex;
        font-size: 8pt;
        justify-content: space-between;
        margin-top: 24pt;
        padding-top: 8pt;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <div class="applicant">${escapeHtml(applicantName?.trim() || 'Aday')}</div>
        <div class="date">${escapeHtml(formattedDate)}</div>
      </header>

      <div class="profile-title">${profileTitle}</div>

      ${summary ? `
      <section class="section">
        <div class="section-title">Kişisel Özet</div>
        <div class="section-content">${summary}</div>
      </section>` : ''}

      ${workExperiences ? `
      <section class="section">
        <div class="section-title">İş Deneyimi</div>
        ${workExperiences}
      </section>` : ''}

      ${educationEntries ? `
      <section class="section">
        <div class="section-title">Eğitim ve Öğrenim</div>
        ${educationEntries}
      </section>` : ''}

      ${languageSkills ? `
      <section class="section">
        <div class="section-title">Dil Yetkinlikleri</div>
        ${languageSkills}
      </section>` : ''}

      ${keySkills ? `
      <section class="section">
        <div class="section-title">Temel Yetkinlikler</div>
        <div class="section-content">${keySkills}</div>
      </section>` : ''}

      ${digitalSkills ? `
      <section class="section">
        <div class="section-title">Dijital Yetkinlikler</div>
        <div class="section-content">${digitalSkills}</div>
      </section>` : ''}

      <footer class="footer">
        <span>Europass CV</span>
        <span>PDF Özgeçmiş</span>
      </footer>
    </main>
  </body>
</html>`;
};