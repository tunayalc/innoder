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
import { Button, InputField } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';

const expressive = {
  background: '#FFF7FF',
  surface: '#FFFFFF',
  surfaceContainerLow: '#FBF0FF',
  surfaceContainerHigh: '#F3E2FF',
  primary: '#6850A5',
  primaryDim: '#5B4498',
  onPrimaryContainer: '#442C7F',
  textPrimary: '#3D2A51',
  textSecondary: '#6B5681',
  danger: '#AC3149',
} as const;

export const AdminLoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { loginAdmin } = useAuth();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen kullanıcı adı ve şifrenizi girin.');
      return;
    }

    loginAdmin({ username, password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View pointerEvents="none" style={styles.topOrb} />
      <View pointerEvents="none" style={styles.bottomOrb} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnLabel}>Geri</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Yönetici Girişi</Text>
          <Text style={styles.subtitle}>
            Yönetim paneline erişmek için giriş yapın
          </Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Kullanıcı Adı"
            value={username}
            onChangeText={setUsername}
            placeholder="Kullanıcı adınız"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.formControl}
          />

          <View style={styles.spacer20} />

          <InputField
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            placeholder="Şifrenizi girin"
            secureTextEntry
            style={styles.formControl}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.spacer16} />

          <Button
            label={isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            onPress={handleAdminLogin}
            style={styles.formControlButton}
            pressedOpacity={0.86}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: expressive.background,
  } as ViewStyle,
  topOrb: {
    position: 'absolute',
    top: -120,
    right: -40,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(202, 182, 255, 0.34)',
  } as ViewStyle,
  bottomOrb: {
    position: 'absolute',
    bottom: 40,
    left: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(194, 255, 162, 0.18)',
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  } as ViewStyle,
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: expressive.surfaceContainerHigh,
    justifyContent: 'center',
  } as ViewStyle,
  backBtnLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: expressive.onPrimaryContainer,
    fontWeight: '800',
  } as TextStyle,
  header: {
    marginBottom: 14,
    backgroundColor: expressive.surfaceContainerLow,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: expressive.primary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  } as ViewStyle,
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: expressive.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 8,
  } as TextStyle,
  subtitle: {
    fontSize: 15,
    color: expressive.textSecondary,
    lineHeight: 22,
  } as TextStyle,
  form: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: expressive.surface,
    shadowColor: expressive.primary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  } as ViewStyle,
  formControl: {
    minHeight: 52,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: expressive.surfaceContainerHigh,
    borderWidth: 0,
    width: '100%',
  } as TextStyle,
  formControlButton: {
    minHeight: 54,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 14,
    width: '100%',
    backgroundColor: expressive.primary,
    shadowColor: expressive.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  } as ViewStyle,
  spacer20: {
    height: 20,
  } as ViewStyle,
  spacer16: {
    height: 16,
  } as ViewStyle,
  errorText: {
    fontSize: 13,
    color: expressive.danger,
    marginTop: 10,
  } as TextStyle,
});
