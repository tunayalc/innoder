import React, { useMemo, useState } from 'react';
import {
  Image,
  ImageStyle,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, LanguageSwitcher, ThemeSwitcher } from '../../components';
import { appConfig } from '../../config/appConfig';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';

const APP_LAUNCHER_IMAGE = require('../../assets/images/app-launcher.jpg');
const ESC_INTRO_VIDEO = require('../../assets/videos/esc-intro.mp4');
const REQUIRED_VIDEO_IDS = ['video-1', 'video-2', 'video-3'] as const;

type VideoId = (typeof REQUIRED_VIDEO_IDS)[number];
type WatchedState = Record<VideoId, boolean>;
type VideoTranslation = {
  id: VideoId;
  title: string;
  duration: string;
  summary: string;
};

const createInitialWatchState = (): WatchedState => ({
  'video-1': false,
  'video-2': false,
  'video-3': false,
});

const readTranslationString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

export const OnboardingIntroScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const { loginDemoCandidate } = useAuth();
  const { colors } = useAppTheme();
  const { t, tm } = useI18n();
  const styles = useThemedStyles(createStyles);
  const [watched, setWatched] = useState<WatchedState>(createInitialWatchState);
  const [alreadyInformed, setAlreadyInformed] = useState(false);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = useState(false);
  const isMockMode = appConfig.dataSource === 'mock';

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
  const canLogin = allVideosWatched || alreadyInformed;

  const toggleWatched = (videoId: VideoId) => {
    setWatched((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const markVideoWatched = (videoId: VideoId) => {
    setWatched((prev) => {
      if (prev[videoId]) {
        return prev;
      }

      return {
        ...prev,
        [videoId]: true,
      };
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerControls}>
          <ThemeSwitcher compact />
          <LanguageSwitcher compact />
        </View>

        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
        </View>

        <Card style={styles.logoCard}>
          <Image source={APP_LAUNCHER_IMAGE} style={styles.logoImage} resizeMode="cover" />
          <Text style={styles.logoCaption}>{t('onboarding.launcherCaption')}</Text>
        </Card>

        {isMockMode ? (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('onboarding.demoTitle')}</Text>
            <Text style={styles.infoText}>{t('onboarding.demoEmail')}</Text>
            <Text style={styles.infoText}>{t('onboarding.demoPassword')}</Text>
            <Pressable style={styles.demoButton} onPress={() => loginDemoCandidate()}>
              <Text style={styles.demoButtonText}>{t('onboarding.demoCta')}</Text>
            </Pressable>
          </Card>
        ) : null}

        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>{t('onboarding.progressTitle')}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(watchedCount / REQUIRED_VIDEO_IDS.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {t('onboarding.progressCaption', {
              watched: watchedCount,
              total: REQUIRED_VIDEO_IDS.length,
            })}
          </Text>
        </Card>

        <View style={styles.videoList}>
          {videos.map((video, index) => {
            const isWatched = watched[video.id];
            const isPrimaryVideo = index === 0;

            return (
              <Card key={video.id} style={styles.videoCard}>
                <View style={styles.videoMetaRow}>
                  <Text style={styles.videoMeta}>
                    {index + 1}. {video.duration}
                  </Text>
                  <Text
                    style={[
                      styles.statusPill,
                      isWatched ? styles.statusDone : styles.statusPending,
                    ]}
                  >
                    {isWatched ? t('onboarding.statusDone') : t('onboarding.statusPending')}
                  </Text>
                </View>

                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoSummary}>{video.summary}</Text>

                {isPrimaryVideo ? (
                  <>
                    <View style={styles.videoFrame}>
                      <Video
                        source={ESC_INTRO_VIDEO}
                        style={styles.videoPlayer}
                        controls
                        paused={!isIntroVideoPlaying}
                        resizeMode="contain"
                        onEnd={() => {
                          setIsIntroVideoPlaying(false);
                          markVideoWatched(video.id);
                        }}
                      />
                    </View>

                    <View style={styles.videoControlRow}>
                      <Pressable
                        style={styles.playButton}
                        onPress={() => setIsIntroVideoPlaying((prev) => !prev)}
                      >
                        <Text style={styles.playButtonText}>
                          {isIntroVideoPlaying ? t('onboarding.pause') : t('onboarding.play')}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}

                <Pressable
                  style={[
                    styles.videoActionButton,
                    isWatched && styles.videoActionButtonDone,
                  ]}
                  onPress={() => toggleWatched(video.id)}
                >
                  <Text
                    style={[
                      styles.videoActionText,
                      isWatched && styles.videoActionTextDone,
                    ]}
                  >
                    {isWatched ? t('onboarding.unmarkWatched') : t('onboarding.markWatched')}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>

        <Card style={styles.declarationCard}>
          <View style={styles.declarationRow}>
            <View style={styles.declarationTextWrap}>
              <Text style={styles.declarationTitle}>{t('onboarding.declarationTitle')}</Text>
              <Text style={styles.declarationText}>{t('onboarding.declarationText')}</Text>
            </View>
            <Switch
              value={alreadyInformed}
              onValueChange={setAlreadyInformed}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.helperText}>{t('onboarding.helper')}</Text>
        </Card>

        <Pressable
          style={[styles.primaryButton, !canLogin && styles.primaryButtonDisabled]}
          onPress={() => navigation.navigate('Login')}
          disabled={!canLogin}
        >
          <Text style={[styles.primaryButtonText, !canLogin && styles.primaryButtonTextDisabled]}>
            {t('onboarding.login')}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, !allVideosWatched && styles.secondaryButtonDisabled]}
          onPress={() => navigation.navigate('Register', { videosCompleted: allVideosWatched })}
          disabled={!allVideosWatched}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              !allVideosWatched && styles.secondaryButtonTextDisabled,
            ]}
          >
            {t('onboarding.register')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    scrollContent: { paddingHorizontal: 22, gap: 14 } as ViewStyle,
    headerControls: { flexDirection: 'row', gap: 8, alignSelf: 'flex-start' } as ViewStyle,
    header: { gap: 8 } as ViewStyle,
    accentBar: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.primary } as ViewStyle,
    title: { fontSize: 31, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary } as TextStyle,
    logoCard: { gap: 10 } as ViewStyle,
    logoImage: { width: '100%', height: 160, borderRadius: 12 } as ImageStyle,
    logoCaption: { fontSize: 13, color: colors.textSecondary } as TextStyle,
    infoCard: { gap: 6 } as ViewStyle,
    infoTitle: { fontSize: 14, fontWeight: '700', color: colors.teal } as TextStyle,
    infoText: { fontSize: 13, color: colors.textPrimary } as TextStyle,
    demoButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.tealBorder,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    demoButtonText: { fontSize: 12, fontWeight: '700', color: colors.teal } as TextStyle,
    progressCard: { gap: 10 } as ViewStyle,
    progressTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.tealSoft,
      overflow: 'hidden',
    } as ViewStyle,
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.teal,
    } as ViewStyle,
    progressCaption: { fontSize: 13, color: colors.textSecondary } as TextStyle,
    videoList: { gap: 12 } as ViewStyle,
    videoCard: { gap: 12 } as ViewStyle,
    videoMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    } as ViewStyle,
    videoMeta: { fontSize: 12, fontWeight: '600', color: colors.textSecondary } as TextStyle,
    statusPill: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 11,
      fontWeight: '700',
      overflow: 'hidden',
    } as TextStyle,
    statusPending: {
      backgroundColor: colors.warning,
      color: colors.primaryDark,
    } as TextStyle,
    statusDone: {
      backgroundColor: colors.success,
      color: colors.teal,
    } as TextStyle,
    videoTitle: { fontSize: 19, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    videoSummary: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    } as TextStyle,
    videoFrame: {
      width: '100%',
      height: 220,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#000000',
    } as ViewStyle,
    videoPlayer: {
      width: '100%',
      height: '100%',
    } as ViewStyle,
    videoControlRow: { flexDirection: 'row' } as ViewStyle,
    playButton: {
      alignSelf: 'flex-start',
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.tealBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.tealLight,
    } as ViewStyle,
    playButtonText: { fontSize: 13, fontWeight: '700', color: colors.teal } as TextStyle,
    videoActionButton: {
      alignSelf: 'flex-start',
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    videoActionButtonDone: {
      borderColor: colors.tealBorder,
      backgroundColor: colors.tealLight,
    } as ViewStyle,
    videoActionText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark } as TextStyle,
    videoActionTextDone: { color: colors.teal } as TextStyle,
    declarationCard: { marginTop: 2 } as ViewStyle,
    declarationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    } as ViewStyle,
    declarationTextWrap: { flex: 1 } as ViewStyle,
    declarationTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary } as TextStyle,
    declarationText: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
    helperText: { fontSize: 13, lineHeight: 20, color: colors.textSecondary } as TextStyle,
    primaryButton: {
      borderRadius: 13,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      alignItems: 'center',
    } as ViewStyle,
    primaryButtonDisabled: { backgroundColor: colors.placeholder } as ViewStyle,
    primaryButtonText: { color: colors.white, fontSize: 17, fontWeight: '700' } as TextStyle,
    primaryButtonTextDisabled: { color: colors.textMuted } as TextStyle,
    secondaryButton: {
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.cardBg,
      paddingVertical: 14,
      alignItems: 'center',
    } as ViewStyle,
    secondaryButtonDisabled: {
      borderColor: colors.borderMedium,
      backgroundColor: colors.rowBg,
    } as ViewStyle,
    secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '700' } as TextStyle,
    secondaryButtonTextDisabled: { color: colors.textMuted } as TextStyle,
  });
