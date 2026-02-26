import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, ChecklistRow, Pill, Field } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationById,
  selectApplicationLoading,
  selectApplicationError,
  selectApplications,
} from '../../store/selectors';
import { selectMessagesByApplicationId } from '../../store/selectors/messageSelectors';
import {
  APPLICATION_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPES,
} from '../../constants';
import { formatDateShort, getRelativeTime } from '../../utils/date';
import {
  DocumentStatus,
  AdminDetayRouteProp,
  RootStackNavigationProp,
} from '../../types';
import {
  approveApplication,
  rejectApplication,
  assignProgramToCandidate,
} from '../../store/thunks/applicationThunks';
import { PROGRAM_CATALOG } from '../../services/programCatalog';
import { saveDocuments } from '@react-native-documents/picker';

const toCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

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

export const AdminDetayScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<AdminDetayRouteProp>();
  const { applicationId } = route.params;

  const dispatch = useAppDispatch();
  const allApplications = useAppSelector(selectApplications);
  const application = useAppSelector(selectApplicationById(applicationId));
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);
  const messages = useAppSelector(selectMessagesByApplicationId(applicationId));

  const [rejectReason, setRejectReason] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedYouthpassProgramApplicationId, setSelectedYouthpassProgramApplicationId] =
    useState('');

  const initials = useMemo(() => {
    if (!application) return '?';
    return application.personalInfo.fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [application]);

  const assignedProgramIds = useMemo(() => {
    if (!application) return new Set<string>();
    return new Set(
      allApplications
        .filter((app) => app.userId === application.userId)
        .map((app) => app.programId),
    );
  }, [allApplications, application]);

  const assignablePrograms = useMemo(
    () => PROGRAM_CATALOG.filter((p) => !assignedProgramIds.has(p.id)),
    [assignedProgramIds],
  );

  const candidatePrograms = useMemo(() => {
    if (!application) return [];
    return allApplications
      .filter((app) => app.userId === application.userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [allApplications, application]);

  const selectedYouthpassProgram = useMemo(
    () =>
      candidatePrograms.find(
        (app) => app.id === selectedYouthpassProgramApplicationId,
      ) || null,
    [candidatePrograms, selectedYouthpassProgramApplicationId],
  );

  useEffect(() => {
    if (assignablePrograms.length === 0) {
      setSelectedProgramId('');
      return;
    }

    const hasSelected = assignablePrograms.some((p) => p.id === selectedProgramId);
    if (!hasSelected) {
      setSelectedProgramId(assignablePrograms[0].id);
    }
  }, [assignablePrograms, selectedProgramId]);

  useEffect(() => {
    if (candidatePrograms.length === 0) {
      setSelectedYouthpassProgramApplicationId('');
      return;
    }

    const hasSelected = candidatePrograms.some(
      (app) => app.id === selectedYouthpassProgramApplicationId,
    );
    if (!hasSelected) {
      setSelectedYouthpassProgramApplicationId(candidatePrograms[0].id);
    }
  }, [candidatePrograms, selectedYouthpassProgramApplicationId]);

  if (!application) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>Basvuru Detayi</Text>
        <Text style={styles.emptyText}>Basvuru bulunamadi.</Text>
      </View>
    );
  }

  const appStatusVariant =
    application.status === 'approved'
      ? 'ok'
      : application.status === 'needs_fix'
        ? 'warn'
        : application.status === 'rejected'
          ? 'err'
          : 'info';

  const handleAssignProgram = () => {
    if (!selectedProgramId) return;

    const selectedProgram = PROGRAM_CATALOG.find((p) => p.id === selectedProgramId);
    if (!selectedProgram) return;

    Alert.alert(
      'Program Atama',
      `${application.personalInfo.fullName} icin ${selectedProgram.name} atamasi yapilsin mi?`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Ata',
          onPress: () => {
            dispatch(
              assignProgramToCandidate({
                userId: application.userId,
                fullName: application.personalInfo.fullName,
                programId: selectedProgramId,
              }),
            );
          },
        },
      ],
    );
  };

  const handleDownloadYouthpassExcel = async () => {
    const targetApplication = selectedYouthpassProgram;
    if (!targetApplication) {
      Alert.alert('Uyari', 'Indirme icin once bir program secin.');
      return;
    }

    const safeCandidateName =
      targetApplication.personalInfo.fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'aday';

    const uploadedDocumentCount = targetApplication.documents.filter(
      (doc) => !!doc.fileName,
    ).length;

    const csvRows = [
      `${toCsvCell('Alan')},${toCsvCell('Deger')}`,
      `${toCsvCell('Program Kodu')},${toCsvCell(targetApplication.programId)}`,
      `${toCsvCell('Program Adi')},${toCsvCell(targetApplication.programName)}`,
      `${toCsvCell('Aday Ad Soyad')},${toCsvCell(targetApplication.personalInfo.fullName)}`,
      `${toCsvCell('Basvuru Durumu')},${toCsvCell(
        APPLICATION_STATUS_LABELS[targetApplication.status] || targetApplication.status,
      )}`,
      `${toCsvCell('Olusturma Tarihi')},${toCsvCell(formatDateShort(targetApplication.createdAt))}`,
      `${toCsvCell('Guncelleme Tarihi')},${toCsvCell(formatDateShort(targetApplication.updatedAt))}`,
      `${toCsvCell('Yuklu Belge Sayisi')},${toCsvCell(String(uploadedDocumentCount))}`,
      `${toCsvCell('Not')},${toCsvCell(
        'Placeholder youthpass export. Nihai kolonlar sonraki adimda eklenecek.',
      )}`,
    ];

    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows.join('\n'))}`;
    const fileName = `youthpass_${targetApplication.programId}_${safeCandidateName}.xlsx`;

    try {
      await saveDocuments({
        sourceUris: [dataUri],
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      return;
    } catch {
      try {
        await Linking.openURL(dataUri);
        return;
      } catch {
        Alert.alert('Hata', 'Youthpass Excel indirilemedi. Lutfen tekrar deneyin.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.h2}>Basvuru Detayi</Text>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{application.personalInfo.fullName}</Text>
          <Text style={styles.subtitle}>
            {application.programName} - {formatDateShort(application.createdAt)}
          </Text>
        </View>
        <Pill
          label={APPLICATION_STATUS_LABELS[application.status]}
          variant={appStatusVariant}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kisisel Bilgiler</Text>
        <Field label="Ad Soyad" value={application.personalInfo.fullName} />
        {application.personalInfo.birthDate ? (
          <Field
            label="Dogum Tarihi"
            value={formatDateShort(application.personalInfo.birthDate)}
          />
        ) : null}
        {application.personalInfo.identityNumber ? (
          <Field
            label="TC Kimlik No"
            value={`***${application.personalInfo.identityNumber.slice(-4)}`}
          />
        ) : null}
        <Field label="Program" value={application.programName} />
        {application.submittedAt ? (
          <Field
            label="Gonderim Tarihi"
            value={formatDateShort(application.submittedAt)}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Program Atama</Text>
        <Text style={styles.cardHint}>
          Adaya ek program atayabilirsiniz. Atanan programlar adayin Programlarim alanina duser.
        </Text>

        {assignablePrograms.length === 0 ? (
          <Text style={styles.mutedText}>Bu adaya atanabilecek yeni program yok.</Text>
        ) : (
          <View style={styles.programChipRow}>
            {assignablePrograms.map((program) => {
              const isActive = program.id === selectedProgramId;
              return (
                <TouchableOpacity
                  key={program.id}
                  style={[
                    styles.programChip,
                    isActive && styles.programChipActive,
                  ]}
                  onPress={() => setSelectedProgramId(program.id)}
                >
                  <Text
                    style={[
                      styles.programChipText,
                      isActive && styles.programChipTextActive,
                    ]}
                  >
                    {program.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Button
          label={isLoading ? 'Isleniyor...' : 'Secili Programi Ata'}
          onPress={assignablePrograms.length > 0 ? handleAssignProgram : undefined}
          variant="ghost"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kullanicinin Programlari</Text>
        <Text style={styles.cardHint}>
          Program secip Youthpass Excel bilgisini indirebilirsiniz.
        </Text>

        {candidatePrograms.length === 0 ? (
          <Text style={styles.mutedText}>Bu kullaniciya ait program bulunamadi.</Text>
        ) : (
          <View style={styles.programChipRow}>
            {candidatePrograms.map((candidateProgram) => {
              const isActive =
                candidateProgram.id === selectedYouthpassProgramApplicationId;
              return (
                <TouchableOpacity
                  key={candidateProgram.id}
                  style={[
                    styles.programChip,
                    isActive && styles.programChipActive,
                  ]}
                  onPress={() =>
                    setSelectedYouthpassProgramApplicationId(candidateProgram.id)
                  }
                >
                  <Text
                    style={[
                      styles.programChipText,
                      isActive && styles.programChipTextActive,
                    ]}
                  >
                    {candidateProgram.programName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Button
          label="Youthpass Excel Bilgisini Indir"
          variant="ghost"
          onPress={
            candidatePrograms.length > 0 ? handleDownloadYouthpassExcel : undefined
          }
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Belgeler</Text>
        {application.documents.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate('DocumentViewer', {
                applicationId,
                documentId: doc.id,
              })
            }
          >
            <ChecklistRow
              label={DOCUMENT_TYPES[doc.type] || doc.type}
              status={DOCUMENT_STATUS_LABELS[doc.status] || doc.status}
              variant={statusToVariant(doc.status)}
            />
          </TouchableOpacity>
        ))}
      </View>

      {messages.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Son Mesajlar</Text>
          {messages.slice(-3).map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.msgBubble,
                msg.senderRole === 'admin' ? styles.msgAdmin : styles.msgCandidate,
              ]}
            >
              <Text style={styles.msgText}>{msg.content}</Text>
              <Text style={styles.msgTime}>{getRelativeTime(msg.createdAt)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        label="Belge Dogrulama"
        onPress={() => navigation.navigate('AdminDogrulama', { applicationId })}
      />
      <Button
        label="Mesaj Gonder"
        variant="ghost"
        onPress={() => navigation.navigate('AdayMesaj', { applicationId })}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basvuru Karari</Text>
        <Text style={styles.cardHint}>
          Bu bolum, operasyonel olarak basvuruyu onaylamak veya reddetmek icindir.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? 'Isleniyor...' : 'Basvuruyu Onayla'}
          onPress={() => {
            Alert.alert('Onay', 'Basvuruyu onaylamak istiyor musunuz?', [
              { text: 'Iptal', style: 'cancel' },
              {
                text: 'Onayla',
                onPress: () => dispatch(approveApplication({ applicationId })),
              },
            ]);
          }}
        />

        <Text style={styles.label}>Reddetme Nedeni</Text>
        <TextInput
          style={styles.textArea}
          value={rejectReason}
          onChangeText={setRejectReason}
          placeholder="Ret gerekcesi..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Button
          label={isLoading ? 'Isleniyor...' : 'Basvuruyu Reddet'}
          variant="ghost"
          onPress={() => {
            if (!rejectReason.trim()) {
              Alert.alert('Uyari', 'Lutfen ret gerekcesi giriniz.');
              return;
            }
            Alert.alert('Ret', 'Basvuruyu reddetmek istiyor musunuz?', [
              { text: 'Iptal', style: 'cancel' },
              {
                text: 'Reddet',
                style: 'destructive',
                onPress: () =>
                  dispatch(
                    rejectApplication({ applicationId, reason: rejectReason.trim() }),
                  ),
              },
            ]);
          }}
        />
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
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  } as TextStyle,
  profileRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  } as ViewStyle,
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  } as TextStyle,
  profileInfo: {
    flex: 1,
  } as ViewStyle,
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  } as TextStyle,
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    gap: 10,
  } as ViewStyle,
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  } as TextStyle,
  cardHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  } as TextStyle,
  mutedText: {
    fontSize: 12,
    color: colors.textMuted,
  } as TextStyle,
  programChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  programChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.cardBg,
  } as ViewStyle,
  programChipActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealBg,
  } as ViewStyle,
  programChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  } as TextStyle,
  programChipTextActive: {
    color: colors.teal,
  } as TextStyle,
  msgBubble: {
    padding: 10,
    borderRadius: 10,
    gap: 2,
  } as ViewStyle,
  msgAdmin: {
    backgroundColor: colors.msgAdmin,
  } as ViewStyle,
  msgCandidate: {
    backgroundColor: colors.msgUser,
  } as ViewStyle,
  msgText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  } as TextStyle,
  msgTime: {
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  } as TextStyle,
  errorText: {
    fontSize: 12,
    color: '#DC2626',
  } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
    marginTop: 4,
  } as TextStyle,
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
});
