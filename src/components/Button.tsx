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
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'solid',
  style,
  pressedOpacity,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'ghost' && styles.buttonGhost,
        style,
        pressed ? { opacity: pressedOpacity ?? 0.9 } : null,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonTextGhost]}>
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
    buttonText: {
      color: colors.white,
      fontWeight: '800',
      fontSize: 15,
    } as TextStyle,
    buttonTextGhost: {
      color: colors.onPrimaryContainer,
    } as TextStyle,
  });
