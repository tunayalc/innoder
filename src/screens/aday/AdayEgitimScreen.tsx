import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Pill, ScreenScrollView, StateMessage } from '../../components';
import { useAuth } from '../../hooks';
import { getApplicationStatusLabel, useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import {
  selectApplicationError,
  selectApplicationLoading,
  selectApplications,
} from '../../store/selectors';
import { useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';
import { documentProgress } from '../../utils/documentProgress';

export const AdayEgitimScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const applications = useAppSelector(selectApplications);
  const isLoading = useAppSelector(selectApplicationLoading);
  const error = useAppSelector(selectApplicationError);

  const myApplications = useMemo(
    () =>
      applications
        .filter(application => application.userId === user?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [applications, user?.id],
  );

  return (
    <ScreenScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Text accessibilityRole="header" style={styles.h2}>
            {t('candidatePrograms.title')}
          </Text>
          <Text style={styles.subtitle}>{t('candidatePrograms.subtitle')}</Text>
        </View>
      </View>

      {myApplications.length === 0 ? (
        <StateMessage
          kind={isLoading ? 'loading' : error ? 'error' : 'empty'}
          message={
            isLoading
              ? t('common.loading')
              : error || t('candidatePrograms.empty')
          }
        />
      ) : null}

      {myApplications.map(application => {
        const progress = documentProgress(application);
        const missingDocuments = progress.total - progress.approved;
        const completedDocuments = progress.approved;
        const progressWidth =
          progress.total > 0
            ? `${(completedDocuments / progress.total) * 100}%`
            : '0%';

        return (
          <View key={application.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{application.programName}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('candidateProgramDetail.documentProgress')}:{' '}
                  {completedDocuments}/{progress.total}
                </Text>
              </View>
              <Pill
                label={getApplicationStatusLabel(application.status, language)}
                variant={
                  application.decisionStatus === 'rejected'
                    ? 'err'
                    : application.status === 'returned_home'
                    ? 'ok'
                    : application.documents.some(
                        document =>
                          document.status === 'wrong_format' ||
                          document.status === 'missing',
                      )
                    ? 'warn'
                    : 'info'
                }
              />
            </View>

            <View
              accessibilityRole="progressbar"
              accessibilityLabel={t('candidateProgramDetail.documentProgress')}
              accessibilityValue={{
                min: 0,
                max: progress.total || 1,
                now: completedDocuments,
              }}
              style={styles.progressTrack}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: progressWidth as ViewStyle['width'] },
                ]}
              />
            </View>

            <Text style={styles.progressHint}>
              {missingDocuments > 0
                ? t('adminList.missingDocuments', { count: missingDocuments })
                : t('adminList.allDocumentsDone')}
            </Text>

            <Button
              label={t('candidatePrograms.detailButton')}
              onPress={() =>
                navigation.navigate('AdayProgramDetay', {
                  applicationId: application.id,
                })
              }
            />
            <Button
              label={t('candidatePrograms.messageButton')}
              variant="ghost"
              onPress={() =>
                navigation.navigate('AdayMesaj', {
                  applicationId: application.id,
                })
              }
            />
          </View>
        );
      })}
    </ScreenScrollView>
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
      paddingVertical: 4,
      flexDirection: 'row',
      gap: 14,
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
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
      gap: 12,
    } as ViewStyle,
    cardHeader: {
      alignItems: 'flex-start',
      gap: 12,
    } as ViewStyle,
    cardTextWrap: {
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
