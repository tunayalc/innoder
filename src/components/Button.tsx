import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { ButtonVariant } from '../types';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'solid',
  style,
}) => {
  return (
    <Pressable
      style={[styles.button, variant === 'ghost' && styles.buttonGhost, style]}
      onPress={onPress}
    >
      <Text
        style={[styles.buttonText, variant === 'ghost' && styles.buttonTextGhost]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
  } as ViewStyle,
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(240, 103, 43, 0.4)',
  } as ViewStyle,
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  } as TextStyle,
  buttonTextGhost: {
    color: colors.primaryDark,
  } as TextStyle,
});
