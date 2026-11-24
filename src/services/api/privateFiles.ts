import BlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';
import { Platform } from 'react-native';
import { apiClient, ApiError } from './apiClient';

const directory = `${BlobUtil.fs.dirs.CacheDir}/inno-private`;
const pending = new Set<string>();
export const trackPrivateFile=(path:string)=>{
  const normalized=path.replace(/^file:\/\//,'');pending.add(normalized);
  setTimeout(()=>{pending.delete(normalized);BlobUtil.fs.unlink(normalized).catch(()=>undefined);},10*60*1000);
};
export const clearPrivateFiles = async () => {
  for (const path of pending)
    await BlobUtil.fs.unlink(path).catch(() => undefined);
  pending.clear();
  if (await BlobUtil.fs.exists(directory))
    await BlobUtil.fs.unlink(directory).catch(() => undefined);
};
const withPrivateFile = async <T>(
  url: string,
  fileName: string,
  action: (path: string) => Promise<T>,
) => {
  const version = apiClient.getVersion();
  if (!(await BlobUtil.fs.exists(directory)))
    await BlobUtil.fs.mkdir(directory);
  const folder = `${directory}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  await BlobUtil.fs.mkdir(folder);
  const path = `${folder}/${fileName}`;
  pending.add(folder);
  try {
    const response = await apiClient.authorized(
      url,
      async (address, headers) => {
        const download = await BlobUtil.config({ path }).fetch(
          'GET',
          address,
          headers,
        );
        const status = download.info().status;
        if (status !== 200)
          await BlobUtil.fs.unlink(path).catch(() => undefined);
        return { status };
      },
    );
    if (response.status !== 200)
      throw new ApiError(
        'Belge indirilemedi. Tekrar deneyin.',
        response.status,
      );
    apiClient.assertSession(version);
    const result = await action(path);
    trackPrivateFile(folder);
    return result;
  } catch (error) {
    pending.delete(folder);
    await BlobUtil.fs.unlink(folder).catch(() => undefined);
    throw error;
  }
};

export const openPrivateFile = (
  url: string,
  extension: 'pdf' | 'png' | 'jpg' = 'pdf',
) => withPrivateFile(url, `belge.${extension}`, path =>
  FileViewer.open(path, { showOpenWithDialog: true }),
);

export const saveOrSharePrivateDocument = (
  url: string,
  originalName: string,
  mimeType: string,
  save: boolean,
) => {
  const extension = mimeType === 'application/pdf' ? 'pdf'
    : mimeType === 'image/png' ? 'png'
    : mimeType === 'image/jpeg' ? 'jpg' : undefined;
  if (!extension) throw new Error('PDF, JPG, PNG');
  const base = Array.from(originalName.replace(/\.[a-z0-9]{1,8}$/i, ''))
    .filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127)
    .join('').replace(/[\s/\\:*?"<>|#%]+/g, '_')
    .replace(/^\.+/, '').slice(0, 100);
  const name = `${base || 'belge'}.${extension}`;
  return withPrivateFile(url, name, async path => {
    if (save && Platform.OS === 'android' && Number(Platform.Version) >= 29) {
      // Android reads name, while the library's declaration requires path.
      const descriptor = { name, path: name, mimeType, parentFolder: 'Inno' };
      await BlobUtil.MediaCollection.copyToMediaStore(
        descriptor, 'Download', path,
      );
      return true;
    }
    const shared = await Share.open({
      url: `file://${path}`,
      type: mimeType,
      saveToFiles: save && Platform.OS === 'ios',
      failOnCancel: false,
    });
    return shared.success;
  });
};
