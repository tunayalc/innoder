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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button } from '../../components';
import { useAuth } from '../../hooks';
import { User } from '../../types';

const USERS_STORAGE_KEY = '@inno_users';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen email ve şifrenizi girin.');
      return;
    }

    setIsLoading(true);
    try {
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        Alert.alert('Hata', 'Kullanıcı bulunamadı.');
        setIsLoading(false);
        return;
      }

      // In a real app, you'd check hashed password
      // For now, we store password in a separate key
      const passwordsJson = await AsyncStorage.getItem('@inno_passwords');
      const passwords: Record<string, string> = passwordsJson ? JSON.parse(passwordsJson) : {};
      
      if (passwords[user.id] !== password) {
        Alert.alert('Hata', 'Şifre yanlış.');
        setIsLoading(false);
        return;
      }

      login(user);
    } catch (error) {
      Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = () => {
    navigation.navigate('AdminLogin');
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
          <Text style={styles.title}>Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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
            onPress={handleLogin}
          />

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Hesabınız yok mu? <Text style={styles.registerTextBold}>Kayıt Olun</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.adminLink}
          onPress={handleAdminLogin}
        >
          <Text style={styles.adminText}>Admin misiniz?</Text>
        </TouchableOpacity>
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
  registerLink: {
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,
  registerTextBold: {
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
  adminLink: {
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 12,
  } as ViewStyle,
  adminText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  } as TextStyle,
});
