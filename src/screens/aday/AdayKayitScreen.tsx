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
import { selectApplications } from '../../store/selectors';
import { addApplication } from '../../store/slices/applicationSlice';
import { addLog } from '../../store/slices/auditSlice';
import { createNewApplication, createAuditEntry } from '../../services/seedData';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validation';
import { RootStackNavigationProp } from '../../types';

export const AdayKayitScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user, update } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
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
    update({ name: fullName, phone, kvkkAccepted });

    if (!hasExistingApplication) {
      // Create a draft application
      const app = createNewApplication(user.id, 'Program A', {
        fullName,
        programSelection: 'Program A',
      });
      dispatch(addApplication(app));

      // Audit log
      dispatch(
        addLog(
          createAuditEntry(
            'USER_REGISTERED',
            user.id,
            user.id,
            `${fullName} kayıt bilgilerini güncelledi`,
          ),
        ),
      );
    }

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
    phone,
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
        <Text style={styles.h2}>Kayıt Formu</Text>
        <Text style={styles.subtitle}>
          Hesap bilgilerinizi doldurun. Verileriniz güvenli biçimde kaydedilir.
        </Text>

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

        <InputField
          label="Telefon"
          value={phone}
          onChangeText={setPhone}
          placeholder="+90 5xx xxx xx xx"
          error={errors.phone}
          keyboardType="phone-pad"
        />

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
    gap: 12,
    padding: 20,
    paddingBottom: 40,
  } as ViewStyle,
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  } as TextStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  kvkkHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  } as TextStyle,
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.switchRowBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 12,
  } as ViewStyle,
  switchLabel: {
    flex: 1,
  } as ViewStyle,
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginLeft: 4,
    marginTop: -4,
  } as TextStyle,
  notice: {
    backgroundColor: '#E7F5F3',
    padding: 12,
    borderRadius: 12,
  } as ViewStyle,
  noticeText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,
});
