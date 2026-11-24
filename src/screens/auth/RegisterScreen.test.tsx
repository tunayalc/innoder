import React from 'react';
import { Alert, Switch } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Button, InputField } from '../../components';
import { RegisterScreen } from './RegisterScreen';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../../components', () => ({
  BackButton: 'BackButton',
  Button: 'Button',
  Card: 'Card',
  ContactLinksCard: 'ContactLinksCard',
  InputField: 'InputField',
  SettingsButton: 'SettingsButton',
}));
jest.mock('../../hooks', () => ({ useAuth: () => ({ registerCandidate: mockRegister }) }));
jest.mock('../../i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('../../store/hooks', () => ({ useAppSelector: () => undefined }));
jest.mock('../../store/selectors', () => ({ selectUserError: jest.fn(), selectUserLoading: jest.fn() }));
jest.mock('../../theme', () => ({
  ...jest.requireActual('../../theme/spacing'),
  useAppTheme: () => ({ colors: jest.requireActual('../../theme/colors').lightColors }),
  useThemedStyles: (factory: (colors: unknown) => unknown) => factory(jest.requireActual('../../theme/colors').lightColors),
}));

let tree: ReactTestRenderer;
afterEach(() => {
  act(() => tree?.unmount());
  jest.restoreAllMocks();
  mockRegister.mockReset();
});

it('submits the registration with both privacy choices and no video step', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockRegister.mockResolvedValue({ ok: true });
  act(() => { tree = create(<RegisterScreen />); });
  const root = tree.root;
  const fields = root.findAllByType(InputField);
  const submit = root.findAllByType(Button).find(node => node.props.label === 'auth.passwordRequestButton');
  expect(submit).toBeDefined();
  expect(submit?.props.disabled).toBeFalsy();
  expect(root.findAllByProps({ accessibilityRole: 'progressbar' })).toHaveLength(0);
  expect(root.findAllByProps({ accessibilityRole: 'checkbox' })).toHaveLength(0);
  expect(fields).toHaveLength(3);
  act(() => {
    fields[0].props.onChangeText('Sample Candidate');
    fields[1].props.onChangeText('candidate@example.com');
    fields[2].props.onChangeText('https://example.com/project');
  });
  await act(async () => { await submit?.props.onPress(); });
  expect(mockRegister).not.toHaveBeenCalled();
  expect(alert).toHaveBeenLastCalledWith('common.errorTitle', 'auth.kvkkRequired');

  act(() => { root.findAllByType(Switch).forEach(control => control.props.onValueChange(true)); });
  await act(async () => { await submit?.props.onPress(); });
  expect(mockRegister).toHaveBeenCalledTimes(1);
  expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
    fullName: 'Sample Candidate',
    email: 'candidate@example.com',
    eventLink: 'https://example.com/project',
    noticeAccepted: true,
    kvkkAccepted: true,
  }));
});
