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
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error('Baglanti acilamadi.');
  }

  await Linking.openURL(url);
};

export const openMailto = async (params: {
  to: string;
  subject?: string;
  body?: string;
}) => openExternalUrl(buildMailtoUrl(params));
