/** @jest-environment-options {"customExportConditions":["node","node-addons"]} */
import React from 'react';
import { Text, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { AdayMesajScreen } from './AdayMesajScreen';
import messageReducer from '../../store/slices/messageSlice';
import type { Message } from '../../types';

const mockSend = jest.fn();
const mockHistory: Message[] = [{
  id: 'existing', applicationId: 'general:candidate-1', senderId: 'admin-1',
  senderRole: 'admin', content: 'Welcome', createdAt: '2026-01-01T12:00:00Z',
}];

jest.mock('@react-navigation/native', () => ({ useRoute: () => ({ params: undefined }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 34, left: 0, right: 0 }) }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../../hooks', () => ({ useAuth: () => ({ user: { id: 'candidate-1' }, isAdmin: false }) }));
jest.mock('../../hooks/useUnsavedChanges',()=>({useUnsavedChanges:jest.fn()}));
jest.mock('../../i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('../../theme', () => ({
  ...jest.requireActual('../../theme/spacing'),
  useAppTheme: () => ({ colors: jest.requireActual('../../theme/colors').lightColors }),
  useThemeColors: () => jest.requireActual('../../theme/colors').lightColors,
  useThemedStyles: (factory: (colors: unknown) => unknown) => factory(jest.requireActual('../../theme/colors').lightColors),
}));
jest.mock('../../services/backend', () => ({
  getBackend: () => ({ messages: {
    send: mockSend,
    listByApplicationId: async () => mockHistory,
    markThreadRead: async () => undefined,
  } }),
}));
jest.mock('../../store/thunks/auditThunks', () => ({ reloadAuditLogs: () => () => undefined }));

let tree: ReactTestRenderer;
const renderScreen = async () => {
  const store = configureStore({ reducer: {
    message: messageReducer,
    user: () => ({ user: { id: 'candidate-1', role: 'candidate' } }),
    application: () => ({ applications: [] }),
  } });
  await act(async () => { tree = create(<Provider store={store}><AdayMesajScreen /></Provider>); });
  return tree.root;
};

beforeEach(() => { mockSend.mockReset(); });
afterEach(() => { act(() => tree?.unmount()); });

it('keeps a failed draft and exposes the error even when the conversation has messages', async () => {
  mockSend.mockRejectedValue(new Error('Connection lost'));
  const root = await renderScreen();
  act(() => root.findByType(TextInput).props.onChangeText('Keep this draft'));
  const send = root.findAllByProps({ accessibilityLabel: 'candidateMessages.send' })[0];
  await act(async () => { await send.props.onPress(); });
  expect(root.findByType(TextInput).props.value).toBe('Keep this draft');
  expect(root.findAllByType(Text).some((text) => text.props.accessibilityRole === 'alert' && text.props.children === 'Connection lost')).toBe(true);
  expect(root.findAllByProps({ accessibilityLabel: 'candidateMessages.send' })[0].props.disabled).toBe(false);
});

it('clears a delivered draft and blocks duplicate sends while delivery is pending', async () => {
  let finishSend!: (message: Message) => void;
  mockSend.mockImplementation(() => new Promise<Message>((resolve) => { finishSend = resolve; }));
  const root = await renderScreen();
  act(() => root.findByType(TextInput).props.onChangeText('Hello'));
  const send = root.findAllByProps({ accessibilityLabel: 'candidateMessages.send' })[0];
  let pending!: Promise<void>;
  act(() => { pending = send.props.onPress(); send.props.onPress(); });
  expect(mockSend).toHaveBeenCalledTimes(1);
  expect(root.findAllByProps({ accessibilityLabel: 'candidateMessages.send' })[0].props.accessibilityState).toEqual({ busy: true, disabled: true });
  expect(root.findByType(TextInput).props.editable).toBe(false);
  await act(async () => {
    finishSend({ id: 'sent', applicationId: 'general:candidate-1', senderId: 'candidate-1', senderRole: 'candidate', content: 'Hello', createdAt: '2026-01-02T12:00:00Z' });
    await pending;
  });
  expect(root.findByType(TextInput).props.value).toBe('');
});
