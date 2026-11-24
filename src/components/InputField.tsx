import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { layout, useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...props
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        accessibilityLabel={props.accessibilityLabel || label}
        accessibilityHint={error || props.accessibilityHint}
        accessibilityState={{ ...props.accessibilityState, disabled: !editable }}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          style,
          focused && styles.inputFocused,
          !editable && styles.inputDisabled,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={props.placeholderTextColor || colors.placeholder}
        selectionColor={colors.primaryText}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      />
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      gap: 8,
    } as ViewStyle,
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 20,
    } as TextStyle,
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      minHeight: layout.controlHeight,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
    } as TextStyle,
    multiline: {
      minHeight: 112,
      textAlignVertical: 'top',
    } as TextStyle,
    inputFocused: {
      borderColor: colors.primaryText,
    } as TextStyle,
    inputDisabled: {
      backgroundColor: colors.surfaceContainerHigh,
      color: colors.textSecondary,
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
