import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Button, InputField, ScreenScrollView } from '../../components';
import { getBackend } from '../../services/backend';
import { useAuth } from '../../hooks';
import { layout, useThemedStyles, type AppColors } from '../../theme';

export const ChangePasswordScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (newPassword !== confirmation) {
      Alert.alert('Şifreler Eşleşmiyor', 'Yeni şifre ve doğrulama alanları aynı olmalıdır.');
      return;
    }
    if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      Alert.alert('Şifre Yeterince Güçlü Değil', 'En az 12 karakter, büyük/küçük harf ve rakam kullanın.');
      return;
    }
    setBusy(true);
    try {
      if (!user) return;
      await getBackend().auth.changePassword({ userId: user.id, currentPassword, newPassword });
      Alert.alert('Şifre Güncellendi', 'Yeni şifrenizle tekrar giriş yapın.', [{ text: 'Tamam', onPress: logout }]);
    } catch (error) {
      Alert.alert('Şifre Değiştirilemedi', error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScreenScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Şifrenizi Değiştirin</Text>
      <Text style={styles.subtitle}>Geçici şifre yalnızca ilk giriş içindir. Devam etmek için kişisel şifrenizi belirleyin.</Text>
      <InputField label="Mevcut Şifre" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" autoCapitalize="none" editable={!busy} />
      <InputField label="Yeni Şifre" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" autoCapitalize="none" editable={!busy} />
      <InputField label="Yeni Şifre Tekrar" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" autoCapitalize="none" editable={!busy} />
      <Text style={styles.hint}>En az 12 karakter; büyük harf, küçük harf ve rakam içermelidir.</Text>
      <Button label={busy ? 'Güncelleniyor...' : 'Şifreyi Güncelle'} loading={busy} onPress={submit} />
    </ScreenScrollView>
  </KeyboardAvoidingView>;
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background } as ViewStyle,
  container: { maxWidth: layout.formMaxWidth, gap: 20 } as ViewStyle,
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '700' } as TextStyle,
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 } as TextStyle,
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 } as TextStyle,
});
