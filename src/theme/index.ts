import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsDarkMode } from '../store/selectors';
import { setDarkMode, toggleDarkMode } from '../store/slices/uiSlice';
import { darkColors, lightColors, type AppColors } from './colors';

export * from './colors';
export * from './spacing';
export * from './typography';

export const useAppTheme = () => {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(selectIsDarkMode);

  const colors = isDarkMode ? darkColors : lightColors;

  return {
    colors,
    isDarkMode,
    setDarkMode: (nextValue: boolean) => dispatch(setDarkMode(nextValue)),
    toggleDarkMode: () => dispatch(toggleDarkMode()),
  };
};

export const useThemeColors = () => useAppTheme().colors;

export const useThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: AppColors) => T,
) => {
  const colors = useThemeColors();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
};

export const theme = {
  colors: lightColors,
  spacing: require('./spacing').spacing,
  borderRadius: require('./spacing').borderRadius,
  fontSize: require('./typography').fontSize,
  fontWeight: require('./typography').fontWeight,
};

export default theme;
