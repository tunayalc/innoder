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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.rowBg,
    gap: 10,
  } as ViewStyle,
  textWrap: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
  hintText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  } as TextStyle,
});
