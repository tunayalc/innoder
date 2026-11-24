import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles, type AppColors } from '../../theme';
import { Button, Pill, ScreenScrollView } from '../../components';
import { useAppSelector } from '../../store/hooks';
import { selectApplicationById } from '../../store/selectors';
import type {
  DocumentStatus,
  DocumentViewerRouteProp,
  RootStackNavigationProp,
} from '../../types';
import {
  useI18n,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from '../../i18n';
import { openPrivateFile, saveOrSharePrivateDocument } from '../../services/api/privateFiles';
import { useAuth } from '../../hooks';

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
  const { isAdmin } = useAuth();
  const [isOpening, setIsOpening] = useState(false);
  const [fileAction, setFileAction] = useState<'download' | 'share'>();

  const application = useAppSelector(selectApplicationById(applicationId));

  const document = useMemo(
    () => application?.documents.find(d => d.id === documentId),
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

  const openDocument = async () => {
    if (!document.fileUrl) {
      Alert.alert(
        'Dosya Bulunamadı',
        'Bu belge için açılabilir bir dosya bulunmuyor.',
      );
      return;
    }
    setIsOpening(true);
    try {
      let path = document.fileUrl;
      if (
        path.startsWith('/api/') ||
        path.startsWith('http://') ||
        path.startsWith('https://')
      ) {
        const extension =
          document.mimeType === 'application/pdf'
            ? 'pdf'
            : document.mimeType === 'image/png'
            ? 'png'
            : 'jpg';
        await openPrivateFile(path, extension);
        return;
      }
      await FileViewer.open(path.replace(/^file:\/\//, ''), {
        showOpenWithDialog: true,
      });
    } catch (error) {
      Alert.alert(
        'Belge Açılamadı',
        error instanceof Error ? error.message : 'Dosya görüntülenemedi.',
      );
    } finally {
      setIsOpening(false);
    }
  };

  const canExport = isAdmin && Boolean(document.fileUrl?.match(/^(\/api\/|https:\/\/)/))
    && ['application/pdf', 'image/png', 'image/jpeg'].includes(document.mimeType || '');
  const canSave = Platform.OS === 'ios' || (Platform.OS === 'android' && Number(Platform.Version) >= 29);
  const exportDocument = async (action: 'download' | 'share') => {
    if (!canExport || !document.fileUrl) return;
    setFileAction(action);
    try {
      const saved = await saveOrSharePrivateDocument(
        document.fileUrl, document.fileName || '', document.mimeType || '', action === 'download',
      );
      if (action === 'download' && saved && Platform.OS === 'android') {
        Alert.alert(t('documentViewer.download'), t('documentViewer.saved'));
      }
    } catch {
      Alert.alert(t('documentViewer.exportError'));
    } finally {
      setFileAction(undefined);
    }
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.h2}>
            {getDocumentTypeLabel(document.type, language)}
          </Text>
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
        <Text style={styles.cardTitle}>Belge Dosyası</Text>
        <Text style={styles.cardHint}>
          {document.mimeType || 'Dosya türü bilinmiyor'}
          {document.sizeBytes
            ? ` · ${(document.sizeBytes / 1024 / 1024).toFixed(1)} MB`
            : ''}
        </Text>
        <Button
          label={isOpening ? 'Belge Açılıyor...' : 'Belgeyi Aç'}
          loading={isOpening}
          disabled={Boolean(fileAction)}
          onPress={openDocument}
        />
        {canExport && canSave && (
          <Button
            label={t('documentViewer.download')}
            variant="ghost"
            loading={fileAction === 'download'}
            disabled={isOpening || fileAction === 'share'}
            onPress={() => exportDocument('download')}
          />
        )}
        {canExport && (
          <Button
            label={t('documentViewer.share')}
            variant="ghost"
            loading={fileAction === 'share'}
            disabled={isOpening || fileAction === 'download'}
            onPress={() => exportDocument('share')}
          />
        )}
      </View>

      {document.parseResult ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('documentViewer.parseTitle')}</Text>
          <Text style={styles.cardHint}>{document.parseResult}</Text>
        </View>
      ) : null}

      {isAdmin ? (
        <Button
          label={t('documentViewer.verifyDecision')}
          onPress={() =>
            navigation.navigate('AdminDogrulama', { applicationId, documentId })
          }
        />
      ) : null}
      <Button
        label={t('documentViewer.messaging')}
        variant="ghost"
        onPress={() => navigation.navigate('AdayMesaj', { applicationId })}
      />
    </ScreenScrollView>
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
      borderRadius: 12,
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
      borderRadius: 12,
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
