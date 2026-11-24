import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AdminDocumentUpload } from './AdminDocumentUpload';
import { Button } from '../../components';
import type { Application } from '../../types';

let mockIsAdmin = true;
const mockPick = jest.fn();
const mockDispatch = jest.fn();
jest.mock('@react-native-documents/picker', () => ({
  pick: (...args: unknown[]) => mockPick(...args),
  types: { pdf: 'application/pdf' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: () => false,
}));
jest.mock('../../hooks', () => ({ useAuth: () => ({ isAdmin: mockIsAdmin }) }));
jest.mock('../../hooks/useUnsavedChanges', () => ({ useUnsavedChanges: jest.fn() }));
jest.mock('../../components', () => ({ Button: () => null }));
jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => 'Ağ bağlantısı kesildi.',
}));
jest.mock('../../store/thunks/applicationThunks', () => ({
  uploadAdminDocument: (data: unknown) => data,
}));
jest.mock('../../theme', () => ({
  useThemedStyles: (factory: (colors: unknown) => unknown) =>
    factory(jest.requireActual('../../theme/colors').lightColors),
}));

const application = { id: 'application-1', documents: [] } as unknown as Application;
let tree: ReactTestRenderer;
const mount = () => {
  act(() => { tree = create(<AdminDocumentUpload application={application} />); });
  return tree.root;
};
beforeEach(() => {
  mockIsAdmin = true;
  mockPick.mockReset();
  mockDispatch.mockReset();
});
afterEach(() => act(() => tree?.unmount()));

test('does not show the admin upload entry point to candidates', () => {
  mockIsAdmin = false;
  expect(mount().findAllByType(Button)).toHaveLength(0);
});

test('retains a selected file and its retry key after a failed upload', async () => {
  mockPick.mockResolvedValue([{ name: 'reference.pdf', size: 124, uri: 'file:///reference.pdf', type: 'application/pdf' }]);
  mockDispatch.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const root = mount();
  const button = (label: string) => root.findAllByType(Button).find(item => item.props.label === label)!;
  act(() => button('Belge Ekle').props.onPress());
  expect(button('Belgeyi Yükle').props.disabled).toBe(true);
  const extra = root.findAllByProps({ accessibilityLabel: 'Ek Belge' }).find(item => item.props.onPress)!;
  act(() => extra.props.onPress());
  await act(async () => button('Dosya Seç').props.onPress());
  await act(async () => button('Belgeyi Yükle').props.onPress());
  expect(button('Dosyayı Değiştir')).toBeTruthy();
  expect(root.findAllByType(Text).some(item =>
    item.props.accessibilityRole === 'alert' && item.props.children === 'Ağ bağlantısı kesildi.',
  )).toBe(true);
  await act(async () => button('Belgeyi Yükle').props.onPress());
  expect(mockDispatch.mock.calls[0][0]).toMatchObject({
    applicationId: 'application-1', fileName: 'reference.pdf', documentType: 'extra',
  });
  expect(mockDispatch.mock.calls[0][0].idempotencyKey).toBe(mockDispatch.mock.calls[1][0].idempotencyKey);
  expect(button('Belge Ekle')).toBeTruthy();
});
