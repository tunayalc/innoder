import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles, type AppColors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAppSelector } from '../../store/hooks';
import { selectApplicationById } from '../../store/selectors';
import type { DocumentStatus, DocumentViewerRouteProp, RootStackNavigationProp } from '../../types';
import { useI18n, getDocumentStatusLabel, getDocumentTypeLabel } from '../../i18n';

const statusToVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'ok':
      return 'ok' as const;
    case 'missing':
      return 'warn' as const;
    case 'wrong_format':
      return 'err' as const;
    case 'unread':
      return 'info' as const;
    default:
      return 'info' as const;
  }
};

export const DocumentViewerScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<DocumentViewerRouteProp>();
  const { applicationId, documentId } = route.params;
  const styles = useThemedStyles(createStyles);
  const { t, language } = useI18n();

  const application = useAppSelector(selectApplicationById(applicationId));

  const document = useMemo(
    () => application?.documents.find((d) => d.id === documentId),
    [application, documentId],
  );

  if (!application || !document) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>{t('documentViewer.title')}</Text>
        <Text style={styles.subtitle}>{t('documentViewer.notFound')}</Text>
      </View>
    );
  }

  const pages = Math.max(1, document.pageCount || 1);

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.h2}>{getDocumentTypeLabel(document.type, language)}</Text>
          <Text style={styles.subtitle}>
            {document.fileName || t('documentViewer.noFile')}
          </Text>
        </View>
        <Pill
          label={getDocumentStatusLabel(document.status, language)}
          variant={statusToVariant(document.status)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('documentViewer.previewTitle')}</Text>
        <Text style={styles.cardHint}>{t('documentViewer.previewHint')}</Text>
      </View>

      <View style={styles.previewWrap}>
        {Array.from({ length: pages }).map((_, idx) => (
          <View key={idx} style={styles.page}>
            <Text style={styles.pageText}>{t('documentViewer.page', { index: idx + 1 })}</Text>
          </View>
        ))}
      </View>

      {document.parseResult ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('documentViewer.parseTitle')}</Text>
          <Text style={styles.cardHint}>{document.parseResult}</Text>
        </View>
      ) : null}

      <Button
        label={t('documentViewer.verifyDecision')}
        onPress={() =>
          navigation.navigate('AdminDogrulama', { applicationId, documentId })
        }
      />
      <Button
        label={t('documentViewer.messaging')}
        variant="ghost"
        onPress={() => navigation.navigate('AdayMesaj', { applicationId })}
      />
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: {
      paddingTop: 16,
      gap: 12,
      padding: 20,
      paddingBottom: 40,
    } as ViewStyle,
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    } as ViewStyle,
    headerText: {
      flex: 1,
    } as ViewStyle,
    h2: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 3,
    } as TextStyle,
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
      gap: 8,
    } as ViewStyle,
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    cardHint: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    } as TextStyle,
    previewWrap: {
      gap: 12,
    } as ViewStyle,
    page: {
      height: 260,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.placeholder,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    pageText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '700',
    } as TextStyle,
  });
