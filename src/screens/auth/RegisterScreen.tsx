import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  ContactLinksCard,
  InputField,
  SettingsButton,
} from '../../components';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { useAppSelector } from '../../store/hooks';
import { selectUserError, selectUserLoading } from '../../store/selectors';
import { RootStackNavigationProp } from '../../types';
import { CONTACT_LINKS } from '../../constants';
import { openMailto } from '../../utils/contact';
import { isValidEmail } from '../../utils/validation';

const ESC_INTRO_VIDEO = require('../../assets/videos/esc-intro.mp4');
const ESC_PORTAL_VIDEO = require('../../assets/videos/esc-european-youth-portal-guide.mp4');
const REQUIRED_VIDEO_IDS = ['video-1', 'video-2', 'video-3', 'video-4'] as const;

type VideoId = (typeof REQUIRED_VIDEO_IDS)[number];
type WatchedState = Record<VideoId, boolean>;
type VideoTranslation = {
  id: VideoId;
  title: string;
  duration: string;
  summary: string;
};

const LOCAL_VIDEO_SOURCES: Partial<Record<VideoId, any>> = {
  'video-1': ESC_INTRO_VIDEO,
  'video-2': ESC_PORTAL_VIDEO,
};

const createInitialWatchState = (): WatchedState => ({
  'video-1': false,
  'video-2': false,
  'video-3': false,
  'video-4': false,
});

