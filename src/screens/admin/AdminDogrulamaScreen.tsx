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
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { Button, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationById } from '../../store/selectors';
import { selectApplicationLoading } from '../../store/selectors/applicationSelectors';
import { DOCUMENT_TYPES, DOCUMENT_STATUS_LABELS } from '../../constants';
import {
  DocumentStatus,
  AdminDogrulamaRouteProp,
  RootStackNavigationProp,
} from '../../types';
import { verifyDocument } from '../../store/thunks/applicationThunks';
import { sendMessageThunk } from '../../store/thunks/messageThunks';

type StatusOption = {
  key: DocumentStatus;
  label: string;
  variant: 'ok' | 'warn' | 'err' | 'info';
};

export const AdminDogrulamaScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<AdminDogrulamaRouteProp>();
  const { t } = useI18n();
  const { applicationId, documentId } = route.params;
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const application = useAppSelector(selectApplicationById(applicationId));
  const isLoading = useAppSelector(selectApplicationLoading);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    documentId || application?.documents[0]?.id || null,
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

  const statusOptions: StatusOption[] = useMemo(
    () => [
      { key: 'ok', label: t('adminVerification.statusOk'), variant: 'ok' },
      { key: 'missing', label: t('adminVerification.statusMissing'), variant: 'warn' },
      { key: 'wrong_format', label: t('adminVerification.statusWrongFormat'), variant: 'err' },
      { key: 'unread', label: t('adminVerification.statusUnread'), variant: 'info' },
    ],
    [t],
  );

  const quickMessages: Record<DocumentStatus, string> = useMemo(
    () => ({
      ok: t('adminVerification.quickOk'),
      missing: t('adminVerification.quickMissing'),
      wrong_format: t('adminVerification.quickWrongFormat'),
      unread: t('adminVerification.quickUnread'),
    }),
    [t],
  );

  const handleSave = useCallback(() => {
    if (!application || !user || !selectedDocId || !selectedStatus) {
      Alert.alert(t('adminVerification.warningTitle'), t('adminVerification.requiredSelection'));
      return;
    }

    dispatch(
        verifyDocument({
          applicationId: application.id,
          documentId: selectedDocId,
          status: selectedStatus,
          note: notes.trim(),
        }),
    );

    if (sendMessage && selectedStatus !== 'ok') {
      const msgContent = notes.trim() || quickMessages[selectedStatus];
      dispatch(
        sendMessageThunk({
          applicationId: application.id,
          relatedDocumentId: selectedDocId,
          content: `[${DOCUMENT_TYPES[selectedDoc!.type]}] ${msgContent}`,
        }),
      );
    }

    Alert.alert(t('adminVerification.savedTitle'), t('adminVerification.savedText'), [
      { text: t('adminVerification.ok'), onPress: () => navigation.goBack() },
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
    quickMessages,
    t,
  ]);

  if (!application) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>{t('adminVerification.title')}</Text>
        <Text style={styles.emptyText}>{t('adminVerification.applicationNotFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.h2}>{t('adminVerification.title')}</Text>
      <Text style={styles.subtitle}>
        {application.personalInfo.fullName} - {application.programName}
      </Text>

      {/* Document selector */}
      <Text style={styles.label}>{t('adminVerification.selectDocument')}</Text>
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
              ? `${t('adminVerification.filePrefix')} ${selectedDoc.fileName}`
              : t('adminVerification.fileMissing')}
          </Text>
        </View>
      )}

      {/* Status selection */}
      <Text style={styles.label}>{t('adminVerification.selectStatus')}</Text>
      <View style={styles.pillRow}>
        {statusOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.pillButton,
              selectedStatus === opt.key && styles.pillButtonActive,
            ]}
            onPress={() => {
              setSelectedStatus(opt.key);
              if (!notes.trim()) {
                setNotes(quickMessages[opt.key]);
              }
            }}
          >
            <Pill label={opt.label} variant={opt.variant} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>{t('adminVerification.notesLabel')}</Text>
      <TextInput
        style={styles.textArea}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('adminVerification.notesPlaceholder')}
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
            {t('adminVerification.autoSendMessage')}
          </Text>
        </TouchableOpacity>
      )}

      <Button label={t('adminVerification.saveButton')} onPress={handleSave} />
      {isLoading ? (
        <Text style={styles.loadingText}>{t('adminVerification.saving')}</Text>
      ) : null}
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
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
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  } as TextStyle,
});





