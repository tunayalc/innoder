import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button } from '../../components';
import { useAuth } from '../../hooks';
import { User } from '../../types';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123123';

export const AdminLoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen kullanıcı adı ve şifrenizi girin.');
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const adminUser: User = {
          id: 'admin-001',
          email: 'admin@inno.com',
          name: 'Admin',
          role: 'admin',
          kvkkAccepted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        login(adminUser);
      } else {
        Alert.alert('Hata', 'Kullanıcı adı veya şifre yanlış.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Admin Girişi</Text>
          <Text style={styles.subtitle}>Admin hesabınıza giriş yapın</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı adınız"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Button
            label={isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            onPress={handleAdminLogin}
          />

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>
              ← Geri Dön
            </Text>
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
    padding: 20,
    justifyContent: 'center',
  } as ViewStyle,
  header: {
    marginBottom: 32,
    alignItems: 'center',
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,
  form: {
    gap: 16,
  } as ViewStyle,
  inputContainer: {
    gap: 6,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
  } as TextStyle,
  backLink: {
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  backText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
});
