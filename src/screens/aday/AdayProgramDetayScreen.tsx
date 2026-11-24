import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Button,
  Card,
  FeatureRow,
  Pill,
  ProgressBar,
  ScreenScrollView,
  SectionHeader,
} from '../../components';
import { APPLICATION_STATUS_LABELS } from '../../constants';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { submitApplication } from '../../store/thunks/applicationThunks';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
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
  const { colors } = useAppTheme();
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

  const statusVariant =
    application.decisionStatus === 'rejected'
      ? 'err'
      : application.status === 'returned_home'
      ? 'ok'
      : application.documents.some(
          document =>
            document.status === 'wrong_format' || document.status === 'missing',
        )
      ? 'warn'
      : 'info';
  const canSubmit =
    application.status === 'application_stage' &&
    application.decisionStatus === 'active';

  return (
    <ScreenScrollView contentContainerStyle={styles.section}>
      <View style={styles.cover}>
        <View style={styles.coverMark}>
          <Icon
            name={program.programKind === 'esc' ? 'hand-heart-outline' : 'earth'}
            size={40}
            color={colors.white}
          />
        </View>
        <Text style={styles.coverYear}>{program.year}</Text>
      </View>

      <View style={styles.titleBlock}>
        <Pill
          label={APPLICATION_STATUS_LABELS[application.status] || application.status}
          variant={statusVariant}
        />
        <Text accessibilityRole="header" style={styles.h2}>
          {application.programName}
        </Text>
        <View style={styles.metaRow}>
          <Icon name="calendar-blank-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {t('candidateProgramDetail.headerSubtitle', { year: program.year })}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="file-check-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {t('candidateProgramDetail.documentProgress')}: {completedCount}/{totalCount}
          </Text>
        </View>
      </View>

      <Card style={styles.statusCard}>
        <Text style={styles.cardTitle}>{t('candidateProgramDetail.documentProgress')}</Text>
        <View style={styles.metaRow}>
          <Icon
            name={completedCount === totalCount && totalCount > 0 ? 'check-circle' : 'progress-clock'}
            size={20}
            color={completedCount === totalCount && totalCount > 0 ? colors.onSuccess : colors.primaryText}
          />
          <Text style={styles.metaText}>
            {completedCount}/{totalCount} · {application.submittedAt ? `Gönderildi: ${formatDateShort(application.submittedAt)}` : 'Henüz gönderilmedi'}
          </Text>
        </View>
        <ProgressBar
          value={completedCount}
          total={totalCount}
          label={t('candidateProgramDetail.documentProgress')}
        />
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => navigation.navigate('AdayBelge', { applicationId: application.id })}
        >
          <Text style={styles.link}>{t('candidateProgramDetail.uploadDocument')}</Text>
        </Pressable>
      </Card>

      <ProjectBloodGroup key={application.id} applicationId={application.id} />

      <SectionHeader title={t('candidateProgramDetail.contentsTitle')} />
      <Card style={styles.group}>
        <FeatureRow
          icon="file-account-outline"
          title="Europass CV"
          badge={cvReady ? t('candidateProgramDetail.complete') : t('candidateProgramDetail.missing')}
          tone={cvReady ? 'ok' : 'warn'}
          onPress={() => navigation.navigate('AdayCvBuilder', { applicationId: application.id })}
        />
        <View style={styles.divider} />
        <FeatureRow
          icon="file-edit-outline"
          title={t('candidateProgramDetail.motivationLetter')}
          badge={motivationReady ? t('candidateProgramDetail.complete') : t('candidateProgramDetail.missing')}
          tone={motivationReady ? 'ok' : 'warn'}
          onPress={() => navigation.navigate('AdayMotivation', { applicationId: application.id })}
        />
        <View style={styles.divider} />
        <FeatureRow
          icon="file-upload-outline"
          title={t('candidateProgramDetail.uploadDocument')}
          onPress={() => navigation.navigate('AdayBelge', { applicationId: application.id })}
        />
        <View style={styles.divider} />
        <FeatureRow
          icon="message-text-outline"
          tone="info"
          title={t('candidateProgramDetail.programChat')}
          onPress={() => navigation.navigate('AdayMesaj', { applicationId: application.id })}
        />
        {templates.map(template => (
          <React.Fragment key={template.id}>
            <View style={styles.divider} />
            <FeatureRow
              icon="download-outline"
              tone="info"
              title={`${template.fileName} İndir`}
              onPress={() =>
                openPrivateFile(template.fileUrl).catch(cause =>
                  Alert.alert(
                    'Şablon Açılamadı',
                    cause instanceof Error ? cause.message : 'Tekrar deneyin.',
                  ),
                )
              }
            />
          </React.Fragment>
        ))}
      </Card>

      {canSubmit ? (
        <Button
          label={application.submittedAt ? 'Başvuruyu Yeniden Gönder' : 'Başvuruyu Gönder'}
          icon="send-outline"
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

      {hasDocumentCommitment ? (
        <View style={styles.commitmentInfoCard}>
          <FeatureRow
            icon="file-sign"
            tone="warn"
            title={t('candidateProgramDetail.commitmentTitle')}
            description={`${t('candidateProgramDetail.commitmentTextBase')}${
              hasBoardingPassRequirement ? t('candidateProgramDetail.commitmentTextBoarding') : ''
            }`}
          />
        </View>
      ) : null}

      {program.steps.length ? (
        <>
          <SectionHeader title={t('candidateProgramDetail.stepsTitle')} />
          <Card style={styles.group}>
            {program.steps.map((step, index) => (
              <View key={`${index}-${step}`} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {program.deadlines.length > 0 ? (
        <>
          <SectionHeader title={t('candidateProgramDetail.deadlinesTitle')} />
          <Card style={styles.group}>
            {program.deadlines.map((deadline, index) => (
              <React.Fragment key={deadline.label}>
                {index ? <View style={styles.divider} /> : null}
                <FeatureRow
                  icon="calendar-clock"
                  tone="info"
                  title={deadline.label}
                  description={formatDateShort(deadline.dateISO)}
                />
              </React.Fragment>
            ))}
          </Card>
        </>
      ) : null}
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: {
      paddingTop: 0,
      gap: 16,
      padding: 20,
      paddingBottom: 40,
    } as ViewStyle,
    cover: {
      height: 168,
      marginHorizontal: -20,
      backgroundColor: colors.heroBg,
      paddingHorizontal: 20,
      paddingBottom: 18,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    } as ViewStyle,
    coverMark: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    coverYear: { fontSize: 40, fontWeight: '700', color: colors.heroMuted } as TextStyle,
    titleBlock: { gap: 8 } as ViewStyle,
    h2: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 } as ViewStyle,
    metaText: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.textSecondary } as TextStyle,
    statusCard: { gap: 12 } as ViewStyle,
    cardTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    link: { fontSize: 16, fontWeight: '600', color: colors.primaryText, paddingVertical: 4 } as TextStyle,
    group: { paddingVertical: 4, gap: 0 } as ViewStyle,
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight, marginLeft: 58 } as ViewStyle,
    commitmentInfoCard: {
      backgroundColor: colors.warning,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 4,
    } as ViewStyle,
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 10 } as ViewStyle,
    stepNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    stepNumberText: { fontSize: 14, fontWeight: '700', color: colors.primaryText } as TextStyle,
    stepText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.textPrimary, paddingTop: 4 } as TextStyle,
    emptyCard: {
      backgroundColor: colors.noticeBg,
      borderRadius: 14,
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
