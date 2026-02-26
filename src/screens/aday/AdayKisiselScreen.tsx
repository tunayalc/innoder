import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { colors } from '../../theme';
import { Button, InputField } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { isValidEmail, isValidPhoneNumber, isValidTCKN } from '../../utils/validation';

export const AdayKisiselScreen: React.FC = () => {
  const { user, update } = useAuth();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Turkiye');
  const [city, setCity] = useState(user?.city || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [identityNumber, setIdentityNumber] = useState(user?.identityNumber || '');
  const [passportNumber, setPassportNumber] = useState(user?.passportNumber || '');
  const [kvkkAccepted, setKvkkAccepted] = useState(Boolean(user?.kvkkAccepted));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Ad soyad zorunludur';
    }
    if (!email.trim()) {
      nextErrors.email = 'E-posta zorunludur';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Gecerli bir e-posta giriniz';
    }
    if (phone.trim() && !isValidPhoneNumber(phone)) {
      nextErrors.phone = 'Gecerli bir telefon numarasi giriniz';
    }
    if (!birthDate.trim()) {
      nextErrors.birthDate = 'Dogum tarihi zorunludur';
    }
    if (!identityNumber.trim()) {
      nextErrors.identityNumber = 'TC kimlik numarasi zorunludur';
    } else if (!isValidTCKN(identityNumber)) {
      nextErrors.identityNumber = 'Gecerli bir TC kimlik numarasi giriniz';
    }
    if (!passportNumber.trim()) {
      nextErrors.passportNumber = 'Pasaport numarasi zorunludur';
    }
    if (!kvkkAccepted) {
      nextErrors.kvkkAccepted = 'KVKK onayi zorunludur';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    fullName,
    email,
    phone,
    birthDate,
    identityNumber,
    passportNumber,
    kvkkAccepted,
  ]);

  const onSave = useCallback(() => {
    if (!validate()) return;

    update({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      country: country.trim() || undefined,
      city: city.trim() || undefined,
      birthDate: birthDate.trim(),
      identityNumber: identityNumber.trim(),
      passportNumber: passportNumber.trim(),
      kvkkAccepted,
    });

    Alert.alert('Kaydedildi', 'Kisisel bilgileriniz guncellendi.');
  }, [
    validate,
    update,
    fullName,
    email,
    phone,
    country,
    city,
    birthDate,
    identityNumber,
    passportNumber,
    kvkkAccepted,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Kisisel Bilgiler</Text>
            <Text style={styles.subtitle}>
              Kayit sonrasi profilinizi buradan tamamlayin.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>HESAP BILGILERI</Text>
        <InputField
          label="Ad Soyad *"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Adiniz Soyadiniz"
          error={errors.fullName}
          autoCapitalize="words"
        />

        <InputField
          label="E-posta *"
          value={email}
          onChangeText={setEmail}
          placeholder="ornek@email.com"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.sectionLabel}>KIMLIK VE SEYAHAT</Text>
        <InputField
          label="TC Kimlik Numarasi *"
          value={identityNumber}
          onChangeText={setIdentityNumber}
          placeholder="xxxxxxxxxxx"
          error={errors.identityNumber}
          keyboardType="number-pad"
          maxLength={11}
          secureTextEntry
        />

        <InputField
          label="Pasaport Numarasi *"
          value={passportNumber}
          onChangeText={setPassportNumber}
          placeholder="Pasaport numaraniz"
          error={errors.passportNumber}
          autoCapitalize="characters"
        />

        <InputField
          label="Dogum Tarihi *"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          error={errors.birthDate}
        />

        <Text style={styles.sectionLabel}>ILETISIM</Text>
        <InputField
          label="Telefon"
          value={phone}
          onChangeText={setPhone}
          placeholder="+90 5xx xxx xx xx"
          error={errors.phone}
          keyboardType="phone-pad"
        />

        <InputField
          label="Ulke"
          value={country}
          onChangeText={setCountry}
          placeholder="Turkiye"
        />

        <InputField
          label="Sehir"
          value={city}
          onChangeText={setCity}
          placeholder="Istanbul"
        />

        <Text style={styles.sectionLabel}>GIZLILIK</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.bodyText}>KVKK Acik Riza Onayi *</Text>
            <Text style={styles.kvkkHint}>
              Kisisel verilerimin basvuru sureci icin islenmesini kabul ediyorum.
            </Text>
          </View>
          <Switch
            value={kvkkAccepted}
            onValueChange={setKvkkAccepted}
            trackColor={{ false: colors.muted, true: colors.teal }}
            thumbColor={colors.white}
          />
        </View>
        {errors.kvkkAccepted ? <Text style={styles.errorText}>{errors.kvkkAccepted}</Text> : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
          onPress={onSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  } as ViewStyle,
  section: {
    paddingTop: 16,
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  } as ViewStyle,
  headerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  accentBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.teal,
  } as ViewStyle,
  headerContent: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
  } as TextStyle,
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 4,
  } as TextStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  } as TextStyle,
  kvkkHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  } as TextStyle,
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.switchRowBg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 14,
  } as ViewStyle,
  switchLabel: {
    flex: 1,
  } as ViewStyle,
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginLeft: 4,
    marginTop: -4,
  } as TextStyle,
});
