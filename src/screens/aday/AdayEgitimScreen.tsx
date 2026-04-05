import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Pill } from '../../components';
import { useAuth } from '../../hooks';
import { getApplicationStatusLabel, useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';

export const AdayEgitimScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const applications = useAppSelector(selectApplications);

  const myApplications = useMemo(
    () =>
      applications
        .filter((application) => application.userId === user?.id)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [applications, user?.id],
  );

  return (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerCard}>
        <View style={styles.accentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.h2}>{t('candidatePrograms.title')}</Text>
          <Text style={styles.subtitle}>{t('candidatePrograms.subtitle')}</Text>
        </View>
      </View>

      {myApplications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('candidatePrograms.empty')}</Text>
        </View>
      ) : null}

      {myApplications.map((application) => {
        const missingDocuments = application.documents.filter((document) => document.status !== 'ok').length;
        const completedDocuments = application.documents.length - missingDocuments;
        const progressWidth = application.documents.length > 0
          ? `${(completedDocuments / application.documents.length) * 100}%`
          : '0%';

        return (
          <View key={application.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{application.programName}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('candidateProgramDetail.documentProgress')}: {completedDocuments}/{application.documents.length}
                </Text>
              </View>
              <Pill
                label={getApplicationStatusLabel(application.status, language)}
                variant={
                  application.status === 'approved'
                    ? 'ok'
                    : application.status === 'needs_fix'
                      ? 'warn'
                      : application.status === 'rejected'
                        ? 'err'
                        : 'info'
                }
              />
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth as ViewStyle['width'] }]} />
            </View>

            <Text style={styles.progressHint}>
              {missingDocuments > 0
                ? t('adminList.missingDocuments', { count: missingDocuments })
                : t('adminList.allDocumentsDone')}
            </Text>

            <Button
              label={t('candidatePrograms.detailButton')}
              onPress={() => navigation.navigate('AdayProgramDetay', { applicationId: application.id })}
            />
            <Button
              label={t('candidatePrograms.messageButton')}
              variant="ghost"
              onPress={() => navigation.navigate('AdayMesaj', { applicationId: application.id })}
            />
          </View>
        );
      })}
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
      lineHeight: 20,
    } as TextStyle,
    emptyCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
    } as ViewStyle,
    emptyText: {
      fontSize: 15,
      color: colors.noticeText,
      textAlign: 'center',
      lineHeight: 22,
    } as TextStyle,
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
      gap: 12,
    } as ViewStyle,
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    } as ViewStyle,
    cardTextWrap: {
      flex: 1,
      gap: 4,
    } as ViewStyle,
    cardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    } as TextStyle,
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.borderLight,
      overflow: 'hidden',
    } as ViewStyle,
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.teal,
    } as ViewStyle,
    progressHint: {
      fontSize: 13,
      color: colors.noticeText,
    } as TextStyle,
  });
