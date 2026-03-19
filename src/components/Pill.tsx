import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';
import { PillVariant } from '../types';

interface PillProps {
  label: string;
  variant: PillVariant;
}

export const Pill: React.FC<PillProps> = ({ label, variant }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const variantStyles: Record<PillVariant, ViewStyle> = {
    ok: { backgroundColor: colors.success },
    warn: { backgroundColor: colors.warning },
    err: { backgroundColor: colors.error },
    info: { backgroundColor: colors.info },
  };

  return (
    <View style={[styles.pill, variantStyles[variant]]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  } as ViewStyle,
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
});
