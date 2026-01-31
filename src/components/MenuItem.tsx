import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

interface MenuItemProps {
  label: string;
  onPress: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ label, onPress }) => {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.menuArrow}>{'>'}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  menuArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  } as TextStyle,
});
