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
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { Button, ChecklistRow, Pill, Field, InputField } from '../../components';
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
  buildYouthpassWorkbookDataUri,
  XLSX_MIME_TYPE,
} from '../../utils/youthpassExcel';
import { openMailto } from '../../utils/contact';
import {
  DocumentStatus,
  DocumentType,
  ProgramDraftInput,
  AdminDetayRouteProp,
  RootStackNavigationProp,
  User,
  createGeneralChatThreadId,
} from '../../types';
import {
  approveApplication,
  rejectApplication,
  assignProgramToCandidate,
} from '../../store/thunks/applicationThunks';
import {
  createProgramDraftInput,
  DEFAULT_REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_OPTIONS,
  parseDeadlines,
  parseTextLines,
} from '../../services/programFactory';
import { getBackend } from '../../services/backend';
import { saveDocuments } from '@react-native-documents/picker';

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
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
  const [programName, setProgramName] = useState('');
  const [programYear, setProgramYear] = useState(String(new Date().getFullYear()));
  const [programStepsText, setProgramStepsText] = useState('');
  const [programDeadlinesText, setProgramDeadlinesText] = useState('');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<DocumentType[]>(
    DEFAULT_REQUIRED_DOCUMENT_TYPES,
  );
  const [selectedYouthpassProgramApplicationId, setSelectedYouthpassProgramApplicationId] =
    useState('');
  const [candidateUser, setCandidateUser] = useState<User | null>(null);
  const [candidateUserError, setCandidateUserError] = useState<string | null>(null);
  const [credentialPassword, setCredentialPassword] = useState('');
  const [isCredentialSending, setIsCredentialSending] = useState(false);

  const initials = useMemo(() => {
    if (!application) return '';
    return application.personalInfo.fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [application]);

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

  useEffect(() => {
    if (!application) return;

    let cancelled = false;

    const loadCandidateUser = async () => {
      try {
        const backend = getBackend();
        const candidates = await backend.auth.listCandidates();
        const nextCandidate = candidates.find((candidate) => candidate.id === application.userId) || null;
        if (cancelled) return;
        setCandidateUser(nextCandidate);
        setCandidateUserError(nextCandidate ? null : 'Kullanıcı kaydı bulunamadı.');
      } catch (err) {
        if (cancelled) return;
        setCandidateUser(null);
        setCandidateUserError(err instanceof Error ? err.message : 'Kullanıcı bilgisi yüklenemedi.');
      }
    };

    loadCandidateUser();

    return () => {
      cancelled = true;
    };
  }, [application]);

  if (!application) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>Başvuru Detayı</Text>
        <Text style={styles.emptyText}>Başvuru bulunamadı.</Text>
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

  const toggleDocumentType = (documentType: DocumentType) => {
    setSelectedDocumentTypes((prev) =>
      prev.includes(documentType)
        ? prev.filter((item) => item !== documentType)
        : [...prev, documentType],
    );
  };

  const buildProgramDraft = (): ProgramDraftInput | null => {
    if (!programName.trim()) {
      Alert.alert('Uyarı', 'Program adı zorunludur.');
      return null;
    }

    if (selectedDocumentTypes.length === 0) {
      Alert.alert('Uyarı', 'En az bir gerekli belge seçmelisiniz.');
      return null;
    }

    const numericYear = Number(programYear);
    if (!Number.isFinite(numericYear) || numericYear < 2020 || numericYear > 2100) {
      Alert.alert('Uyarı', 'Geçerli bir yıl giriniz.');
      return null;
    }

    return createProgramDraftInput({
      name: programName,
      year: numericYear,
      documentTypes: selectedDocumentTypes,
      steps: parseTextLines(programStepsText),
      deadlines: parseDeadlines(programDeadlinesText),
    });
  };

  const handleAssignProgram = () => {
    const selectedProgram = buildProgramDraft();
    if (!selectedProgram) return;

    Alert.alert(
      'Program Atama',
      `${application.personalInfo.fullName} için ${selectedProgram.name} ataması yapılsın mı`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ata',
          onPress: () => {
            dispatch(
              assignProgramToCandidate({
                userId: application.userId,
                fullName: application.personalInfo.fullName,
                program: selectedProgram,
              }),
            );
            setProgramName('');
            setProgramYear(String(new Date().getFullYear()));
            setProgramStepsText('');
            setProgramDeadlinesText('');
            setSelectedDocumentTypes(DEFAULT_REQUIRED_DOCUMENT_TYPES);
          },
        },
      ],
    );
  };

  const handleDownloadYouthpassExcel = async () => {
    const targetApplication = selectedYouthpassProgram;
    if (!targetApplication) {
      Alert.alert('Uyarı', 'İndirme için önce bir program seçin.');
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

    const rows = [
      ['Alan', 'Değer'],
      ['Program Kodu', targetApplication.programId],
      ['Program Adı', targetApplication.programName],
      ['Aday Ad Soyad', targetApplication.personalInfo.fullName],
      [
        'Başvuru Durumu',
        APPLICATION_STATUS_LABELS[targetApplication.status] || targetApplication.status,
      ],
      ['Oluşturma Tarihi', formatDateShort(targetApplication.createdAt)],
      ['Güncelleme Tarihi', formatDateShort(targetApplication.updatedAt)],
      ['Yüklü Belge Sayısı', String(uploadedDocumentCount)],
      ['Not', 'Placeholder youthpass export. Nihai kolonlar sonraki adımda eklenecek.'],
    ];
    const dataUri = buildYouthpassWorkbookDataUri(rows);
    const fileName = `youthpass_${targetApplication.programId}_${safeCandidateName}.xlsx`;

    try {
      await saveDocuments({
        sourceUris: [dataUri],
        fileName,
        mimeType: XLSX_MIME_TYPE,
      });
      return;
    } catch {
      try {
        await Linking.openURL(dataUri);
        return;
      } catch {
        Alert.alert('Hata', 'Youthpass Excel indirilemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleSendCandidatePassword = async () => {
    if (!candidateUser) {
      Alert.alert('Uyarı', 'Şifre göndermek için kayıtlı aday bilgisi bulunamadı.');
      return;
    }

    if (!credentialPassword.trim()) {
      Alert.alert('Uyarı', 'Lütfen gönderilecek şifreyi yazın.');
      return;
    }

    setIsCredentialSending(true);

    try {
      const backend = getBackend();
      const updatedCandidate = await backend.auth.sendCandidatePassword({
        candidateUserId: candidateUser.id,
        password: credentialPassword.trim(),
        adminUserId: 'admin-001',
      });

      setCandidateUser(updatedCandidate);
      setCandidateUserError(null);
      setCredentialPassword('');

      try {
        await openMailto({
          to: updatedCandidate.email,
          subject: 'Inno Derneği Giriş ve Doğrulama Şifresi',
          body:
            `Merhaba ${updatedCandidate.name},\n\n` +
            `Giriş ve doğrulama için kullanacağınız şifreniz: ${credentialPassword.trim()}\n\n` +
            `İyi günler,\nInno Derneği`,
        });
      } catch {
        // Mail client yoksa şifre yine mock backend tarafında aktif edilmiş olur.
      }

      Alert.alert('Şifre Gönderildi', 'Aday için giriş şifresi hazırlandı ve mail akışı tetiklendi.');
    } catch (err) {
      Alert.alert(
        'Hata',
        err instanceof Error ? err.message : 'Şifre gönderilirken bir sorun oluştu.',
      );
    } finally {
      setIsCredentialSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.h2}>Başvuru Detayı</Text>

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
        <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
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
            label='Gönderim Tarihi'
            value={formatDateShort(application.submittedAt)}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Şifre Gönderimi</Text>
        <Text style={styles.cardHint}>
          Aday doğrulama ve giriş için şifre talep ettiğinde, şifreyi yazıp buradan
          gönderin. Mail akışı cihazdaki e-posta uygulaması üzerinden tetiklenir.
        </Text>

        <Field
          label="Aday E-posta"
          value={candidateUser?.email || 'Kullanıcı kaydı bulunamadı'}
        />
        <Field
          label="Şifre Talebi"
          value={
            candidateUser?.credentialRequestPending
              ? `Bekliyor${candidateUser.credentialRequestedAt ? ` • ${formatDateShort(candidateUser.credentialRequestedAt)}` : ''}`
              : candidateUser?.credentialSentAt
                ? `Şifre Gönderildi • ${formatDateShort(candidateUser.credentialSentAt)}`
                : 'Bekleyen talep yok'
          }
        />
        {candidateUserError ? <Text style={styles.errorText}>{candidateUserError}</Text> : null}

        <InputField
          label="Gönderilecek Şifre"
          value={credentialPassword}
          onChangeText={setCredentialPassword}
          placeholder="Örnek: inno2026!"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          label={isCredentialSending ? 'Şifre Gönderiliyor...' : 'Şifreyi Gönder'}
          onPress={isCredentialSending ? undefined : handleSendCandidatePassword}
          variant="ghost"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Program Atama</Text>
        <Text style={styles.cardHint}>
          Aday için yeni programı burada oluşturup doğrudan atayabilirsiniz.
        </Text>

        <View style={styles.programChipRow}>
          {DOCUMENT_TYPE_OPTIONS.map((documentType) => {
            const isActive = selectedDocumentTypes.includes(documentType.key);
            return (
              <TouchableOpacity
                key={documentType.key}
                style={[
                  styles.programChip,
                  isActive && styles.programChipActive,
                ]}
                onPress={() => toggleDocumentType(documentType.key)}
              >
                <Text
                  style={[
                    styles.programChipText,
                    isActive && styles.programChipTextActive,
                  ]}
                >
                  {documentType.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <InputField
          label='Program Adı *'
          value={programName}
          onChangeText={setProgramName}
          placeholder='Örnek: ESC İtalya Gönüllülük Programı'
        />

        <InputField
          label='Yıl *'
          value={programYear}
          onChangeText={setProgramYear}
          placeholder="2026"
          keyboardType="number-pad"
        />

        <InputField
          label='Adımlar (her satıra bir adım)'
          value={programStepsText}
          onChangeText={setProgramStepsText}
          placeholder='Boş bırakılırsa varsayılan adımlar kullanılır'
          multiline
          numberOfLines={4}
        />

        <InputField
          label='Teslim Tarihleri (Satır formatı: Etiket|YYYY-MM-DD)'
          value={programDeadlinesText}
          onChangeText={setProgramDeadlinesText}
          placeholder='Başvuru kapanış|2026-06-15'
          multiline
          numberOfLines={3}
        />

        <Button
          label={isLoading ? 'İşleniyor...' : 'Programi Olustur ve Ata'}
          onPress={handleAssignProgram}
          variant="ghost"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kullanıcının Programları</Text>
        <Text style={styles.cardHint}>
          Program secip Youthpass Excel bilgisini indirebilirsiniz.
        </Text>

        {candidatePrograms.length === 0 ? (
          <Text style={styles.mutedText}>Bu kullanıcıya ait program bulunamadı.</Text>
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
        label="Belge Doğrulama"
        onPress={() => navigation.navigate('AdminDogrulama', { applicationId })}
      />
      <Button
        label='Program Sohbeti'
        variant="ghost"
        onPress={() => navigation.navigate('AdayMesaj', { applicationId })}
      />
      <Button
        label='Genel Sohbet'
        variant="ghost"
        onPress={() =>
          navigation.navigate('AdayMesaj', {
            applicationId: createGeneralChatThreadId(application.userId),
          })
        }
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Başvuru Karari</Text>
        <Text style={styles.cardHint}>
          Bu bolum, operasyonel olarak basvuruyu onaylamak veya reddetmek icindir.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? 'İşleniyor...' : 'Başvuruyu Onayla'}
          onPress={() => {
            Alert.alert('Onay', 'Başvuruyu onaylamak istiyor musunuz', [
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
          label={isLoading ? 'İşleniyor...' : 'Başvuruyu Reddet'}
          variant="ghost"
          onPress={() => {
            if (!rejectReason.trim()) {
              Alert.alert('Uyarı', 'Lütfen ret gerekçesi giriniz.');
              return;
            }
            Alert.alert('Ret', 'Başvuruyu reddetmek istiyor musunuz', [
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





