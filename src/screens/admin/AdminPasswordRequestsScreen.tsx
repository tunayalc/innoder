import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Button, Field, InputField, Pill } from '../../components';
import { getBackend } from '../../services/backend';
import { useThemedStyles, type AppColors } from '../../theme';
import { formatDateShort } from '../../utils/date';
import { openExternalUrl, openMailto } from '../../utils/contact';
import { User } from '../../types';

export const AdminPasswordRequestsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingFor, setIsSendingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backend = getBackend();
      const nextCandidates = await backend.auth.listCandidates();
      setCandidates(nextCandidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre talepleri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const pendingCandidates = useMemo(
    () =>
      candidates
        .filter((candidate) => candidate.credentialRequestPending)
        .sort((a, b) =>
          new Date(b.credentialRequestedAt || 0).getTime() -
          new Date(a.credentialRequestedAt || 0).getTime(),
        ),
    [candidates],
  );

  const handleSendPassword = async (candidate: User) => {
    const password = passwords[candidate.id]?.trim();
    if (!password) {
      Alert.alert('Uyarı', 'Lütfen gönderilecek şifreyi yazın.');
      return;
    }

    setIsSendingFor(candidate.id);
    try {
      const backend = getBackend();
      const updatedCandidate = await backend.auth.sendCandidatePassword({
        candidateUserId: candidate.id,
        password,
        adminUserId: 'admin-001',
      });

      setCandidates((prev) =>
        prev.map((item) => (item.id === updatedCandidate.id ? updatedCandidate : item)),
      );
      setPasswords((prev) => ({ ...prev, [candidate.id]: '' }));

      try {
        await openMailto({
          to: updatedCandidate.email,
          subject: 'Inno Derneği Giriş Şifresi',
          body:
            `Merhaba ${updatedCandidate.name},\n\n` +
            `Giriş şifreniz: ${password}\n\n` +
            'İyi günler,\nInno Derneği',
        });
      } catch {
        // Mail uygulaması yoksa backend tarafındaki gönderim yine tamamlanmış olur.
      }

      Alert.alert('Şifre Gönderildi', `${updatedCandidate.name} için şifre hazırlandı.`);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Şifre gönderilemedi.');
    } finally {
      setIsSendingFor(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Şifre Talepleri</Text>
        <Text style={styles.subtitle}>
          Şifre isteyen adayları bu ekrandan ayrı olarak yönetin.
        </Text>
      </View>

      <Button label={isLoading ? 'Yükleniyor...' : 'Listeyi Yenile'} variant="ghost" onPress={loadCandidates} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isLoading && pendingCandidates.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Bekleyen şifre talebi yok.</Text>
        </View>
      ) : null}

      {pendingCandidates.map((candidate) => (
        <View key={candidate.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{candidate.name}</Text>
            <Pill label="Bekliyor" variant="warn" />
          </View>
          <Field
            label="E-posta"
            value={candidate.email}
            onPress={() => openMailto({ to: candidate.email })}
            isLink
          />
          <Field
            label="Etkinlik Linki"
            value={candidate.eventLink || 'Paylaşılmadı'}
            onPress={candidate.eventLink ? () => openExternalUrl(candidate.eventLink!) : undefined}
            isLink={Boolean(candidate.eventLink)}
          />
          <Field
            label="Talep Tarihi"
            value={
              candidate.credentialRequestedAt
                ? formatDateShort(candidate.credentialRequestedAt)
                : 'Bilinmiyor'
            }
          />
          <InputField
            label="Gönderilecek Şifre"
            value={passwords[candidate.id] || ''}
            onChangeText={(value) =>
              setPasswords((prev) => ({ ...prev, [candidate.id]: value }))
            }
            placeholder="Örnek: inno2026!"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label={isSendingFor === candidate.id ? 'Gönderiliyor...' : 'Şifreyi Gönder'}
            onPress={isSendingFor === candidate.id ? undefined : () => handleSendPassword(candidate)}
          />
        </View>
      ))}
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
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    } as ViewStyle,
    cardTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    emptyCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 16,
      padding: 20,
    } as ViewStyle,
    emptyText: {
      fontSize: 14,
      color: colors.noticeText,
      textAlign: 'center',
    } as TextStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
      textAlign: 'center',
    } as TextStyle,
  });
