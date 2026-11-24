import { Platform } from 'react-native';
import { fontFamily, withTypography } from './typography';

afterEach(() => jest.restoreAllMocks());

test.each([
  [undefined, fontFamily.regular], ['normal', fontFamily.regular],
  ['400', fontFamily.regular], ['500', fontFamily.medium],
  ['600', fontFamily.semibold], ['700', fontFamily.bold],
  ['800', fontFamily.bold], ['bold', fontFamily.bold],
])('uses a bundled face for weight %s', (fontWeight, family) => {
  for (const os of ['ios', 'android'] as const) {
    jest.replaceProperty(Platform, 'OS', os);
    const styles = withTypography({ label: { fontSize: 16, fontWeight, color: '#20272c' } });
    const iosWeight = family === fontFamily.bold ? '700'
      : family === fontFamily.semibold ? '600'
        : family === fontFamily.medium ? '500' : '400';
    expect(styles.label).toEqual({ fontSize: 16, fontFamily: family, fontWeight: os === 'ios' ? iosWeight : 'normal', color: '#20272c', letterSpacing: 0 });
  }
});

test('preserves view styles, color-only overrides and explicit icon fonts', () => {
  const styles = {
    container: { flex: 1, borderRadius: 8 },
    active: { color: '#006f93' },
    icon: { fontSize: 20, fontFamily: 'MaterialCommunityIcons' },
  };
  const result = withTypography(styles);
  expect(result).toEqual(styles);
  expect(result.container).toBe(styles.container);
  expect(result.active).toBe(styles.active);
  expect(result.icon).toBe(styles.icon);
});

test('does not mutate source styles and preserves line height and large-text settings', () => {
  const source = { label: { fontSize: 16, lineHeight: 24, flexShrink: 1 } };
  expect(withTypography(source).label).toMatchObject(source.label);
  expect(source.label).not.toHaveProperty('fontFamily');
});
