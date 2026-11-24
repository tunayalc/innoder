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
      <View style={styles.textWrap}>
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
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surfaceContainerLow,
  } as ViewStyle,
  textWrap: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    gap: 4,
  } as ViewStyle,
  bodyText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  } as TextStyle,
});
