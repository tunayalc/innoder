import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MenuItem, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { getApplicationStatusLabel, useI18n } from '../../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { RootStackNavigationProp } from '../../types';

export const AdayMenuScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const { t, language } = useI18n();
  const applications = useAppSelector(selectApplications);

  const latestApplication = useMemo(
    () =>
      applications
        .filter((application) => application.userId === user?.id)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0] || null,
    [applications, user?.id],
  );

  const missingDocs = useMemo(() => {
    if (!latestApplication) return 0;
    return latestApplication.documents.filter((document) => document.status !== 'ok').length;
  }, [latestApplication]);

  const totalDocs = latestApplication?.documents.length ?? 0;
  const completedDocs = totalDocs - missingDocs;
  const progressFillStyle = useMemo(
    () => ({
      width: totalDocs > 0 ? `${(completedDocs / totalDocs) * 100}%` : '0%',
    } as ViewStyle),
    [completedDocs, totalDocs],
  );

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.greeting}>
        {t('candidateMenu.greeting', { name: user?.name || t('candidateMenu.fallbackName') })}
      </Text>

      {latestApplication ? (
        <View style={styles.statusCard}>
          <View style={styles.statusAccent} />
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{latestApplication.programName}</Text>
              <Pill
                label={getApplicationStatusLabel(latestApplication.status, language)}
                variant={
                  latestApplication.status === 'approved'
                    ? 'ok'
                    : latestApplication.status === 'needs_fix'
                      ? 'warn'
                      : latestApplication.status === 'rejected'
                        ? 'err'
                        : 'info'
                }
              />
            </View>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, progressFillStyle]} />
              </View>
              <Text style={styles.progressLabel}>
                {completedDocs}/{totalDocs}
              </Text>
            </View>
            <Text style={styles.statusHint}>
              {missingDocs > 0
                ? t('adminList.missingDocuments', { count: missingDocs })
                : t('adminList.allDocumentsDone')}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{t('candidateMenu.mainBlock')}</Text>

      <MenuItem
        label={t('nav.myPrograms')}
        subtitle={t('candidatePrograms.subtitle')}
        iconName="school-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayEgitim')}
      />
      <MenuItem
        label={t('nav.personalInfo')}
        subtitle="Kimlik ve ortak profil bilgileri"
        iconName="card-account-details-outline"
        iconColor={colors.primary}
        iconBg={colors.info}
        onPress={() => navigation.navigate('AdayKisisel')}
      />
      <MenuItem
        label={t('nav.messaging')}
        subtitle={t('candidateMenu.messagesSubtitle')}
        iconName="message-text-outline"
        iconColor={colors.teal}
        iconBg={colors.success}
        onPress={() =>
          navigation.navigate(
            'AdayMesaj',
            latestApplication ? { applicationId: latestApplication.id } : undefined,
          )
        }
      />
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
      gap: 10,
    } as ViewStyle,
    statusLabel: {
      flex: 1,
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
