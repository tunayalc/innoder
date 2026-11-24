import { Linking } from 'react-native';
import { buildMailtoUrl, openExternalUrl, openMailto } from './contact';

describe('external support and privacy links', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('opens valid links even when package discovery reports no handler', async () => {
    const query = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await openExternalUrl('https://api.innoder.org/privacy');
    expect(open).toHaveBeenCalledWith('https://api.innoder.org/privacy');
    expect(query).not.toHaveBeenCalled();
  });

  it('encodes support mail subjects and messages without inserting new parameters', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const message = { to: 'support@inno.test', subject: 'Hesap & silme', body: 'A&B?test=1' };
    await openMailto(message);
    expect(open).toHaveBeenCalledWith(buildMailtoUrl(message));
    expect(buildMailtoUrl(message)).toContain('subject=Hesap%20%26%20silme&body=A%26B%3Ftest%3D1');
  });

  it('rejects executable and private file URLs', async () => {
    const open = jest.spyOn(Linking, 'openURL');
    for (const url of ['java' + 'script:alert(1)', 'file:///private/data', 'intent://settings'])
      await expect(openExternalUrl(url)).rejects.toThrow();
    expect(open).not.toHaveBeenCalled();
  });

  it('propagates missing mail-app errors so the screen can offer feedback', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No handler'));
    await expect(openMailto({ to: 'support@inno.test' })).rejects.toThrow('No handler');
  });
});
