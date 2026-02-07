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
import { selectApplications } from '../../store/selectors';
import {
  updateApplication,
  updatePersonalInfo,
} from '../../store/slices/applicationSlice';
import { addLog } from '../../store/slices/auditSlice';
import { createAuditEntry } from '../../services/seedData';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { RootStackNavigationProp } from '../../types';

const PROGRAMS = ['Program A', 'Program B', 'Program C'];

export const AdayKisiselScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);

  const myApplication = useMemo(
    () => applications.find((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const [programSelection, setProgramSelection] = useState(
    myApplication?.personalInfo.programSelection || PROGRAMS[0],
  );
  const [birthDate, setBirthDate] = useState(
    myApplication?.personalInfo.birthDate || '',
  );
  const [identityNumber, setIdentityNumber] = useState(
    myApplication?.personalInfo.identityNumber || '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!birthDate.trim()) {
      newErrors.birthDate = 'Doğum tarihi zorunludur';
    }
    if (!identityNumber.trim()) {
      newErrors.identityNumber = 'Kimlik numarası zorunludur';
    } else if (identityNumber.length !== 11) {
      newErrors.identityNumber = 'TC Kimlik No 11 haneli olmalıdır';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [birthDate, identityNumber]);

  const handleSaveDraft = useCallback(() => {
    if (!myApplication || !user) return;
    dispatch(
      updatePersonalInfo({
        applicationId: myApplication.id,
        info: { programSelection, birthDate, identityNumber },
      }),
    );
    Alert.alert('Taslak Kaydedildi', 'Bilgileriniz taslak olarak saklandı.');
  }, [myApplication, user, dispatch, programSelection, birthDate, identityNumber]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    if (!myApplication || !user) return;

    dispatch(
      updatePersonalInfo({
        applicationId: myApplication.id,
        info: {
          fullName: user.name,
          programSelection,
          birthDate,
          identityNumber,
        },
      }),
    );

    // Change application status to submitted
    dispatch(
      updateApplication({
        ...myApplication,
        status: 'submitted',
        personalInfo: {
          ...myApplication.personalInfo,
          programSelection,
          birthDate,
          identityNumber,
        },
        updatedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      }),
    );

    dispatch(
      addLog(
        createAuditEntry(
          'APPLICATION_SUBMITTED',
          user.id,
          myApplication.id,
          `${user.name} başvurusunu gönderdi (${programSelection})`,
        ),
      ),
    );

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
    navigation,
  ]);

  if (!myApplication) {
    return (
      <View style={styles.section}>
        <Text style={styles.h2}>Kişisel Bilgi</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Önce Kayıt Formu ekranından bilgilerinizi kaydedin.
          </Text>
          <Button
            label="Kayıt Formuna Git"
            onPress={() => navigation.navigate('AdayKayit')}
          />
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

        <View style={styles.programRow}>
          <Text style={styles.label}>Program Seçimi</Text>
          <View style={styles.programChips}>
            {PROGRAMS.map((prog) => (
              <Button
                key={prog}
                label={prog}
                variant={programSelection === prog ? 'solid' : 'ghost'}
                onPress={() => setProgramSelection(prog)}
                style={styles.chip}
              />
            ))}
          </View>
        </View>

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

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {isSubmitted
              ? 'Başvurunuz gönderildi. Belge durumlarınızı Eğitim Bilgilendirme ekranından takip edebilirsiniz.'
              : 'Form taslak olarak saklanır. "Başvuru Gönder" butonuna basana kadar değişiklik yapabilirsiniz.'}
          </Text>
        </View>

        {!isSubmitted && (
          <>
            <Button
              label="Taslak Kaydet"
              variant="ghost"
              onPress={handleSaveDraft}
            />
            <Button label="Başvuru Gönder" onPress={handleSubmit} />
          </>
        )}

        {myApplication.status === 'needs_fix' && (
          <Button label="Düzelterek Yeniden Gönder" onPress={handleSubmit} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  } as TextStyle,
  programRow: {
    gap: 8,
  } as ViewStyle,
  programChips: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  } as ViewStyle,
  notice: {
    backgroundColor: colors.noticeBg,
    padding: 12,
    borderRadius: 12,
  } as ViewStyle,
  noticeText: {
    color: colors.noticeText,
    fontSize: 12,
    lineHeight: 18,
  } as TextStyle,
  emptyCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  emptyText: {
    fontSize: 13,
    color: colors.noticeText,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});
