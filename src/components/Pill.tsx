import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { PillVariant } from '../types';

interface PillProps {
  label: string;
  variant: PillVariant;
}

const variantStyles: Record<PillVariant, ViewStyle> = {
  ok: { backgroundColor: colors.success },
  warn: { backgroundColor: colors.warning },
  err: { backgroundColor: colors.error },
  info: { backgroundColor: colors.info },
};

export const Pill: React.FC<PillProps> = ({ label, variant }) => {
  return (
    <View style={[styles.pill, variantStyles[variant]]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  } as ViewStyle,
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
});
