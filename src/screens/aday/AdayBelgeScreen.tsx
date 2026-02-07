import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { updateDocument, updateApplication } from '../../store/slices/applicationSlice';
import { addLog } from '../../store/slices/auditSlice';
import { createAuditEntry } from '../../services/seedData';
import { DOCUMENT_TYPES, DOCUMENT_STATUS_LABELS } from '../../constants';
import { Document, DocumentStatus, RootStackNavigationProp } from '../../types';

type DocType = 'identity' | 'form' | 'extra';

const DOC_TYPE_OPTIONS: { key: DocType; label: string }[] = [
  { key: 'identity', label: 'Kimlik Belgesi' },
  { key: 'form', label: 'Başvuru Formu' },
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
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);

  const myApplication = useMemo(
    () => applications.find((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const [selectedDocType, setSelectedDocType] = useState<DocType>('identity');
  const [isUploading, setIsUploading] = useState(false);
  const [qualityScore, setQualityScore] = useState(0); // 0-3

  const selectedDocument = useMemo(
    () => myApplication?.documents.find((d) => d.type === selectedDocType),
    [myApplication, selectedDocType],
  );

  const simulateCapture = useCallback(() => {
    // Simulate camera capture & quality check
    const score = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    setQualityScore(score);
  }, []);

  const handleUpload = useCallback(() => {
    if (!myApplication || !user || !selectedDocument) return;
    if (qualityScore === 0) {
      Alert.alert('Uyarı', 'Önce belgeyi tarayın (kamerayı kullanın).');
      return;
    }
    if (qualityScore < 2) {
      Alert.alert(
        'Kalite Düşük',
        'Çekilen görüntü bulanık veya karanlık. Yeniden çekmek ister misiniz?',
        [
          { text: 'Yeniden Çek', onPress: () => setQualityScore(0) },
          { text: 'Yine de Yükle', onPress: () => performUpload() },
        ],
      );
      return;
    }
    performUpload();
  }, [myApplication, user, selectedDocument, qualityScore]);

  const performUpload = useCallback(() => {
    if (!myApplication || !user || !selectedDocument) return;
    setIsUploading(true);

    // Simulate upload delay
    setTimeout(() => {
      const now = new Date().toISOString();
      const fileName = `${selectedDocType}_${user.id}_${Date.now()}.jpg`;

      // Determine status based on quality
      let newStatus: DocumentStatus = 'ok';
      if (qualityScore === 1) {
        newStatus = 'unread'; // Too blurry
      }

      const updatedDoc: Document = {
        ...selectedDocument,
        fileName,
        status: newStatus,
        uploadedAt: now,
        fileUrl: `local://${fileName}`,
      };

      dispatch(
        updateDocument({
          applicationId: myApplication.id,
          document: updatedDoc,
        }),
      );

      dispatch(
        addLog(
          createAuditEntry(
            'DOCUMENT_UPLOADED',
            user.id,
            selectedDocument.id,
            `${DOCUMENT_TYPES[selectedDocType]} yüklendi (${fileName}) → ${DOCUMENT_STATUS_LABELS[newStatus]}`,
          ),
        ),
      );

      setIsUploading(false);
      setQualityScore(0);
      Alert.alert(
        'Yükleme Tamamlandı',
        `${DOCUMENT_TYPES[selectedDocType]} başarıyla yüklendi.\nDurum: ${DOCUMENT_STATUS_LABELS[newStatus]}`,
      );
    }, 1500);
  }, [myApplication, user, selectedDocument, selectedDocType, qualityScore, dispatch]);

  if (!myApplication) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>Belge Tarama</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Önce Kayıt Formu ekranından bilgilerinizi kaydedin.
          </Text>
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
      <Text style={styles.h2}>Belge Tarama</Text>

      {/* Document type selector */}
      <Text style={styles.label}>Belge Tipi Seçin</Text>
      <View style={styles.typeRow}>
        {DOC_TYPE_OPTIONS.map((opt) => {
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
                setQualityScore(0);
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

      {/* Camera/scan area */}
      <TouchableOpacity style={styles.scanBox} onPress={simulateCapture}>
        <View style={styles.scanGuide}>
          {qualityScore > 0 ? (
            <Text style={styles.scanOkText}>Görüntü Alındı</Text>
          ) : (
            <Text style={styles.scanHintText}>Belgeyi Tara</Text>
          )}
        </View>
        <Text style={styles.bodyText}>
          {qualityScore > 0
            ? 'Tekrar çekmek için dokunun'
            : 'Kamerayı hizalayıp dokunun'}
        </Text>
      </TouchableOpacity>

      {/* Quality indicator */}
      <View style={styles.rowBetween}>
        <Text style={styles.bodyText}>Kalite Kontrol</Text>
        <View style={styles.bars}>
          {[1, 2, 3].map((level) => (
            <View
              key={level}
              style={[
                styles.bar,
                qualityScore >= level ? styles.barActive : styles.barMuted,
              ]}
            />
          ))}
        </View>
      </View>
      {qualityScore > 0 && qualityScore < 2 && (
        <Text style={styles.qualityWarn}>
          Görüntü kalitesi düşük. Aydınlık bir ortamda tekrar deneyin.
        </Text>
      )}
      {qualityScore >= 2 && (
        <Text style={styles.qualityOk}>Görüntü kalitesi yeterli.</Text>
      )}

      {/* Upload button */}
      <Button
        label={isUploading ? 'Yükleniyor...' : 'Yükle'}
        onPress={handleUpload}
      />

      {/* Current document statuses */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Belge Durumları</Text>
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
    gap: 12,
    padding: 20,
    paddingBottom: 40,
  } as ViewStyle,
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  } as TextStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
  typeRow: {
    gap: 8,
  } as ViewStyle,
  typeChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    fontSize: 13,
    color: colors.textPrimary,
  } as TextStyle,
  typeChipTextActive: {
    color: colors.teal,
    fontWeight: '600',
  } as TextStyle,
  scanBox: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.tealBorder,
    padding: 16,
    backgroundColor: colors.tealBg,
    gap: 8,
    alignItems: 'center',
  } as ViewStyle,
  scanGuide: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  scanHintText: {
    color: colors.teal,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  scanOkText: {
    color: colors.teal,
    fontSize: 16,
    fontWeight: '700',
  } as TextStyle,
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
  qualityWarn: {
    fontSize: 11,
    color: '#DC2626',
  } as TextStyle,
  qualityOk: {
    fontSize: 11,
    color: colors.teal,
  } as TextStyle,
  statusCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    gap: 8,
  } as ViewStyle,
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  statusLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  } as TextStyle,
  emptyCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  emptyText: {
    fontSize: 13,
    color: colors.noticeText,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});
