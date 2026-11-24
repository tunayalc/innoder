import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';
import { PillVariant } from '../types';

interface PillProps {
  label: string;
  variant: PillVariant;
  subtle?: boolean;
}

export const Pill: React.FC<PillProps> = ({ label, variant, subtle = false }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const variantStyles: Record<PillVariant, ViewStyle> = {
    ok: { backgroundColor: colors.success },
    warn: { backgroundColor: colors.warning },
    err: { backgroundColor: colors.error },
    info: { backgroundColor: colors.info },
  };
  const textColors = { ok: colors.onSuccess, warn: colors.onWarning, err: colors.onError, info: colors.onInfo };

  return (
    <View style={[styles.pill, subtle ? styles.subtle : variantStyles[variant]]}>
      {subtle && <View style={[styles.statusDot, { backgroundColor: textColors[variant] }]} />}
      <Text style={[styles.pillText, { color: subtle ? colors.textSecondary : textColors[variant] }]}>{label}</Text>
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: '100%',
    flexShrink: 1,
    alignSelf: 'flex-start',
  } as ViewStyle,
  pillText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
  } as TextStyle,
  subtle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  } as ViewStyle,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
});
