import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Button } from './Button';
import { BrandWordmark } from './BrandWordmark';
import { InputField } from './InputField';
import { Pill } from './Pill';
import { ScreenScrollView } from './ScreenScrollView';
import { StateMessage } from './StateMessage';
import { darkColors, lightColors } from '../theme/colors';

let mockColors = lightColors as typeof lightColors | typeof darkColors;
jest.mock('../theme', () => ({
  ...jest.requireActual('../theme/spacing'),
  useAppTheme: () => ({ colors: mockColors }),
  useThemeColors: () => mockColors,
  useThemedStyles: (factory: (colors: typeof lightColors | typeof darkColors) => unknown) =>
    jest.requireActual('../theme/typography').withTypography(factory(mockColors)),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 34, top: 0, left: 0, right: 0 }) }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

let tree: ReactTestRenderer;
const render = (element: React.ReactElement) => {
  act(() => { tree = create(element); });
  return tree.root;
};
beforeEach(() => { mockColors = lightColors; });
afterEach(() => { act(() => tree?.unmount()); });

it('exposes loading and prevents activation while retaining the button label', () => {
  const onPress = jest.fn();
  const root = render(<Button label="Save" loading onPress={onPress} />);
  const button = root.findAllByProps({ accessibilityRole: 'button' })[0];
  expect(button.props.accessibilityRole).toBe('button');
  expect(button.props.accessibilityState).toEqual({ busy: true, disabled: true });
  expect(button.props.disabled).toBe(true);
  expect(button.props.onPress).toBeUndefined();
  expect(root.findByType(ActivityIndicator)).toBeDefined();
  expect(root.findByType(Text).props.children).toBe('Save');
});

it('enables a completed action, but disables a button without an action', () => {
  const onPress = jest.fn();
  const root = render(<Button label="Save" onPress={onPress} />);
  act(() => root.findAllByProps({ accessibilityRole: 'button' })[0].props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);
  act(() => tree.update(<Button label="Save" />));
  expect(root.findAllByProps({ accessibilityRole: 'button' })[0].props.disabled).toBe(true);
});

it.each([
  ['light solid', lightColors, 'solid'],
  ['dark solid', darkColors, 'solid'],
  ['light secondary', lightColors, 'ghost'],
  ['dark secondary', darkColors, 'ghost'],
] as const)('retains readable labels and stable geometry for %s pressed buttons', (_name, colors, variant) => {
  mockColors = colors;
  const root = render(<Button label="Continue" variant={variant} onPress={jest.fn()} />);
  const button = root.findAllByProps({ accessibilityRole: 'button' })[0];
  const resting = StyleSheet.flatten(button.props.style({ pressed: false }));
  const pressed = StyleSheet.flatten(button.props.style({ pressed: true }));
  expect(resting.minHeight).toBeGreaterThanOrEqual(48);
  expect(pressed.minHeight).toBe(resting.minHeight);
  expect(pressed.borderRadius).toBe(8);
  expect(pressed.backgroundColor).toBe(variant === 'ghost' ? colors.surfaceContainerHigh : colors.primaryPressed);
  expect(StyleSheet.flatten(root.findByType(Text).props.style)).toMatchObject({ fontFamily: 'Inter-SemiBold', fontSize: 16 });
  expect(StyleSheet.flatten(root.findByType(Text).props.style).color).toBe(variant === 'ghost' ? colors.textPrimary : colors.white);
});

it('preserves the original wordmark on an opaque nameplate in dark mode', () => {
  mockColors = darkColors;
  const logo = render(<BrandWordmark compact />).findByType(Image);
  expect(logo.props.accessibilityLabel).toBe('Inno Derneği');
  expect(logo.props.resizeMode).toBe('contain');
  expect(StyleSheet.flatten(logo.props.style)).toMatchObject({ width: 104, height: 44, backgroundColor: '#FFFFFF' });
});

it('uses a visible label for input accessibility, preserves focus callbacks, and prioritizes errors', () => {
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  const root = render(<InputField label="Email" onFocus={onFocus} onBlur={onBlur} />);
  const input = () => root.findByType(TextInput);
  expect(input().props.accessibilityLabel).toBe('Email');
  expect(StyleSheet.flatten(input().props.style)).toMatchObject({ fontFamily: 'Inter-Regular', fontSize: 16, borderRadius: 8 });
  act(() => input().props.onFocus({ nativeEvent: {} }));
  expect(onFocus).toHaveBeenCalledTimes(1);
  expect(StyleSheet.flatten(input().props.style).borderColor).toBe(lightColors.primaryText);
  act(() => tree.update(<InputField label="Email" error="Invalid email" onBlur={onBlur} />));
  expect(StyleSheet.flatten(input().props.style).borderColor).toBe(lightColors.danger);
  expect(input().props.accessibilityHint).toBe('Invalid email');
  expect(root.findAllByType(Text).some((text) => text.props.accessibilityRole === 'alert')).toBe(true);
  act(() => input().props.onBlur({ nativeEvent: {} }));
  expect(onBlur).toHaveBeenCalledTimes(1);
});

it('exposes read-only fields and keeps multiline content top-aligned', () => {
  const root = render(<InputField label="Notes" multiline editable={false} />);
  const input = root.findByType(TextInput);
  expect(input.props.accessibilityState.disabled).toBe(true);
  expect(StyleSheet.flatten(input.props.style).textAlignVertical).toBe('top');
});

it.each(['ok', 'warn', 'err', 'info'] as const)('uses a dedicated readable %s status color in dark mode', (variant) => {
  mockColors = darkColors;
  const root = render(<Pill label="A long translated status" variant={variant} />);
  const expected = { ok: darkColors.onSuccess, warn: darkColors.onWarning, err: darkColors.onError, info: darkColors.onInfo };
  expect(StyleSheet.flatten(root.findByType(Text).props.style).color).toBe(expected[variant]);
});

it.each([lightColors, darkColors])('keeps subtle status labels readable without a filled badge', (colors) => {
  mockColors = colors;
  const root = render(<Pill label="Başvuru Aşaması" variant="warn" subtle />);
  const views = root.findAllByType(View);
  expect(StyleSheet.flatten(views[0].props.style)).toMatchObject({
    backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0,
  });
  expect(StyleSheet.flatten(views[1].props.style)).toMatchObject({
    width: 6, height: 6, backgroundColor: colors.onWarning,
  });
  expect(root.findByType(Text).props.children).toBe('Başvuru Aşaması');
  expect(StyleSheet.flatten(root.findByType(Text).props.style)).toMatchObject({
    color: colors.textSecondary, flexShrink: 1,
  });
});

it('constrains tablet content and adds bottom safe area without stealing keyboard taps', () => {
  const root = render(<ScreenScrollView contentContainerStyle={{ paddingBottom: 40 }}><Text>Form</Text></ScreenScrollView>);
  const scroll = root.findByType(ScrollView);
  expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  expect(StyleSheet.flatten(scroll.props.contentContainerStyle)).toMatchObject({ width: '100%', maxWidth: 720, paddingBottom: 74 });
});

it('announces an error and provides a working retry action', () => {
  const retry = jest.fn();
  const root = render(<StateMessage kind="error" message="Unable to load" actionLabel="Retry" onAction={retry} />);
  expect(root.findAllByType(Text).some((text) => text.props.accessibilityRole === 'alert')).toBe(true);
  act(() => root.findAllByProps({ accessibilityRole: 'button' })[0].props.onPress());
  expect(retry).toHaveBeenCalledTimes(1);
});
