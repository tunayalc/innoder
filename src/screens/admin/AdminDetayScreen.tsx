import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, ChecklistRow, Pill, Field } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationById, selectApplicationLoading, selectApplicationError } from '../../store/selectors';
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
import { approveApplication, rejectApplication } from '../../store/thunks/applicationThunks';

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
  const application = useAppSelector(selectApplicationById(applicationId));
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);
  const messages = useAppSelector(
    selectMessagesByApplicationId(applicationId),
  );
  const [rejectReason, setRejectReason] = useState('');

  const initials = useMemo(() => {
    if (!application) return '?';
    return application.personalInfo.fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
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

      {/* Profile header */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {application.personalInfo.fullName}
          </Text>
          <Text style={styles.subtitle}>
            {application.programName} · {formatDateShort(application.createdAt)}
          </Text>
        </View>
        <Pill
          label={APPLICATION_STATUS_LABELS[application.status]}
          variant={appStatusVariant}
        />
      </View>

      {/* Personal info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
        <Field
          label="Ad Soyad"
          value={application.personalInfo.fullName}
        />
        {application.personalInfo.birthDate && (
          <Field
            label="Doğum Tarihi"
            value={formatDateShort(application.personalInfo.birthDate)}
          />
        )}
        {application.personalInfo.identityNumber && (
          <Field
            label="TC Kimlik No"
            value={`***${application.personalInfo.identityNumber.slice(-4)}`}
          />
        )}
        <Field
          label="Program"
          value={application.programName}
        />
        {application.submittedAt && (
          <Field
            label="Gönderim Tarihi"
            value={formatDateShort(application.submittedAt)}
          />
        )}
      </View>

      {/* Document checklist */}
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

      {/* Recent messages */}
      {messages.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Son Mesajlar</Text>
          {messages.slice(-3).map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.msgBubble,
                msg.senderRole === 'admin'
                  ? styles.msgAdmin
                  : styles.msgCandidate,
              ]}
            >
              <Text style={styles.msgText}>{msg.content}</Text>
              <Text style={styles.msgTime}>
                {getRelativeTime(msg.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <Button
        label="Belge Doğrulama"
        onPress={() =>
          navigation.navigate('AdminDogrulama', { applicationId })
        }
      />
      <Button
        label="Mesaj Gönder"
        variant="ghost"
        onPress={() =>
          navigation.navigate('AdayMesaj', { applicationId })
        }
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Başvuru Kararı</Text>
        <Text style={styles.cardHint}>
          Bu bölüm, belge doğrulaması dışında (operasyonel) onay/ret kararı vermek içindir.
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
  cardHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
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
