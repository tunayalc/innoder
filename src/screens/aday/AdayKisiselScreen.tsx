import React, { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Button, InputField, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { RootStackNavigationProp } from '../../types';
import { PROGRAM_CATALOG } from '../../services/programCatalog';
import { isValidTCKN } from '../../utils/validation';
import {
  submitApplication,
  updatePersonalInfoDraft,
} from '../../store/thunks/applicationThunks';
import { isEuropassCvComplete, isMotivationLetterComplete } from '../../utils/europass';

export const AdayKisiselScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);

  const myApplication = useMemo(
    () => applications.find((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const [programSelection, setProgramSelection] = useState(
    myApplication?.programId ||
      myApplication?.personalInfo.programSelection ||
      PROGRAM_CATALOG[0].id,
  );
  const [birthDate, setBirthDate] = useState(myApplication?.personalInfo.birthDate || '');
  const [identityNumber, setIdentityNumber] = useState(
    myApplication?.personalInfo.identityNumber || '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cvReady = isEuropassCvComplete(myApplication?.personalInfo.europassCv);
  const motivationReady = isMotivationLetterComplete(
    myApplication?.personalInfo.motivationLetter,
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!birthDate.trim()) {
      newErrors.birthDate = 'Doğum tarihi zorunludur';
    }
    if (!identityNumber.trim()) {
      newErrors.identityNumber = 'Kimlik numarası zorunludur';
    } else if (!isValidTCKN(identityNumber)) {
      newErrors.identityNumber = 'Geçerli bir TC Kimlik No giriniz';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [birthDate, identityNumber]);

  const handleSaveDraft = useCallback(async () => {
    if (!myApplication || !user) return;
    await dispatch(
      updatePersonalInfoDraft({
        applicationId: myApplication.id,
        patch: { programSelection, birthDate, identityNumber },
        programId: programSelection,
      }),
    );
    Alert.alert('Taslak Kaydedildi', 'Bilgileriniz taslak olarak saklandı.');
  }, [myApplication, user, dispatch, programSelection, birthDate, identityNumber]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (!myApplication || !user) return;

    if (!cvReady || !motivationReady) {
      Alert.alert(
        'Eksik Başvuru İçeriği',
        'Başvuru göndermeden önce Europass CV ve motivasyon mektubu bölümlerini tamamlamalısınız.',
        [
          {
            text: 'CV Ekranına Git',
            onPress: () => {
              if (!cvReady) {
                navigation.navigate('AdayCvBuilder');
                return;
              }
              navigation.navigate('AdayMotivation');
            },
          },
          { text: 'Tamam', style: 'cancel' },
        ],
      );
      return;
    }

    await dispatch(
      updatePersonalInfoDraft({
        applicationId: myApplication.id,
        patch: {
          fullName: user.name,
          programSelection,
          birthDate,
          identityNumber,
        },
        programId: programSelection,
      }),
    );

    await dispatch(submitApplication({ applicationId: myApplication.id }));

    Alert.alert(
      'Başvuru Gönderildi',
      'Başvurunuz başarıyla gönderildi. Admin incelemesini bekleyin.',
      [{ text: 'Tamam', onPress: () => navigation.goBack() }],
    );
  }, [
    validate,
    myApplication,
    user,
    dispatch,
    programSelection,
    birthDate,
    identityNumber,
    cvReady,
    motivationReady,
    navigation,
  ]);

  if (!myApplication) {
    return (
      <View style={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Kişisel Bilgi</Text>
            <Text style={styles.subtitle}>Önce Kayıt Formu ekranından bilgilerinizi kaydedin.</Text>
          </View>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Önce Kayıt Formu ekranından bilgilerinizi kaydedin.
          </Text>
          <Button label="Kayıt Formuna Git" onPress={() => navigation.navigate('AdayKayit')} />
        </View>
      </View>
    );
  }

  const isSubmitted =
    myApplication.status !== 'draft' && myApplication.status !== 'needs_fix';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <Text style={styles.h2}>Kişisel Bilgi</Text>
              <Pill
                label={APPLICATION_STATUS_LABELS[myApplication.status] || myApplication.status}
                variant={
                  myApplication.status === 'approved'
                    ? 'ok'
                    : myApplication.status === 'needs_fix'
                      ? 'warn'
                      : myApplication.status === 'rejected'
                        ? 'err'
                        : 'info'
                }
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PROGRAM SEÇİMİ</Text>
        <View style={styles.programChips}>
          {PROGRAM_CATALOG.map((prog) => (
            <Button
              key={prog.id}
              label={prog.name}
              variant={programSelection === prog.id ? 'solid' : 'ghost'}
              onPress={() => setProgramSelection(prog.id)}
              style={styles.chip}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>KİMLİK BİLGİLERİ</Text>
        <InputField
          label="Doğum Tarihi *"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          error={errors.birthDate}
          editable={!isSubmitted}
        />

        <InputField
          label="TC Kimlik Numarası *"
          value={identityNumber}
          onChangeText={setIdentityNumber}
          placeholder="xxxxxxxxxxx"
          error={errors.identityNumber}
          keyboardType="number-pad"
          maxLength={11}
          editable={!isSubmitted}
          secureTextEntry
        />

        <Text style={styles.sectionLabel}>PROGRAM BAŞVURU DOSYASI</Text>
        <View style={styles.requirementCard}>
          <View style={styles.requirementRow}>
            <Text style={styles.requirementLabel}>Europass CV</Text>
            <Pill label={cvReady ? 'Tamam' : 'Eksik'} variant={cvReady ? 'ok' : 'warn'} />
          </View>
          <Button label="CV'yi Düzenle" variant="ghost" onPress={() => navigation.navigate('AdayCvBuilder')} />

          <View style={styles.requirementRow}>
            <Text style={styles.requirementLabel}>Motivasyon Mektubu</Text>
            <Pill label={motivationReady ? 'Tamam' : 'Eksik'} variant={motivationReady ? 'ok' : 'warn'} />
          </View>
          <Button
            label="Mektubu Düzenle"
            variant="ghost"
            onPress={() => navigation.navigate('AdayMotivation')}
          />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {isSubmitted
              ? 'Başvurunuz gönderildi. Belge ve doğrulama durumlarını Eğitim Bilgilendirme ekranından takip edin.'
              : 'Başvuru gönderimi için Europass CV ve motivasyon mektubu zorunludur.'}
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isSubmitted && (
          <View style={styles.buttonGroup}>
            <Button
              label={isLoading ? 'Kaydediliyor...' : 'Taslak Kaydet'}
              variant="ghost"
              onPress={handleSaveDraft}
            />
            <Button
              label={isLoading ? 'Gönderiliyor...' : 'Başvuru Gönder'}
              onPress={handleSubmit}
            />
          </View>
        )}

        {myApplication.status === 'needs_fix' && (
          <View style={styles.buttonGroup}>
            <Button
              label={isLoading ? 'Gönderiliyor...' : 'Düzelterek Yeniden Gönder'}
              onPress={handleSubmit}
            />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  programChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  } as ViewStyle,
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  } as ViewStyle,
  requirementCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    gap: 10,
  } as ViewStyle,
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  requirementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  buttonGroup: {
    gap: 12,
    marginTop: 4,
  } as ViewStyle,
  notice: {
    backgroundColor: colors.noticeBg,
    padding: 14,
    borderRadius: 12,
  } as ViewStyle,
  noticeText: {
    color: colors.noticeText,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  emptyCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 12,
    padding: 24,
    gap: 18,
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  emptyText: {
    fontSize: 15,
    color: colors.noticeText,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  } as TextStyle,
});
