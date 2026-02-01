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

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];

      // Check if email already exists
      const existingUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        Alert.alert('Hata', 'Bu email adresi zaten kayıtlı.');
        setIsLoading(false);
        return;
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: 'candidate', // Always register as candidate
        kvkkAccepted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save user
      users.push(newUser);
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

      // Save password separately (in real app, use proper hashing)
      const passwordsJson = await AsyncStorage.getItem('@inno_passwords');
      const passwords: Record<string, string> = passwordsJson ? JSON.parse(passwordsJson) : {};
      passwords[newUser.id] = password;
      await AsyncStorage.setItem('@inno_passwords', JSON.stringify(passwords));

      // Login the user
      login(newUser);
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu!');
    } catch (error) {
      Alert.alert('Hata', 'Kayıt olurken bir hata oluştu.');
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
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Adınız Soyadınız"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre Tekrar</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Button
            label={isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            onPress={handleRegister}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginText}>
              Zaten hesabınız var mı? <Text style={styles.loginTextBold}>Giriş Yapın</Text>
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
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  loginText: {
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,
  loginTextBold: {
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
