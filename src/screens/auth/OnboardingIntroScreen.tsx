import React from 'react';
import {
  Image,
  ImageStyle,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, FeatureRow, SettingsButton } from '../../components';
import { useI18n } from '../../i18n';
import { layout, useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';

// Entry screen: brand-red hero with the white wordmark, then a sheet with the value and actions.
export const OnboardingIntroScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { t, language } = useI18n();
  const en = language === 'en';

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.topControls}>
            <SettingsButton />
          </View>
          <Image
            source={require('../../assets/images/inno-wordmark-white.png')}
            accessibilityLabel="Inno Derneği"
            resizeMode="contain"
            style={styles.logo}
          />
          <Text accessibilityRole="header" style={styles.title}>{t('entry.title')}</Text>
          <Text style={styles.tagline}>
            {en
              ? 'Your ESC and Erasmus+ journey with the association, in one place.'
              : 'Dernekle ESC ve Erasmus+ yolculuğun tek bir yerde.'}
          </Text>
        </View>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.features}>
            <FeatureRow
              icon="clipboard-check-outline"
              title={en ? 'Track your application' : 'Başvurunu takip et'}
              description={en ? 'See every step, deadline and decision.' : 'Her adımı, son tarihi ve kararı gör.'}
            />
            <FeatureRow
              icon="file-upload-outline"
              title={en ? 'Upload documents' : 'Belgelerini yükle'}
              description={en ? 'Scan with your camera or pick a PDF.' : 'Kamerayla tara ya da PDF seç.'}
            />
            <FeatureRow
              icon="message-text-outline"
              title={en ? 'Talk to the association' : 'Dernekle yazış'}
              description={en ? 'Private messages, answered by the team.' : 'Ekibin yanıtladığı birebir mesajlar.'}
            />
          </View>

          <Button label={t('auth.loginButton')} onPress={() => navigation.navigate('Login')} style={styles.button} />
          <Button label={t('auth.registerTitle')} variant="outline" onPress={() => navigation.navigate('Register')} style={styles.button} />
          <Text style={styles.hint}>{t('entry.registerHint')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.brandRed } as ViewStyle,
    scroll: { flexGrow: 1 } as ViewStyle,
    hero: {
      backgroundColor: colors.brandRed,
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 44,
      gap: 14,
    } as ViewStyle,
    topControls: { flexDirection: 'row', justifyContent: 'flex-end' } as ViewStyle,
    logo: { width: 190, height: 72, marginTop: 8 } as ImageStyle,
    title: { fontSize: 34, lineHeight: 40, fontWeight: '700', color: colors.white } as TextStyle,
    tagline: { fontSize: 17, lineHeight: 24, color: colors.white, opacity: 0.92, maxWidth: 420 } as TextStyle,
    sheet: {
      flexGrow: 1,
      marginTop: -24,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.background,
      paddingHorizontal: layout.screenPadding,
      paddingTop: 22,
      gap: 12,
    } as ViewStyle,
    features: { marginBottom: 8 } as ViewStyle,
    button: { minHeight: 54, width: '100%', maxWidth: layout.formMaxWidth, alignSelf: 'center' } as ViewStyle,
    hint: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' } as TextStyle,
  });
