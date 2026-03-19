import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { LanguageSwitcher, MenuItem, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { getApplicationStatusLabel, useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { isEuropassCvComplete } from '../../utils/europass';

export const AdayMenuScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { language, t } = useI18n();
  const applications = useAppSelector(selectApplications);

  const myPrograms = useMemo(
    () =>
      applications
        .filter((app) => app.userId === user?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [applications, user?.id],
  );

  const latestProgram = myPrograms[0];
  const missingDocs = useMemo(() => {
    if (!latestProgram) return 0;
    return latestProgram.documents.filter((d) => d.status !== 'ok').length;
  }, [latestProgram]);

  const totalDocs = latestProgram?.documents.length ?? 0;
  const completedDocs = totalDocs - missingDocs;

  const cvReady = user?.europassCv ? isEuropassCvComplete(user.europassCv) : false;

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <LanguageSwitcher />
      <Text style={styles.greeting}>
        {t('candidateMenu.greeting', { name: user?.name || t('candidateMenu.fallbackName') })}
      </Text>

      <View style={styles.statusCard}>
        <View style={styles.statusAccent} />
        <View style={styles.statusContent}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('candidateMenu.profileSummary')}</Text>
            <Pill
              label={cvReady ? t('candidateMenu.cvReady') : t('candidateMenu.cvMissing')}
              variant={cvReady ? 'ok' : 'warn'}
            />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t('candidateMenu.programAssignments')}</Text>
            <Text style={styles.metaValue}>{myPrograms.length}</Text>
          </View>
          {latestProgram ? (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t('candidateMenu.latestProgram')}</Text>
                <Text style={styles.metaValue}>{latestProgram.programName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t('candidateMenu.status')}</Text>
                <Text style={styles.metaValue}>
                  {getApplicationStatusLabel(latestProgram.status, language)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t('candidateMenu.documentProgress')}</Text>
                <Text style={styles.metaValue}>
                  {completedDocs}/{totalDocs}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.statusHint}>{t('candidateMenu.waitingForAssignment')}</Text>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t('candidateMenu.mainBlock')}</Text>

      <MenuItem
        label={t('candidateMenu.personalInfo')}
        subtitle={t('candidateMenu.personalInfoSubtitle')}
        iconName="account-edit-outline"
        iconColor={colors.primary}
        iconBg={colors.warning}
        onPress={() => navigation.navigate('AdayKisisel')}
      />

      <MenuItem
        label={t('candidateMenu.myPrograms')}
        subtitle={t('candidateMenu.myProgramsSubtitle')}
        iconName="view-list-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayEgitim')}
      />

      <MenuItem
        label={t('candidateMenu.messages')}
        subtitle={t('candidateMenu.messagesSubtitle')}
        iconName="message-text-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayMesaj')}
      />

      <MenuItem
        label={t('candidateMenu.europassCv')}
        subtitle={cvReady ? t('candidateMenu.europassCvReady') : t('candidateMenu.europassCvMissing')}
        iconName="file-account-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayCvBuilder')}
      />
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
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
