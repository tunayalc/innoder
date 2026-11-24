import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useThemedStyles, type AppColors } from '../theme';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, style]}>
      {title && <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    gap: 10,
  } as ViewStyle,
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    color: colors.textPrimary,
  } as TextStyle,
});
