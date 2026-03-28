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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { RootStackNavigationProp } from '../../types';
import { appConfig } from '../../config/appConfig';

const APP_LAUNCHER_IMAGE = require('../../assets/images/app-launcher.jpg');
const ESC_INTRO_VIDEO = require('../../assets/videos/esc-intro.mp4');

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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerSection, { paddingTop: insets.top + 18 }]}>
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
                        style={styles.playButton}
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
                  style={[
                    styles.videoActionButton,
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
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Pressable
            style={[styles.loginButton, !canContinue && styles.loginButtonDisabled]}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 0,
    gap: 0,
  } as ViewStyle,
  headerSection: {
    width: '100%',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  } as ViewStyle,
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  } as TextStyle,
  logoSection: {
    width: '100%',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  } as ViewStyle,
  logoImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
  } as ImageStyle,
  logoCaption: {
    fontSize: 12,
    color: colors.textSecondary,
  } as TextStyle,
  mockInfoSection: {
    width: '100%',
    backgroundColor: colors.tealBg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 4,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.tealBorder,
  } as ViewStyle,
  mockInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
    marginBottom: 2,
  } as TextStyle,
  mockInfoText: {
    fontSize: 13,
    color: colors.textPrimary,
  } as TextStyle,
  progressSection: {
    width: '100%',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  } as ViewStyle,
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  } as ViewStyle,
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  progressBadge: {
    borderRadius: 999,
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: colors.tealBorder,
    paddingHorizontal: 11,
    paddingVertical: 5,
  } as ViewStyle,
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  } as TextStyle,
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.tealSoft,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.teal,
  } as ViewStyle,
  progressCaption: {
    fontSize: 12,
    color: colors.textSecondary,
  } as TextStyle,
  videoListSection: {
    width: '100%',
    backgroundColor: colors.background,
  } as ViewStyle,
  videoBlock: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  } as ViewStyle,
  videoBlockLight: {
    backgroundColor: colors.background,
  } as ViewStyle,
  videoBlockDark: {
    backgroundColor: colors.rowBg,
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
    letterSpacing: 0.3,
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
    color: colors.primaryDark,
  } as TextStyle,
  statusDone: {
    backgroundColor: colors.success,
    color: colors.teal,
  } as TextStyle,
  videoTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  videoSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tealBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
  } as ViewStyle,
  playButtonText: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: '700',
  } as TextStyle,
  videoActionButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
  } as ViewStyle,
  videoActionButtonDone: {
    borderColor: colors.tealBorder,
    backgroundColor: colors.tealLight,
  } as ViewStyle,
  videoActionText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  } as TextStyle,
  videoActionTextDone: {
    color: colors.teal,
  } as TextStyle,
  ackSection: {
    width: '100%',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5,
  } as TextStyle,
  ackDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  } as TextStyle,
  ctaSection: {
    width: '100%',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  } as ViewStyle,
  loginButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  } as ViewStyle,
  loginButtonDisabled: {
    backgroundColor: colors.placeholder,
  } as ViewStyle,
  loginButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  } as TextStyle,
  loginButtonTextDisabled: {
    color: colors.textMuted,
  } as TextStyle,
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 10,
    paddingHorizontal: 4,
  } as TextStyle,
});
