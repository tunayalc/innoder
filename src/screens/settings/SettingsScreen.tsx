import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  LanguageSwitcher,
  ThemeSwitcher,
} from '../../components';
import { useI18n } from '../../i18n';
import { useThemedStyles, type AppColors } from '../../theme';

export const SettingsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.themeTitle')}</Text>
        <Text style={styles.cardText}>{t('settings.themeText')}</Text>
        <ThemeSwitcher />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.languageTitle')}</Text>
        <Text style={styles.cardText}>{t('settings.languageText')}</Text>
        <LanguageSwitcher />
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 14,
      backgroundColor: colors.background,
    } as ViewStyle,
    heroCard: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 24,
      padding: 20,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    } as TextStyle,
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 20,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
    } as ViewStyle,
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    } as TextStyle,
    cardText: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
    } as TextStyle,
  });
