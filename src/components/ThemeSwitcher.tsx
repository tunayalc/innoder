import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useI18n } from '../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact }) => {
  const { isDarkMode, toggleDarkMode } = useAppTheme();
  const { t } = useI18n();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={[styles.button, compact && styles.buttonCompact]}
      onPress={toggleDarkMode}
    >
      <Icon
        name={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'}
        size={compact ? 16 : 18}
        color={isDarkMode ? '#F7D8A7' : '#0F766E'}
      />
      {!compact ? (
        <Text style={styles.label}>
          {isDarkMode ? t('common.lightTheme') : t('common.darkTheme')}
        </Text>
      ) : null}
    </Pressable>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBg,
    } as ViewStyle,
    buttonCompact: {
      paddingHorizontal: 10,
      paddingVertical: 7,
    } as ViewStyle,
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    } as TextStyle,
  });
