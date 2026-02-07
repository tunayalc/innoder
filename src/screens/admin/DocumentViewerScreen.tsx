import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAppSelector } from '../../store/hooks';
import { selectApplicationById } from '../../store/selectors';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPES } from '../../constants';
import type { DocumentStatus, DocumentViewerRouteProp, RootStackNavigationProp } from '../../types';

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

  const application = useAppSelector(selectApplicationById(applicationId));

  const document = useMemo(
    () => application?.documents.find((d) => d.id === documentId),
    [application, documentId],
  );

  if (!application || !document) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>Belge Görüntüleme</Text>
        <Text style={styles.subtitle}>Belge bulunamadı.</Text>
      </View>
    );
  }

  const pages = Math.max(1, document.pageCount || 1);

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.h2}>{DOCUMENT_TYPES[document.type] || document.type}</Text>
          <Text style={styles.subtitle}>
            {document.fileName ? document.fileName : 'Henüz dosya yok'}
          </Text>
        </View>
        <Pill
          label={DOCUMENT_STATUS_LABELS[document.status] || document.status}
          variant={statusToVariant(document.status)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Önizleme (Mock)</Text>
        <Text style={styles.cardHint}>
          Backend bağlantısı olmadığı için gerçek dosya görüntüleme yerine sayfa bazlı bir önizleme
          yer tutucusu gösterilir. Gerçek entegrasyonda dosya URL’si ile PDF/IMG viewer açılacak.
        </Text>
      </View>

      <View style={styles.previewWrap}>
        {Array.from({ length: pages }).map((_, idx) => (
          <View key={idx} style={styles.page}>
            <Text style={styles.pageText}>Sayfa {idx + 1}</Text>
          </View>
        ))}
      </View>

      {document.parseResult ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parse Sonucu</Text>
          <Text style={styles.cardHint}>{document.parseResult}</Text>
        </View>
      ) : null}

      <Button
        label="Doğrulama Kararı"
        onPress={() =>
          navigation.navigate('AdminDogrulama', { applicationId, documentId })
        }
      />
      <Button
        label="Mesajlaşma"
        variant="ghost"
        onPress={() => navigation.navigate('AdayMesaj', { applicationId })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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

