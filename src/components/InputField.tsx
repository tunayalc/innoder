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
      gap: 7,
    } as ViewStyle,
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 2,
    } as TextStyle,
    input: {
      backgroundColor: colors.rowBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      paddingHorizontal: 16,
      paddingVertical: 15,
      fontSize: 16,
      color: colors.textPrimary,
    } as TextStyle,
    inputError: {
      borderColor: colors.danger,
    } as ViewStyle,
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginLeft: 2,
    } as TextStyle,
  });
