import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      gap: 8,
    } as ViewStyle,
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginLeft: 4,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    } as TextStyle,
    input: {
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: 16,
      borderWidth: 0,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.textPrimary,
    } as TextStyle,
    inputError: {
      borderColor: colors.danger,
      borderWidth: 1,
    } as ViewStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginLeft: 2,
    } as TextStyle,
  });
