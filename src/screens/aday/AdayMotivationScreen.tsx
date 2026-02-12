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
        patch: {
          motivationLetter: letter,
        },
      }),
    );
    Alert.alert('Mektup Kaydedildi', 'Motivasyon mektubu taslagi kaydedildi.');
  };

  if (!myApplication) {
    return (
      <View style={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Motivasyon Mektubu Builder</Text>
            <Text style={styles.subtitle}>Once basvuru taslagi olusturmaniz gerekiyor.</Text>
          </View>
        </View>
        <Card>
          <Text style={styles.emptyText}>
            Bu adima gecmeden once Kayit Formu ekranindan taslak basvuru olusturun.
          </Text>
          <Button label="Kayit Formuna Git" onPress={() => navigation.navigate('AdayKayit')} />
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
              <Text style={styles.h2}>Motivasyon Mektubu Builder</Text>
              <Pill label={completion ? 'Hazir' : 'Eksik'} variant={completion ? 'ok' : 'warn'} />
            </View>
            <Text style={styles.subtitle}>
              Mektubu uygulama icinde olusturun: hitap, neden bu program, katkilariniz ve kapanis.
            </Text>
          </View>
        </View>

        <Card title="European Youth Portal Tarzi Mektup Yapisi">
          <Text style={styles.hintRow}>• Addressee and subject</Text>
          <Text style={styles.hintRow}>• Opening (who you are + why writing)</Text>
          <Text style={styles.hintRow}>• Motivation (why this programme)</Text>
          <Text style={styles.hintRow}>• Contribution (what you will bring)</Text>
          <Text style={styles.hintRow}>• Closing (availability and thanks)</Text>
        </Card>

        <Text style={styles.sectionLabel}>HEADER</Text>
        <InputField
          label="Addressee *"
          value={letter.addressee}
          onChangeText={(value) => updateField('addressee', value)}
          placeholder="Inno Association Selection Team"
        />
        <InputField
          label="Subject *"
          value={letter.subject}
          onChangeText={(value) => updateField('subject', value)}
          placeholder="Application Motivation Letter"
        />

        <Text style={styles.sectionLabel}>BODY</Text>
        <InputField
          label={`Opening Paragraph * (${wordCount(letter.openingParagraph)} words)`}
          value={letter.openingParagraph}
          onChangeText={(value) => updateField('openingParagraph', value)}
          placeholder="Kimsiniz, hangi role basvuruyorsunuz?"
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />
        <InputField
          label={`Motivation Paragraph * (${wordCount(letter.motivationParagraph)} words)`}
          value={letter.motivationParagraph}
          onChangeText={(value) => updateField('motivationParagraph', value)}
          placeholder="Bu programa neden katilmak istiyorsunuz?"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />
        <InputField
          label={`Contribution Paragraph * (${wordCount(letter.contributionParagraph)} words)`}
          value={letter.contributionParagraph}
          onChangeText={(value) => updateField('contributionParagraph', value)}
          placeholder="Deneyimlerinizle programa nasil katkida bulunacaksiniz?"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />
        <InputField
          label={`Closing Paragraph * (${wordCount(letter.closingParagraph)} words)`}
          value={letter.closingParagraph}
          onChangeText={(value) => updateField('closingParagraph', value)}
          placeholder="Tesekkur, uygunluk ve iletisim bilgisi"
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Minimum onerilen kelime sayisi: giris 20+, motivasyon 40+, katkilar 40+, kapanis 20+.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? 'Kaydediliyor...' : 'Mektup Taslagini Kaydet'}
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

