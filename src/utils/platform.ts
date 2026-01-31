import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Check if the device is iOS
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Check if the device is Android
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Get screen dimensions
 */
export const screenWidth = width;
export const screenHeight = height;

/**
 * Get status bar height
 */
export const statusBarHeight = StatusBar.currentHeight ?? 0;

/**
 * Check if small screen (iPhone SE, etc.)
 */
export const isSmallScreen = width < 375;

/**
 * Check if large screen (tablets, etc.)
 */
export const isLargeScreen = width >= 768;

/**
 * Responsive size helper
 */
export const responsiveSize = (size: number): number => {
  const baseWidth = 375; // iPhone X width
  return (width / baseWidth) * size;
};
