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
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, InputField, Card } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validation';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { registerCandidate } = useAuth();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Türkiye');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta giriniz.');
      return;
    }

    if (phone.trim() && !isValidPhoneNumber(phone)) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası giriniz.');
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

    if (!kvkkAccepted) {
      Alert.alert('Hata', 'KVKK onayı zorunludur.');
      return;
    }

    registerCandidate({
      fullName,
      email,
      phone: phone.trim() || undefined,
      country: country.trim() || undefined,
      city: city.trim() || undefined,
      password,
      kvkkAccepted,
    });
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
          <InputField
            label="Ad Soyad *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Adınız Soyadınız"
            autoCapitalize="words"
          />

          <InputField
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <InputField
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            placeholder="+90 5xx xxx xx xx"
            keyboardType="phone-pad"
          />

          <View style={styles.row2}>
            <View style={styles.flex1}>
              <InputField
                label="Ülke"
                value={country}
                onChangeText={setCountry}
                placeholder="Türkiye"
              />
            </View>
            <View style={styles.flex1}>
              <InputField
                label="Şehir"
                value={city}
                onChangeText={setCity}
                placeholder="İstanbul"
              />
            </View>
          </View>

          <InputField
            label="Şifre *"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <InputField
            label="Şifre Tekrar *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Card style={styles.kvkkCard}>
            <View style={styles.kvkkRow}>
              <View style={styles.kvkkTextWrap}>
                <Text style={styles.kvkkTitle}>KVKK Aydınlatma & Açık Rıza *</Text>
                <Text style={styles.kvkkHint}>
                  Kişisel verilerimin amaçla sınırlı şekilde işlenmesini kabul ediyorum.
                </Text>
              </View>
              <Switch
                value={kvkkAccepted}
                onValueChange={setKvkkAccepted}
                trackColor={{ false: colors.muted, true: colors.teal }}
                thumbColor={colors.white}
              />
            </View>
          </Card>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
  row2: {
    flexDirection: 'row',
    gap: 10,
  } as ViewStyle,
  flex1: {
    flex: 1,
  } as ViewStyle,
  kvkkCard: {
    padding: 14,
  } as ViewStyle,
  kvkkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  } as ViewStyle,
  kvkkTextWrap: {
    flex: 1,
  } as ViewStyle,
  kvkkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  kvkkHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  } as TextStyle,
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
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
