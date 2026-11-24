import React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextStyle, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useI18n } from '../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact }) => {
  const { colors, isDarkMode, toggleDarkMode } = useAppTheme();
  const { t } = useI18n();
  const styles = useThemedStyles(createStyles);

  return compact ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDarkMode ? t('common.lightTheme') : t('common.darkTheme')}
      style={[styles.button, compact && styles.buttonCompact]}
      onPress={toggleDarkMode}
    >
      <Icon
        name={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'}
        size={compact ? 16 : 18}
        color={colors.primaryText}
      />
    </Pressable>
  ) : (
    <View style={styles.row}>
      <Text style={styles.label}>{t('common.darkTheme')}</Text>
      <Switch
        accessibilityLabel={t('common.darkTheme')}
        value={isDarkMode}
        onValueChange={() => { toggleDarkMode(); }}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    button: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: colors.surfaceContainerHigh,
    } as ViewStyle,
    buttonCompact: {
      paddingHorizontal: 10,
      paddingVertical: 7,
    } as ViewStyle,
    label: {
      flexShrink: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
    } as TextStyle,
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      gap: 16,
    } as ViewStyle,
  });
