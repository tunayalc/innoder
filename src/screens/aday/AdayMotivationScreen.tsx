import React, { useMemo, useState } from 'react';
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
import { Button, Card, InputField, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import { RootStackNavigationProp, MotivationLetterDraft } from '../../types';
import { updatePersonalInfoDraft } from '../../store/thunks/applicationThunks';
import {
  createEmptyMotivationLetter,
  isMotivationLetterComplete,
  wordCount,
} from '../../utils/europass';

export const AdayMotivationScreen: React.FC = () => {
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

  const [letter, setLetter] = useState<MotivationLetterDraft>(
    myApplication?.personalInfo.motivationLetter ?? createEmptyMotivationLetter(),
  );

  const completion = useMemo(() => isMotivationLetterComplete(letter), [letter]);

  const updateField = (key: keyof MotivationLetterDraft, value: string) => {
    setLetter((prev) => ({ ...prev, [key]: value }));
  };

  const saveLetter = async () => {
    if (!myApplication) return;
    await dispatch(
      updatePersonalInfoDraft({
        applicationId: myApplication.id,
        programId: myApplication.programId,
        patch: {
          motivationLetter: letter,
        },
      }),
    );
    Alert.alert('Mektup Kaydedildi', 'Motivasyon mektubu taslağı kaydedildi.');
  };

  if (!myApplication) {
    return (
      <View style={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Motivasyon Mektubu Oluşturucu</Text>
            <Text style={styles.subtitle}>Önce başvuru taslağı oluşturmanız gerekiyor.</Text>
          </View>
        </View>
        <Card>
          <Text style={styles.emptyText}>
            Bu adıma geçmeden önce Kayıt Formu ekranından taslak başvuru oluşturun.
          </Text>
          <Button label="Kayıt Formuna Git" onPress={() => navigation.navigate('AdayKayit')} />
        </Card>
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
            <View style={styles.titleRow}>
              <Text style={styles.h2}>Motivasyon Mektubu Oluşturucu</Text>
              <Pill label={completion ? 'Hazır' : 'Eksik'} variant={completion ? 'ok' : 'warn'} />
            </View>
            <Text style={styles.subtitle}>
              Mektubu uygulama içinde oluşturun: hitap, neden bu program, katkılarınız ve kapanış.
            </Text>
          </View>
        </View>

        <Card title="European Youth Portal Tarzı Mektup Yapısı">
          <Text style={styles.hintRow}>• Hitap ve konu</Text>
          <Text style={styles.hintRow}>• Açılış (kimsiniz + neden yazıyorsunuz)</Text>
          <Text style={styles.hintRow}>• Motivasyon (neden bu program)</Text>
          <Text style={styles.hintRow}>• Katkı (ne katacaksınız)</Text>
          <Text style={styles.hintRow}>• Kapanış (uygunluk ve teşekkür)</Text>
        </Card>

        <Text style={styles.sectionLabel}>BAŞLIK</Text>
        <InputField
          label="Hitap *"
          value={letter.addressee}
          onChangeText={(value) => updateField('addressee', value)}
          placeholder="Inno Derneği Seçim Ekibi"
        />
        <InputField
          label="Konu *"
          value={letter.subject}
          onChangeText={(value) => updateField('subject', value)}
          placeholder="Başvuru Motivasyon Mektubu"
        />

        <Text style={styles.sectionLabel}>GÖVDE</Text>
        <InputField
          label={`Açılış Paragrafı * (${wordCount(letter.openingParagraph)} kelime)`}
          value={letter.openingParagraph}
          onChangeText={(value) => updateField('openingParagraph', value)}
          placeholder="Kimsiniz, hangi role başvuruyorsunuz?"
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />
        <InputField
          label={`Motivasyon Paragrafı * (${wordCount(letter.motivationParagraph)} kelime)`}
          value={letter.motivationParagraph}
          onChangeText={(value) => updateField('motivationParagraph', value)}
          placeholder="Bu programa neden katılmak istiyorsunuz?"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />
        <InputField
          label={`Katkı Paragrafı * (${wordCount(letter.contributionParagraph)} kelime)`}
          value={letter.contributionParagraph}
          onChangeText={(value) => updateField('contributionParagraph', value)}
          placeholder="Deneyimlerinizle programa nasıl katkıda bulunacaksınız?"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />
        <InputField
          label={`Kapanış Paragrafı * (${wordCount(letter.closingParagraph)} kelime)`}
          value={letter.closingParagraph}
          onChangeText={(value) => updateField('closingParagraph', value)}
          placeholder="Teşekkür, uygunluk ve iletişim bilgisi"
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Minimum önerilen kelime sayısı: giriş 20+, motivasyon 40+, katkılar 40+, kapanış 20+.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? 'Kaydediliyor...' : 'Mektup Taslağını Kaydet'}
          onPress={saveLetter}
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
    gap: 14,
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
    gap: 6,
  } as ViewStyle,
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  } as ViewStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 4,
  } as TextStyle,
  hintRow: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  } as TextStyle,
  notice: {
    backgroundColor: colors.noticeBg,
    padding: 14,
    borderRadius: 12,
  } as ViewStyle,
  noticeText: {
    color: colors.noticeText,
    fontSize: 13,
    lineHeight: 19,
  } as TextStyle,
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  } as TextStyle,
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  } as TextStyle,
});
