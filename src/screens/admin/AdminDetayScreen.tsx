import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, ChecklistRow, Field, Pill } from '../../components';
import {
  APPLICATION_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPES,
} from '../../constants';
import { getBackend } from '../../services/backend';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationById,
  selectApplicationError,
  selectApplicationLoading,
} from '../../store/selectors';
import { selectMessagesByApplicationId } from '../../store/selectors/messageSelectors';
import { approveApplication, rejectApplication } from '../../store/thunks/applicationThunks';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import {
  AdminDetayRouteProp,
  createGeneralChatThreadId,
  DocumentStatus,
  RootStackNavigationProp,
  User,
} from '../../types';
import { formatDateShort, getRelativeTime } from '../../utils/date';
import { openExternalUrl, openMailto } from '../../utils/contact';

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
  const dispatch = useAppDispatch();
  const { applicationId } = route.params;

  const application = useAppSelector(selectApplicationById(applicationId));
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);
  const messages = useAppSelector(selectMessagesByApplicationId(applicationId));

  const [candidateUser, setCandidateUser] = useState<User | null>(null);
  const [candidateUserError, setCandidateUserError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const initials = useMemo(() => {
    if (!application) return '';
    return application.personalInfo.fullName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [application]);

  useEffect(() => {
    if (!application) return;

    let cancelled = false;

    const loadCandidate = async () => {
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

    loadCandidate();

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
            {application.programName} · {formatDateShort(application.createdAt)}
          </Text>
        </View>
        <Pill
          label={APPLICATION_STATUS_LABELS[application.status] || application.status}
          variant={appStatusVariant}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
        <Field label="Ad Soyad" value={application.personalInfo.fullName} />
        {application.personalInfo.birthDate ? (
          <Field label="Doğum Tarihi" value={formatDateShort(application.personalInfo.birthDate)} />
        ) : null}
        {application.personalInfo.identityNumber ? (
          <Field
            label="TC Kimlik No"
            value={`***${application.personalInfo.identityNumber.slice(-4)}`}
          />
        ) : null}
        <Field label="Program" value={application.programName} />
        <Field
          label="E-posta"
          value={candidateUser?.email || 'Kullanıcı kaydı bulunamadı'}
          onPress={candidateUser?.email ? () => openMailto({ to: candidateUser.email }) : undefined}
          isLink={Boolean(candidateUser?.email)}
        />
        <Field
          label="Etkinlik Linki"
          value={candidateUser?.eventLink || 'Paylaşılmadı'}
          onPress={candidateUser?.eventLink ? () => openExternalUrl(candidateUser.eventLink!) : undefined}
          isLink={Boolean(candidateUser?.eventLink)}
        />
        {application.submittedAt ? (
          <Field label="Gönderim Tarihi" value={formatDateShort(application.submittedAt)} />
        ) : null}
        {candidateUserError ? <Text style={styles.errorText}>{candidateUserError}</Text> : null}
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
        label="Program Sohbeti"
        variant="ghost"
        onPress={() => navigation.navigate('AdayMesaj', { applicationId })}
      />
      <Button
        label="Genel Sohbet"
        variant="ghost"
        onPress={() =>
          navigation.navigate('AdayMesaj', {
            applicationId: createGeneralChatThreadId(application.userId),
          })
        }
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Başvuru Kararı</Text>
        <Text style={styles.cardHint}>
          Bu bölüm yalnızca başvuru sürecinin onay/red kararını yönetir.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? 'İşleniyor...' : 'Başvuruyu Onayla'}
          onPress={() => {
            Alert.alert('Onay', 'Başvuruyu onaylamak istiyor musunuz?', [
              { text: 'İptal', style: 'cancel' },
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
          placeholder="Ret gerekçesi..."
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
            Alert.alert('Ret', 'Başvuruyu reddetmek istiyor musunuz?', [
              { text: 'İptal', style: 'cancel' },
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

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
      color: colors.danger,
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
