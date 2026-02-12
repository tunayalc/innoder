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
} from 'react-native';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { Card } from '../../components';
import { RootStackNavigationProp } from '../../types';
import { appConfig } from '../../config/appConfig';

const APP_LAUNCHER_IMAGE = require('../../assets/images/app-launcher.jpg');
const ESC_INTRO_VIDEO = require('../../assets/videos/esc-intro.mp4');

const REQUIRED_VIDEOS = [
  {
    id: 'video-1',
    title: 'ESC Projeleri Basvuru Sureci',
    duration: 'Yerel Video',
    summary:
      'Inno Dernegi, Italya gonulluluk sureci ve projelere katilim adimlarini bu videodan izleyin.',
  },
  {
    id: 'video-2',
    title: 'Aday Sorumluluklari',
    duration: '05:10',
    summary: 'Basvuru surecindeki sorumluluklar ve dogrulama adimlari.',
  },
  {
    id: 'video-3',
    title: 'Belge ve Etik Kurallar',
    duration: '03:45',
    summary: 'Belge yukleme, dogruluk beyani ve gizlilik kurallari.',
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

  const toggleWatched = (videoId: string) => {
    setWatched((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>Bilgilendirme Alani</Text>
          <Text style={styles.subtitle}>
            Uygulamaya girmeden once bilgilendirme videolarini tamamlayin veya
            onay beyanini isaretleyin.
          </Text>
        </View>

        <Card style={styles.logoCard}>
          <Image source={APP_LAUNCHER_IMAGE} style={styles.logoImage} resizeMode="cover" />
          <Text style={styles.logoCaption}>Uygulama simgesi ve tanitim gorseli</Text>
        </Card>

        {isMockMode ? (
          <Card style={styles.mockInfoCard}>
            <Text style={styles.mockInfoTitle}>Demo Giris Bilgisi</Text>
            <Text style={styles.mockInfoText}>Email: aday@inno.com</Text>
            <Text style={styles.mockInfoText}>Sifre: 123123</Text>
          </Card>
        ) : null}

        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>Video Tamamlama Durumu</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(watchedCount / REQUIRED_VIDEOS.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {watchedCount}/{REQUIRED_VIDEOS.length} video tamamlandi
          </Text>
        </Card>

        <View style={styles.videoList}>
          {REQUIRED_VIDEOS.map((video, index) => {
            const isWatched = watched[video.id];
            const isPrimaryVideo = index === 0;

            return (
              <Card key={video.id} style={styles.videoCard}>
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
                    {isWatched ? 'Izlendi' : 'Bekliyor'}
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
                    {isWatched ? 'Izlemeyi Geri Al' : 'Videoyu Izledim'}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>

        <Card style={styles.ackCard}>
          <View style={styles.ackRow}>
            <View style={styles.ackTextWrap}>
              <Text style={styles.ackTitle}>Beyanim</Text>
              <Text style={styles.ackDescription}>
                Inno Dernegi ile ilgili icerikleri daha once izledim, tum
                sorumluluklari biliyorum ve kabul ediyorum.
              </Text>
            </View>
            <Switch
              value={alreadyInformed}
              onValueChange={setAlreadyInformed}
              trackColor={{ false: colors.muted, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

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
            Giris Yap
          </Text>
        </Pressable>

        {!canContinue ? (
          <Text style={styles.helperText}>
            Giris icin tum videolari tamamlayin veya beyan onayini acin.
          </Text>
        ) : null}
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
    paddingHorizontal: 22,
    gap: 14,
  } as ViewStyle,
  header: {
    marginBottom: 2,
  } as ViewStyle,
  accentBar: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: 14,
  } as ViewStyle,
  title: {
    fontSize: 31,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 8,
  } as TextStyle,
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  } as TextStyle,
  logoCard: {
    gap: 10,
  } as ViewStyle,
  logoImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  } as ImageStyle,
  logoCaption: {
    fontSize: 13,
    color: colors.textSecondary,
  } as TextStyle,
  progressCard: {
    marginTop: 8,
    gap: 10,
  } as ViewStyle,
  mockInfoCard: {
    gap: 4,
    borderColor: colors.tealBorder,
    backgroundColor: colors.tealBg,
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
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
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
  progressCaption: {
    fontSize: 13,
    color: colors.textSecondary,
  } as TextStyle,
  videoList: {
    gap: 12,
  } as ViewStyle,
  videoCard: {
    gap: 12,
  } as ViewStyle,
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  videoMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  } as TextStyle,
  statusPill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  videoSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
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
  videoControlRow: {
    flexDirection: 'row',
  } as ViewStyle,
  playButton: {
    alignSelf: 'flex-start',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.tealBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.tealLight,
  } as ViewStyle,
  playButtonText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '700',
  } as TextStyle,
  videoActionButton: {
    alignSelf: 'flex-start',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  } as ViewStyle,
  videoActionButtonDone: {
    borderColor: colors.tealBorder,
    backgroundColor: colors.tealLight,
  } as ViewStyle,
  videoActionText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  } as TextStyle,
  videoActionTextDone: {
    color: colors.teal,
  } as TextStyle,
  ackCard: {
    marginTop: 4,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  } as TextStyle,
  ackDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  loginButton: {
    marginTop: 6,
    borderRadius: 13,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
  } as ViewStyle,
  loginButtonDisabled: {
    backgroundColor: colors.placeholder,
  } as ViewStyle,
  loginButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  } as TextStyle,
  loginButtonTextDisabled: {
    color: colors.textMuted,
  } as TextStyle,
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  } as TextStyle,
});