const readTranslationString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { registerCandidate } = useAuth();
  const { t, tm } = useI18n();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const [watched, setWatched] = useState<WatchedState>(createInitialWatchState);
  const [activeVideoId, setActiveVideoId] = useState<VideoId | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const videos = useMemo<VideoTranslation[]>(() => {
    const translatedVideos = tm('onboarding.videos');

    return REQUIRED_VIDEO_IDS.map((id, index) => {
      const entry = translatedVideos[index] as Record<string, unknown> | undefined;

      return {
        id,
        title: readTranslationString(entry?.title, `Video ${index + 1}`),
        duration: readTranslationString(entry?.duration, ''),
        summary: readTranslationString(entry?.summary, ''),
      };
    });
  }, [tm]);

  const watchedCount = useMemo(
    () => REQUIRED_VIDEO_IDS.filter((videoId) => watched[videoId]).length,
    [watched],
  );
  const allVideosWatched = watchedCount === REQUIRED_VIDEO_IDS.length;
  const progressPercent = Math.round((watchedCount / REQUIRED_VIDEO_IDS.length) * 100);

  const toggleWatched = (videoId: VideoId) => {
    setWatched((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const markVideoWatched = (videoId: VideoId) => {
    setWatched((prev) => ({
      ...prev,
      [videoId]: true,
    }));
  };

  const handleRegister = async () => {
    if (!allVideosWatched) {
      Alert.alert(t('auth.videoRequiredTitle'), t('auth.videoRequiredText'));
      return;
    }
    if (!fullName.trim() || !email.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.fillNameEmail'));
      return;
    }
    if (!eventLink.trim()) {
      Alert.alert(t('common.errorTitle'), t('auth.eventLinkRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert(t('common.errorTitle'), t('auth.validEmail'));
      return;
    }
    if (!kvkkAccepted) {
      Alert.alert(t('common.errorTitle'), t('auth.kvkkRequired'));
      return;
    }

    const result = await registerCandidate({ fullName, email, eventLink, kvkkAccepted });
    if (result?.ok) {
      try {
        await openMailto({
          to: CONTACT_LINKS.email,
          subject: `${t('auth.passwordRequestButton')} - ${fullName.trim()}`,
          body: `${fullName.trim()} (${email.trim().toLowerCase()}) dogrulama ve giris icin sifre talep etti.\nEtkinlik linki: ${eventLink.trim()}`,
        });
      } catch {
        // Fall back to in-app confirmation when no mail app is available.
      }

      Alert.alert(
        t('auth.passwordRequestSuccessTitle'),
        result.message || t('auth.passwordRequestSuccessText'),
        [{ text: t('auth.ok'), onPress: () => navigation.navigate('Login') }],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View pointerEvents="none" style={styles.topOrb} />
      <View pointerEvents="none" style={styles.bottomOrb} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnLabel}>{t('common.back')}</Text>
          </TouchableOpacity>

          <View style={styles.topControls}>
            <SettingsButton />
          </View>
        </View>

        <View style={styles.headerCard}>
          <Text style={styles.title}>{t('auth.registerTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
          <Text style={styles.helperText}>{t('auth.registerPasswordInfo')}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{t('onboarding.progressTitle')}</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressPercent}%</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressCaption}>
            {t('onboarding.progressCaption', {
              watched: watchedCount,
              total: REQUIRED_VIDEO_IDS.length,
            })}
          </Text>
        </View>

        <View style={styles.videoListSection}>
          {videos.map((video, index) => {
            const isWatched = watched[video.id];
            const localSource = LOCAL_VIDEO_SOURCES[video.id];
            const isPlayableVideo = typeof localSource === 'number';
            const isPlaying = activeVideoId === video.id;

            return (
              <View key={video.id} style={styles.videoBlock}>
                <View style={styles.videoMetaRow}>
                  <Text style={styles.videoMeta}>
                    {index + 1}. {video.duration}
                  </Text>
                  <Text style={[styles.statusPill, isWatched ? styles.statusDone : styles.statusPending]}>
                    {isWatched ? t('onboarding.statusDone') : t('onboarding.statusPending')}
                  </Text>
                </View>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoSummary}>{video.summary}</Text>

                {isPlayableVideo ? (
                  <>
                    <View style={styles.videoFrame}>
                      <Video
                        source={{ uri: localSource as any }}
                        style={styles.videoPlayer}
                        controls
                        paused={!isPlaying}
                        resizeMode="contain"
                        onEnd={() => {
                          setActiveVideoId(null);
                          markVideoWatched(video.id);
                        }}
                      />
                    </View>
                    <View style={styles.videoControlRow}>
                      <Pressable
                        style={styles.playButton}
                        onPress={() =>
                          setActiveVideoId((prev) => (prev === video.id ? null : video.id))
                        }
                      >
                        <Text style={styles.playButtonText}>
                          {isPlaying ? t('onboarding.pause') : t('onboarding.play')}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}

                <Pressable
                  style={[styles.videoActionButton, isWatched && styles.videoActionButtonDone]}
                  onPress={() => toggleWatched(video.id)}
                >
                  <Text style={[styles.videoActionText, isWatched && styles.videoActionTextDone]}>
                    {isWatched ? t('onboarding.unmarkWatched') : t('onboarding.markWatched')}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {!allVideosWatched ? <Text style={styles.warningText}>{t('auth.registerWarning')}</Text> : null}

        <View style={styles.formCard}>
          <InputField
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('auth.fullNamePlaceholder')}
            autoCapitalize="words"
            style={styles.formControl}
          />
          <View style={styles.spacer16} />
          <InputField
            label={t('auth.emailRequired')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.formControl}
          />
          <View style={styles.spacer16} />
          <InputField
            label={t('auth.eventLinkLabel')}
            value={eventLink}
            onChangeText={setEventLink}
            placeholder={t('auth.eventLinkPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.formControl}
          />
        </View>

        <Card style={styles.kvkkCard}>
          <View style={styles.kvkkRow}>
            <View style={styles.kvkkTextWrap}>
              <Text style={styles.kvkkTitle}>{t('auth.kvkkTitle')}</Text>
              <Text style={styles.kvkkText}>{t('auth.kvkkText')}</Text>
            </View>
            <Switch
              value={kvkkAccepted}
              onValueChange={setKvkkAccepted}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isLoading ? t('auth.registerLoading') : t('auth.passwordRequestButton')}
          onPress={allVideosWatched ? handleRegister : undefined}
          style={allVideosWatched ? styles.registerButton : styles.registerButtonDisabled}
        />

        <ContactLinksCard
          title={t('auth.contactTitle')}
          subtitle={t('auth.contactSubtitle')}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>{t('auth.backToLogin')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,
    topOrb: {
      position: 'absolute',
      top: -120,
      right: -40,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: colors.orbOrange,
    } as ViewStyle,
    bottomOrb: {
      position: 'absolute',
      bottom: 80,
      left: -70,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: colors.tealLight,
    } as ViewStyle,
    scrollContent: {
      paddingHorizontal: 16,
      gap: 14,
    } as ViewStyle,
    topBar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    } as ViewStyle,
    topControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      flex: 1,
    } as ViewStyle,
    backBtn: {
      alignSelf: 'flex-start',
      minHeight: 42,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.rowBg,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    backBtnLabel: {
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
      fontWeight: '800',
    } as TextStyle,
    headerCard: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.primary,
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
    } as ViewStyle,
    title: {
      fontSize: 34,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.6,
    } as TextStyle,
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    } as TextStyle,
    helperText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
    progressCard: {
      width: '100%',
      backgroundColor: colors.cardBg,
      paddingHorizontal: 18,
      paddingVertical: 18,
      gap: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.primary,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    } as ViewStyle,
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    } as ViewStyle,
    progressTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    progressBadge: {
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHighest,
      paddingHorizontal: 11,
      paddingVertical: 5,
    } as ViewStyle,
    progressBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    progressTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHighest,
      overflow: 'hidden',
    } as ViewStyle,
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.primary,
    } as ViewStyle,
    progressCaption: {
      fontSize: 12,
      color: colors.textSecondary,
    } as TextStyle,
    videoListSection: {
      width: '100%',
      gap: 12,
    } as ViewStyle,
    videoBlock: {
      width: '100%',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 24,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.primary,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    } as ViewStyle,
    videoMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    } as ViewStyle,
    videoMeta: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.5,
    } as TextStyle,
    statusPill: {
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 11,
      fontSize: 11,
      fontWeight: '700',
      overflow: 'hidden',
    } as TextStyle,
    statusPending: {
      backgroundColor: colors.warning,
      color: colors.textPrimary,
    } as TextStyle,
    statusDone: {
      backgroundColor: colors.tertiaryContainer,
      color: colors.onTertiaryContainer,
    } as TextStyle,
    videoTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    } as TextStyle,
    videoSummary: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    } as TextStyle,
    videoFrame: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: '#000000',
    } as ViewStyle,
    videoPlayer: {
      width: '100%',
      height: '100%',
    } as ViewStyle,
    videoControlRow: {
      flexDirection: 'row',
      marginTop: 2,
    } as ViewStyle,
    playButton: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.rowBg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    playButtonText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    } as TextStyle,
    videoActionButton: {
      alignSelf: 'stretch',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
    } as ViewStyle,
    videoActionButtonDone: {
      backgroundColor: colors.tertiaryContainer,
      borderColor: colors.tealBorder,
    } as ViewStyle,
    videoActionText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    } as TextStyle,
    videoActionTextDone: {
      color: colors.onTertiaryContainer,
    } as TextStyle,
    warningText: {
      fontSize: 13,
      color: colors.danger,
      lineHeight: 18,
    } as TextStyle,
    formCard: {
      paddingHorizontal: 16,
      paddingVertical: 18,
      borderRadius: 24,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.primary,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    } as ViewStyle,
    formControl: {
      minHeight: 52,
      width: '100%',
    } as TextStyle,
    kvkkCard: {
      borderRadius: 24,
    } as ViewStyle,
    kvkkRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,
    kvkkTextWrap: {
      flex: 1,
    } as ViewStyle,
    kvkkTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    kvkkText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    } as TextStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
    } as TextStyle,
    registerButton: {
      minHeight: 54,
      width: '100%',
    } as ViewStyle,
    registerButtonDisabled: {
      minHeight: 54,
      width: '100%',
      backgroundColor: colors.muted,
      opacity: 0.9,
    } as ViewStyle,
    loginText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
    } as TextStyle,
    spacer16: {
      height: 16,
    } as ViewStyle,
  });
