import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationById } from '../../store/selectors';
import { updateDocument, updateApplication } from '../../store/slices/applicationSlice';
import { addMessage } from '../../store/slices/messageSlice';
import { addLog } from '../../store/slices/auditSlice';
import { createAuditEntry } from '../../services/seedData';
import { DOCUMENT_TYPES, DOCUMENT_STATUS_LABELS } from '../../constants';
import {
  DocumentStatus,
  Document,
  AdminDogrulamaRouteProp,
  RootStackNavigationProp,
} from '../../types';

type StatusOption = {
  key: DocumentStatus;
  label: string;
  variant: 'ok' | 'warn' | 'err' | 'info';
};

const STATUS_OPTIONS: StatusOption[] = [
  { key: 'ok', label: 'OK', variant: 'ok' },
  { key: 'missing', label: 'EKSİK', variant: 'warn' },
  { key: 'wrong_format', label: 'YANLIŞ FORMAT', variant: 'err' },
  { key: 'unread', label: 'OKUNMADI', variant: 'info' },
];

const QUICK_MESSAGES: Record<DocumentStatus, string> = {
  ok: 'Belgeniz onaylandı.',
  missing: 'Belge eksik. Lütfen gerekli belgeyi yükleyin.',
  wrong_format: 'Yüklenen dosya beklenen formatta değil. Lütfen doğru formatta yükleyin.',
  unread: 'Yüklenen görüntü bulanık/okunamıyor. Lütfen daha net bir görüntü çekin.',
};

