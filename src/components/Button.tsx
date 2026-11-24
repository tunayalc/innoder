import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { ButtonVariant } from '../types';
import { layout, useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
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
  style,
  pressedOpacity,
  disabled = false,
  loading = false,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading || !onPress;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        variant === 'ghost' && styles.buttonGhost,
        style,
        isDisabled && !loading && styles.buttonDisabled,
        pressed && !isDisabled ? {
          backgroundColor: variant === 'ghost' ? colors.surfaceContainerHigh : colors.primaryPressed,
          opacity: pressedOpacity ?? 1,
        } : null,
      ]}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
    >
      {loading ? <ActivityIndicator color={variant === 'ghost' ? colors.primaryText : colors.white} /> : null}
      <Text
        style={[
          styles.buttonText,
          variant === 'ghost' && styles.buttonTextGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      minHeight: layout.controlHeight,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    } as ViewStyle,
    buttonGhost: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.borderMedium,
    } as ViewStyle,
    buttonDisabled: {
      opacity: 0.55,
    } as ViewStyle,
    buttonText: {
      color: colors.white,
      fontWeight: '600',
      fontSize: 16,
      lineHeight: 24,
      flexShrink: 1,
      textAlign: 'center',
    } as TextStyle,
    buttonTextGhost: {
      color: colors.textPrimary,
    } as TextStyle,
  });
