const sharedColors = {
  primary: '#F0672B',
  primaryDark: '#B94C1F',
  teal: '#0F766E',
  tealLight: 'rgba(15, 118, 110, 0.18)',
  tealMuted: 'rgba(15, 118, 110, 0.15)',
  tealBorder: 'rgba(15, 118, 110, 0.35)',
  tealBg: '#F2FBF9',
  tealSoft: 'rgba(15, 118, 110, 0.08)',
  tealDashed: 'rgba(15, 118, 110, 0.4)',
  success: 'rgba(15, 118, 110, 0.18)',
  warning: 'rgba(240, 103, 43, 0.18)',
  error: 'rgba(220, 38, 38, 0.18)',
  info: 'rgba(59, 130, 246, 0.18)',
  white: '#FFFFFF',
  danger: '#DC2626',
} as const;

export const lightColors = {
  ...sharedColors,
  background: '#F4F1EC',
  cardBg: '#FFFFFF',
  inputBg: '#FFFFFF',
  rowBg: '#F9F7F3',
  switchRowBg: '#F8F4EF',
  textPrimary: '#1C1B19',
  textSecondary: '#6B6762',
  textMuted: '#8B8681',
  borderLight: 'rgba(28, 27, 25, 0.08)',
  borderMedium: 'rgba(28, 27, 25, 0.12)',
  msgAdmin: '#FFF1E8',
  msgUser: '#E7F5F3',
  noticeBg: '#FEF6EA',
  noticeText: '#8A5A21',
  orbOrange: 'rgba(240, 103, 43, 0.18)',
  muted: '#CBD5D1',
  placeholder: 'rgba(28, 27, 25, 0.08)',
} as const;

export const darkColors = {
  ...sharedColors,
  background: '#14181A',
  cardBg: '#1B2326',
  inputBg: '#1F2A2D',
  rowBg: '#1F282B',
  switchRowBg: '#20292C',
  textPrimary: '#F7F4EE',
  textSecondary: '#C3BBB1',
  textMuted: '#91897E',
  borderLight: 'rgba(247, 244, 238, 0.08)',
  borderMedium: 'rgba(247, 244, 238, 0.16)',
  msgAdmin: '#3A2419',
  msgUser: '#123B39',
  noticeBg: '#3A2D1F',
  noticeText: '#F7D8A7',
  orbOrange: 'rgba(240, 103, 43, 0.14)',
  muted: '#5B6A68',
  placeholder: 'rgba(247, 244, 238, 0.14)',
} as const;

export type AppColors = {
  [K in keyof typeof lightColors]: string;
};

export const colors = lightColors;

export type ColorKey = keyof AppColors;
