import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Button, InputField, ScreenScrollView } from '../../components';
import { apiClient } from '../../services/api/apiClient';
import { layout, useThemedStyles, type AppColors } from '../../theme';
import { isValidEmail } from '../../utils/validation';

export const ForgotPasswordScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!isValidEmail(email)) { Alert.alert('Geçersiz E-posta', 'Kayıtlı e-posta adresinizi girin.'); return; }
    setBusy(true);
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email: email.trim().toLowerCase() });
    setBusy(false);
    Alert.alert('Şifre Sıfırlama', response.data?.message || response.error || 'İşlem tamamlanamadı.');
  };
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScreenScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Şifremi Unuttum</Text>
      <Text style={styles.subtitle}>Aktif hesabınıza ait e-posta adresine 30 dakika geçerli bir şifre yenileme bağlantısı gönderilir.</Text>
      <InputField label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} editable={!busy} />
      <Button label={busy ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'} loading={busy} onPress={submit} />
    </ScreenScrollView>
  </KeyboardAvoidingView>;
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background } as ViewStyle,
  container: { maxWidth: layout.formMaxWidth, gap: 20 } as ViewStyle,
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '700' } as TextStyle,
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 } as TextStyle,
});