export const AdminDogrulamaScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<AdminDogrulamaRouteProp>();
  const { applicationId } = route.params;
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const application = useAppSelector(selectApplicationById(applicationId));

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    application?.documents[0]?.id || null,
  );
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | null>(
    null,
  );
  const [notes, setNotes] = useState('');
  const [sendMessage, setSendMessage] = useState(true);

  const selectedDoc = useMemo(
    () => application?.documents.find((d) => d.id === selectedDocId),
    [application, selectedDocId],
  );

  const handleSave = useCallback(() => {
    if (!application || !user || !selectedDocId || !selectedStatus) {
      Alert.alert('Uyarı', 'Lütfen belge ve durum seçiniz.');
      return;
    }

    const now = new Date().toISOString();

    // Update document status
    const updatedDoc: Document = {
      ...selectedDoc!,
      status: selectedStatus,
      verifiedAt: now,
    };

    dispatch(
      updateDocument({
        applicationId: application.id,
        document: updatedDoc,
      }),
    );

    // Audit log
    dispatch(
      addLog(
        createAuditEntry(
          'ADMIN_VERIFIED',
          user.id,
          selectedDocId,
          `${DOCUMENT_TYPES[selectedDoc!.type]} → ${DOCUMENT_STATUS_LABELS[selectedStatus]}${notes ? ` (${notes})` : ''}`,
        ),
      ),
    );

    // Send automatic message if enabled
    if (sendMessage && selectedStatus !== 'ok') {
      const msgContent =
        notes.trim() || QUICK_MESSAGES[selectedStatus];
      dispatch(
        addMessage({
          id: Date.now().toString(),
          applicationId: application.id,
          senderId: user.id,
          senderRole: 'admin',
          content: `[${DOCUMENT_TYPES[selectedDoc!.type]}] ${msgContent}`,
          createdAt: now,
        }),
      );
      dispatch(
        addLog(
          createAuditEntry(
            'MESSAGE_SENT',
            user.id,
            application.id,
            `Doğrulama mesajı gönderildi (${DOCUMENT_STATUS_LABELS[selectedStatus]})`,
          ),
        ),
      );
    }

    // Check if all docs are OK → update app status
    const allDocsAfterUpdate = application.documents.map((d) =>
      d.id === selectedDocId ? updatedDoc : d,
    );
    const allOk = allDocsAfterUpdate.every((d) => d.status === 'ok');
    const hasIssue = allDocsAfterUpdate.some(
      (d) => d.status !== 'ok',
    );

    if (allOk) {
      dispatch(
        updateApplication({
          ...application,
          status: 'approved',
          updatedAt: now,
        }),
      );
      dispatch(
        addLog(
          createAuditEntry(
            'STATUS_CHANGED',
            user.id,
            application.id,
            `Tüm belgeler onaylandı → Başvuru ONAYLI`,
          ),
        ),
      );
    } else if (hasIssue && selectedStatus !== 'ok') {
      dispatch(
        updateApplication({
          ...application,
          status: 'needs_fix',
          updatedAt: now,
        }),
      );
    }

    Alert.alert('Kaydedildi', 'Doğrulama kararı başarıyla kaydedildi.', [
      { text: 'Tamam', onPress: () => navigation.goBack() },
    ]);
  }, [
    application,
    user,
    selectedDocId,
    selectedStatus,
    selectedDoc,
    notes,
    sendMessage,
    dispatch,
    navigation,
  ]);

  if (!application) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>Doğrulama Kararı</Text>
        <Text style={styles.emptyText}>Başvuru bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.h2}>Doğrulama Kararı</Text>
      <Text style={styles.subtitle}>
        {application.personalInfo.fullName} - {application.programName}
      </Text>

      {/* Document selector */}
      <Text style={styles.label}>Belge Seçin</Text>
      {application.documents.map((doc) => (
        <TouchableOpacity
          key={doc.id}
          style={[
            styles.docRow,
            selectedDocId === doc.id && styles.docRowActive,
          ]}
          onPress={() => {
            setSelectedDocId(doc.id);
            setSelectedStatus(null);
            setNotes('');
          }}
        >
          <Text style={styles.docName}>
            {DOCUMENT_TYPES[doc.type]}
          </Text>
          <Pill
            label={DOCUMENT_STATUS_LABELS[doc.status]}
            variant={
              doc.status === 'ok'
                ? 'ok'
                : doc.status === 'missing'
                  ? 'warn'
                  : doc.status === 'wrong_format'
                    ? 'err'
                    : 'info'
            }
          />
        </TouchableOpacity>
      ))}

      {/* Preview placeholder */}
      {selectedDoc && (
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>
            {selectedDoc.fileName
              ? `Dosya: ${selectedDoc.fileName}`
              : 'Belge henüz yüklenmemiş'}
          </Text>
        </View>
      )}

      {/* Status selection */}
      <Text style={styles.label}>Yeni Durum Belirleyin</Text>
      <View style={styles.pillRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.pillButton,
              selectedStatus === opt.key && styles.pillButtonActive,
            ]}
            onPress={() => {
              setSelectedStatus(opt.key);
              if (!notes.trim()) {
                setNotes(QUICK_MESSAGES[opt.key]);
              }
            }}
          >
            <Pill label={opt.label} variant={opt.variant} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>Açıklama / Not</Text>
      <TextInput
        style={styles.textArea}
        value={notes}
        onChangeText={setNotes}
        placeholder="Adaya iletilecek açıklama..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Auto-message toggle */}
      {selectedStatus && selectedStatus !== 'ok' && (
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setSendMessage(!sendMessage)}
        >
          <View
            style={[styles.checkbox, sendMessage && styles.checkboxActive]}
          >
            {sendMessage && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.toggleText}>
            Adaya otomatik mesaj gönder
          </Text>
        </TouchableOpacity>
      )}

      <Button label="Durumu Kaydet" onPress={handleSave} />
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
    marginTop: 4,
  } as TextStyle,
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  } as TextStyle,
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  docRowActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealBg,
  } as ViewStyle,
  docName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  previewBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  previewText: {
    fontSize: 12,
    color: colors.textMuted,
  } as TextStyle,
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  pillButton: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  } as ViewStyle,
  pillButtonActive: {
    borderColor: colors.teal,
  } as ViewStyle,
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    padding: 12,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 80,
    backgroundColor: colors.cardBg,
  } as TextStyle,
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  } as ViewStyle,
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  checkboxActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  } as ViewStyle,
  checkmark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  } as TextStyle,
  toggleText: {
    fontSize: 13,
    color: colors.textPrimary,
  } as TextStyle,
});
