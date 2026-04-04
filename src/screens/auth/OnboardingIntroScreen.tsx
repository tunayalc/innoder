import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ScrollView,
  Pressable,
  Switch,
  Image,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../types';
import { appConfig } from '../../config/appConfig';

const APP_LAUNCHER_IMAGE = require('../../assets/images/app-launcher.jpg');
const ESC_INTRO_VIDEO = require('../../assets/videos/esc-intro.mp4');
const expressive = {
  background: '#FFF7FF',
  surface: '#FFFFFF',
  surfaceContainerLow: '#FBF0FF',
  surfaceContainer: '#F7E9FF',
  surfaceContainerHigh: '#F3E2FF',
  surfaceContainerHighest: '#EFDBFF',
  surfaceVariant: '#EFDBFF',
  primary: '#6850A5',
  primaryDim: '#5B4498',
  primaryContainer: '#CAB6FF',
  onPrimary: '#FDF7FF',
  onPrimaryContainer: '#442C7F',
  tertiaryContainer: '#C2FFA2',
  onTertiaryContainer: '#1E5107',
  textPrimary: '#3D2A51',
  textSecondary: '#6B5681',
  outline: '#88729E',
  outlineVariant: '#C1A8D8',
  muted: '#C8BDE0',
  warningBg: '#F7DBE3',
} as const;

const REQUIRED_VIDEOS = [
  {
    id: 'video-1',
    title: 'ESC Projeleri Başvuru Süreci',
    duration: 'Yerel Video',
    summary:
      'Inno Derneği, İtalya gönüllülük süreci ve projelere katılım adımlarını bu videodan izleyin.',
  },
  {
    id: 'video-2',
    title: 'Aday Sorumlulukları',
    duration: '05:10',
    summary: 'Başvuru sürecindeki sorumluluklar ve doğrulama adımları.',
  },
  {
    id: 'video-3',
    title: 'Belge ve Etik Kurallar',
    duration: '03:45',
    summary: 'Belge yükleme, doğruluk beyanı ve gizlilik kuralları.',
  },
] as const;

const createInitialWatchState = (): Record<string, boolean> =>
  REQUIRED_VIDEOS.reduce<Record<string, boolean>>((acc, video) => {
    acc[video.id] = false;
    return acc;
  }, {});

