import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Button } from './Button';
import { apiClient, requireData } from '../services/api/apiClient';
import { openPrivateFile } from '../services/api/privateFiles';
import { getDocumentTypeLabel, useI18n } from '../i18n';
import { useThemedStyles, type AppColors } from '../theme';
import type { AssignedProgram, Document } from '../types';
import { appConfig } from '../config/appConfig';
import { documentLabel } from '../utils/documentSlots';

export const DocumentHistoryList = ({
  applicationId,
  program,
}: {
  applicationId: string;
  program?: Pick<AssignedProgram, 'checklist'>;
}) => {
  const [documents, setDocuments] = useState<Document[] | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const styles = useThemedStyles(createStyles),
    { language } = useI18n();
  if (appConfig.dataSource !== 'remote') return null;
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setDocuments(
        requireData(
          await apiClient.get<Document[]>(
            `/applications/${applicationId}/documents/history`,
          ),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Geçmiş yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.section}>
      <Button
        label={documents ? 'Belge Geçmişini Kapat' : 'Belge Yükleme Geçmişi'}
        variant="ghost"
        loading={loading}
        onPress={() => (documents ? setDocuments(null) : load())}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {documents?.map(document => (
        <View key={document.id} style={styles.row}>
          <Text style={styles.text}>
            {document.requirementKey ? documentLabel(document, program) : getDocumentTypeLabel(document.type, language)} · v
            {document.version || 1} · {document.isCurrent ? 'Güncel' : 'Önceki'}
          </Text>
          <Button
            label="Orijinali Aç"
            variant="ghost"
            onPress={() =>
              openPrivateFile(
                document.fileUrl!,
                document.mimeType === 'image/png'
                  ? 'png'
                  : document.mimeType === 'image/jpeg'
                  ? 'jpg'
                  : 'pdf',
              ).catch(cause =>
                setError(
                  cause instanceof Error ? cause.message : 'Dosya açılamadı.',
                ),
              )
            }
          />
        </View>
      ))}
    </View>
  );
};
const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: { gap: 12 },
    row: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: 4,
    },
    text: { color: colors.textPrimary, fontSize: 14 },
    error: { color: colors.danger, fontSize: 14 },
  });
