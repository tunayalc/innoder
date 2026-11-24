import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useI18n } from '../i18n';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

export const SettingsButton: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.settings')}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => navigation.navigate('Settings')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="cog-outline" size={22} color={colors.textSecondary} />
    </Pressable>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    pressed: {
      opacity: 0.86,
    } as ViewStyle,
  });
