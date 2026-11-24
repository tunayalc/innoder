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
        accessibilityRole="radio"
        accessibilityState={{ checked: isActive }}
        accessibilityLabel={label}
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
      <View accessibilityRole="radiogroup" accessibilityLabel={t('common.language')} style={styles.row}>
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
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    } as TextStyle,
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignSelf: 'flex-start',
      gap: 4,
      padding: 4,
      borderRadius: 8,
      backgroundColor: colors.surfaceContainerHigh,
    } as ViewStyle,
    option: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 44,
      justifyContent: 'center',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    } as ViewStyle,
    optionCompact: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    } as ViewStyle,
    optionActive: {
      borderColor: colors.borderMedium,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    optionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    } as TextStyle,
    optionTextActive: {
      color: colors.primaryText,
    } as TextStyle,
  });
