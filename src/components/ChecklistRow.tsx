import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { Pill } from './Pill';
import { PillVariant } from '../types';

interface ChecklistRowProps {
  label: string;
  hint?: string;
  status: string;
  variant: PillVariant;
}

export const ChecklistRow: React.FC<ChecklistRowProps> = ({
  label,
  hint,
  status,
  variant,
}) => {
  return (
    <View style={styles.checkRow}>
      <View style={styles.textWrap}>
        <Text style={styles.bodyText}>{label}</Text>
        {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
      </View>
      <Pill label={status} variant={variant} />
    </View>
  );
};

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.rowBg,
    gap: 12,
  } as ViewStyle,
  textWrap: {
    flex: 1,
    gap: 3,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 15,
  } as TextStyle,
  hintText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,
});
