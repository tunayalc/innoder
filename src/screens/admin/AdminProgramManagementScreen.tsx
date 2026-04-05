import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Button, Field, InputField } from '../../components';
import { assignProgramToCandidate, loadAdminApplications } from '../../store/thunks/applicationThunks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationError, selectApplicationLoading, selectApplications } from '../../store/selectors';
import { getBackend } from '../../services/backend';
import {
  DEFAULT_REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_OPTIONS,
  createProgramDraftInput,
  parseDeadlines,
  parseTextLines,
} from '../../services/programFactory';
import { useThemedStyles, type AppColors } from '../../theme';
import { openExternalUrl, openMailto } from '../../utils/contact';
import { User } from '../../types';

export const AdminProgramManagementScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [programName, setProgramName] = useState('');
  const [programYear, setProgramYear] = useState(String(new Date().getFullYear()));
  const [programStepsText, setProgramStepsText] = useState('');
  const [programDeadlinesText, setProgramDeadlinesText] = useState('');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState(DEFAULT_REQUIRED_DOCUMENT_TYPES);

  const loadCandidates = useCallback(async () => {
    const backend = getBackend();
    const nextCandidates = await backend.auth.listCandidates();
    setCandidates(nextCandidates);
    if (!selectedCandidateId && nextCandidates.length > 0) {
      setSelectedCandidateId(nextCandidates[0].id);
    }
  }, [selectedCandidateId]);

  useEffect(() => {
    loadCandidates().catch(() => undefined);
    dispatch(loadAdminApplications());
  }, [dispatch, loadCandidates]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) || null,
    [candidates, selectedCandidateId],
  );

  const candidatePrograms = useMemo(
    () => applications.filter((application) => application.userId === selectedCandidateId),
    [applications, selectedCandidateId],
  );

  const toggleDocumentType = (documentType: typeof selectedDocumentTypes[number]) => {
    setSelectedDocumentTypes((prev) =>
      prev.includes(documentType)
        ? prev.filter((item) => item !== documentType)
        : [...prev, documentType],
    );
  };

  const resetForm = () => {
    setProgramName('');
    setProgramYear(String(new Date().getFullYear()));
    setProgramStepsText('');
    setProgramDeadlinesText('');
    setSelectedDocumentTypes(DEFAULT_REQUIRED_DOCUMENT_TYPES);
  };

  const handleAssignProgram = () => {
    if (!selectedCandidate) {
      Alert.alert('Uyarı', 'Önce bir aday seçin.');
      return;
    }

    if (!programName.trim()) {
      Alert.alert('Uyarı', 'Program adı zorunludur.');
      return;
    }

    const numericYear = Number(programYear);
    if (!Number.isFinite(numericYear) || numericYear < 2020 || numericYear > 2100) {
      Alert.alert('Uyarı', 'Geçerli bir yıl giriniz.');
      return;
    }

    const program = createProgramDraftInput({
      name: programName,
      year: numericYear,
      documentTypes: selectedDocumentTypes,
      steps: parseTextLines(programStepsText),
      deadlines: parseDeadlines(programDeadlinesText),
    });

    dispatch(
      assignProgramToCandidate({
        userId: selectedCandidate.id,
        fullName: selectedCandidate.name,
        program,
      }),
    );

    resetForm();
    Alert.alert('Program Eklendi', `${selectedCandidate.name} için yeni program oluşturuldu.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Program Yönetimi</Text>
        <Text style={styles.subtitle}>
          Adaya yeni program açma işlemini başvuru sürecinden ayrı yönetin.
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aday Seçimi</Text>
        <View style={styles.candidateRow}>
          {candidates.map((candidate) => (
            <TouchableOpacity
              key={candidate.id}
              style={[
                styles.candidateChip,
                candidate.id === selectedCandidateId && styles.candidateChipActive,
              ]}
              onPress={() => setSelectedCandidateId(candidate.id)}
            >
              <Text
                style={[
                  styles.candidateChipText,
                  candidate.id === selectedCandidateId && styles.candidateChipTextActive,
                ]}
              >
                {candidate.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedCandidate ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seçili Aday</Text>
          <Field label="E-posta" value={selectedCandidate.email} onPress={() => openMailto({ to: selectedCandidate.email })} isLink />
          <Field
            label="Etkinlik Linki"
            value={selectedCandidate.eventLink || 'Paylaşılmadı'}
            onPress={selectedCandidate.eventLink ? () => openExternalUrl(selectedCandidate.eventLink!) : undefined}
            isLink={Boolean(selectedCandidate.eventLink)}
          />
          <Field
            label="Mevcut Programlar"
            value={candidatePrograms.length > 0 ? candidatePrograms.map((application) => application.programName).join(', ') : 'Henüz program yok'}
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Programa Özel Belge İstekleri</Text>
        <View style={styles.documentChipRow}>
          {DOCUMENT_TYPE_OPTIONS.map((documentType) => {
            const isActive = selectedDocumentTypes.includes(documentType.key);
            return (
              <TouchableOpacity
                key={documentType.key}
                style={[styles.documentChip, isActive && styles.documentChipActive]}
                onPress={() => toggleDocumentType(documentType.key)}
              >
                <Text style={[styles.documentChipText, isActive && styles.documentChipTextActive]}>
                  {documentType.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <InputField
          label="Program Adı *"
          value={programName}
          onChangeText={setProgramName}
          placeholder="Örnek: ESC İtalya Gönüllülük Programı"
        />
        <InputField
          label="Yıl *"
          value={programYear}
          onChangeText={setProgramYear}
          placeholder="2026"
          keyboardType="number-pad"
        />
        <InputField
          label="Adımlar (her satıra bir adım)"
          value={programStepsText}
          onChangeText={setProgramStepsText}
          placeholder="Boş bırakılırsa varsayılan adımlar kullanılır"
          multiline
          numberOfLines={4}
        />
        <InputField
          label="Teslim Tarihleri (Etiket|YYYY-MM-DD)"
          value={programDeadlinesText}
          onChangeText={setProgramDeadlinesText}
          placeholder="Başvuru kapanış|2026-06-15"
          multiline
          numberOfLines={3}
        />

        <Button
          label={isLoading ? 'İşleniyor...' : 'Programı Oluştur ve Ata'}
          onPress={isLoading ? undefined : handleAssignProgram}
        />
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 14,
      backgroundColor: colors.background,
    } as ViewStyle,
    heroCard: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 24,
      padding: 20,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
    } as TextStyle,
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    candidateRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    } as ViewStyle,
    candidateChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    candidateChipActive: {
      borderColor: colors.teal,
      backgroundColor: colors.tealBg,
    } as ViewStyle,
    candidateChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    } as TextStyle,
    candidateChipTextActive: {
      color: colors.teal,
    } as TextStyle,
    documentChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    } as ViewStyle,
    documentChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    documentChipActive: {
      borderColor: colors.teal,
      backgroundColor: colors.tealBg,
    } as ViewStyle,
    documentChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    } as TextStyle,
    documentChipTextActive: {
      color: colors.teal,
    } as TextStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
      textAlign: 'center',
    } as TextStyle,
  });
