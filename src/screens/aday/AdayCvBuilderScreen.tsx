import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles, type AppColors } from '../../theme';
import { Button, Card, InputField, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import { RootStackNavigationProp, RootStackParamList, EuropassCvProfile } from '../../types';
import { updatePersonalInfoDraft } from '../../store/thunks/applicationThunks';
import {
  CEFR_LEVELS,
  createEmptyEuropassCv,
  isEuropassCvComplete,
} from '../../utils/europass';

const sectionHints = [
  '1) Kişisel profil ve özet',
  '2) İş deneyimi (en yeni deneyim önce)',
  '3) Eğitim ve öğrenim',
  '4) CEFR dil seviyeleri (A1-C2)',
  '5) Yetkinlikler ve dijital beceriler',
];

export const AdayCvBuilderScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdayCvBuilder'>>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);

  const myApplication = useMemo(
    () =>
      route.params?.applicationId
        ? applications.find((app) => app.id === route.params?.applicationId)
        : applications.find((app) => app.userId === user?.id),
    [applications, route.params?.applicationId, user?.id],
  );

  const savedCv = myApplication?.personalInfo.europassCv ?? createEmptyEuropassCv();
  const applicationId = myApplication?.id;

  const [cv, setCv] = useState<EuropassCvProfile>(savedCv);

  // Re-sync local state when navigating to a different application
  const prevApplicationIdRef = React.useRef(applicationId);
  if (prevApplicationIdRef.current !== applicationId) {
    prevApplicationIdRef.current = applicationId;
    setCv(savedCv);
  }

  const isComplete = useMemo(() => isEuropassCvComplete(cv), [cv]);

  const updateCv = (patch: Partial<EuropassCvProfile>) => {
    setCv((prev) => ({ ...prev, ...patch }));
  };

  const updateWorkField = (index: number, key: string, value: string) => {
    setCv((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addWorkExperience = () => {
    setCv((prev) => ({
      ...prev,
      workExperiences: [
        ...prev.workExperiences,
        {
          role: '',
          organization: '',
          startDate: '',
          endDate: '',
          responsibilities: '',
        },
      ],
    }));
  };

  const removeWorkExperience = (index: number) => {
    setCv((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, idx) => idx !== index),
    }));
  };

  const updateEducationField = (index: number, key: string, value: string) => {
    setCv((prev) => ({
      ...prev,
      educationEntries: prev.educationEntries.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addEducation = () => {
    setCv((prev) => ({
      ...prev,
      educationEntries: [
        ...prev.educationEntries,
        {
          qualification: '',
          institution: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setCv((prev) => ({
      ...prev,
      educationEntries: prev.educationEntries.filter((_, idx) => idx !== index),
    }));
  };

  const updateLanguageField = (index: number, key: string, value: string) => {
    setCv((prev) => ({
      ...prev,
      languageSkills: prev.languageSkills.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addLanguage = () => {
    setCv((prev) => ({
      ...prev,
      languageSkills: [
        ...prev.languageSkills,
        {
          language: '',
          listening: 'A1',
          reading: 'A1',
          spokenInteraction: 'A1',
          spokenProduction: 'A1',
          writing: 'A1',
        },
      ],
    }));
  };

  const removeLanguage = (index: number) => {
    setCv((prev) => ({
      ...prev,
      languageSkills: prev.languageSkills.filter((_, idx) => idx !== index),
    }));
  };

  const saveCv = async () => {
    if (!myApplication) return;
    await dispatch(
      updatePersonalInfoDraft({
        applicationId: myApplication.id,
        programId: myApplication.programId,
        patch: {
          europassCv: cv,
        },
      }),
    );
    Alert.alert('CV Kaydedildi', 'Europass formatındaki CV taslağı kaydedildi.');
  };


  if (!myApplication) {
    return (
      <View style={styles.section}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>Europass CV Oluşturucu</Text>
            <Text style={styles.subtitle}>Önce başvuru taslağı oluşturmanız gerekiyor.</Text>
          </View>
        </View>
        <Card>
          <Text style={styles.emptyText}>
            CV düzenlemek için önce Programlarım ekranından bir programa geçin.
          </Text>
          <Button label="Programlarıma Git" onPress={() => navigation.navigate('AdayEgitim')} />
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
              <Text style={styles.h2}>Europass CV Oluşturucu</Text>
              <Pill label={isComplete ? 'Hazır' : 'Eksik'} variant={isComplete ? 'ok' : 'warn'} />
            </View>
            <Text style={styles.subtitle}>
              European Youth Portal / Europass CV formatına uygun bilgileri uygulama içinde doldurun.
            </Text>
          </View>
        </View>

        <Card title="Format Kontrol Listesi">
          {sectionHints.map((item) => (
            <Text key={item} style={styles.hintRow}>
              • {item}
            </Text>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>PROFİL</Text>
        <InputField
          label="Profil Başlığı *"
          value={cv.profileTitle}
          onChangeText={(value) => updateCv({ profileTitle: value })}
          placeholder="Gençlik Çalışanı / Gönüllü / Öğrenci"
        />
        <InputField
          label="Profesyonel Özet *"
          value={cv.summary}
          onChangeText={(value) => updateCv({ summary: value })}
          placeholder="Kısa özet (en az 40 karakter)"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
        <InputField
          label="Temel Yetkinlikler *"
          value={cv.keySkills}
          onChangeText={(value) => updateCv({ keySkills: value })}
          placeholder="İletişim, takım çalışması, proje yönetimi..."
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />
        <InputField
          label="Dijital Beceriler"
          value={cv.digitalSkills}
          onChangeText={(value) => updateCv({ digitalSkills: value })}
          placeholder="Canva, Notion, Excel, video düzenleme..."
          multiline
          numberOfLines={2}
          style={styles.textArea}
        />

        <Text style={styles.sectionLabel}>İŞ DENEYİMİ</Text>
        {cv.workExperiences.map((item, index) => (
          <Card key={`work-${index}`} title={`Deneyim ${index + 1}`}>
            <InputField
              label="Pozisyon *"
              value={item.role}
              onChangeText={(value) => updateWorkField(index, 'role', value)}
              placeholder="Proje Asistanı"
            />
            <InputField
              label="Kurum *"
              value={item.organization}
              onChangeText={(value) => updateWorkField(index, 'organization', value)}
              placeholder="STK / Okul / Şirket"
            />
            <InputField
              label="Başlangıç Tarihi *"
              value={item.startDate}
              onChangeText={(value) => updateWorkField(index, 'startDate', value)}
              placeholder="YYYY-MM"
            />
            <InputField
              label="Bitiş Tarihi"
              value={item.endDate}
              onChangeText={(value) => updateWorkField(index, 'endDate', value)}
              placeholder="YYYY-MM veya Devam Ediyor"
            />
            <InputField
              label="Sorumluluklar"
              value={item.responsibilities}
              onChangeText={(value) => updateWorkField(index, 'responsibilities', value)}
              placeholder="Ana başarılar ve görevler"
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
            {cv.workExperiences.length > 1 ? (
              <Pressable style={styles.removeButton} onPress={() => removeWorkExperience(index)}>
                <Text style={styles.removeButtonText}>Deneyimi Kaldır</Text>
              </Pressable>
            ) : null}
          </Card>
        ))}
        <Button label="Deneyim Ekle" variant="ghost" onPress={addWorkExperience} />

        <Text style={styles.sectionLabel}>EĞİTİM</Text>
        {cv.educationEntries.map((item, index) => (
          <Card key={`edu-${index}`} title={`Eğitim ${index + 1}`}>
            <InputField
              label="Yeterlilik *"
              value={item.qualification}
              onChangeText={(value) => updateEducationField(index, 'qualification', value)}
              placeholder="Lisans: Bilgisayar Mühendisliği"
            />
            <InputField
              label="Kurum *"
              value={item.institution}
              onChangeText={(value) => updateEducationField(index, 'institution', value)}
              placeholder="Üniversite / Okul"
            />
            <InputField
              label="Başlangıç Tarihi *"
              value={item.startDate}
              onChangeText={(value) => updateEducationField(index, 'startDate', value)}
              placeholder="YYYY-MM"
            />
            <InputField
              label="Bitiş Tarihi"
              value={item.endDate}
              onChangeText={(value) => updateEducationField(index, 'endDate', value)}
              placeholder="YYYY-MM"
            />
            <InputField
              label="Açıklama"
              value={item.description}
              onChangeText={(value) => updateEducationField(index, 'description', value)}
              placeholder="Projeler, tez, not ortalaması vb."
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
            {cv.educationEntries.length > 1 ? (
              <Pressable style={styles.removeButton} onPress={() => removeEducation(index)}>
                <Text style={styles.removeButtonText}>Eğitimi Kaldır</Text>
              </Pressable>
            ) : null}
          </Card>
        ))}
        <Button label="Eğitim Ekle" variant="ghost" onPress={addEducation} />

        <Text style={styles.sectionLabel}>DİL YETKİNLİKLERİ (CEFR)</Text>
        {cv.languageSkills.map((item, index) => (
          <Card key={`lang-${index}`} title={`Dil ${index + 1}`}>
            <InputField
              label="Dil *"
              value={item.language}
              onChangeText={(value) => updateLanguageField(index, 'language', value)}
              placeholder="İngilizce"
            />
            {[
              ['listening', 'Dinleme'],
              ['reading', 'Okuma'],
              ['spokenInteraction', 'Sözlü Etkileşim'],
              ['spokenProduction', 'Sözlü Anlatım'],
              ['writing', 'Yazma'],
            ].map(([fieldKey, label]) => (
              <View key={`${index}-${fieldKey}`} style={styles.levelGroup}>
                <Text style={styles.levelLabel}>{label}</Text>
                <View style={styles.levelRow}>
                  {CEFR_LEVELS.map((level) => (
                    <Pressable
                      key={`${index}-${fieldKey}-${level}`}
                      style={[
                        styles.levelPill,
                        item[fieldKey as keyof typeof item] === level && styles.levelPillActive,
                      ]}
                      onPress={() => updateLanguageField(index, fieldKey, level)}
                    >
                      <Text
                        style={[
                          styles.levelPillText,
                          item[fieldKey as keyof typeof item] === level && styles.levelPillTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            {cv.languageSkills.length > 1 ? (
              <Pressable style={styles.removeButton} onPress={() => removeLanguage(index)}>
                <Text style={styles.removeButtonText}>Dili Kaldır</Text>
              </Pressable>
            ) : null}
          </Card>
        ))}
        <Button label="Dil Ekle" variant="ghost" onPress={addLanguage} />


        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? 'Kaydediliyor...' : 'CV Taslağını Kaydet'}
          onPress={saveCv}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
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
  } as ViewStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
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
    minHeight: 88,
    textAlignVertical: 'top',
  } as TextStyle,
  levelGroup: {
    gap: 8,
  } as ViewStyle,
  levelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  } as TextStyle,
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  levelPill: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.rowBg,
  } as ViewStyle,
  levelPillActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealLight,
  } as ViewStyle,
  levelPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  } as TextStyle,
  levelPillTextActive: {
    color: colors.teal,
  } as TextStyle,
  removeButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  } as ViewStyle,
  removeButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  } as TextStyle,
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  } as TextStyle,
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  } as TextStyle,
});




