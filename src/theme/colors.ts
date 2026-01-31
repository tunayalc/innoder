export const colors = {
  // Primary
  primary: '#F0672B',
  primaryDark: '#B94C1F',
  
  // Teal
  teal: '#0F766E',
  tealLight: 'rgba(15, 118, 110, 0.18)',
  tealMuted: 'rgba(15, 118, 110, 0.15)',
  tealBorder: 'rgba(15, 118, 110, 0.35)',
  tealBg: '#F2FBF9',
  tealSoft: 'rgba(15, 118, 110, 0.08)',
  tealDashed: 'rgba(15, 118, 110, 0.4)',
  
  // Backgrounds
  background: '#F4F1EC',
  cardBg: '#FFFFFF',
  inputBg: '#FFFFFF',
  rowBg: '#F9F7F3',
  switchRowBg: '#F8F4EF',
  
  // Text
  textPrimary: '#1C1B19',
  textSecondary: '#6B6762',
  textMuted: '#8B8681',
  
  // Status
  success: 'rgba(15, 118, 110, 0.18)',
  warning: 'rgba(240, 103, 43, 0.18)',
  error: 'rgba(220, 38, 38, 0.18)',
  info: 'rgba(59, 130, 246, 0.18)',
  
  // Borders
  borderLight: 'rgba(28, 27, 25, 0.08)',
  borderMedium: 'rgba(28, 27, 25, 0.12)',
  
  // Messages
  msgAdmin: '#FFF1E8',
  msgUser: '#E7F5F3',
  
  // Notice
  noticeBg: '#FEF6EA',
  noticeText: '#8A5A21',
  
  // Orbs
  orbOrange: 'rgba(240, 103, 43, 0.18)',
  
  // Misc
  white: '#FFFFFF',
  muted: '#CBD5D1',
  placeholder: 'rgba(28, 27, 25, 0.08)',
} as const;

export type ColorKey = keyof typeof colors;
