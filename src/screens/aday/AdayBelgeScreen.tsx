import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ImageStyle,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { pick, types as docTypes } from '@react-native-documents/picker';
import { colors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationError, selectApplicationLoading, selectApplications } from '../../store/selectors';
import { DOCUMENT_TYPES, DOCUMENT_STATUS_LABELS } from '../../constants';
import { DocumentStatus, RootStackNavigationProp, RootStackParamList } from '../../types';
import { uploadDocument } from '../../store/thunks/applicationThunks';
import { getProgramById } from '../../services/programCatalog';

type DocType = 'identity' | 'form' | 'boarding_pass' | 'extra';
type CaptureFormat = 'jpg' | 'pdf';

const DOC_TYPE_OPTIONS: { key: DocType; label: string }[] = [
  { key: 'identity', label: 'Kimlik Belgesi' },
  { key: 'form', label: 'Başvuru Formu' },
  { key: 'boarding_pass', label: 'Biniş Kartı' },
  { key: 'extra', label: 'Ek Belge' },
];

const statusToVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'ok': return 'ok' as const;
    case 'missing': return 'warn' as const;
    case 'wrong_format': return 'err' as const;
    case 'unread': return 'info' as const;
    default: return 'info' as const;
  }
};

export const AdayBelgeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdayBelge'>>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);

  const myApplication = useMemo(
    () => applications.find((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const [selectedDocType, setSelectedDocType] = useState<DocType>('identity');
  const [captureFormat, setCaptureFormat] = useState<CaptureFormat>('jpg');
  const [capturedPages, setCapturedPages] = useState<Asset[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  // Receive photo from BelgeCameraScreen
  useEffect(() => {
    const photoUri = route.params?.capturedPhotoUri;
    if (photoUri) {
      setCapturedPages((prev) => [
        ...prev,
        { uri: photoUri, fileName: `camera_${Date.now()}.jpg` } as Asset,
      ]);
      // Clear the param so it doesn't re-add on re-render
      navigation.setParams({ capturedPhotoUri: undefined });
    }
  }, [route.params?.capturedPhotoUri, navigation]);

  const availableDocTypes = useMemo(() => {
    if (!myApplication) return DOC_TYPE_OPTIONS;
    return DOC_TYPE_OPTIONS.filter((opt) =>
      myApplication.documents.some((d) => d.type === opt.key),
    );
  }, [myApplication]);

  useEffect(() => {
    if (availableDocTypes.some((o) => o.key === selectedDocType)) return;
    setSelectedDocType(availableDocTypes[0]?.key || 'identity');
  }, [availableDocTypes, selectedDocType]);

  const selectedDocument = useMemo(
    () => myApplication?.documents.find((d) => d.type === selectedDocType),
    [myApplication, selectedDocType],
  );

  const expectedFormat = useMemo(() => {
    if (!myApplication) return '';
    const program = getProgramById(myApplication.programId);
    return (
      program.checklist.find((x) => x.documentType === selectedDocType)?.expectedFormat ||
      ''
    );
  }, [myApplication, selectedDocType]);

  const handleCameraCapture = useCallback(() => {
    if (!myApplication) {
      Alert.alert('Uyarı', 'Önce başvuru taslağı oluşturun.');
      return;
    }
    navigation.navigate('BelgeCamera', {
      docType: selectedDocType,
      applicationId: myApplication.id,
    });
  }, [navigation, selectedDocType, myApplication]);

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
      if (result.assets?.length) {
        setCapturedPages((prev) => [...prev, ...result.assets!]);
      }
    } catch {
      Alert.alert('Hata', 'Galeri açılırken bir sorun oluştu.');
    }
  }, []);

  const handleDocumentPick = useCallback(async () => {
    try {
      const [res] = await pick({ type: [docTypes.pdf] });
      if (res) {
        setPdfFileName(res.name || 'document.pdf');
        setPdfUri(res.uri);
      }
    } catch (e: any) {
      // User cancelled or error
      if (e?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Hata', 'Dosya seçilirken bir sorun oluştu.');
      }
    }
  }, []);

  const performUpload = useCallback(() => {
    if (!myApplication || !user || !selectedDocument) return;

    const ext = captureFormat === 'pdf' ? 'pdf' : 'jpg';
    const mimeType = captureFormat === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const pageCount = captureFormat === 'pdf' ? 1 : capturedPages.length;
    const fileName =
      captureFormat === 'pdf' && pdfFileName
        ? pdfFileName
        : `${selectedDocType}_${user.id}_${Date.now()}_${pageCount}p.${ext}`;
    const fileUrl =
      captureFormat === 'pdf' && pdfUri
        ? pdfUri
        : capturedPages[0]?.uri || `local://${fileName}`;

    const parseResult =
      selectedDocType === 'extra' || selectedDocType === 'boarding_pass'
        ? Math.random() > 0.5
          ? `QR_OK:${Math.floor(Math.random() * 999999)}`
          : 'QR_NOT_FOUND'
        : undefined;

    dispatch(
      uploadDocument({
        applicationId: myApplication.id,
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
    Alert.alert(
      'Yükleme Başlatıldı',
      'Belge backend\'e gönderiliyor. Durum güncellenince kontrol listesi üzerinden takip edebilirsiniz.',
    );
  }, [myApplication, user, selectedDocument, selectedDocType, captureFormat, capturedPages, pdfFileName, pdfUri, dispatch]);

  const handleUpload = useCallback(() => {
    if (!myApplication || !user || !selectedDocument) return;
    const hasContent =
      captureFormat === 'pdf' ? !!pdfUri : capturedPages.length > 0;
    if (!hasContent) {
      Alert.alert(
        'Uyarı',
        captureFormat === 'pdf'
          ? 'Önce bir PDF dosyası seçin.'
          : 'Önce belgeyi tarayın (en az 1 sayfa).',
      );
      return;
    }
    performUpload();
  }, [myApplication, user, selectedDocument, captureFormat, capturedPages.length, pdfUri, performUpload]);

  if (!myApplication) {
    return (
      <View style={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Belge Tarama</Text>
            <Text style={styles.subtitle}>Önce Kayıt Formu ekranından bilgilerinizi kaydedin.</Text>
          </View>
        </View>
        <View style={styles.emptyCard}>
          <Button
            label="Kayıt Formuna Git"
            onPress={() => navigation.navigate('AdayKayit')}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerCard}>
        <View style={styles.accentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.h2}>Belge Tarama</Text>
        </View>
      </View>

      {/* Document type selector */}
      <Text style={styles.sectionLabel}>BELGE TİPİ</Text>
        <View style={styles.typeRow}>
        {availableDocTypes.map((opt) => {
          const doc = myApplication.documents.find((d) => d.type === opt.key);
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.typeChip,
                selectedDocType === opt.key && styles.typeChipActive,
              ]}
              onPress={() => {
                setSelectedDocType(opt.key);
                setCaptureFormat(
                  opt.key === 'form' || opt.key === 'boarding_pass' ? 'pdf' : 'jpg',
                );
                setCapturedPages([]);
                setPdfFileName(null);
                setPdfUri(null);
              }}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selectedDocType === opt.key && styles.typeChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
              {doc && (
                <Pill
                  label={DOCUMENT_STATUS_LABELS[doc.status]}
                  variant={statusToVariant(doc.status)}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Format selector */}
      <Text style={styles.sectionLabel}>FORMAT</Text>
      {expectedFormat ? (
        <Text style={styles.formatHint}>{expectedFormat}</Text>
      ) : null}
      <View style={styles.formatRow}>
        {(['jpg', 'pdf'] as const).map((fmt) => (
          <TouchableOpacity
            key={fmt}
            style={[
              styles.formatChip,
              captureFormat === fmt && styles.formatChipActive,
            ]}
            onPress={() => {
              setCaptureFormat(fmt);
              setCapturedPages([]);
              setPdfFileName(null);
              setPdfUri(null);
            }}
          >
            <Text
              style={[
                styles.formatChipText,
                captureFormat === fmt && styles.formatChipTextActive,
              ]}
            >
              {fmt.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Camera/scan area */}
      <Text style={styles.sectionLabel}>TARAMA</Text>
      {captureFormat === 'jpg' ? (
        <>
          <View style={styles.scanActions}>
            <TouchableOpacity style={styles.scanBox} onPress={handleCameraCapture}>
              <View style={styles.scanGuide}>
                <Text style={styles.scanOkText}>📷</Text>
                <Text style={styles.scanHintText}>Kamera ile Çek</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanBoxAlt} onPress={handleGalleryPick}>
              <View style={styles.scanGuide}>
                <Text style={styles.scanOkText}>🖼️</Text>
                <Text style={styles.scanHintText}>Galeriden Seç</Text>
              </View>
            </TouchableOpacity>
          </View>

          {capturedPages.length > 0 && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.bodyText}>{capturedPages.length} sayfa eklendi</Text>
                <TouchableOpacity onPress={() => setCapturedPages([])}>
                  <Text style={styles.resetText}>Sıfırla</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                {capturedPages.map((asset, idx) => (
                  <Image
                    key={`${idx}-${asset.uri}`}
                    source={{ uri: asset.uri }}
                    style={styles.thumbnail}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.scanBox} onPress={handleDocumentPick}>
            <View style={styles.scanGuide}>
              <Text style={styles.scanOkText}>📄</Text>
              <Text style={styles.scanHintText}>
                {pdfFileName || 'PDF Dosyası Seç'}
              </Text>
            </View>
          </TouchableOpacity>
          {pdfFileName && (
            <View style={styles.rowBetween}>
              <Text style={styles.bodyText} numberOfLines={1}>{pdfFileName}</Text>
              <TouchableOpacity onPress={() => { setPdfFileName(null); setPdfUri(null); }}>
                <Text style={styles.resetText}>Sıfırla</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Upload button */}
      <Button
        label={isLoading ? 'Yükleniyor...' : 'Yükle'}
        onPress={handleUpload}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Current document statuses */}
      <Text style={styles.sectionLabel}>BELGE DURUMLARI</Text>
      <View style={styles.statusCard}>
        {myApplication.documents.map((doc) => (
          <View key={doc.id} style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              {DOCUMENT_TYPES[doc.type]}
            </Text>
            <Pill
              label={DOCUMENT_STATUS_LABELS[doc.status]}
              variant={statusToVariant(doc.status)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  } as TextStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 15,
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
  } as TextStyle,
  typeChipTextActive: {
    color: colors.teal,
    fontWeight: '600',
  } as TextStyle,
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
  scanActions: {
    flexDirection: 'row',
    gap: 10,
  } as ViewStyle,
  scanGuide: {
    minHeight: 80,
    borderRadius: 12,
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
  scanOkText: {
    fontSize: 28,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  bars: {
    flexDirection: 'row',
    gap: 4,
  } as ViewStyle,
  bar: {
    width: 24,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  barActive: {
    backgroundColor: colors.teal,
  } as ViewStyle,
  barMuted: {
    backgroundColor: colors.muted,
  } as ViewStyle,
  statusCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    gap: 10,
  } as ViewStyle,
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  statusLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  } as TextStyle,
  emptyCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 12,
    padding: 24,
    gap: 18,
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  emptyText: {
    fontSize: 15,
    color: colors.noticeText,
    textAlign: 'center',
    lineHeight: 22,
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
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  } as TextStyle,
  formatHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    marginTop: -6,
  } as TextStyle,
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  } as TextStyle,
});
