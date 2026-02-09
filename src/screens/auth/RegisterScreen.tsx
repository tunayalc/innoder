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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, InputField, Card } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validation';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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
        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>
            Başvurunuzu takip edebilmek için bir hesap oluşturun
          </Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Ad Soyad *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Adınız Soyadınız"
            autoCapitalize="words"
          />

          <View style={{ height: 20 }} />

          <InputField
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ height: 20 }} />

          <InputField
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            placeholder="+90 5xx xxx xx xx"
            keyboardType="phone-pad"
          />

          <View style={{ height: 20 }} />

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
        </View>

        <View style={[styles.form, { marginTop: 20 }]}>
          <InputField
            label="Şifre *"
            value={password}
            onChangeText={setPassword}
            placeholder="En az 6 karakter"
            secureTextEntry
          />

          <View style={{ height: 20 }} />

          <InputField
            label="Şifre Tekrar *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Şifrenizi tekrar girin"
            secureTextEntry
          />
        </View>

        <View style={styles.kvkkWrap}>
          <View style={styles.kvkkRow}>
            <View style={styles.kvkkTextWrap}>
              <Text style={styles.kvkkTitle}>KVKK Aydınlatma & Açık Rıza</Text>
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
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={{ paddingHorizontal: 4, marginTop: 16 }}>
          <Button
            label={isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            onPress={handleRegister}
          />
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.loginText}>
            Zaten hesabınız var mı?{' '}
            <Text style={styles.loginTextBold}>Giriş Yapın</Text>
          </Text>
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
    paddingHorizontal: 24,
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
  row2: {
    flexDirection: 'row',
    gap: 10,
  } as ViewStyle,
  flex1: {
    flex: 1,
  } as ViewStyle,
  kvkkWrap: {
    marginTop: 20,
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  kvkkHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  } as TextStyle,
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 12,
    paddingHorizontal: 4,
  } as TextStyle,
  loginLink: {
    alignSelf: 'center',
    marginTop: 28,
    marginBottom: 16,
  } as ViewStyle,
  loginText: {
    fontSize: 15,
    color: colors.textSecondary,
  } as TextStyle,
  loginTextBold: {
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
});
