import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { Pill } from './Pill';
import { PillVariant } from '../types';

interface ChecklistRowProps {
  label: string;
  status: string;
  variant: PillVariant;
}

export const ChecklistRow: React.FC<ChecklistRowProps> = ({
  label,
  status,
  variant,
}) => {
  return (
    <View style={styles.checkRow}>
      <Text style={styles.bodyText}>{label}</Text>
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
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
});
