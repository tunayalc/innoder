import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Button, Field, InputField, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { apiClient } from '../../services/api/apiClient';
import { useThemedStyles, type AppColors } from '../../theme';
import type { User } from '../../types';

export const AdminManagementScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await apiClient.get<User[]>('/admin/admins');
    if (response.data) setAdmins(response.data);
  }, []);

  useEffect(() => { if (user?.role === 'super_admin') load().catch(() => undefined); }, [load, user?.role]);

  if (user?.role !== 'super_admin') {
    return <View style={styles.container}><Text style={styles.title}>Admin Yönetimi</Text><Text style={styles.notice}>Bu ekran yalnızca super admin hesabına açıktır.</Text></View>;
  }

  const createAdmin = async () => {
    if (!name.trim() || !email.trim() || !username.trim()) {
      Alert.alert('Eksik Bilgi', 'Ad soyad, e-posta ve kullanıcı adı zorunludur.');
      return;
    }
    if (temporaryPassword.length < 12 || !/[A-Z]/.test(temporaryPassword) || !/[a-z]/.test(temporaryPassword) || !/\d/.test(temporaryPassword)) {
      Alert.alert('Geçersiz Şifre', 'Geçici şifre en az 12 karakter, büyük/küçük harf ve rakam içermelidir.');
      return;
    }
    setBusy(true);
    const response = await apiClient.post<User>('/admin/admins', {
      name: name.trim(), email: email.trim(), username: username.trim(), temporaryPassword, role: 'admin',
    });
    setBusy(false);
    if (!response.data) { Alert.alert('Admin Eklenemedi', response.error || 'İşlem tamamlanamadı.'); return; }
    setName(''); setEmail(''); setUsername(''); setTemporaryPassword('');
    await load();
    Alert.alert('Admin Oluşturuldu', 'Yeni admin ilk girişte geçici şifresini değiştirmek zorundadır.');
  };

  const toggleAdmin = async (admin: User) => {
    const status = admin.status === 'active' ? 'disabled' : 'active';
    const response = await apiClient.patch<User>(`/admin/admins/${admin.id}/status`, { status });
    if (!response.data) Alert.alert('İşlem Tamamlanamadı', response.error || 'Admin durumu güncellenemedi.');
    else await load();
  };

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Admin Yönetimi</Text>
    <Text style={styles.subtitle}>Yeni yönetici oluşturun ve mevcut hesapların erişimini yönetin.</Text>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Yeni Admin</Text>
      <InputField label="Ad Soyad" value={name} onChangeText={setName} />
      <InputField label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <InputField label="Kullanıcı Adı" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <InputField label="Geçici Şifre" value={temporaryPassword} onChangeText={setTemporaryPassword} secureTextEntry />
      <Button label={busy ? 'Oluşturuluyor...' : 'Admin Oluştur'} onPress={busy ? undefined : createAdmin} />
    </View>
    <Text style={styles.sectionTitle}>Mevcut Adminler</Text>
    {admins.map((admin) => <View style={styles.adminRow} key={admin.id}>
      <View style={styles.adminHeader}><Text style={styles.adminName}>{admin.name}</Text><Pill label={admin.status} variant={admin.status === 'active' ? 'ok' : 'warn'} /></View>
      <Field label="E-posta" value={admin.email} /><Field label="Rol" value={admin.role} />
      {admin.role !== 'super_admin' ? <Button label={admin.status === 'active' ? 'Erişimi Pasifleştir' : 'Erişimi Etkinleştir'} variant="ghost" onPress={() => toggleAdmin(admin)} /> : null}
    </View>)}
  </ScrollView>;
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { padding: 20, gap: 14, paddingBottom: 44 } as ViewStyle,
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' } as TextStyle,
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 } as TextStyle,
  notice: { color: colors.noticeText, backgroundColor: colors.noticeBg, padding: 16, borderRadius: 8 } as TextStyle,
  section: { gap: 12, padding: 16, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, backgroundColor: colors.cardBg } as ViewStyle,
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' } as TextStyle,
  adminRow: { gap: 8, padding: 16, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, backgroundColor: colors.cardBg } as ViewStyle,
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  adminName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' } as TextStyle,
});
