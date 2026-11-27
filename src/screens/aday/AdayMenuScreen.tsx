import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Button,
  Carousel,
  ChipRow,
  FeatureRow,
  HeroCard,
  IconCircleButton,
  InfoChip,
  ScreenScrollView,
  SectionHeader,
  SegmentedTabs,
  TaskCard,
} from '../../components';
import { useAuth } from '../../hooks';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { getApplicationStatusLabel, getDocumentTypeLabel, useI18n } from '../../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import type { Application, DocumentType, RootStackNavigationProp } from '../../types';
import { documentProgress } from '../../utils/documentProgress';
import { documentSlot, itemSlot, parseSlot, slotLabel } from '../../utils/documentSlots';
import { isEuropassCvComplete, isMotivationLetterComplete } from '../../utils/europass';

type DocTab = 'missing' | 'review' | 'approved';

const documentIcon: Partial<Record<DocumentType, string>> = {
  identity: 'card-account-details-outline',
  form: 'file-document-edit-outline',
  agreement: 'file-sign',
  activity_agreement: 'file-sign',
  commitment_letter: 'email-newsletter',
  photo_activity_report: 'image-multiple-outline',
  boarding_pass_outbound: 'airplane-takeoff',
  boarding_pass_return: 'airplane-landing',
  boarding_pass: 'airplane',
};

const greetingFor = (hour: number, en: boolean) =>
  hour < 12 ? (en ? 'Good morning' : 'Günaydın') : hour < 18 ? (en ? 'Good afternoon' : 'İyi günler') : en ? 'Good evening' : 'İyi akşamlar';

