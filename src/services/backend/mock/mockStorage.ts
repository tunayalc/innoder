import AsyncStorage from '@react-native-async-storage/async-storage';

export const MOCK_STORAGE_KEYS = {
  users: '@inno_mock/users',
  programs: '@inno_mock/programs',
  passwords: '@inno_mock/passwords',
  applications: '@inno_mock/applications',
  messages: '@inno_mock/messages',
  auditLogs: '@inno_mock/auditLogs',
} as const;

const safeJsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  const raw = await AsyncStorage.getItem(key);
  return safeJsonParse(raw, fallback);
};

export const writeJson = async (key: string, value: unknown): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

