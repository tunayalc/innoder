import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

export type TabIcons = Record<string, [active: string, inactive: string]>;

// Rounded bar that floats above the content; the selected tab sits on a soft red pill.
export const createFloatingTabBar = (icons: TabIcons) => {
  const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation, insets }) => {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    return (
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View accessibilityRole="tablist" style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const label = typeof options.title === 'string' ? options.title : route.name;
            const badge = options.tabBarBadge;
            const [activeIcon, inactiveIcon] = icons[route.name] || ['circle', 'circle-outline'];
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={badge ? `${label}, ${badge}` : label}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                style={({ pressed }) => [styles.item, focused && styles.itemActive, pressed && styles.pressed]}
              >
                <View>
                  <Icon
                    name={focused ? activeIcon : inactiveIcon}
                    size={24}
                    color={focused ? colors.primaryText : colors.textMuted}
                  />
                  {badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={[styles.label, focused && styles.labelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };
  return FloatingTabBar;
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      paddingTop: 6,
    } as ViewStyle,
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.tabBarBg,
      borderRadius: 32,
      padding: 6,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    } as ViewStyle,
    item: {
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRadius: 26,
      paddingHorizontal: 4,
    } as ViewStyle,
    itemActive: { backgroundColor: colors.primarySoft } as ViewStyle,
    pressed: { opacity: 0.8 } as ViewStyle,
    label: { fontSize: 12, fontWeight: '500', color: colors.textMuted } as TextStyle,
    labelActive: { color: colors.primaryText, fontWeight: '700' } as TextStyle,
    badge: {
      position: 'absolute',
      top: -4,
      right: -10,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.tabBarBg,
    } as ViewStyle,
    badgeText: { fontSize: 10, fontWeight: '700', color: colors.white } as TextStyle,
  });
