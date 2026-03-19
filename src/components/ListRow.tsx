import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles, type AppColors } from '../theme';
import { Pill } from './Pill';
import { PillVariant } from '../types';

interface ListRowProps {
  name: string;
  subtitle: string;
  label: string;
  variant: PillVariant;
}

export const ListRow: React.FC<ListRowProps> = ({
  name,
  subtitle,
  label,
  variant,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.listRow}>
      <View>
        <Text style={styles.bodyText}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pill label={label} variant={variant} />
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 13,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  } as TextStyle,
});
