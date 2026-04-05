const sharedColors = {
  primary: '#6850A5',
  primaryDark: '#5B4498',
  onPrimaryContainer: '#442C7F',
  teal: '#376B21',
  tealLight: 'rgba(55, 107, 33, 0.18)',
  tealMuted: 'rgba(55, 107, 33, 0.14)',
  tealBorder: 'rgba(55, 107, 33, 0.3)',
  tealBg: '#ECFFDC',
  tealSoft: 'rgba(55, 107, 33, 0.08)',
  tealDashed: 'rgba(55, 107, 33, 0.4)',
  success: '#C2FFA2',
  warning: '#F7DBE3',
  error: 'rgba(220, 38, 38, 0.18)',
  info: '#CAB6FF',
  surfaceContainerLow: '#FBF0FF',
  surfaceContainerHigh: '#F3E2FF',
  surfaceContainerHighest: '#EFDBFF',
  tertiaryContainer: '#C2FFA2',
  onTertiaryContainer: '#31641B',
  white: '#FFFFFF',
  danger: '#AC3149',
} as const;

export const lightColors = {
  ...sharedColors,
  background: '#FFF7FF',
  cardBg: '#FBF0FF',
  inputBg: '#FFFFFF',
  rowBg: '#F3E2FF',
  switchRowBg: '#F7E9FF',
  textPrimary: '#3D2A51',
  textSecondary: '#6B5681',
  textMuted: '#88729E',
  borderLight: 'rgba(193, 168, 216, 0.24)',
  borderMedium: 'rgba(104, 80, 165, 0.14)',
  msgAdmin: '#F3E2FF',
  msgUser: '#E9D1FF',
  noticeBg: '#F3E2FF',
  noticeText: '#442C7F',
  orbOrange: 'rgba(104, 80, 165, 0.16)',
  muted: '#C1A8D8',
  placeholder: 'rgba(136, 114, 158, 0.32)',
} as const;

export const darkColors = {
  ...sharedColors,
  background: '#130A1E',
  cardBg: '#2A1A3D',
  inputBg: '#332049',
  rowBg: '#3A2452',
  switchRowBg: '#2E1D44',
  surfaceContainerLow: '#241637',
  surfaceContainerHigh: '#332049',
  surfaceContainerHighest: '#3A2452',
  success: '#376B21',
  warning: '#6A3144',
  error: 'rgba(172, 49, 73, 0.34)',
  info: '#5C4A8E',
  tertiaryContainer: '#376B21',
  onTertiaryContainer: '#F6FFEF',
  textPrimary: '#FDF7FF',
  textSecondary: '#C1A8D8',
  textMuted: '#A697B2',
  borderLight: 'rgba(193, 168, 216, 0.18)',
  borderMedium: 'rgba(202, 182, 255, 0.28)',
  msgAdmin: '#3A2452',
  msgUser: '#4D3689',
  noticeBg: '#442C7F',
  noticeText: '#FDF7FF',
  orbOrange: 'rgba(187, 162, 254, 0.2)',
  muted: '#6B5681',
  placeholder: 'rgba(166, 151, 178, 0.3)',
} as const;

export type AppColors = {
  [K in keyof typeof lightColors]: string;
};

export const colors = lightColors;

export type ColorKey = keyof AppColors;
