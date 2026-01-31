import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

interface FieldProps {
  label: string;
  value: string;
}

export const Field: React.FC<FieldProps> = ({ label, value }) => {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputFake}>
        <Text style={styles.bodyText}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.inputBg,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
});
