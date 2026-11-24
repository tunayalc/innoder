import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, InputField, Pill, StateMessage } from '../../components';
import { useAuth } from '../../hooks';
import { getBackend } from '../../services/backend';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { formatDateShort } from '../../utils/date';
import { openExternalUrl, openMailto } from '../../utils/contact';
import { User } from '../../types';
import {apiClient,requireData} from '../../services/api/apiClient';
import {appConfig} from '../../config/appConfig';

export const AdminPasswordRequestsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user: adminUser } = useAuth();
  // Activation is only possible after the admin confirms the candidate's event link.
  const [approved, setApproved] = useState<Record<string, boolean>>({});
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
    if (!candidate.eventLink) {
      Alert.alert('Uyarı', 'Aday etkinlik bağlantısı paylaşmadığı için hesap etkinleştirilemez.');
      return;
    }
    if (!approved[candidate.id]) {
      Alert.alert('Uyarı', 'Önce etkinlik bağlantısını kontrol edip onaylayın.');
      return;
    }
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
        eventLinkApproved: true,
      });

      setCandidates((prev) =>
        prev.map((item) => (item.id === updatedCandidate.id ? updatedCandidate : item)),
      );
      setPasswords((prev) => ({ ...prev, [candidate.id]: '' }));
      setApproved((prev) => ({ ...prev, [candidate.id]: false }));

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
    <FlatList data={pendingCandidates} keyExtractor={item=>item.id} style={[styles.list, { paddingTop: insets.top }]} contentContainerStyle={styles.container} initialNumToRender={6} windowSize={5} keyboardShouldPersistTaps="handled" ListHeaderComponent={<>
      <View style={styles.heroCard}>
        <Text accessibilityRole="header" style={styles.title}>Onaylar</Text>
        <Text style={styles.subtitle}>
          Kayıt olan adayın etkinlik bağlantısını açıp kontrol edin. Onaylamadan hesap etkinleştirilemez.
        </Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchField}>
          <InputField label="Aday ara" value={query} onChangeText={value=>{setQuery(value);setPage(1);}} autoCapitalize="none"/>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Listeyi yenile" disabled={isLoading || Boolean(isSendingFor)} onPress={loadCandidates} style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}>
          <Icon name="refresh" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text> : null}

      {!isLoading && !error && pendingCandidates.length === 0 ? (
        <StateMessage message="Onay bekleyen aday yok." />
      ) : null}

      </>} renderItem={({item:candidate}) => {
        const isApproved = Boolean(approved[candidate.id]);
        return (
        <View key={candidate.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(candidate.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toLocaleUpperCase('tr-TR')).join('')}</Text>
            </View>
            <View style={styles.identity}>
              <Text style={styles.cardTitle}>{candidate.name}</Text>
              <Pressable accessibilityRole="link" onPress={() => openMailto({ to: candidate.email })}>
                <Text style={styles.email}>{candidate.email}</Text>
              </Pressable>
            </View>
            <Pill label="Bekliyor" variant="warn" />
          </View>
          <Text style={styles.meta}>
            Talep: {candidate.credentialRequestedAt ? formatDateShort(candidate.credentialRequestedAt) : 'Bilinmiyor'}
          </Text>

          <View style={styles.linkBox}>
            <Text style={styles.linkLabel}>Etkinlik bağlantısı</Text>
            {candidate.eventLink ? (
              <Pressable accessibilityRole="link" onPress={() => openExternalUrl(candidate.eventLink!)} style={styles.linkRow}>
                <Icon name="open-in-new" size={18} color={colors.primaryText} />
                <Text numberOfLines={2} style={styles.linkText}>{candidate.eventLink}</Text>
              </Pressable>
            ) : (
              <Text style={styles.errorText}>Paylaşılmadı — bu aday etkinleştirilemez.</Text>
            )}
            {candidate.eventLink ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isApproved }}
                onPress={() => setApproved(prev => ({ ...prev, [candidate.id]: !prev[candidate.id] }))}
                style={styles.checkRow}
              >
                <Icon name={isApproved ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={isApproved ? colors.primary : colors.outline} />
                <Text style={styles.checkText}>Bağlantıyı açıp kontrol ettim; aday bu etkinliğe katılıyor.</Text>
              </Pressable>
            ) : null}
          </View>

          <InputField
            label="Geçici şifre"
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
            label={isSendingFor === candidate.id ? 'Kaydediliyor...' : 'Onayla ve şifreyi kaydet'}
            icon="account-check-outline"
            loading={isSendingFor === candidate.id}
            disabled={isLoading || Boolean(isSendingFor) || !candidate.eventLink || !isApproved}
            onPress={() => handleSendPassword(candidate)}
          />
        </View>
        );
      }} ListFooterComponent={appConfig.dataSource==='remote' && total > 25 ? <View style={styles.pager}><Button label="Önceki" size="sm" variant="ghost" disabled={page===1||isLoading} onPress={()=>setPage(value=>value-1)}/><Text style={styles.meta}>{page} / {Math.max(1,Math.ceil(total/25))}</Text><Button label="Sonraki" size="sm" variant="ghost" disabled={page*25>=total||isLoading} onPress={()=>setPage(value=>value+1)}/></View>:null}/>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    list: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    container: { padding: 20, paddingBottom: 32, gap: 14 } as ViewStyle,
    heroCard: { gap: 6, marginBottom: 14 } as ViewStyle,
    title: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    subtitle: { fontSize: 15, lineHeight: 21, color: colors.textSecondary } as TextStyle,
    toolbar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 14 } as ViewStyle,
    searchField: { flex: 1 } as ViewStyle,
    refresh: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerHigh,
    } as ViewStyle,
    pressed: { opacity: 0.8 } as ViewStyle,
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      padding: 16,
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    } as ViewStyle,
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 } as ViewStyle,
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    avatarText: { fontSize: 16, fontWeight: '700', color: colors.primaryText } as TextStyle,
    identity: { flex: 1, gap: 2 } as ViewStyle,
    cardTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    email: { fontSize: 14, color: colors.primaryText } as TextStyle,
    meta: { fontSize: 14, color: colors.textSecondary } as TextStyle,
    linkBox: { backgroundColor: colors.surfaceContainerHigh, borderRadius: 14, padding: 14, gap: 10 } as ViewStyle,
    linkLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' } as TextStyle,
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 } as ViewStyle,
    linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primaryText } as TextStyle,
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 } as ViewStyle,
    checkText: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.textPrimary } as TextStyle,
    pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 } as ViewStyle,
    errorText: { fontSize: 14, color: colors.danger } as TextStyle,
  });
