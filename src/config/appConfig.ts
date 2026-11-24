export type DataSource = 'mock' | 'remote';

/**
 * App-wide configuration.
 *
 * Development keeps the deterministic mock backend. Release builds always use
 * the production API and never expose local demo credentials.
 */
export const appConfig = {
  dataSource: (__DEV__ ? 'mock' : 'remote') as DataSource,
  mock: {
    // Used to simulate network latency so loading/empty/error states are exercised.
    delayMs: 450,
  },
  privacyPolicyUrl: 'https://api.innoder.org/privacy',
  accountDeletionUrl: 'https://api.innoder.org/account-deletion',
  supportUrl: 'https://api.innoder.org/support',
} as const;
