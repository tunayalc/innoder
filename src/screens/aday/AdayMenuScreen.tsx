import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { colors } from '../../theme';
import { MenuItem, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { isEuropassCvComplete, isMotivationLetterComplete } from '../../utils/europass';

export const AdayMenuScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const applications = useAppSelector(selectApplications);

  const myApplication = useMemo(
    () => applications.find((app) => app.userId === user?.id),
    [applications, user?.id],
  );

  const missingDocs = useMemo(() => {
    if (!myApplication) return 0;
    return myApplication.documents.filter((d) => d.status !== 'ok').length;
  }, [myApplication]);

  const totalDocs = myApplication?.documents.length ?? 0;
  const completedDocs = totalDocs - missingDocs;
  const progressFillStyle = useMemo(
    () => ({
      width: totalDocs > 0 ? `${(completedDocs / totalDocs) * 100}%` : '0%',
    } as ViewStyle),
    [completedDocs, totalDocs],
  );

  const cvReady = isEuropassCvComplete(myApplication?.personalInfo.europassCv);
  const motivationReady = isMotivationLetterComplete(
    myApplication?.personalInfo.motivationLetter,
  );
  const dossierCompleted = Number(cvReady) + Number(motivationReady);

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.greeting}>Merhaba, {user?.name || 'Aday'}</Text>

      {myApplication && (
        <View style={styles.statusCard}>
          <View style={styles.statusAccent} />
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Başvuru</Text>
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
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    progressFillStyle,
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {completedDocs}/{totalDocs}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>CV + Mektup:</Text>
              <Text style={styles.metaValue}>{dossierCompleted}/2</Text>
            </View>
            {missingDocs > 0 && (
              <Text style={styles.statusHint}>{missingDocs} belge eksik veya hatalı</Text>
            )}
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>BAŞVURU ADIMLARI</Text>

      <MenuItem
        label="Kayıt Formu"
        subtitle="Hesap ve iletişim bilgileri"
        iconName="account-edit-outline"
        iconColor={colors.primary}
        iconBg={colors.warning}
        onPress={() => navigation.navigate('AdayKayit')}
      />
      <MenuItem
        label="Eğitim Bilgilendirme"
        subtitle="Program detayları ve kontrol listesi"
        iconName="school-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayEgitim')}
      />
      <MenuItem
        label="Kişisel Bilgi Formu"
        subtitle="TC, doğum tarihi ve program seçimi"
        iconName="card-account-details-outline"
        iconColor="#6366F1"
        iconBg={colors.info}
        onPress={() => navigation.navigate('AdayKisisel')}
      />
      <MenuItem
        label="Europass CV Oluştur"
        subtitle={cvReady ? 'CV formatı tamamlandı' : 'CV formatını uygulama içinde doldurun'}
        iconName="file-account-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayCvBuilder')}
      />
      <MenuItem
        label="Motivasyon Mektubu"
        subtitle={
          motivationReady
            ? 'Mektup taslağı tamamlandı'
            : 'Program için mektubunuzu oluşturun'
        }
        iconName="file-document-edit-outline"
        iconColor={colors.primary}
        iconBg={colors.warning}
        onPress={() => navigation.navigate('AdayMotivation')}
      />
      <MenuItem
        label="Belge Tarama / Yükleme"
        subtitle="Belgelerinizi tarayıp yükleyin"
        iconName="file-document-outline"
        iconColor={colors.primary}
        iconBg={colors.warning}
        onPress={() => navigation.navigate('AdayBelge')}
      />
      <MenuItem
        label="Mesajlaşma"
        subtitle="Admin ile iletişim"
        iconName="message-text-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() =>
          navigation.navigate(
            'AdayMesaj',
            myApplication ? { applicationId: myApplication.id } : undefined,
          )
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 14,
  } as ViewStyle,
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  } as TextStyle,
  statusCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: 6,
  } as ViewStyle,
  statusAccent: {
    width: 4,
    backgroundColor: colors.teal,
  } as ViewStyle,
  statusContent: {
    flex: 1,
    padding: 16,
    gap: 10,
  } as ViewStyle,
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.teal,
  } as ViewStyle,
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    minWidth: 28,
    textAlign: 'right',
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  } as ViewStyle,
  metaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  } as TextStyle,
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  statusHint: {
    fontSize: 13,
    color: colors.noticeText,
  } as TextStyle,
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  } as TextStyle,
});
