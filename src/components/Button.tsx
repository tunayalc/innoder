import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { ButtonVariant } from '../types';
import { useThemedStyles, type AppColors } from '../theme';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  pressedOpacity?: number;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'solid',
  style,
  pressedOpacity,
  disabled = false,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        style,
        pressed && !disabled ? { opacity: pressedOpacity ?? 0.9 } : null,
      ]}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'ghost' && styles.buttonTextGhost,
          disabled && styles.buttonTextDisabled,
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
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
    } as ViewStyle,
    buttonGhost: {
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 0,
    } as ViewStyle,
    buttonDisabled: {
      opacity: 0.56,
    } as ViewStyle,
    buttonText: {
      color: colors.white,
      fontWeight: '800',
      fontSize: 15,
    } as TextStyle,
    buttonTextGhost: {
      color: colors.textPrimary,
    } as TextStyle,
    buttonTextDisabled: {
      color: colors.textMuted,
    } as TextStyle,
  });
