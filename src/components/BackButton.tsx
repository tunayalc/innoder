import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

interface BackButtonProps {
  onPress?: () => void;
  tintColor?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, tintColor }) => {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon 
        name="chevron-left" 
        size={24}
        color={tintColor || colors.primary}
      />
    </Pressable>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
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
