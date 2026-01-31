// Layout Constants
export const LAYOUT = {
  screenPadding: 20,
  cardPadding: 16,
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 18,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
  },
} as const;

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  THEME: '@theme',
  ONBOARDING_COMPLETE: '@onboarding_complete',
} as const;
