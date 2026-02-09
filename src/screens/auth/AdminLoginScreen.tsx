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
          <Text style={styles.backBtnText}>← Geri</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.accentBar} />
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
          />

          <View style={{ height: 20 }} />

          <InputField
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            placeholder="Şifrenizi girin"
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ height: 16 }} />

          <Button
            label={isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            onPress={handleAdminLogin}
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
    marginBottom: 32,
  } as ViewStyle,
  backBtnText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
  header: {
    marginBottom: 36,
  } as ViewStyle,
  accentBar: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.teal,
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
});
