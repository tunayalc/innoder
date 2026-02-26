import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, InputField } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { loginCandidate, loginDemoCandidate } = useAuth();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lutfen e-posta ve sifrenizi girin.');
      return;
    }

    loginCandidate({ email, password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>Giris Yap</Text>
          <Text style={styles.subtitle}>
            Devam etmek icin hesap bilgilerinizle giris yapin.
          </Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ height: 20 }} />

          <InputField
            label="Sifre"
            value={password}
            onChangeText={setPassword}
            placeholder="Sifrenizi girin"
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ height: 16 }} />

          <Button
            label={isLoading ? 'Giris yapiliyor...' : 'Giris Yap'}
            onPress={isLoading ? undefined : handleLogin}
          />

          <View style={{ height: 10 }} />

          <Button
            label={isLoading ? 'Demo giris yapiliyor...' : 'Demo Giris (Bilgi Girmeden)'}
            variant="ghost"
            onPress={isLoading ? undefined : loginDemoCandidate}
          />

          <Text style={styles.helperText}>
            Sadece tarafimizca giris bilgisi tanimlanan hesaplar giris yapabilir.
          </Text>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('OnboardingIntro')}
          >
            <Text style={styles.registerText}>
              Hesabiniz yok mu?{' '}
              <Text style={styles.registerTextBold}>Once Videolari Izle</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminLogin')}
            hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
          >
            <Text style={styles.adminText}>Yonetici girisi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  } as ViewStyle,
  header: {
    marginBottom: 36,
  } as ViewStyle,
  accentBar: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
    marginBottom: 16,
  } as ViewStyle,
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 23,
  } as TextStyle,
  form: {
    paddingHorizontal: 0,
  } as ViewStyle,
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 10,
  } as TextStyle,
  helperText: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  } as TextStyle,
  registerLink: {
    marginTop: 14,
    alignSelf: 'flex-start',
  } as ViewStyle,
  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,
  registerTextBold: {
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
  footer: {
    marginTop: 'auto' as any,
    paddingTop: 32,
    alignItems: 'center',
  } as ViewStyle,
  adminText: {
    fontSize: 14,
    color: colors.textMuted,
  } as TextStyle,
});
