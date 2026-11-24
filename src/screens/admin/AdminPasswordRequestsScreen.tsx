import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  FlatList,
} from 'react-native';
import { Button, Field, InputField, Pill, StateMessage } from '../../components';
import { useAuth } from '../../hooks';
import { getBackend } from '../../services/backend';
import { useThemedStyles, type AppColors } from '../../theme';
import { formatDateShort } from '../../utils/date';
import { openExternalUrl, openMailto } from '../../utils/contact';
import { User } from '../../types';
import {apiClient,requireData} from '../../services/api/apiClient';
import {appConfig} from '../../config/appConfig';

export const AdminPasswordRequestsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { user: adminUser } = useAuth();
  const [candidates, setCandidates] = useState<User[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingFor, setIsSendingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page,setPage]=useState(1),[total,setTotal]=useState(0),[query,setQuery]=useState('');

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backend = getBackend();
      const response=appConfig.dataSource==='remote'?requireData(await apiClient.get<{items:User[];total:number}>(`/admin/candidates?page=${page}&pageSize=25&status=pending&q=${encodeURIComponent(query)}`)):null;
      const nextCandidates = response?.items||await backend.auth.listCandidates();
      setCandidates(nextCandidates);
      setTotal(response?.total||nextCandidates.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre talepleri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [page,query]);

  useEffect(() => {
    const timer=setTimeout(()=>{loadCandidates();},250);return()=>clearTimeout(timer);
  }, [loadCandidates]);

  const pendingCandidates = useMemo(
    () =>
      candidates
        .filter((candidate) => candidate.status === 'pending' || candidate.credentialRequestPending)
        .sort((a, b) =>
          new Date(b.credentialRequestedAt || 0).getTime() -
          new Date(a.credentialRequestedAt || 0).getTime(),
        ),
    [candidates],
  );

  const handleSendPassword = async (candidate: User) => {
    const password = passwords[candidate.id]?.trim() || '';
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      Alert.alert('Uyarı', 'Geçici şifre en az 12 karakter, büyük/küçük harf ve rakam içermelidir.');
      return;
    }

    setIsSendingFor(candidate.id);
    try {
      const backend = getBackend();
      const updatedCandidate = await backend.auth.sendCandidatePassword({
        candidateUserId: candidate.id,
        password,
        adminUserId: adminUser?.id || '',
      });

      setCandidates((prev) =>
        prev.map((item) => (item.id === updatedCandidate.id ? updatedCandidate : item)),
      );
      setPasswords((prev) => ({ ...prev, [candidate.id]: '' }));

      Alert.alert(
        'Geçici Şifre Hazırlandı',
        `${updatedCandidate.name} ilk girişte bu şifreyi değiştirmek zorundadır. Şifreyi güvenli bir kanaldan adaya iletin.`,
      );
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Şifre gönderilemedi.');
    } finally {
      setIsSendingFor(null);
    }
  };

  return (
    <FlatList data={pendingCandidates} keyExtractor={item=>item.id} contentContainerStyle={styles.container} initialNumToRender={6} windowSize={5} ListHeaderComponent={<>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Şifre Talepleri</Text>
        <Text style={styles.subtitle}>
          Şifre isteyen adayları bu ekrandan ayrı olarak yönetin.
        </Text>
      </View>

      <Button label={isLoading ? 'Yükleniyor...' : 'Listeyi Yenile'} variant="ghost" loading={isLoading} disabled={Boolean(isSendingFor)} onPress={loadCandidates} />
      <InputField label="Aday ara" value={query} onChangeText={value=>{setQuery(value);setPage(1);}} autoCapitalize="none"/>

      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text> : null}

      {!isLoading && !error && pendingCandidates.length === 0 ? (
        <StateMessage message="Bekleyen şifre talebi yok." />
      ) : null}

      </>} renderItem={({item:candidate}) => (
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
            placeholder="En az 12 karakter"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label={isSendingFor === candidate.id ? 'Gönderiliyor...' : 'Şifreyi Gönder'}
            loading={isSendingFor === candidate.id}
            disabled={isLoading || Boolean(isSendingFor)}
            onPress={() => handleSendPassword(candidate)}
          />
        </View>
      )} ListFooterComponent={appConfig.dataSource==='remote'?<View style={styles.cardHeader}><Button label="Önceki" variant="ghost" disabled={page===1||isLoading} onPress={()=>setPage(value=>value-1)}/><Text>{page} / {Math.max(1,Math.ceil(total/25))}</Text><Button label="Sonraki" variant="ghost" disabled={page*25>=total||isLoading} onPress={()=>setPage(value=>value+1)}/></View>:null}/>
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
      borderRadius: 8,
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
      borderRadius: 8,
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
