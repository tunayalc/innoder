import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { AppLanguage, useI18n } from '../i18n';
import { useThemedStyles, type AppColors } from '../theme';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { language, setLanguage, t } = useI18n();
  const styles = useThemedStyles(createStyles);

  const renderOption = (value: AppLanguage, label: string) => {
    const isActive = language === value;

    return (
      <Pressable
        key={value}
        style={[styles.option, compact && styles.optionCompact, isActive && styles.optionActive]}
        onPress={() => setLanguage(value)}
      >
        <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {!compact ? <Text style={styles.label}>{t('common.language')}</Text> : null}
      <View style={styles.row}>
        {renderOption('tr', t('common.turkish'))}
        {renderOption('en', t('common.english'))}
      </View>
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    wrapper: {
      gap: 8,
    } as ViewStyle,
    wrapperCompact: {
      gap: 6,
    } as ViewStyle,
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    } as TextStyle,
    row: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      gap: 8,
    } as ViewStyle,
    option: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    optionCompact: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    } as ViewStyle,
    optionActive: {
      borderColor: colors.teal,
      backgroundColor: colors.tealBg,
    } as ViewStyle,
    optionText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    } as TextStyle,
    optionTextActive: {
      color: colors.teal,
    } as TextStyle,
  });
