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
          />
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
  } as ViewStyle,
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 26,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  } as ViewStyle,
  backBtnLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
    fontWeight: '700',
  } as TextStyle,
  header: {
    marginBottom: 36,
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
  formControl: {
    minHeight: 52,
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
  } as TextStyle,
  formControlButton: {
    minHeight: 52,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: '100%',
  } as ViewStyle,
  spacer20: {
    height: 20,
  } as ViewStyle,
  spacer16: {
    height: 16,
  } as ViewStyle,
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 10,
  } as TextStyle,
});