export const OnboardingIntroScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const [watched, setWatched] = useState<Record<string, boolean>>(
    createInitialWatchState(),
  );
  const [alreadyInformed, setAlreadyInformed] = useState(false);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = useState(false);
  const isMockMode = appConfig.dataSource === 'mock';

  const watchedCount = useMemo(
    () => REQUIRED_VIDEOS.filter((video) => watched[video.id]).length,
    [watched],
  );

  const allVideosWatched = watchedCount === REQUIRED_VIDEOS.length;
  const canContinue = allVideosWatched || alreadyInformed;
  const progressPercent = Math.round((watchedCount / REQUIRED_VIDEOS.length) * 100);

  const setWatchedState = (videoId: string, nextValue: boolean) => {
    setWatched((prev) => ({
      ...prev,
      [videoId]: nextValue,
    }));
  };

  const handleWatchAction = (videoId: string, isWatched: boolean) => {
    if (isWatched) {
      setWatchedState(videoId, false);
      return;
    }

    Alert.alert(
      'İzleme Onayı',
      "Videoyu izlediğinizi onaylıyor musunuz? 'Tamam' seçimi, videoyu izlediğinize dair beyanınız olarak kabul edilir.",
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tamam',
          onPress: () => setWatchedState(videoId, true),
        },
      ],
      { cancelable: true },
    );
  };

  const setVideo1Watched = () => {
    setWatched((prev) => ({
      ...prev,
      'video-1': true,
    }));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.topOrb} />
        <View pointerEvents="none" style={styles.bottomOrb} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.headerSection, { paddingTop: 18 }]}>
          <Text style={styles.title}>Bilgilendirme Alanı</Text>
          <Text style={styles.subtitle}>
            Uygulamaya girmeden önce videoları tamamlayın veya beyan onayını
            açın.
          </Text>
        </View>

        <View style={styles.logoSection}>
          <Image source={APP_LAUNCHER_IMAGE} style={styles.logoImage} resizeMode="cover" />
          <Text style={styles.logoCaption}>Uygulama simgesi ve tanıtım görseli</Text>
        </View>

        {isMockMode ? (
          <View style={styles.mockInfoSection}>
            <Text style={styles.mockInfoTitle}>Demo Giriş Bilgisi</Text>
            <Text style={styles.mockInfoText}>Email: aday@inno.com</Text>
            <Text style={styles.mockInfoText}>Şifre: 123123</Text>
          </View>
        ) : null}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Video Tamamlama Durumu</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressPercent}%</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {watchedCount}/{REQUIRED_VIDEOS.length} video tamamlandı
          </Text>
        </View>

        <View style={styles.videoListSection}>
          {REQUIRED_VIDEOS.map((video, index) => {
            const isWatched = watched[video.id];
            const isPrimaryVideo = index === 0;
            const isButtonDone = isWatched || alreadyInformed;

            return (
              <View
                key={video.id}
                style={[styles.videoBlock, index % 2 === 0 ? styles.videoBlockLight : styles.videoBlockDark]}
              >
                <View style={styles.videoMetaRow}>
                  <Text style={styles.videoMeta}>
                    {index + 1}. Video - {video.duration}
                  </Text>
                  <Text
                    style={[
                      styles.statusPill,
                      isWatched ? styles.statusDone : styles.statusPending,
                    ]}
                  >
                    {isWatched ? 'İzlendi' : 'Bekliyor'}
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
                          setVideo1Watched();
                        }}
                      />
                    </View>
                    <View style={styles.videoControlRow}>
                      <Pressable
                        style={({ pressed }) => [styles.playButton, pressed && styles.pressedScale]}
                        onPress={() => setIsIntroVideoPlaying((prev) => !prev)}
                      >
                        <Text style={styles.playButtonText}>
                          {isIntroVideoPlaying ? 'Videoyu Durdur' : 'Videoyu Oynat'}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.videoActionButton,
                    pressed && styles.pressedScale,
                    isButtonDone && styles.videoActionButtonDone,
                  ]}
                  onPress={() => handleWatchAction(video.id, isWatched)}
                >
                  <Text
                    style={[
                      styles.videoActionText,
                      isButtonDone && styles.videoActionTextDone,
                    ]}
                  >
                    {isWatched ? 'İzlemeyi Geri Al' : 'Videoyu İzledim'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.ackSection}>
          <View style={styles.ackRow}>
            <View style={styles.ackTextWrap}>
              <Text style={styles.ackTitle}>Beyanım</Text>
              <Text style={styles.ackDescription}>
                Inno Derneği ile ilgili içerikleri daha önce izledim, tüm
                sorumlulukları biliyorum ve kabul ediyorum.
              </Text>
            </View>
            <Switch
              value={alreadyInformed}
              onValueChange={setAlreadyInformed}
              trackColor={{ false: expressive.muted, true: expressive.primary }}
              thumbColor={expressive.surface}
            />
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.pressedScale,
              pressed && styles.pressedDim,
              !canContinue && styles.loginButtonDisabled,
            ]}
            disabled={!canContinue}
            onPress={() => navigation.navigate('Login')}
          >
            <Text
              style={[
                styles.loginButtonText,
                !canContinue && styles.loginButtonTextDisabled,
              ]}
            >
              Giriş Yap
            </Text>
          </Pressable>

          {!canContinue ? (
            <Text style={styles.helperText}>
              Giriş için tüm videoları tamamlayın veya beyan onayını açın.
            </Text>
          ) : null}
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: expressive.background,
  } as ViewStyle,
  container: {
    flex: 1,
    backgroundColor: expressive.background,
  } as ViewStyle,
  topOrb: {
    position: 'absolute',
    top: -120,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(202, 182, 255, 0.36)',
  } as ViewStyle,
  bottomOrb: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(194, 255, 162, 0.18)',
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  } as ViewStyle,
  headerSection: {
    width: '100%',
    backgroundColor: expressive.surfaceContainerLow,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderRadius: 28,
    shadowColor: expressive.primary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  } as ViewStyle,
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: expressive.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 8,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: expressive.textSecondary,
    lineHeight: 22,
  } as TextStyle,
  logoSection: {
    width: '100%',
    backgroundColor: expressive.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    borderRadius: 24,
    shadowColor: expressive.primary,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  } as ViewStyle,
  logoImage: {
    width: '100%',
    height: 170,
    borderRadius: 18,
  } as ImageStyle,
  logoCaption: {
    fontSize: 12,
    color: expressive.textSecondary,
  } as TextStyle,
  mockInfoSection: {
    width: '100%',
    backgroundColor: expressive.tertiaryContainer,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 4,
    borderRadius: 22,
  } as ViewStyle,
  mockInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: expressive.onTertiaryContainer,
    marginBottom: 2,
  } as TextStyle,
  mockInfoText: {
    fontSize: 13,
    color: expressive.onTertiaryContainer,
  } as TextStyle,
  progressSection: {
    width: '100%',
    backgroundColor: expressive.surface,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
    borderRadius: 24,
    shadowColor: expressive.primary,
    shadowOpacity: 0.04,
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
    color: expressive.textPrimary,
  } as TextStyle,
  progressBadge: {
    borderRadius: 999,
    backgroundColor: expressive.primaryContainer,
    paddingHorizontal: 11,
    paddingVertical: 5,
  } as ViewStyle,
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: expressive.onPrimaryContainer,
  } as TextStyle,
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: expressive.surfaceContainerHighest,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: expressive.primary,
  } as ViewStyle,
  progressCaption: {
    fontSize: 12,
    color: expressive.textSecondary,
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
    shadowColor: expressive.primary,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  } as ViewStyle,
  videoBlockLight: {
    backgroundColor: expressive.surface,
  } as ViewStyle,
  videoBlockDark: {
    backgroundColor: expressive.surface,
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
    color: expressive.textSecondary,
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
    backgroundColor: expressive.warningBg,
    color: expressive.onPrimaryContainer,
  } as TextStyle,
  statusDone: {
    backgroundColor: expressive.tertiaryContainer,
    color: expressive.onTertiaryContainer,
  } as TextStyle,
  videoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: expressive.textPrimary,
    letterSpacing: -0.2,
  } as TextStyle,
  videoSummary: {
    fontSize: 13,
    color: expressive.textSecondary,
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
    backgroundColor: expressive.surfaceContainerHigh,
    alignItems: 'center',
  } as ViewStyle,
  playButtonText: {
    color: expressive.onPrimaryContainer,
    fontSize: 14,
    fontWeight: '700',
  } as TextStyle,
  videoActionButton: {
    alignSelf: 'stretch',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: expressive.surface,
    alignItems: 'center',
  } as ViewStyle,
  videoActionButtonDone: {
    backgroundColor: expressive.tertiaryContainer,
  } as ViewStyle,
  videoActionText: {
    color: expressive.onPrimaryContainer,
    fontSize: 14,
    fontWeight: '800',
  } as TextStyle,
  videoActionTextDone: {
    color: expressive.onTertiaryContainer,
  } as TextStyle,
  ackSection: {
    width: '100%',
    backgroundColor: expressive.surface,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 24,
    shadowColor: expressive.primary,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  } as ViewStyle,
  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  } as ViewStyle,
  ackTextWrap: {
    flex: 1,
  } as ViewStyle,
  ackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: expressive.textPrimary,
    marginBottom: 5,
  } as TextStyle,
  ackDescription: {
    fontSize: 13,
    color: expressive.textSecondary,
    lineHeight: 19,
  } as TextStyle,
  ctaSection: {
    width: '100%',
    backgroundColor: expressive.surface,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderRadius: 24,
    shadowColor: expressive.primary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  } as ViewStyle,
  loginButton: {
    alignSelf: 'stretch',
    borderRadius: 18,
    backgroundColor: expressive.primary,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: expressive.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  } as ViewStyle,
  loginButtonDisabled: {
    backgroundColor: expressive.muted,
    shadowOpacity: 0,
  } as ViewStyle,
  loginButtonText: {
    color: expressive.onPrimary,
    fontSize: 14,
    fontWeight: '800',
  } as TextStyle,
  loginButtonTextDisabled: {
    color: expressive.textSecondary,
  } as TextStyle,
  helperText: {
    fontSize: 12,
    color: expressive.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 10,
    paddingHorizontal: 4,
  } as TextStyle,
  pressedScale: {
    transform: [{ scale: 0.98 }],
  } as ViewStyle,
  pressedDim: {
    opacity: 0.88,
  } as ViewStyle,
});
