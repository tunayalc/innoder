import { Platform } from 'react-native';
import BlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { apiClient } from './apiClient';
import { clearPrivateFiles, saveOrSharePrivateDocument } from './privateFiles';

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: { CacheDir: '/cache' },
    exists: jest.fn(async () => true),
    mkdir: jest.fn(async () => undefined),
    unlink: jest.fn(async () => undefined),
  },
  config: jest.fn(() => ({
    fetch: jest.fn(async () => ({ info: () => ({ status: 200 }) })),
  })),
  MediaCollection: { copyToMediaStore: jest.fn(async () => 'content://downloads/1') },
}));
jest.mock('react-native-file-viewer', () => ({ open: jest.fn() }));
jest.mock('react-native-share', () => ({ open: jest.fn(async () => ({ success: true })) }));

const url = '/api/documents/report/download';
const fileName = '../Activity Agreement.pdf';
const save = (download: boolean) =>
  saveOrSharePrivateDocument(url, fileName, 'application/pdf', download);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.spyOn(apiClient, 'authorized').mockImplementation(async (_url, run) =>
    run('https://api.innoder.org/api/documents/report/download', { Authorization: 'Bearer test' }),
  );
});
afterEach(async () => {
  await clearPrivateFiles();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('passes a local PDF to the OS share sheet, never its private URL', async () => {
  expect(await save(false)).toBe(true);
  expect(apiClient.authorized).toHaveBeenCalledWith(url, expect.any(Function));
  expect(Share.open).toHaveBeenCalledWith({
    url: expect.stringMatching(/^file:\/\/\/cache\/inno-private\/[^/]+\/_Activity_Agreement\.pdf$/),
    type: 'application/pdf', saveToFiles: false, failOnCancel: false,
  });
});

test('saves a copy through MediaStore without opening the share sheet on Android', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue(34);
  expect(await save(true)).toBe(true);
  expect(BlobUtil.MediaCollection.copyToMediaStore).toHaveBeenCalledWith(
    expect.objectContaining({ name: '_Activity_Agreement.pdf', parentFolder: 'Inno' }),
    'Download', expect.stringContaining('/cache/inno-private/'),
  );
  expect(Share.open).not.toHaveBeenCalled();
});

test('uses the Files picker on iOS and does not report cancellation as success', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(Share.open).mockResolvedValueOnce({ success: false, dismissedAction: true, message: '' });
  expect(await save(true)).toBe(false);
  expect(Share.open).toHaveBeenCalledWith(expect.objectContaining({ saveToFiles: true }));
});

test('rejects a failed download without handing any file to the OS', async () => {
  jest.mocked(apiClient.authorized).mockResolvedValueOnce({ status: 403 });
  await expect(save(false)).rejects.toMatchObject({ status: 403 });
  expect(Share.open).not.toHaveBeenCalled();
  expect(BlobUtil.fs.unlink).toHaveBeenCalled();
});
