import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageStyle,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { pick, types as docTypes } from '@react-native-documents/picker';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { Button, Pill } from '../../components';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPES } from '../../constants';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationError, selectApplicationLoading, selectApplications } from '../../store/selectors';
import { uploadDocument } from '../../store/thunks/applicationThunks';
import { useThemedStyles, type AppColors } from '../../theme';
import { DocumentStatus, DocumentType, RootStackNavigationProp, RootStackParamList } from '../../types';

type CaptureFormat = 'jpg' | 'pdf';

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

export const AdayBelgeScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdayBelge'>>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);

  const application = useMemo(() => {
    if (route.params?.applicationId) {
      return applications.find((item) => item.id === route.params?.applicationId) || null;
    }

    return (
      applications
        .filter((item) => item.userId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ||
      null
    );
  }, [applications, route.params?.applicationId, user?.id]);

  const checklistItems = useMemo(() => application?.program.checklist || [], [application]);

  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(
    checklistItems[0]?.documentType || null,
  );
  const [captureFormat, setCaptureFormat] = useState<CaptureFormat>('jpg');
  const [capturedPages, setCapturedPages] = useState<Asset[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  useEffect(() => {
    if (checklistItems.length === 0) return;
    if (selectedDocType && checklistItems.some((item) => item.documentType === selectedDocType)) return;
    setSelectedDocType(checklistItems[0].documentType);
  }, [checklistItems, selectedDocType]);

  useEffect(() => {
    const photoUri = route.params?.capturedPhotoUri;
    if (!photoUri) return;

    setCapturedPages((prev) => [
      ...prev,
      { uri: photoUri, fileName: `camera_${Date.now()}.jpg` } as Asset,
    ]);
    navigation.setParams({ capturedPhotoUri: undefined });
  }, [navigation, route.params?.capturedPhotoUri]);

  const selectedChecklistItem = useMemo(
    () => checklistItems.find((item) => item.documentType === selectedDocType) || null,
    [checklistItems, selectedDocType],
  );

  const selectedDocument = useMemo(
    () => application?.documents.find((document) => document.type === selectedDocType) || null,
    [application, selectedDocType],
  );

  useEffect(() => {
    if (!selectedChecklistItem) return;
    const expected = selectedChecklistItem.expectedFormat.toLowerCase();
    const nextFormat: CaptureFormat = expected.includes('pdf') && !expected.includes('jpg') ? 'pdf' : 'jpg';
    setCaptureFormat(nextFormat);
    setCapturedPages([]);
    setPdfFileName(null);
    setPdfUri(null);
  }, [selectedChecklistItem]);

  const handleCameraCapture = useCallback(() => {
    if (!application || !selectedDocType) {
      Alert.alert('Uyarı', 'Önce program ve belge tipi seçilmelidir.');
      return;
    }

    navigation.navigate('BelgeCamera', {
      docType: selectedDocType,
      applicationId: application.id,
    });
  }, [application, navigation, selectedDocType]);

  const handleGalleryPick = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
        selectionLimit: 5,
        maxWidth: 2048,
        maxHeight: 2048,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Hata', result.errorMessage || 'Galeri açılamadı.');
        return;
      }
      const assets = result.assets ?? [];
      if (assets.length > 0) {
        setCapturedPages((prev) => [...prev, ...assets]);
      }
    } catch {
      Alert.alert('Hata', 'Galeri açılırken bir sorun oluştu.');
    }
  }, []);

  const handleDocumentPick = useCallback(async () => {
    try {
      const [result] = await pick({ type: [docTypes.pdf] });
      if (result) {
        setPdfFileName(result.name || 'document.pdf');
        setPdfUri(result.uri);
      }
    } catch (err: any) {
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Hata', 'Dosya seçilirken bir sorun oluştu.');
      }
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (!application || !user || !selectedDocType || !selectedDocument) return;

    const hasContent = captureFormat === 'pdf' ? Boolean(pdfUri) : capturedPages.length > 0;
    if (!hasContent) {
      Alert.alert(
        'Uyarı',
        captureFormat === 'pdf' ? 'Önce bir PDF dosyası seçin.' : 'Önce belgeyi tarayın (en az 1 sayfa).',
      );
      return;
    }

    const ext = captureFormat === 'pdf' ? 'pdf' : 'jpg';
    const mimeType = captureFormat === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const pageCount = captureFormat === 'pdf' ? 1 : capturedPages.length;
    const fileName =
      captureFormat === 'pdf' && pdfFileName
        ? pdfFileName
        : `${selectedDocType}_${user.id}_${Date.now()}_${pageCount}p.${ext}`;
    const fileUrl = captureFormat === 'pdf' && pdfUri ? pdfUri : capturedPages[0]?.uri;

    const parseResult = selectedDocType === 'boarding_pass'
      ? Math.random() > 0.5
        ? `QR_OK:${Math.floor(Math.random() * 999999)}`
        : 'QR_NOT_FOUND'
      : undefined;

    dispatch(
      uploadDocument({
        applicationId: application.id,
        documentType: selectedDocType,
        fileName,
        fileUrl,
        pageCount,
        mimeType,
        qualityScore: 3,
        parseResult,
      }),
    );

    setCapturedPages([]);
    setPdfFileName(null);
    setPdfUri(null);
    Alert.alert('Yükleme Başlatıldı', 'Belge gönderildi. Sonucu bu ekran üzerinden takip edebilirsiniz.');
  }, [application, capturedPages, captureFormat, dispatch, pdfFileName, pdfUri, selectedDocType, selectedDocument, user]);

  if (!application) {
    return (
      <View style={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Belge Yükleme</Text>
            <Text style={styles.subtitle}>Önce bir programa başvurmanız gerekiyor.</Text>
          </View>
        </View>
        <View style={styles.emptyCard}>
          <Button label="Programlarıma Git" onPress={() => navigation.navigate('AdayEgitim')} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerCard}>
        <View style={styles.accentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.h2}>Belge Yükleme</Text>
          <Text style={styles.subtitle}>{application.programName}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>PROGRAMA ÖZEL BELGELER</Text>
      <View style={styles.typeRow}>
        {checklistItems.map((item) => {
          const document = application.documents.find((entry) => entry.type === item.documentType);
          return (
            <TouchableOpacity
              key={item.documentType}
              style={[
                styles.typeChip,
                selectedDocType === item.documentType && styles.typeChipActive,
              ]}
              onPress={() => setSelectedDocType(item.documentType)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selectedDocType === item.documentType && styles.typeChipTextActive,
                ]}
              >
                {DOCUMENT_TYPES[item.documentType] || item.documentType}
              </Text>
              <Pill
                label={DOCUMENT_STATUS_LABELS[document?.status || 'missing']}
                variant={statusToVariant((document?.status || 'missing') as DocumentStatus)}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedChecklistItem ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{DOCUMENT_TYPES[selectedChecklistItem.documentType]}</Text>
          <Text style={styles.cardHint}>{selectedChecklistItem.expectedFormat}</Text>
          {selectedChecklistItem.description ? (
            <Text style={styles.cardText}>{selectedChecklistItem.description}</Text>
          ) : null}
          {selectedChecklistItem.exampleHint ? (
            <Text style={styles.cardText}>{selectedChecklistItem.exampleHint}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>FORMAT</Text>
      <View style={styles.formatRow}>
        {(['jpg', 'pdf'] as const).map((format) => (
          <TouchableOpacity
            key={format}
            style={[styles.formatChip, captureFormat === format && styles.formatChipActive]}
            onPress={() => {
              setCaptureFormat(format);
              setCapturedPages([]);
              setPdfFileName(null);
              setPdfUri(null);
            }}
          >
            <Text style={[styles.formatChipText, captureFormat === format && styles.formatChipTextActive]}>
              {format.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>YÜKLEME</Text>
      {captureFormat === 'jpg' ? (
        <>
          <View style={styles.scanActions}>
            <TouchableOpacity style={styles.scanBox} onPress={handleCameraCapture}>
              <View style={styles.scanGuide}>
                <Text style={styles.scanHintText}>Kamera ile Çek</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanBoxAlt} onPress={handleGalleryPick}>
              <View style={styles.scanGuide}>
                <Text style={styles.scanHintText}>Galeriden Seç</Text>
              </View>
            </TouchableOpacity>
          </View>

          {capturedPages.length > 0 ? (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.bodyText}>{capturedPages.length} sayfa eklendi</Text>
                <TouchableOpacity onPress={() => setCapturedPages([])}>
                  <Text style={styles.resetText}>Sıfırla</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                {capturedPages.map((asset, index) => (
                  <Image key={`${index}-${asset.uri}`} source={{ uri: asset.uri }} style={styles.thumbnail} />
                ))}
              </ScrollView>
            </>
          ) : null}
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.scanBox} onPress={handleDocumentPick}>
            <View style={styles.scanGuide}>
              <Text style={styles.scanHintText}>{pdfFileName || 'PDF Dosyası Seç'}</Text>
            </View>
          </TouchableOpacity>
          {pdfFileName ? (
            <View style={styles.rowBetween}>
              <Text style={styles.bodyText} numberOfLines={1}>{pdfFileName}</Text>
              <TouchableOpacity onPress={() => { setPdfFileName(null); setPdfUri(null); }}>
                <Text style={styles.resetText}>Sıfırla</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      )}

      <Button label={isLoading ? 'Yükleniyor...' : 'Belgeyi Yükle'} onPress={handleUpload} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: {
      paddingTop: 16,
      gap: 16,
      padding: 20,
      paddingBottom: 40,
    } as ViewStyle,
    headerCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      padding: 18,
      flexDirection: 'row',
      gap: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    accentBar: {
      width: 4,
      borderRadius: 2,
      backgroundColor: colors.teal,
    } as ViewStyle,
    headerContent: {
      flex: 1,
      gap: 4,
    } as ViewStyle,
    h2: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
    } as TextStyle,
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginTop: 4,
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
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    cardHint: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    } as TextStyle,
    cardText: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
    } as TextStyle,
    typeRow: {
      gap: 8,
    } as ViewStyle,
    typeChip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    typeChipActive: {
      borderColor: colors.teal,
      backgroundColor: colors.tealBg,
    } as ViewStyle,
    typeChipText: {
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '600',
    } as TextStyle,
    typeChipTextActive: {
      color: colors.teal,
    } as TextStyle,
    formatRow: {
      flexDirection: 'row',
      gap: 8,
    } as ViewStyle,
    formatChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    formatChipActive: {
      borderColor: colors.teal,
      backgroundColor: colors.tealBg,
    } as ViewStyle,
    formatChipText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    } as TextStyle,
    formatChipTextActive: {
      color: colors.teal,
    } as TextStyle,
    scanActions: {
      flexDirection: 'row',
      gap: 10,
    } as ViewStyle,
    scanBox: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: colors.tealBorder,
      padding: 16,
      backgroundColor: colors.tealBg,
      alignItems: 'center',
    } as ViewStyle,
    scanBoxAlt: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: colors.borderMedium,
      padding: 16,
      backgroundColor: colors.cardBg,
      alignItems: 'center',
    } as ViewStyle,
    scanGuide: {
      minHeight: 80,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    } as ViewStyle,
    scanHintText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    } as TextStyle,
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,
    bodyText: {
      color: colors.textPrimary,
      fontSize: 15,
    } as TextStyle,
    resetText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryDark,
      textDecorationLine: 'underline',
    } as TextStyle,
    thumbRow: {
      flexGrow: 0,
    } as ViewStyle,
    thumbnail: {
      width: 64,
      height: 80,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: colors.borderLight,
    } as ImageStyle,
    emptyCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 12,
      padding: 24,
      gap: 18,
      alignItems: 'center',
      marginTop: 16,
    } as ViewStyle,
    errorText: {
      fontSize: 14,
      color: colors.danger,
      textAlign: 'center',
    } as TextStyle,
  });
