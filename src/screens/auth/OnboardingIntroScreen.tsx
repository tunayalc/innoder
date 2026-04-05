import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  SettingsButton,
} from '../../components';
import { appConfig } from '../../config/appConfig';
import { useAuth } from '../../hooks';
import { useI18n } from '../../i18n';
import { useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';

export const OnboardingIntroScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { loginDemoCandidate } = useAuth();
  const { t } = useI18n();
  const isMockMode = appConfig.dataSource === 'mock';

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.topOrb} />
      <View pointerEvents="none" style={styles.bottomOrb} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topControls}>
          <SettingsButton />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.title}>{t('entry.title')}</Text>
          <Text style={styles.subtitle}>{t('entry.subtitle')}</Text>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>{t('entry.actionsTitle')}</Text>

          {isMockMode ? (
            <Button
              label={t('auth.demoButton')}
              onPress={() => loginDemoCandidate(false)}
              style={styles.primaryButton}
            />
          ) : null}

          <Button
            label={t('auth.loginButton')}
            variant={isMockMode ? 'ghost' : 'solid'}
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryButton}
          />

          <Button
            label={t('auth.registerTitle')}
            variant="ghost"
            onPress={() => navigation.navigate('Register')}
            style={styles.secondaryButton}
          />

          <Text style={styles.registerHint}>{t('entry.registerHint')}</Text>
        </View>

      </ScrollView>
    </View>
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
    topControls: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    } as ViewStyle,
    heroCard: {
      width: '100%',
      backgroundColor: colors.surfaceContainerLow,
      paddingHorizontal: 20,
      paddingVertical: 24,
      gap: 8,
      borderRadius: 28,
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
      color: colors.textSecondary,
      lineHeight: 22,
    } as TextStyle,
    actionsCard: {
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
    actionsTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    primaryButton: {
      minHeight: 54,
      width: '100%',
    } as ViewStyle,
    secondaryButton: {
      minHeight: 54,
      width: '100%',
    } as ViewStyle,
    registerHint: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
  });
