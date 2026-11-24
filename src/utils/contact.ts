import { Linking } from 'react-native';

export const buildMailtoUrl = (params: {
  to: string;
  subject?: string;
  body?: string;
}) => {
  const query = [
    params.subject ? `subject=${encodeURIComponent(params.subject)}` : '',
    params.body ? `body=${encodeURIComponent(params.body)}` : '',
  ]
    .filter(Boolean)
    .join('&');

  return `mailto:${params.to}${query ? `?${query}` : ''}`;
};

export const openExternalUrl = async (url: string) => {
  if (!/^(https?:\/\/|mailto:)/i.test(url))
    throw new Error('Desteklenmeyen bağlantı.');
  // Opening an intent does not require Android package-visibility permission.
  // canOpenURL may return false even when the system can open a web/mail link.
  await Linking.openURL(url);
};

export const openMailto = async (params: {
  to: string;
  subject?: string;
  body?: string;
}) => openExternalUrl(buildMailtoUrl(params));
