import type { Application } from '../types';
import { appConfig } from '../config/appConfig';
import { openPrivateFile,trackPrivateFile } from './api/privateFiles';
import { generatePDF } from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import { buildEuropassCvPdfHtml } from '../utils/europassCvPdf';
import { buildMotivationLetterPdfHtml } from '../utils/motivationLetterPdf';

export const openApplicationPdf = async (
  application: Application,
  kind: 'cv' | 'motivation',
) => {
  if (appConfig.dataSource === 'remote')
    return openPrivateFile(`/api/applications/${application.id}/pdf/${kind}`);
  const html =
    kind === 'cv'
      ? buildEuropassCvPdfHtml({
          applicantName: application.personalInfo.fullName,
          cv: application.personalInfo.europassCv!,
        })
      : buildMotivationLetterPdfHtml({
          applicantName: application.personalInfo.fullName,
          letter: application.personalInfo.motivationLetter!,
        });
  const result = await generatePDF({
    html,
    fileName: `inno-${kind}-${Date.now()}`,
    width: 595,
    height: 842,
  });
  if (!result.filePath) throw new Error('PDF oluşturulamadı.');
  trackPrivateFile(result.filePath);
  await FileViewer.open(result.filePath, { showOpenWithDialog: true });
};
