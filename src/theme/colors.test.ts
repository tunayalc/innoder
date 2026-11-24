import { darkColors, lightColors } from './colors';

const luminance = (hex: string) => {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrast = (foreground: string, background: string) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

describe.each([['light', lightColors], ['dark', darkColors]] as const)('%s theme', (_name, colors) => {
  it('keeps body, secondary, muted and link text readable on surfaces', () => {
    for (const background of [colors.background, colors.cardBg, colors.surfaceContainerHigh]) {
      for (const text of [colors.textPrimary, colors.textSecondary, colors.textMuted, colors.primaryText, colors.danger]) {
        expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps status labels and primary button labels readable', () => {
    for (const [text, background] of [
      [colors.onSuccess, colors.success],
      [colors.onWarning, colors.warning],
      [colors.onError, colors.error],
      [colors.onInfo, colors.info],
      [colors.white, colors.primary],
      [colors.white, colors.primaryPressed],
      [colors.placeholder, colors.inputBg],
      [colors.heroText, colors.heroBg],
      [colors.heroMuted, colors.heroBg],
      [colors.primaryText, colors.primarySoft],
      [colors.primaryText, colors.tabBarBg],
      [colors.textMuted, colors.tabBarBg],
    ]) {
      expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('makes input boundaries distinguishable from their surface', () => {
    expect(contrast(colors.outline, colors.inputBg)).toBeGreaterThanOrEqual(3);
  });
});
