import { Platform, type TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

// Use bundled static faces on both platforms instead of synthetic font weights.
export const withTypography = <T extends Record<string, object>>(styles: T): T =>
  Object.fromEntries(Object.entries(styles).map(([key, value]) => {
    const style = value as TextStyle;
    if (style.fontFamily || (style.fontSize === undefined && style.fontWeight === undefined)) {
      return [key, value];
    }
    const weight = style.fontWeight === 'bold' ? 700 : Number(style.fontWeight) || 400;
    const family = weight >= 700 ? fontFamily.bold
      : weight >= 600 ? fontFamily.semibold
        : weight >= 500 ? fontFamily.medium : fontFamily.regular;
    // iOS resolves a named face back to its family; Android loads the exact asset.
    const nativeWeight = Platform.OS === 'ios'
      ? String(weight >= 700 ? 700 : weight >= 600 ? 600 : weight >= 500 ? 500 : 400)
      : 'normal';
    return [key, { ...style, fontFamily: family, fontWeight: nativeWeight, letterSpacing: 0 }];
  })) as T;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  '2xl': 24,
  '3xl': 28,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
