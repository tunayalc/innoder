import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, InputField, ScreenScrollView } from '../../components';
import { useAuth } from '../../hooks';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAppSelector } from '../../store/hooks';
import {
  selectApplicationLoading,
  selectUserLoading,
} from '../../store/selectors';
import { apiClient, requireData } from '../../services/api/apiClient';
import { appConfig } from '../../config/appConfig';
import { useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidTCKN,
} from '../../utils/validation';

export const AdayKisiselScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user, update } = useAuth();
  const isUserLoading = useAppSelector(selectUserLoading);
  const isApplicationLoading = useAppSelector(selectApplicationLoading);
  const saveError = useAppSelector(state => state.user.error);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Türkiye');
  const [city, setCity] = useState(user?.city || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [nationality, setNationality] = useState(
    user?.nationality || 'Türkiye Cumhuriyeti',
  );
  const [identityType, setIdentityType] = useState(
    user?.identityType || 'turkish_id',
  );
  const [identityNumber, setIdentityNumber] = useState(
    user?.identityNumber || '',
  );
  const [passportNumber, setPassportNumber] = useState(
    user?.passportNumber || '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState('');
  const draft = JSON.stringify({
    fullName,
    email,
    phone,
    country,
    city,
    birthDate,
    nationality,
    identityType,
    identityNumber,
    passportNumber,
    currentPassword,
  });
  const [savedDraft, setSavedDraft] = useState(draft);
  useUnsavedChanges(draft !== savedDraft);

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
    } else if (
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
      Number.isNaN(Date.parse(birthDate)) ||
      new Date(birthDate).toISOString().slice(0, 10) !== birthDate ||
      birthDate > new Date().toISOString().slice(0, 10)
    ) {
      nextErrors.birthDate = 'Geçerli bir tarih girin: YYYY-MM-DD';
    }
    if (identityType === 'turkish_id') {
      if (!identityNumber.trim()) {
        nextErrors.identityNumber = 'Kimlik numarası zorunludur';
      } else if (!isValidTCKN(identityNumber)) {
        nextErrors.identityNumber = 'Geçerli bir TC Kimlik No giriniz';
      }
    } else if (!passportNumber.trim()) {
      nextErrors.passportNumber = 'Pasaport numarası zorunludur';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validate()) return;
    if (
      email.trim().toLowerCase() !== user.email.toLowerCase() &&
      appConfig.dataSource === 'remote'
    ) {
      if (!currentPassword) {
        setErrors({
          ...errors,
          currentPassword: 'E-posta değişikliği için mevcut şifrenizi girin.',
        });
        return;
      }
      try {
        const result = requireData(
          await apiClient.post<{ message: string }>(
            '/auth/request-email-change',
            { email: email.trim(), currentPassword },
          ),
        );
        Alert.alert('E-posta Doğrulaması', result.message);
        setEmail(user.email);
        setCurrentPassword('');
      } catch (error) {
        Alert.alert(
          'E-posta Değiştirilemedi',
          error instanceof Error ? error.message : 'Tekrar deneyin.',
        );
        return;
      }
    }

    const saved = await update({
      name: fullName,
      ...(appConfig.dataSource === 'mock' ? { email } : {}),
      phone,
      country,
      city,
      birthDate,
      nationality,
      identityType,
      identityNumber,
      passportNumber,
    });

    if (!saved) return;
    setSavedDraft(
      JSON.stringify({
        fullName,
        email: appConfig.dataSource === 'remote' ? user.email : email,
        phone,
        country,
        city,
        birthDate,
        nationality,
        identityType,
        identityNumber,
        passportNumber,
        currentPassword: '',
      }),
    );
    setCurrentPassword('');

    Alert.alert(
      'Bilgiler Güncellendi',
      'Kişisel bilgileriniz profil ve program kayıtlarına yansıtıldı.',
      [{ text: 'Tamam', onPress: () => navigation.goBack() }],
    );
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
      <ScreenScrollView contentContainerStyle={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Kişisel Bilgiler</Text>
            <Text style={styles.subtitle}>
              Buradaki bilgiler kullanıcı profiline aittir ve tüm program
              kayıtlarında ortak kullanılır.
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
        {email.trim().toLowerCase() !== user.email.toLowerCase() &&
        appConfig.dataSource === 'remote' ? (
          <InputField
            label="E-posta değişikliği için mevcut şifre"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoComplete="current-password"
            error={errors.currentPassword}
          />
        ) : null}
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
          label="Uyruk *"
          value={nationality}
          onChangeText={setNationality}
          placeholder="Türkiye Cumhuriyeti"
        />
        <Text style={styles.inputLabel}>Kimlik Belgesi Türü *</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segment,
              identityType === 'turkish_id' && styles.segmentActive,
            ]}
            onPress={() => setIdentityType('turkish_id')}
          >
            <Text
              style={[
                styles.segmentText,
                identityType === 'turkish_id' && styles.segmentTextActive,
              ]}
            >
              T.C. Kimlik
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segment,
              identityType === 'passport' && styles.segmentActive,
            ]}
            onPress={() => setIdentityType('passport')}
          >
            <Text
              style={[
                styles.segmentText,
                identityType === 'passport' && styles.segmentTextActive,
              ]}
            >
              Pasaport
            </Text>
          </TouchableOpacity>
        </View>
        {identityType === 'turkish_id' ? (
          <InputField
            label="T.C. Kimlik Numarası *"
            value={identityNumber}
            onChangeText={setIdentityNumber}
            placeholder="xxxxxxxxxxx"
            error={errors.identityNumber}
            keyboardType="number-pad"
            maxLength={11}
            secureTextEntry
          />
        ) : (
          <InputField
            label="Pasaport Numarası *"
            value={passportNumber}
            onChangeText={setPassportNumber}
            placeholder="U12345678"
            error={errors.passportNumber}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        )}
        <Button
          label={
            isUserLoading || isApplicationLoading
              ? 'Kaydediliyor...'
              : 'Bilgileri Güncelle'
          }
          loading={isUserLoading || isApplicationLoading}
          onPress={handleSave}
        />
        {saveError ? (
          <Text
            accessibilityRole="alert"
            style={{ color: styles.sectionLabel.color }}
          >
            {saveError}
          </Text>
        ) : null}
      </ScreenScrollView>
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
      paddingVertical: 18,
      flexDirection: 'row',
      gap: 14,
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
      letterSpacing: 0,
      marginTop: 4,
    } as TextStyle,
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    } as TextStyle,
    segmentedControl: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 8,
      overflow: 'hidden',
    } as ViewStyle,
    segment: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    segmentActive: {
      backgroundColor: colors.primary,
    } as ViewStyle,
    segmentText: {
      color: colors.textSecondary,
      fontWeight: '600',
    } as TextStyle,
    segmentTextActive: {
      color: colors.white,
    } as TextStyle,
    emptyCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 8,
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
