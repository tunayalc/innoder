import React from 'react';
import { Switch } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Button } from './Button';
import { ProjectBloodGroup } from './ProjectBloodGroup';

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
jest.mock('@react-navigation/native', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void) => useEffect(effect, [effect]) };
});
jest.mock('../config/appConfig', () => ({ appConfig: { dataSource: 'remote' } }));
jest.mock('../i18n', () => ({ useI18n: () => ({ language: 'tr' }) }));
jest.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  requireData: (response: unknown) => response,
}));
jest.mock('./Button', () => ({ Button: () => null }));
jest.mock('./Field', () => ({ Field: () => null }));
jest.mock('../theme', () => ({
  useThemedStyles: (factory: (colors: unknown) => unknown) =>
    factory(jest.requireActual('../theme/colors').lightColors),
  useAppTheme: () => ({ colors: jest.requireActual('../theme/colors').lightColors }),
}));

const available = { available: true, consentVersion: 'esc-blood-group-v1' };
let tree: ReactTestRenderer;
const mount = (readOnly = false) => act(async () => {
  tree = create(<ProjectBloodGroup applicationId="application-1" readOnly={readOnly} />);
});
const button = (label: string) => tree.root.findAllByType(Button).find(item => item.props.label === label);

beforeEach(() => {
  mockGet.mockReset();
  mockPut.mockReset();
  mockDelete.mockReset();
});
afterEach(() => act(() => tree?.unmount()));

test('does not render a consent control for an ordinary program', async () => {
  mockGet.mockResolvedValue({ ...available, available: false });
  await mount();
  expect(tree.toJSON()).toBeNull();
});

test('requires an explicit opt-in and removes the displayed recording after withdrawal', async () => {
  mockGet.mockResolvedValue(available);
  mockPut.mockResolvedValue({ ...available, bloodGroup: 'A+' });
  mockDelete.mockResolvedValue(available);
  await mount();
  const radio = tree.root.findAllByProps({ accessibilityRole: 'radio' }).find(item => item.props.onPress);
  const consent = () => tree.root.findByType(Switch);
  expect(consent().props.value).toBe(false);
  act(() => radio?.props.onPress());
  expect(button('Kan grubumu paylaş')?.props.disabled).toBe(true);
  await act(async () => button('Kan grubumu paylaş')?.props.onPress());
  expect(mockPut).not.toHaveBeenCalled();
  act(() => consent().props.onValueChange(true));
  await act(async () => button('Kan grubumu paylaş')?.props.onPress());
  expect(mockPut).toHaveBeenCalledWith('/applications/application-1/blood-group', {
    bloodGroup: 'A+', consentAccepted: true, consentVersion: available.consentVersion,
  }, expect.anything());
  await act(async () => button('Rızamı geri al')?.props.onPress());
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(button('Rızamı geri al')).toBeUndefined();
  expect(consent().props.value).toBe(false);
});

test('admin access only loads the health record after asking to reveal it', async () => {
  mockGet.mockResolvedValue({ ...available, bloodGroup: 'A+' });
  await mount(true);
  expect(mockGet).not.toHaveBeenCalled();
  await act(async () => button('Kan grubunu göster')?.props.onPress());
  expect(mockGet).toHaveBeenCalledTimes(1);
  act(() => button('Kan grubunu gizle')?.props.onPress());
  expect(button('Kan grubunu göster')).toBeDefined();
});
