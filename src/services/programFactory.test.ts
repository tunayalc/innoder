import { parseDeadlines } from './programFactory';
import {
  createGeneralChatThreadId,
  isGeneralChatThreadId,
} from '../types/message';

it('keeps valid deadlines and rejects malformed calendar dates instead of dropping them', () => {
  expect(parseDeadlines('Belgeler|2026-11-12')).toEqual([
    { label: 'Belgeler', dateISO: '2026-11-12' },
  ]);
  expect(parseDeadlines('')).toEqual([]);
  for (const text of ['Eksik tarih', 'Yanlış|2026-02-31', 'Yanlış|not-a-date'])
    expect(() => parseDeadlines(text)).toThrow();
});
it('uses the API general conversation namespace and recognizes legacy mobile threads', () => {
  expect(createGeneralChatThreadId('candidate')).toBe('general:candidate');
  expect(isGeneralChatThreadId('general:candidate')).toBe(true);
  expect(isGeneralChatThreadId('general-user:candidate')).toBe(true);
  expect(isGeneralChatThreadId('application')).toBe(false);
});
