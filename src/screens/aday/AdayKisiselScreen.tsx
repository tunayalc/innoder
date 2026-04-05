import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, InputField } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationLoading,
  selectApplications,
  selectUserLoading,
} from '../../store/selectors';
import { updatePersonalInfoDraft } from '../../store/thunks/applicationThunks';
import { useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';
import { isValidEmail, isValidPhoneNumber, isValidTCKN } from '../../utils/validation';

export const AdayKisiselScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const dispatch = useAppDispatch();
  const { user, update } = useAuth();
  const applications = useAppSelector(selectApplications);
  const isUserLoading = useAppSelector(selectUserLoading);
  const isApplicationLoading = useAppSelector(selectApplicationLoading);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Türkiye');
  const [city, setCity] = useState(user?.city || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [identityNumber, setIdentityNumber] = useState(user?.identityNumber || '');
  const [passportNumber, setPassportNumber] = useState(user?.passportNumber || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userApplications = applications.filter((application) => application.userId === user?.id);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      nextErrors.fullName = 'Ad soyad zorunludur';
    }
    if (!email.trim()) {
      nextErrors.email = 'E-posta zorunludur';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Geçerli bir e-posta giriniz';
    }
    if (phone.trim() && !isValidPhoneNumber(phone)) {
      nextErrors.phone = 'Geçerli bir telefon numarası giriniz';
    }
    if (!birthDate.trim()) {
      nextErrors.birthDate = 'Doğum tarihi zorunludur';
    }
    if (!identityNumber.trim()) {
      nextErrors.identityNumber = 'Kimlik numarası zorunludur';
    } else if (!isValidTCKN(identityNumber)) {
      nextErrors.identityNumber = 'Geçerli bir TC Kimlik No giriniz';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validate()) return;

    update({
      name: fullName,
      email,
      phone,
      country,
      city,
      birthDate,
      identityNumber,
      passportNumber,
    });

    await Promise.all(
      userApplications.map((application) =>
        dispatch(
          updatePersonalInfoDraft({
            applicationId: application.id,
            patch: {
              fullName,
              birthDate,
              identityNumber,
              passportNumber,
            },
            programId: application.programId,
          }),
        ) as unknown as Promise<unknown>,
      ),
    );

    Alert.alert('Bilgiler Güncellendi', 'Kişisel bilgileriniz profil ve program kayıtlarına yansıtıldı.', [
      { text: 'Tamam', onPress: () => navigation.goBack() },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.section}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Kişisel Bilgiler</Text>
            <Text style={styles.subtitle}>
              Buradaki bilgiler kullanıcı profiline aittir ve tüm program kayıtlarında ortak kullanılır.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>HESAP BİLGİLERİ</Text>
        <InputField
          label="Ad Soyad *"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Adınız Soyadınız"
          error={errors.fullName}
          autoCapitalize="words"
        />
        <InputField
          label="E-posta *"
          value={email}
          onChangeText={setEmail}
          placeholder="ornek@mail.com"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.sectionLabel}>İLETİŞİM</Text>
        <InputField
          label="Telefon"
          value={phone}
          onChangeText={setPhone}
          placeholder="+90 5xx xxx xx xx"
          error={errors.phone}
          keyboardType="phone-pad"
        />
        <InputField
          label="Ülke"
          value={country}
          onChangeText={setCountry}
          placeholder="Türkiye"
        />
        <InputField
          label="Şehir"
          value={city}
          onChangeText={setCity}
          placeholder="İstanbul"
        />

        <Text style={styles.sectionLabel}>KİMLİK BİLGİLERİ</Text>
        <InputField
          label="Doğum Tarihi *"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          error={errors.birthDate}
        />
        <InputField
          label="TC Kimlik Numarası *"
          value={identityNumber}
          onChangeText={setIdentityNumber}
          placeholder="xxxxxxxxxxx"
          error={errors.identityNumber}
          keyboardType="number-pad"
          maxLength={11}
          secureTextEntry
        />
        <InputField
          label="Pasaport Numarası"
          value={passportNumber}
          onChangeText={setPassportNumber}
          placeholder="U12345678"
          error={errors.passportNumber}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Button
          label={isUserLoading || isApplicationLoading ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}
          onPress={isUserLoading || isApplicationLoading ? undefined : handleSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
      lineHeight: 20,
    } as TextStyle,
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginTop: 4,
    } as TextStyle,
    emptyCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
    } as ViewStyle,
    emptyText: {
      fontSize: 15,
      color: colors.noticeText,
      textAlign: 'center',
      lineHeight: 22,
    } as TextStyle,
  });
