import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

export const SettingsButton: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => navigation.navigate('Settings')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="cog-outline" size={22} color={colors.primary} />
    </Pressable>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    pressed: {
      opacity: 0.86,
    } as ViewStyle,
  });
