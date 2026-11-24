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
  BrandWordmark,
  SettingsButton,
} from '../../components';
import { useI18n } from '../../i18n';
import { layout, useThemedStyles, type AppColors } from '../../theme';
import { RootStackNavigationProp } from '../../types';

export const OnboardingIntroScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topControls}>
          <SettingsButton />
        </View>

        <View style={styles.heroCard}>
          <BrandWordmark />
          <Text accessibilityRole="header" style={styles.title}>{t('entry.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>{t('entry.actionsTitle')}</Text>

          <Button
            label={t('auth.loginButton')}
            onPress={() => navigation.navigate('Login')}
            style={styles.primaryButton}
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
    scrollContent: {
      paddingTop: 16,
      width: '100%',
      maxWidth: layout.formMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.screenPadding,
      gap: 24,
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
      gap: 16,
    } as ViewStyle,
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    } as TextStyle,
    actionsCard: {
      width: '100%',
      gap: 12,
    } as ViewStyle,
    actionsTitle: {
      fontSize: 16,
      fontWeight: '600',
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
