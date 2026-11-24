import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Switch,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Button, Field, InputField, ScreenScrollView } from '../../components';
import {
  assignProgramToCandidate,
  loadAdminApplications,
} from '../../store/thunks/applicationThunks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import { getBackend } from '../../services/backend';
import {
  DEFAULT_REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_OPTIONS,
  createProgramDraftInput,
  parseDeadlines,
  parseTextLines,
} from '../../services/programFactory';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { openExternalUrl, openMailto } from '../../utils/contact';
import { User, AssignedProgram, Application } from '../../types';
import { appConfig } from '../../config/appConfig';
import { apiClient, requireData } from '../../services/api/apiClient';
import { pick, types as fileTypes } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const AdminProgramManagementScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [programName, setProgramName] = useState('');
  const [isEscProgram, setIsEscProgram] = useState(false);
  const [collectBloodGroup, setCollectBloodGroup] = useState(false);
  const [programYear, setProgramYear] = useState(
    String(new Date().getFullYear()),
  );
  const [programStepsText, setProgramStepsText] = useState('');
  const [programDeadlinesText, setProgramDeadlinesText] = useState('');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState(
    DEFAULT_REQUIRED_DOCUMENT_TYPES,
  );
  const [programs, setPrograms] = useState<AssignedProgram[]>([]),
    [editing, setEditing] = useState<AssignedProgram>(),
    [saving, setSaving] = useState(false),
    [localError, setLocalError] = useState('');
  const [candidateQuery, setCandidateQuery] = useState(''),
    [candidatePage, setCandidatePage] = useState(1),
    [candidateTotal, setCandidateTotal] = useState(0);
  const [assignedApplications, setAssignedApplications] = useState<
    Application[]
  >([]);
  const loadPrograms = useCallback(async () => {
    setPrograms(
      appConfig.dataSource === 'remote'
        ? requireData(
            await apiClient.get<AssignedProgram[]>(
              '/programs?includeArchived=true',
            ),
          )
        : await getBackend().programs.listPrograms(),
    );
  }, []);
  useEffect(() => {
    loadPrograms().catch(cause =>
      setLocalError(
        cause instanceof Error ? cause.message : 'Programlar yüklenemedi.',
      ),
    );
  }, [loadPrograms]);

  const loadCandidates = useCallback(async () => {
    const page =
      appConfig.dataSource === 'remote'
        ? requireData(
            await apiClient.get<{ items: User[]; total: number }>(
              `/admin/candidates?page=${candidatePage}&pageSize=25&q=${encodeURIComponent(
                candidateQuery,
              )}`,
            ),
          )
        : null;
    const nextCandidates =
      page?.items || (await getBackend().auth.listCandidates());
    setCandidates(nextCandidates);
    setCandidateTotal(page?.total || nextCandidates.length);
    setSelectedCandidateId(current =>
      nextCandidates.some(item => item.id === current)
        ? current
        : nextCandidates[0]?.id || '',
    );
  }, [candidatePage, candidateQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCandidates().catch(cause =>
        setLocalError(
          cause instanceof Error ? cause.message : 'Adaylar yüklenemedi.',
        ),
      );
    }, 250);
    if (appConfig.dataSource === 'mock') dispatch(loadAdminApplications());
    return () => clearTimeout(timer);
  }, [dispatch, loadCandidates]);
  useEffect(() => {
    let active = true;
    if (appConfig.dataSource === 'remote' && selectedCandidateId)
      apiClient
        .get<{ items: Application[] }>(
          `/applications?page=1&pageSize=100&userId=${selectedCandidateId}`,
        )
        .then(response => {
          const page = requireData(response);
          if (active) setAssignedApplications(page.items);
        })
        .catch(cause => {
          if (active)
            setLocalError(
              cause instanceof Error ? cause.message : 'Atamalar yüklenemedi.',
            );
        });
    return () => {
      active = false;
    };
  }, [selectedCandidateId]);

  const selectedCandidate = useMemo(
    () =>
      candidates.find(candidate => candidate.id === selectedCandidateId) ||
      null,
    [candidates, selectedCandidateId],
  );

  const candidatePrograms = useMemo(
    () =>
      (appConfig.dataSource === 'remote'
        ? assignedApplications
        : applications
      ).filter(application => application.userId === selectedCandidateId),
    [applications, assignedApplications, selectedCandidateId],
  );

  const toggleDocumentType = (
    documentType: (typeof selectedDocumentTypes)[number],
  ) => {
    setSelectedDocumentTypes(prev =>
      prev.includes(documentType)
        ? prev.filter(item => item !== documentType)
        : [...prev, documentType],
    );
  };

  const resetForm = () => {
    setEditing(undefined);
    setProgramName('');
    setIsEscProgram(false);
    setCollectBloodGroup(false);
    setProgramYear(String(new Date().getFullYear()));
    setProgramStepsText('');
    setProgramDeadlinesText('');
    setSelectedDocumentTypes(DEFAULT_REQUIRED_DOCUMENT_TYPES);
  };

  const programInput = () => {
    if (
      !programName.trim() ||
      !Number.isInteger(Number(programYear)) ||
      Number(programYear) < 2020 ||
      Number(programYear) > 2100 ||
      !selectedDocumentTypes.length
    )
      throw new Error('Program adı, yıl ve zorunlu belgeleri tamamlayın.');
    const draft = createProgramDraftInput({
      name: programName,
      year: Number(programYear),
      documentTypes: selectedDocumentTypes,
      steps: parseTextLines(programStepsText),
      deadlines: parseDeadlines(programDeadlinesText),
      commonMistakes: editing?.commonMistakes,
    });
    draft.programKind = isEscProgram ? 'esc' : 'other';
    draft.collectBloodGroup = isEscProgram && collectBloodGroup;
    if (editing) {
      draft.steps = parseTextLines(programStepsText);
      draft.commonMistakes = [...editing.commonMistakes];
      draft.checklist = draft.checklist?.map(item => ({
        ...item,
        ...editing.checklist.find(
          existing => existing.documentType === item.documentType,
        ),
      }));
    }
    return draft;
  };

  const saveProgram = async () => {
    if (saving) return;
    setSaving(true);
    setLocalError('');
    try {
      const save = getBackend().programs.save;
      if (!save) throw new Error('Program kaydı bu ortamda desteklenmiyor.');
      await save({
        ...programInput(),
        id: editing?.id,
        revision: editing?.revision,
      });
      await loadPrograms();
      resetForm();
      Alert.alert(
        'Program Kaydedildi',
        'Mevcut başvuruların program koşulları korunmuştur.',
      );
    } catch (cause) {
      setLocalError(
        cause instanceof Error ? cause.message : 'Program kaydedilemedi.',
      );
    } finally {
      setSaving(false);
    }
  };
  const uploadTemplate = async (
    type: 'activity_agreement' | 'commitment_letter',
  ) => {
    if (!editing || saving) return;
    try {
      const [file] = await pick({ type: [fileTypes.pdf] });
      if (!file) return;
      if ((file.size || 0) > 20 * 1024 * 1024)
        throw new Error('Şablon en fazla 20 MB olabilir.');
      setSaving(true);
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name || 'template.pdf',
        type: 'application/pdf',
      } as any);
      requireData(
        await apiClient.postForm(
          `/programs/${editing.id}/templates/${type}`,
          form,
        ),
      );
      Alert.alert('Şablon Kaydedildi', 'Kurum PDF şablonu programa bağlandı.');
    } catch (cause) {
      if ((cause as { code?: string }).code !== 'DOCUMENT_PICKER_CANCELED')
        setLocalError(
          cause instanceof Error ? cause.message : 'Şablon yüklenemedi.',
        );
    } finally {
      setSaving(false);
    }
  };

  const handleAssignProgram = async () => {
    if (saving || isLoading) return;
    if (!selectedCandidate) {
      Alert.alert('Uyarı', 'Önce bir aday seçin.');
      return;
    }

    if (!programName.trim()) {
      Alert.alert('Uyarı', 'Program adı zorunludur.');
      return;
    }

    const numericYear = Number(programYear);
    if (
      !Number.isFinite(numericYear) ||
      numericYear < 2020 ||
      numericYear > 2100
    ) {
      Alert.alert('Uyarı', 'Geçerli bir yıl giriniz.');
      return;
    }

    setSaving(true);
    setLocalError('');
    try {
      const program = programInput();
      if (editing) {
        const save = getBackend().programs.save;
        if (!save) throw new Error('Program kaydı bu ortamda desteklenmiyor.');
        const updated = await save({
          ...program,
          id: editing.id,
          revision: editing.revision,
        });
        program.id = updated.id;
        setEditing(updated);
        await loadPrograms();
      }

      const saved = await dispatch(
        assignProgramToCandidate({
          userId: selectedCandidate.id,
          fullName: selectedCandidate.name,
          program,
        }),
      );

      if (!saved) return;
      if (appConfig.dataSource === 'remote')
        setAssignedApplications(
          requireData(
            await apiClient.get<{ items: Application[] }>(
              `/applications?page=1&pageSize=100&userId=${selectedCandidate.id}`,
            ),
          ).items,
        );
      resetForm();
      Alert.alert(
        'Program Eklendi',
        `${selectedCandidate.name} için yeni program oluşturuldu.`,
      );
    } catch (cause) {
      setLocalError(
        cause instanceof Error ? cause.message : 'Program atanamadı.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Program Yönetimi</Text>
        <Text style={styles.subtitle}>
          Adaya yeni program açma işlemini başvuru sürecinden ayrı yönetin.
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {localError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {localError}
        </Text>
      ) : null}
      <Text style={styles.cardTitle}>Kayıtlı Programlar</Text>
      {programs.map(program => (
        <View key={program.id} style={styles.candidateRow}>
          <View style={styles.rowContent}>
            <Text style={styles.cardTitle}>
              {program.name} · {program.year}
            </Text>
            <Text style={styles.subtitle}>
              {program.active === false ? 'Arşiv' : 'Aktif'}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${program.name} düzenle`}
            style={styles.iconButton}
            onPress={() => {
              setEditing(program);
              setProgramName(program.name);
              setIsEscProgram(program.programKind === 'esc');
              setCollectBloodGroup(Boolean(program.collectBloodGroup));
              setProgramYear(String(program.year));
              setProgramStepsText(program.steps.join('\n'));
              setProgramDeadlinesText(
                program.deadlines
                  .map(item => `${item.label}|${item.dateISO}`)
                  .join('\n'),
              );
              setSelectedDocumentTypes(
                program.checklist.map(item => item.documentType),
              );
            }}
          >
            <Icon name="pencil-outline" size={22} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              program.active === false
                ? 'Programı etkinleştir'
                : 'Programı arşivle'
            }
            disabled={saving}
            style={styles.iconButton}
            onPress={async () => {
              setSaving(true);
              try {
                await getBackend().programs.save?.({
                  ...program,
                  active: program.active === false,
                });
                await loadPrograms();
              } catch (cause) {
                setLocalError(
                  cause instanceof Error
                    ? cause.message
                    : 'Program güncellenemedi.',
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <Icon name="archive-outline" size={22} style={styles.icon} />
          </TouchableOpacity>
        </View>
      ))}
      {editing ? (
        <Button label="Yeni Program" variant="ghost" onPress={resetForm} />
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aday Seçimi</Text>
        <InputField
          label="Aday ara"
          value={candidateQuery}
          onChangeText={value => {
            setCandidateQuery(value);
            setCandidatePage(1);
          }}
          autoCapitalize="none"
        />
        <View style={styles.candidateRow}>
          {candidates.map(candidate => (
            <TouchableOpacity
              key={candidate.id}
              style={[
                styles.candidateChip,
                candidate.id === selectedCandidateId &&
                  styles.candidateChipActive,
              ]}
              onPress={() => setSelectedCandidateId(candidate.id)}
            >
              <Text
                style={[
                  styles.candidateChipText,
                  candidate.id === selectedCandidateId &&
                    styles.candidateChipTextActive,
                ]}
              >
                {candidate.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {appConfig.dataSource === 'remote' ? (
          <View style={styles.candidateRow}>
            <Button
              label="Önceki"
              variant="ghost"
              disabled={candidatePage === 1}
              onPress={() => setCandidatePage(page => page - 1)}
            />
            <Text>
              {candidatePage} / {Math.max(1, Math.ceil(candidateTotal / 25))}
            </Text>
            <Button
              label="Sonraki"
              variant="ghost"
              disabled={candidatePage * 25 >= candidateTotal}
              onPress={() => setCandidatePage(page => page + 1)}
            />
          </View>
        ) : null}
      </View>

      {selectedCandidate ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seçili Aday</Text>
          <Field
            label="E-posta"
            value={selectedCandidate.email}
            onPress={() => openMailto({ to: selectedCandidate.email })}
            isLink
          />
          <Field
            label="Etkinlik Linki"
            value={selectedCandidate.eventLink || 'Paylaşılmadı'}
            onPress={
              selectedCandidate.eventLink
                ? () => openExternalUrl(selectedCandidate.eventLink!)
                : undefined
            }
            isLink={Boolean(selectedCandidate.eventLink)}
          />
          <Field
            label="Mevcut Programlar"
            value={
              candidatePrograms.length > 0
                ? candidatePrograms
                    .map(application => application.programName)
                    .join(', ')
                : 'Henüz program yok'
            }
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Programa Özel Belge İstekleri</Text>
        <View style={styles.documentChipRow}>
          {DOCUMENT_TYPE_OPTIONS.map(documentType => {
            const isActive = selectedDocumentTypes.includes(documentType.key);
            return (
              <TouchableOpacity
                key={documentType.key}
                style={[
                  styles.documentChip,
                  isActive && styles.documentChipActive,
                ]}
                onPress={() => toggleDocumentType(documentType.key)}
              >
                <Text
                  style={[
                    styles.documentChipText,
                    isActive && styles.documentChipTextActive,
                  ]}
                >
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
        <View style={styles.privacySetting}>
          <Text style={styles.subtitle}>ESC projesi</Text>
          <Switch accessibilityLabel="ESC projesi" value={isEscProgram} onValueChange={value => {
            setIsEscProgram(value);
            if (!value) setCollectBloodGroup(false);
          }} trackColor={{ false: colors.muted, true: colors.teal }} />
        </View>
        {isEscProgram ? (
          <View style={styles.privacySetting}>
            <Text style={styles.subtitle}>İsteğe bağlı kan grubu paylaşımı</Text>
            <Switch accessibilityLabel="İsteğe bağlı kan grubu paylaşımı" value={collectBloodGroup}
              onValueChange={setCollectBloodGroup} trackColor={{ false: colors.muted, true: colors.teal }} />
          </View>
        ) : null}
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
          label={isLoading ? 'İşleniyor...' : 'Programı Adaya Ata'}
          loading={isLoading}
          onPress={handleAssignProgram}
        />
        <Button
          label={
            editing
              ? 'Program Değişikliklerini Kaydet'
              : 'Programı Atamadan Kaydet'
          }
          loading={saving}
          onPress={saveProgram}
        />
        {editing && appConfig.dataSource === 'remote' ? (
          <>
            <Button
              label="Activity Agreement PDF Şablonu"
              variant="ghost"
              disabled={saving}
              onPress={() => uploadTemplate('activity_agreement')}
            />
            <Button
              label="Taahhütname PDF Şablonu"
              variant="ghost"
              disabled={saving}
              onPress={() => uploadTemplate('commitment_letter')}
            />
          </>
        ) : null}
      </View>
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    privacySetting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
    rowContent: { flex: 1 } as ViewStyle,
    iconButton: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    icon: { color: colors.primaryText },
    container: {
      padding: 20,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 14,
      backgroundColor: colors.background,
    } as ViewStyle,
    heroCard: {
      paddingVertical: 16,
      gap: 8,
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
      borderRadius: 12,
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
      borderRadius: 12,
      minHeight: 44,
      justifyContent: 'center',
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
      borderRadius: 12,
      minHeight: 44,
      justifyContent: 'center',
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
