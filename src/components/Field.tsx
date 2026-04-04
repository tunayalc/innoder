import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles, type AppColors } from '../theme';

interface FieldProps {
  label: string;
  value: string;
}

export const Field: React.FC<FieldProps> = ({ label, value }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputFake}>
        <Text style={styles.bodyText}>{value}</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  field: {
    gap: 6,
  } as ViewStyle,
  label: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  inputFake: {
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerHigh,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
});
