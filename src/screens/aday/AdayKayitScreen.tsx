import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, InputField } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationLoading, selectApplications, selectUserLoading } from '../../store/selectors';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validation';
import { RootStackNavigationProp } from '../../types';
import { ensureDraftApplication } from '../../store/thunks/applicationThunks';

export const AdayKayitScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user, update } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isUserLoading = useAppSelector(selectUserLoading);
  const isApplicationLoading = useAppSelector(selectApplicationLoading);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Türkiye');
  const [city, setCity] = useState(user?.city || '');
  const [kvkkAccepted, setKvkkAccepted] = useState(user?.kvkkAccepted || false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const hasExistingApplication = applications.some(
    (app) => app.userId === user?.id,
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Ad soyad zorunludur';
    }
    if (!email.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Geçerli bir e-posta giriniz';
    }
    if (phone.trim() && !isValidPhoneNumber(phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz (5xx xxx xx xx)';
    }
    if (!kvkkAccepted) {
      newErrors.kvkk = 'KVKK onayı zorunludur';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, email, phone, kvkkAccepted]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    if (!user) return;

    // Update user info
    update({ name: fullName, email, phone, country, city, kvkkAccepted });

    // Ensure the draft application exists (server/DB would create it after personal info step;
    // for the prototype we create a draft so checklist + docs are visible).
    dispatch(ensureDraftApplication({ programId: 'prog-a' }));

    setSubmitted(true);
    Alert.alert(
      'Başarılı',
      hasExistingApplication
        ? 'Bilgileriniz güncellendi.'
        : 'Hesap bilgileriniz kaydedildi ve taslak başvurunuz oluşturuldu.',
      [
        {
          text: 'Tamam',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [
    validate,
    user,
    fullName,
    email,
    phone,
    country,
    city,
    kvkkAccepted,
    hasExistingApplication,
    dispatch,
    update,
    navigation,
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
            <Text style={styles.h2}>Kayıt Formu</Text>
            <Text style={styles.subtitle}>
              Hesap bilgilerinizi doldurun. Verileriniz güvenli biçimde kaydedilir.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>HESAP BİLGİLERİ</Text>
        <InputField
          label="Ad Soyad *"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Adınız ve soyadınız"
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

        <Text style={styles.sectionLabel}>GİZLİLİK</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.bodyText}>KVKK Aydınlatma & Açık Rıza Onayı *</Text>
            <Text style={styles.kvkkHint}>
              Kişisel verilerinizin işlenmesini kabul ediyorum.
            </Text>
          </View>
          <Switch
            value={kvkkAccepted}
            onValueChange={setKvkkAccepted}
            trackColor={{ false: colors.muted, true: colors.teal }}
            thumbColor={colors.white}
          />
        </View>
        {errors.kvkk ? (
          <Text style={styles.errorText}>{errors.kvkk}</Text>
        ) : null}

        <Button
          label={hasExistingApplication ? 'Bilgileri Güncelle' : 'Hesap Oluştur'}
          onPress={handleSubmit}
          // Prevent repeated taps while backend operations are in-flight.
          style={isUserLoading || isApplicationLoading ? { opacity: 0.7 } : undefined}
        />

        {submitted && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Bilgileriniz başarıyla kaydedildi.
            </Text>
          </View>
        )}
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
  notice: {
    backgroundColor: '#E7F5F3',
    padding: 14,
    borderRadius: 12,
  } as ViewStyle,
  noticeText: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
});