const latestFor = (applications: Application[], userId?: string) =>
  applications
    .filter(application => application.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

export const AdayMenuScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const { t, language } = useI18n();
  const en = language === 'en';
  const tx = (tr: string, english: string) => (en ? english : tr);
  const applications = useAppSelector(selectApplications);
  const [focusTick, setFocusTick] = useState(0);
  useFocusEffect(useCallback(() => setFocusTick(tick => tick + 1), []));
  const { unread, error: summaryError } = useUnreadMessages(focusTick);
  const [docTab, setDocTab] = useState<DocTab>('missing');

  const application = useMemo(() => latestFor(applications, user?.id), [applications, user?.id]);
  const progress = documentProgress(application);
  const dateLocale = en ? 'en-GB' : 'tr-TR';
  const firstName = (user?.name || t('candidateMenu.fallbackName')).split(' ')[0];

  const currentDocs = (application?.documents || []).filter(doc => doc.isCurrent !== false);
  const checklist = application?.program.checklist || [];
  // Slots are fixed types or "extra:<key>" for documents the admin named.
  const expectedFormat = (slot: string) => checklist.find(item => itemSlot(item) === slot)?.expectedFormat;
  const wrongFormat = new Set(currentDocs.filter(doc => doc.status === 'wrong_format').map(documentSlot));
  const slotTitle = (slot: string) =>
    parseSlot(slot).requirementKey
      ? slotLabel(slot, application?.program)
      : getDocumentTypeLabel(slot as DocumentType, language);
  const slotIcon = (slot: string) => documentIcon[parseSlot(slot).type];
  const reviewDocs = currentDocs.filter(doc => doc.status === 'unread');
  const approvedDocs = currentDocs.filter(doc => doc.status === 'ok');

  const upcoming = useMemo(
    () =>
      applications
        .filter(item => item.userId === user?.id)
        .flatMap(item =>
          item.program.deadlines
            .map(deadline => ({ ...deadline, application: item, days: Math.ceil((Date.parse(deadline.dateISO) - Date.now()) / 86400000) }))
            .filter(deadline => deadline.days >= -7 && deadline.days <= 60),
        )
        .sort((a, b) => a.days - b.days),
    [applications, user?.id],
  );

  const personalIncomplete =
    !!application &&
    (!application.personalInfo.birthDate ||
      !application.personalInfo.nationality ||
      !(application.personalInfo.identityType === 'passport'
        ? application.personalInfo.passportNumber
        : application.personalInfo.identityNumber));
  const active = !!application && application.decisionStatus !== 'rejected';
  const cvIncomplete = active && !isEuropassCvComplete(application.personalInfo.europassCv);
  const letterIncomplete = active && !isMotivationLetterComplete(application.personalInfo.motivationLetter);
  const todoCount =
    (active ? progress.missing.length : 0) + (active && personalIncomplete ? 1 : 0) + (cvIncomplete ? 1 : 0) + (letterIncomplete ? 1 : 0);

  const openDocuments = (docType?: string) =>
    application && navigation.navigate('AdayBelge', { applicationId: application.id, docType });
  const openMessages = () => navigation.navigate('AdayMesaj', application ? { applicationId: application.id } : undefined);

  return (
    <View style={styles.root}>
      <ScreenScrollView safeTop inTabs contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{tx('inno derneği', 'inno association')}</Text>
            <Text accessibilityRole="header" style={styles.greeting}>
              {greetingFor(new Date().getHours(), en)}, {firstName}
            </Text>
          </View>
          <IconCircleButton
            icon="message-text-outline"
            label={t('nav.messaging')}
            badge={unread || undefined}
            onPress={openMessages}
          />
        </View>

        {application ? (
          <ChipRow>
            <InfoChip icon="school-outline" label={application.programName} onPress={() => navigation.navigate('AdayProgramDetay', { applicationId: application.id })} />
            <InfoChip icon="flag-outline" label={getApplicationStatusLabel(application.status, language)} />
            {upcoming[0] ? (
              <InfoChip
                icon="calendar-clock"
                label={`${upcoming[0].label} · ${new Date(upcoming[0].dateISO).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}`}
              />
            ) : null}
          </ChipRow>
        ) : null}

        {application ? (
          <HeroCard
            eyebrow={tx('Başvurum', 'My application')}
            title={application.programName}
            progress={{
              value: progress.approved,
              total: progress.total,
              caption: progress.total
                ? tx(`${progress.total} belgeden ${progress.approved} tanesi onaylandı`, `${progress.approved} of ${progress.total} documents approved`)
                : tx('Bu aşamada istenen belge yok', 'No documents required at this stage'),
            }}
          >
            {active && progress.missing.length ? (
              <Button label={tx('Belge yükle', 'Upload documents')} variant="onHero" size="sm" icon="upload" onPress={() => openDocuments(progress.missing[0] as DocumentType)} />
            ) : null}
            <Pressable accessibilityRole="link" hitSlop={8} style={styles.heroLink} onPress={() => navigation.navigate('AdayProgramDetay', { applicationId: application.id })}>
              <Text style={styles.heroLinkText}>{tx('Detayları gör', 'View details')}</Text>
            </Pressable>
          </HeroCard>
        ) : (
          <HeroCard eyebrow={tx('Hoş geldin', 'Welcome')} title={tx('Başvurun hazırlanıyor', 'Your application is being prepared')}>
            <Text style={styles.heroBody}>{t('candidateMenu.waitingForAssignment')}</Text>
            <Button label={tx('Derneğe yaz', 'Message the association')} variant="onHero" size="sm" icon="message-outline" onPress={openMessages} />
          </HeroCard>
        )}

        {application?.decisionStatus === 'rejected' ? (
          <FeatureRow icon="alert-circle-outline" tone="err" title={tx('Başvurun sonuçlandı', 'Your application was closed')} description={application.decisionReason || tx('Ayrıntılar için dernekle iletişime geçebilirsin.', 'Contact the association for details.')} onPress={openMessages} />
        ) : null}

        {active ? (
          <>
            <SectionHeader
              title={tx('Yapılacaklar', 'To do')}
              subtitle={todoCount ? tx(`${todoCount} adım seni bekliyor`, `${todoCount} steps left`) : undefined}
              actionLabel={progress.missing.length ? tx('Tümünü gör', 'View all') : undefined}
              onAction={() => openDocuments()}
            />
            {todoCount ? (
              <Carousel>
                {progress.missing.map(type => {
                  const docType = type;
                  const fix = wrongFormat.has(docType);
                  return (
                    <TaskCard
                      key={type}
                      icon={slotIcon(docType) || 'file-upload-outline'}
                      tone={fix ? 'warn' : 'brand'}
                      statusLabel={fix ? tx('Düzeltme gerekli', 'Needs a fix') : tx('Eksik', 'Missing')}
                      title={slotTitle(docType)}
                      meta={expectedFormat(type)}
                      onPress={() => openDocuments(docType)}
                    >
                      <Button label={tx('Yükle', 'Upload')} size="sm" icon="upload" onPress={() => openDocuments(docType)} />
                      <Button
                        label={tx('Tara', 'Scan')}
                        size="sm"
                        variant="outline"
                        icon="camera-outline"
                        onPress={() => navigation.navigate('BelgeCamera', { docType, applicationId: application.id })}
                      />
                    </TaskCard>
                  );
                })}
                {personalIncomplete ? (
                  <TaskCard icon="account-edit-outline" tone="info" title={t('nav.personalInfo')} meta={tx('Doğum tarihi, uyruk ve kimlik bilgilerini tamamla.', 'Add birth date, nationality and ID details.')} onPress={() => navigation.navigate('AdayKisisel')}>
                    <Button label={tx('Tamamla', 'Complete')} size="sm" onPress={() => navigation.navigate('AdayKisisel')} />
                  </TaskCard>
                ) : null}
                {cvIncomplete ? (
                  <TaskCard icon="file-account-outline" tone="info" title={t('nav.europassCv')} meta={tx('Europass formatında CV taslağını bitir.', 'Finish your Europass CV draft.')} onPress={() => navigation.navigate('AdayCvBuilder', { applicationId: application.id })}>
                    <Button label={tx('Devam et', 'Continue')} size="sm" onPress={() => navigation.navigate('AdayCvBuilder', { applicationId: application.id })} />
                  </TaskCard>
                ) : null}
                {letterIncomplete ? (
                  <TaskCard icon="file-edit-outline" tone="info" title={t('nav.motivationLetter')} meta={tx('Neden bu projeye katılmak istediğini anlat.', 'Tell us why you want to join.')} onPress={() => navigation.navigate('AdayMotivation', { applicationId: application.id })}>
                    <Button label={tx('Yaz', 'Write')} size="sm" onPress={() => navigation.navigate('AdayMotivation', { applicationId: application.id })} />
                  </TaskCard>
                ) : null}
              </Carousel>
            ) : (
              <FeatureRow icon="check-decagram-outline" tone="ok" title={tx('Her şey tamam', 'All caught up')} description={tx('Şu an senden beklenen bir adım yok.', 'Nothing needs your attention right now.')} />
            )}

            {progress.awaitingOriginal ? (
              <FeatureRow
                icon="file-sign"
                tone="warn"
                title={tx(`${progress.awaitingOriginal} belgenin aslı bekleniyor`, `${progress.awaitingOriginal} originals awaited`)}
                description={tx('Islak imzalı asıllarını derneğe teslim et.', 'Deliver the signed originals to the association.')}
                onPress={() => navigation.navigate('AdayProgramDetay', { applicationId: application.id })}
              />
            ) : null}

            <SectionHeader title={tx('Belgelerim', 'My documents')} actionLabel={tx('Yönet', 'Manage')} onAction={() => openDocuments()} />
            <SegmentedTabs<DocTab>
              value={docTab}
              onChange={setDocTab}
              tabs={[
                { key: 'missing', label: tx('Eksik', 'Missing'), count: progress.missing.length },
                { key: 'review', label: tx('İncelemede', 'In review'), count: reviewDocs.length },
                { key: 'approved', label: tx('Onaylı', 'Approved'), count: approvedDocs.length },
              ]}
            />
            <View>
              {docTab === 'missing'
                ? progress.missing.map(type => (
                    <FeatureRow
                      key={type}
                      icon={slotIcon(type) || 'file-outline'}
                      tone={wrongFormat.has(type) ? 'warn' : 'brand'}
                      title={slotTitle(type)}
                      description={wrongFormat.has(type) ? tx('Yeniden yüklemen gerekiyor', 'Please upload again') : expectedFormat(type)}
                      onPress={() => openDocuments(type)}
                    />
                  ))
                : (docTab === 'review' ? reviewDocs : approvedDocs).map(doc => (
                    <FeatureRow
                      key={doc.id}
                      icon={documentIcon[doc.type] || 'file-outline'}
                      tone={docTab === 'review' ? 'info' : 'ok'}
                      title={slotTitle(documentSlot(doc))}
                      description={doc.fileName}
                      onPress={() => navigation.navigate('DocumentViewer', { applicationId: application.id, documentId: doc.id })}
                    />
                  ))}
              {(docTab === 'missing' ? progress.missing.length : docTab === 'review' ? reviewDocs.length : approvedDocs.length) === 0 ? (
                <Text style={styles.emptyText}>
                  {docTab === 'missing'
                    ? tx('Eksik belgen yok.', 'No missing documents.')
                    : docTab === 'review'
                    ? tx('İncelemede bekleyen belge yok.', 'Nothing waiting for review.')
                    : tx('Henüz onaylanan belge yok.', 'No approved documents yet.')}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        {upcoming.length ? (
          <>
            <SectionHeader title={tx('Yaklaşan tarihler', 'Upcoming dates')} />
            {upcoming.slice(0, 4).map((deadline, index) => (
              <FeatureRow
                key={`${deadline.application.id}-${index}`}
                icon="calendar-clock"
                tone={deadline.days < 0 ? 'err' : deadline.days <= 7 ? 'warn' : 'info'}
                title={deadline.label}
                badge={deadline.days < 0 ? tx('Geçti', 'Past') : deadline.days === 0 ? tx('Bugün', 'Today') : tx(`${deadline.days} gün`, `${deadline.days} days`)}
                description={`${new Date(deadline.dateISO).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })} · ${deadline.application.programName}`}
                onPress={() => navigation.navigate('AdayProgramDetay', { applicationId: deadline.application.id })}
              />
            ))}
          </>
        ) : null}

        {summaryError ? <Text accessibilityRole="alert" style={styles.emptyText}>{summaryError}</Text> : null}
      </ScreenScrollView>

      {unread ? (
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.toast, pressed && styles.pressed]} onPress={openMessages}>
          <Icon name="message-badge-outline" size={20} color={colors.primaryText} />
          <Text style={styles.toastText}>{tx(`${unread} okunmamış mesajın var`, `You have ${unread} unread messages`)}</Text>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    content: { gap: 16, paddingBottom: 88 } as ViewStyle,
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 } as ViewStyle,
    headerText: { flex: 1, gap: 2 } as ViewStyle,
    eyebrow: { fontSize: 14, fontWeight: '600', color: colors.primaryText } as TextStyle,
    greeting: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    heroBody: { fontSize: 15, lineHeight: 21, color: colors.heroMuted, width: '100%' } as TextStyle,
    heroLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 } as ViewStyle,
    heroLinkText: { fontSize: 15, fontWeight: '600', color: colors.heroText } as TextStyle,
    emptyText: { fontSize: 14, lineHeight: 20, color: colors.textMuted, paddingVertical: 12 } as TextStyle,
    toast: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: 24,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      maxWidth: 520,
      alignSelf: 'center',
    } as ViewStyle,
    toastText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary } as TextStyle,
    pressed: { opacity: 0.85 } as ViewStyle,
  });
