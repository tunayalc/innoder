import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface MenuItemProps {
  label: string;
  subtitle?: string;
  iconName?: string;
  iconColor?: string;
  iconBg?: string;
  onPress: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  subtitle,
  iconName,
  iconColor,
  iconBg,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const resolvedIconColor = iconColor || colors.primary;
  const resolvedIconBg = iconBg || colors.warning;

  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      {iconName && (
        <View style={[styles.iconWrap, { backgroundColor: resolvedIconBg }]}>
          <Icon name={iconName} size={20} color={resolvedIconColor} />
        </View>
      )}
      <View style={styles.textWrap}>
        <Text style={styles.menuText}>{label}</Text>
        {subtitle ? <Text style={styles.menuSubtext}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 14,
  } as ViewStyle,
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  textWrap: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  } as TextStyle,
  menuSubtext: {
    fontSize: 13,
    color: colors.textMuted,
  } as TextStyle,
});
