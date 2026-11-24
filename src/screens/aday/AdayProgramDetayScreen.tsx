import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Button, Pill, ScreenScrollView } from '../../components';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { submitApplication } from '../../store/thunks/applicationThunks';
import { useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp, RootStackParamList } from '../../types';
import { formatDateShort } from '../../utils/date';
import {
  isEuropassCvComplete,
  isMotivationLetterComplete,
} from '../../utils/europass';
import { documentProgress } from '../../utils/documentProgress';
import { apiClient, requireData } from '../../services/api/apiClient';
import { openPrivateFile } from '../../services/api/privateFiles';
import { appConfig } from '../../config/appConfig';
import { ProjectBloodGroup } from '../../components/ProjectBloodGroup';

export const AdayProgramDetayScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdayProgramDetay'>>();
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const applications = useAppSelector(selectApplications);

  const application = useMemo(
    () =>
      applications.find(app => app.id === route.params.applicationId) || null,
    [applications, route.params.applicationId],
  );

  const program = application?.program || null;
  const [templates, setTemplates] = useState<
    Array<{ id: string; fileName: string; fileUrl: string }>
  >([]);
  useEffect(() => {
    let current = true;
    if (appConfig.dataSource === 'remote' && program?.id)
      apiClient
        .get<Array<{ id: string; fileName: string; fileUrl: string }>>(
          `/programs/${program.id}/templates`,
        )
        .then(response => {
          const items = requireData(response);
          if (current) setTemplates(items);
        })
        .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [program?.id]);
  const { approved: completedCount, total: totalCount } =
    documentProgress(application);
  const progressFillStyle = {
    width: (totalCount > 0
      ? `${(completedCount / totalCount) * 100}%`
      : '0%') as ViewStyle['width'],
  };
  const motivationReady = isMotivationLetterComplete(
    application?.personalInfo.motivationLetter,
  );
  const cvReady = isEuropassCvComplete(application?.personalInfo.europassCv);
  const hasDocumentCommitment = (program?.checklist || []).length > 0;
  const hasBoardingPassRequirement = (program?.checklist || []).some(
    item =>
      item.documentType === 'boarding_pass_outbound' ||
      item.documentType === 'boarding_pass_return' ||
      item.documentType === 'boarding_pass',
  );

  if (!application || !program) {
    return (
      <View style={styles.section}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {t('candidateProgramDetail.notFound')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={styles.section}>
      <View style={styles.headerCard}>
        <View style={styles.accentBar} />
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Text style={styles.h2}>{application.programName}</Text>
            <Pill
              label={
                APPLICATION_STATUS_LABELS[application.status] ||
                application.status
              }
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
          <Text style={styles.subtitle}>
            {t('candidateProgramDetail.headerSubtitle', { year: program.year })}
          </Text>
        </View>
      </View>

      <ProjectBloodGroup key={application.id} applicationId={application.id} />
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {t('candidateProgramDetail.documentProgress')}
          </Text>
          <Text style={styles.progressCount}>
            {completedCount}/{totalCount}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, progressFillStyle]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t('candidateProgramDetail.contentsTitle')}
        </Text>
        {templates.map(template => (
          <Button
            key={template.id}
            label={`${template.fileName} İndir`}
            variant="ghost"
            onPress={() =>
              openPrivateFile(template.fileUrl).catch(cause =>
                Alert.alert(
                  'Şablon Açılamadı',
                  cause instanceof Error ? cause.message : 'Tekrar deneyin.',
                ),
              )
            }
          />
        ))}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Europass CV</Text>
          <Pill
            label={
              cvReady
                ? t('candidateProgramDetail.complete')
                : t('candidateProgramDetail.missing')
            }
            variant={cvReady ? 'ok' : 'warn'}
          />
        </View>
        <Button
          label="CV Ekranına Git"
          variant="ghost"
          onPress={() =>
            navigation.navigate('AdayCvBuilder', {
              applicationId: application.id,
            })
          }
        />

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>
            {t('candidateProgramDetail.motivationLetter')}
          </Text>
          <Pill
            label={
              motivationReady
                ? t('candidateProgramDetail.complete')
                : t('candidateProgramDetail.missing')
            }
            variant={motivationReady ? 'ok' : 'warn'}
          />
        </View>
        <Button
          label={t('candidateProgramDetail.goToMotivation')}
          variant="ghost"
          onPress={() =>
            navigation.navigate('AdayMotivation', {
              applicationId: application.id,
            })
          }
        />
        <Button
          label={t('candidateProgramDetail.uploadDocument')}
          onPress={() =>
            navigation.navigate('AdayBelge', { applicationId: application.id })
          }
        />
        <Button
          label={t('candidateProgramDetail.programChat')}
          variant="ghost"
          onPress={() =>
            navigation.navigate('AdayMesaj', { applicationId: application.id })
          }
        />
        {application.status === 'application_stage' &&
        application.decisionStatus === 'active' ? (
          <Button
            label={
              application.submittedAt
                ? 'Başvuruyu Yeniden Gönder'
                : 'Başvuruyu Gönder'
            }
            onPress={() => {
              if (!cvReady || !motivationReady) {
                Alert.alert(
                  'Eksik Başvuru İçeriği',
                  'Başvuruyu göndermeden önce CV ve motivasyon mektubunu tamamlamalısınız.',
                );
                return;
              }
              dispatch(submitApplication({ applicationId: application.id }));
            }}
          />
        ) : null}
      </View>

      {hasDocumentCommitment ? (
        <View style={styles.commitmentInfoCard}>
          <Text style={styles.commitmentInfoTitle}>
            {t('candidateProgramDetail.commitmentTitle')}
          </Text>
          <Text style={styles.commitmentInfoText}>
            {t('candidateProgramDetail.commitmentTextBase')}
            {hasBoardingPassRequirement
              ? t('candidateProgramDetail.commitmentTextBoarding')
              : ''}
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>
        {t('candidateProgramDetail.stepsTitle')}
      </Text>
      <View style={styles.card}>
        {program.steps.map((step, index) => (
          <Text key={`${index}-${step}`} style={styles.stepText}>
            {index + 1}) {step}
          </Text>
        ))}
      </View>

      {program.deadlines.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>
            {t('candidateProgramDetail.deadlinesTitle')}
          </Text>
          <View style={styles.card}>
            {program.deadlines.map(deadline => (
              <View key={deadline.label} style={styles.deadlineRow}>
                <Text style={styles.deadlineLabel}>{deadline.label}</Text>
                <Text style={styles.deadlineValue}>
                  {formatDateShort(deadline.dateISO)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
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
      paddingVertical: 18,
      flexDirection: 'row',
      gap: 14,
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    } as ViewStyle,
    h2: {
      flex: 1,
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
    } as TextStyle,
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0,
      marginTop: 4,
    } as TextStyle,
    progressCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 8,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,
    progressLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    } as TextStyle,
    progressCount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.teal,
    } as TextStyle,
    progressBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.borderLight,
      overflow: 'hidden',
    } as ViewStyle,
    progressFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: colors.teal,
    } as ViewStyle,
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
      gap: 8,
    } as ViewStyle,
    commitmentInfoCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.warning,
      padding: 16,
      gap: 8,
    } as ViewStyle,
    commitmentInfoTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryDark,
    } as TextStyle,
    commitmentInfoText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.noticeText,
    } as TextStyle,
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,
    statusLabel: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
    } as TextStyle,
    stepText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
    } as TextStyle,
    deadlineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,
    deadlineLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    } as TextStyle,
    deadlineValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '700',
    } as TextStyle,
    emptyCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 8,
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
  });
