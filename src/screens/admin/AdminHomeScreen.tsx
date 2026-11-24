import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Button,
  Card,
  Carousel,
  ChipRow,
  FeatureRow,
  HeroCard,
  IconCircleButton,
  InfoChip,
  ScreenScrollView,
  SectionHeader,
  TaskCard,
} from '../../components';
import { appConfig } from '../../config/appConfig';
import { useAuth } from '../../hooks';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { getApplicationStatusLabel, useI18n } from '../../i18n';
import { apiClient, requireData } from '../../services/api/apiClient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { loadAdminApplications } from '../../store/thunks/applicationThunks';
import { useThemedStyles, type AppColors } from '../../theme';
import type { RootStackNavigationProp } from '../../types';

const greetingFor = (hour: number, en: boolean) =>
  hour < 12 ? (en ? 'Good morning' : 'Günaydın') : hour < 18 ? (en ? 'Good afternoon' : 'İyi günler') : en ? 'Good evening' : 'İyi akşamlar';

// Admin dashboard: what needs attention today, then the latest applications.
export const AdminHomeScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { language } = useI18n();
  const en = language === 'en';
  const tx = (tr: string, english: string) => (en ? english : tr);
  const applications = useAppSelector(selectApplications);
  const totalApplications = useAppSelector(state => state.application.total);
  const [pending, setPending] = useState<number | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const { unread } = useUnreadMessages(focusTick);

  useFocusEffect(
    useCallback(() => {
      setFocusTick(tick => tick + 1);
      dispatch(loadAdminApplications({}));
      let current = true;
      if (appConfig.dataSource === 'remote')
        apiClient
          .get<{ items: unknown[]; total: number }>('/admin/candidates?page=1&pageSize=1&status=pending')
          .then(response => {
            if (current) setPending(requireData(response).total);
          })
          .catch(() => undefined);
      return () => {
        current = false;
      };
    }, [dispatch]),
  );

  const toReview = useMemo(
    () =>
      applications.reduce(
        (count, application) =>
          count + application.documents.filter(doc => doc.isCurrent !== false && doc.status === 'unread').length,
        0,
      ),
    [applications],
  );
  const withIssues = applications.filter(application =>
    application.documents.some(doc => doc.status === 'wrong_format' || doc.status === 'missing'),
  ).length;
  const byStage = (stage: string) => applications.filter(application => application.status === stage).length;
  const latest = [...applications]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5);
  const attention = (pending || 0) + toReview + (unread || 0);
  const openList = (issues?: boolean) => navigation.navigate('AdminTabs', { screen: 'AdminListe', params: issues ? { issues } : undefined });
  const openMessages = () => navigation.navigate('AdminOperations', { section: 'messages' });

  return (
    <ScreenScrollView safeTop inTabs contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{tx('Yönetim paneli', 'Admin panel')}</Text>
          <Text accessibilityRole="header" style={styles.greeting}>
            {greetingFor(new Date().getHours(), en)}, {(user?.name || tx('Yönetici', 'Admin')).split(' ')[0]}
          </Text>
        </View>
        <IconCircleButton icon="message-text-outline" label={tx('Mesajlar', 'Messages')} badge={unread || undefined} onPress={openMessages} />
      </View>

      <ChipRow>
        <InfoChip icon="clipboard-text-outline" label={tx(`${totalApplications ?? applications.length} başvuru`, `${totalApplications ?? applications.length} applications`)} onPress={() => openList()} />
        <InfoChip icon="airplane" label={`${getApplicationStatusLabel('erasmus_stage', language)} · ${byStage('erasmus_stage')}`} />
        <InfoChip icon="home-import-outline" label={`${getApplicationStatusLabel('returned_home', language)} · ${byStage('returned_home')}`} />
      </ChipRow>

      <HeroCard
        eyebrow={tx('Bugün', 'Today')}
        title={attention ? tx(`${attention} iş seni bekliyor`, `${attention} items need you`) : tx('Bekleyen iş yok', 'Nothing waiting')}
      >
        <Text style={styles.heroBody}>
          {tx(
            'Aday onayları, incelenecek belgeler ve okunmamış mesajlar burada toplanır.',
            'Candidate approvals, documents to review and unread messages gather here.',
          )}
        </Text>
        <Button label={tx('Başvurulara git', 'Open applications')} variant="onHero" size="sm" icon="arrow-right" onPress={() => openList()} />
      </HeroCard>

      <SectionHeader title={tx('Öncelikli işler', 'Priorities')} />
      <Carousel>
        <TaskCard
          icon="account-check-outline"
          tone={pending ? 'brand' : 'ok'}
          statusLabel={pending === null ? undefined : String(pending)}
          title={tx('Onay bekleyen adaylar', 'Candidates to approve')}
          meta={tx('Etkinlik bağlantısını kontrol et, sonra hesabı aç.', 'Check the event link, then activate.')}
          onPress={() => navigation.navigate('AdminTabs', { screen: 'AdminOnaylar' })}
        >
          <Button label={tx('İncele', 'Review')} size="sm" onPress={() => navigation.navigate('AdminTabs', { screen: 'AdminOnaylar' })} />
        </TaskCard>
        <TaskCard
          icon="file-search-outline"
          tone={toReview ? 'warn' : 'ok'}
          statusLabel={String(toReview)}
          title={tx('İncelenecek belgeler', 'Documents to review')}
          meta={tx(`${withIssues} başvuruda eksik veya hatalı belge var.`, `${withIssues} applications have missing or wrong files.`)}
          onPress={() => openList(true)}
        >
          <Button label={tx('Belgeleri aç', 'Open')} size="sm" onPress={() => openList(true)} />
        </TaskCard>
        <TaskCard
          icon="message-badge-outline"
          tone={unread ? 'info' : 'ok'}
          statusLabel={unread === null ? undefined : String(unread)}
          title={tx('Okunmamış mesajlar', 'Unread messages')}
          meta={tx('Adaylardan gelen genel ve program mesajları.', 'General and program messages from candidates.')}
          onPress={openMessages}
        >
          <Button label={tx('Yanıtla', 'Reply')} size="sm" onPress={openMessages} />
        </TaskCard>
      </Carousel>

      <SectionHeader title={tx('Son başvurular', 'Latest applications')} actionLabel={tx('Tümünü gör', 'View all')} onAction={() => openList()} />
      {latest.length ? (
        <Card style={styles.group}>
          {latest.map((application, index) => (
            <View key={application.id} style={index ? styles.divided : undefined}>
              <FeatureRow
                icon="account-outline"
                tone={application.decisionStatus === 'rejected' ? 'err' : application.status === 'returned_home' ? 'ok' : 'info'}
                title={application.personalInfo.fullName || tx('Aday', 'Candidate')}
                description={`${application.programName} · ${getApplicationStatusLabel(application.status, language)}`}
                onPress={() => navigation.navigate('AdminDetay', { applicationId: application.id })}
              />
            </View>
          ))}
        </Card>
      ) : (
        <Pressable onPress={() => openList()}>
          <Text style={styles.empty}>{tx('Henüz başvuru yok.', 'No applications yet.')}</Text>
        </Pressable>
      )}
    </ScreenScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    content: { gap: 16, paddingBottom: 32 } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 } as ViewStyle,
    headerText: { flex: 1, gap: 2 } as ViewStyle,
    eyebrow: { fontSize: 14, fontWeight: '600', color: colors.primaryText } as TextStyle,
    greeting: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    heroBody: { fontSize: 15, lineHeight: 21, color: colors.heroMuted, width: '100%' } as TextStyle,
    group: { paddingVertical: 4, gap: 0 } as ViewStyle,
    divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight } as ViewStyle,
    empty: { fontSize: 15, color: colors.textMuted, paddingVertical: 12 } as TextStyle,
  });
