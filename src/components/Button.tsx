import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ButtonVariant } from '../types';
import { layout, useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: string;
  style?: StyleProp<ViewStyle>;
  pressedOpacity?: number;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  icon,
  style,
  pressedOpacity,
  disabled = false,
  loading = false,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading || !onPress;
  const textColor = {
    solid: colors.white,
    ghost: colors.textPrimary,
    outline: colors.primaryText,
    onHero: colors.heroText,
  }[variant];
  const pressedBackground = {
    solid: colors.primaryPressed,
    ghost: colors.surfaceContainerHigh,
    outline: colors.primarySoft,
    onHero: colors.heroTrack,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSmall,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'outline' && styles.buttonOutline,
        variant === 'onHero' && styles.buttonOnHero,
        style,
        isDisabled && !loading && styles.buttonDisabled,
        pressed && !isDisabled ? { backgroundColor: pressedBackground, opacity: pressedOpacity ?? 1 } : null,
      ]}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
    >
      {loading ? <ActivityIndicator color={textColor} /> : icon ? (
        <View importantForAccessibility="no-hide-descendants">
          <Icon name={icon} size={size === 'sm' ? 16 : 20} color={textColor} />
        </View>
      ) : null}
      <Text style={[styles.buttonText, size === 'sm' && styles.buttonTextSmall, { color: textColor }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    button: {
      paddingVertical: 12,
      paddingHorizontal: 22,
      minHeight: layout.controlHeight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    } as ViewStyle,
    buttonSmall: {
      minHeight: 44,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
    } as ViewStyle,
    buttonGhost: {
      backgroundColor: colors.cardBg,
      borderColor: colors.borderMedium,
    } as ViewStyle,
    buttonOutline: {
      backgroundColor: colors.cardBg,
      borderColor: colors.primaryText,
    } as ViewStyle,
    buttonOnHero: {
      backgroundColor: 'transparent',
      borderColor: colors.heroText,
    } as ViewStyle,
    buttonDisabled: {
      opacity: 0.55,
    } as ViewStyle,
    buttonText: {
      fontWeight: '600',
      fontSize: 16,
      lineHeight: 22,
      flexShrink: 1,
      textAlign: 'center',
    } as TextStyle,
    buttonTextSmall: {
      fontWeight: '600',
      fontSize: 14,
      lineHeight: 20,
    } as TextStyle,
  });
