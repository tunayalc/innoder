export type DataSource = 'mock' | 'remote';

/**
 * App-wide configuration.
 *
 * We cannot reach the real backend right now, so we default to `mock`.
 * When the backend is available, switch `dataSource` to `remote`.
 */
export const appConfig = {
  dataSource: 'mock' as DataSource,
  mock: {
    // Used to simulate network latency so loading/empty/error states are exercised.
    delayMs: 450,
  },
} as const;

