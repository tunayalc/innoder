import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MenuItem, Pill, ScreenScrollView } from '../../components';
import { useAuth } from '../../hooks';
import { getApplicationStatusLabel, useI18n } from '../../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { RootStackNavigationProp } from '../../types';
import { documentProgress } from '../../utils/documentProgress';
import {apiClient,requireData} from '../../services/api/apiClient';
import {appConfig} from '../../config/appConfig';
import {isEuropassCvComplete,isMotivationLetterComplete} from '../../utils/europass';
import {getDocumentTypeLabel} from '../../i18n';

export const AdayMenuScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const { t, language } = useI18n();
  const applications = useAppSelector(selectApplications);
  const [unread,setUnread]=useState<number|null>(null),[summaryError,setSummaryError]=useState('');
  useFocusEffect(useCallback(()=>{
    let current=true;
    if(appConfig.dataSource==='remote')apiClient.get<{unread:number}>('/messages/unread-count').then(response=>{const summary=requireData(response);if(current){setUnread(summary.unread);setSummaryError('');}}).catch(cause=>{if(current)setSummaryError(cause instanceof Error?cause.message:'Mesaj özeti alınamadı.');});
    return()=>{current=false;};
  },[]));

  const latestApplication = useMemo(
    () =>
      applications
        .filter(application => application.userId === user?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0] || null,
    [applications, user?.id],
  );

  const progress = documentProgress(latestApplication);
  const totalDocs = progress.total;
  const completedDocs = progress.approved;
  const missingDocs = totalDocs - completedDocs;
  const progressFillStyle = useMemo(
    () =>
      ({
        width: totalDocs > 0 ? `${(completedDocs / totalDocs) * 100}%` : '0%',
      } as ViewStyle),
    [completedDocs, totalDocs],
  );

  return (
    <ScreenScrollView contentContainerStyle={styles.section}>
      <Text accessibilityRole="header" style={styles.greeting}>
        {t('candidateMenu.greeting', {
          name: user?.name || t('candidateMenu.fallbackName'),
        })}
      </Text>

      {latestApplication ? (
        <View style={styles.statusCard}>
          <View style={styles.statusAccent} />
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>
                {latestApplication.programName}
              </Text>
              <Pill
                label={getApplicationStatusLabel(
                  latestApplication.status,
                  language,
                )}
                variant={
                  latestApplication.decisionStatus === 'rejected'
                    ? 'err'
                    : latestApplication.status === 'returned_home'
                    ? 'ok'
                    : latestApplication.documents.some(
                        document =>
                          document.status === 'wrong_format' ||
                          document.status === 'missing',
                      )
                    ? 'warn'
                    : 'info'
                }
              />
            </View>
            <View style={styles.progressRow}>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={t(
                  'candidateProgramDetail.documentProgress',
                )}
                accessibilityValue={{
                  min: 0,
                  max: totalDocs || 1,
                  now: completedDocs,
                }}
                style={styles.progressTrack}
              >
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

      {latestApplication&&latestApplication.decisionStatus!=='rejected'?<>
        {(!latestApplication.personalInfo.birthDate||!latestApplication.personalInfo.nationality||!(latestApplication.personalInfo.identityType==='passport'?latestApplication.personalInfo.passportNumber:latestApplication.personalInfo.identityNumber))?<MenuItem label={language==='en'?'Complete personal details':'Kişisel Bilgileri Tamamlayın'} iconName="account-edit-outline" onPress={()=>navigation.navigate('AdayKisisel')}/>:null}
        {!isEuropassCvComplete(latestApplication.personalInfo.europassCv)?<MenuItem label={language==='en'?'Complete your CV':'CV Taslağını Tamamlayın'} iconName="file-account-outline" onPress={()=>navigation.navigate('AdayCvBuilder',{applicationId:latestApplication.id})}/>:null}
        {!isMotivationLetterComplete(latestApplication.personalInfo.motivationLetter)?<MenuItem label={language==='en'?'Complete your motivation letter':'Motivasyon Mektubunu Tamamlayın'} iconName="file-edit-outline" onPress={()=>navigation.navigate('AdayMotivation',{applicationId:latestApplication.id})}/>:null}
        {progress.missing.length?<MenuItem label={language==='en'?`${progress.missing.length} documents missing`:`${progress.missing.length} Eksik / Düzeltme Gereken Belge`} subtitle={progress.missing.map(type=>getDocumentTypeLabel(type as import('../../types').DocumentType,language)).join(', ')} iconName="file-alert-outline" onPress={()=>navigation.navigate('AdayBelge',{applicationId:latestApplication.id})}/>:null}
        {progress.awaitingOriginal?<MenuItem label={language==='en'?`${progress.awaitingOriginal} originals awaiting delivery`:`${progress.awaitingOriginal} Belgenin Aslı Bekleniyor`} iconName="file-sign" onPress={()=>navigation.navigate('AdayProgramDetay',{applicationId:latestApplication.id})}/>:null}
      </>:null}
      {unread!==null&&unread>0?<MenuItem label={language==='en'?`${unread} unread messages`:`${unread} Okunmamış Mesaj`} iconName="message-badge-outline" onPress={()=>navigation.navigate('AdayMesaj')}/>:null}
      {summaryError?<Text accessibilityRole="alert" style={styles.statusHint}>{summaryError}</Text>:null}
      {applications.filter(application=>application.userId===user?.id).flatMap(application=>application.program.deadlines.filter(deadline=>{const days=(Date.parse(deadline.dateISO)-Date.now())/86400000;return days>=-7&&days<=30;}).map((deadline,index)=><MenuItem key={`${application.id}-${index}`} label={deadline.label} subtitle={`${application.programName} · ${new Date(deadline.dateISO).toLocaleDateString(language==='en'?'en-GB':'tr-TR')}`} iconName="calendar-clock" onPress={()=>navigation.navigate('AdayProgramDetay',{applicationId:application.id})}/>))}
      <Text style={styles.sectionLabel}>{t('candidateMenu.mainBlock')}</Text>

      <MenuItem
        label={t('nav.myPrograms')}
        subtitle={t('candidatePrograms.subtitle')}
        iconName="school-outline"
        iconColor={colors.onSuccess}
        iconBg={colors.success}
        onPress={() => navigation.navigate('AdayEgitim')}
      />
      <MenuItem
        label={t('nav.personalInfo')}
        subtitle="Kimlik ve ortak profil bilgileri"
        iconName="card-account-details-outline"
        iconColor={colors.onInfo}
        iconBg={colors.info}
        onPress={() => navigation.navigate('AdayKisisel')}
      />
      <MenuItem
        label={t('nav.messaging')}
        subtitle={t('candidateMenu.messagesSubtitle')}
        iconName="message-text-outline"
        iconColor={colors.onSuccess}
        iconBg={colors.success}
        onPress={() =>
          navigation.navigate(
            'AdayMesaj',
            latestApplication
              ? { applicationId: latestApplication.id }
              : undefined,
          )
        }
      />
    </ScreenScrollView>
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
      borderRadius: 8,
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
      alignItems: 'flex-start',
      gap: 10,
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
    statusHint: {
      fontSize: 13,
      color: colors.noticeText,
    } as TextStyle,
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginTop: 4,
    } as TextStyle,
  });
