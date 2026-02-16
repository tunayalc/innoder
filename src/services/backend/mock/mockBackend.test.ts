import AsyncStorage from '@react-native-async-storage/async-storage';

import { appConfig } from '../../../config/appConfig';
import { createMockBackend } from './mockBackend';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('mock backend', () => {
  beforeEach(async () => {
    // Speed up tests by removing artificial latency.
    (appConfig as any).mock.delayMs = 0;
    await AsyncStorage.clear();
  });

  it('registers and logs in a candidate, creates a draft and uploads/verifies a document', async () => {
    const backend = createMockBackend();

    const user = await backend.auth.registerCandidate({
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '+905551112233',
      country: 'Türkiye',
      city: 'İstanbul',
      password: '123456',
      kvkkAccepted: true,
    });

    const loggedIn = await backend.auth.loginCandidate({
      email: 'test@example.com',
      password: '123456',
    });

    expect(loggedIn.id).toBe(user.id);
    expect(loggedIn.role).toBe('candidate');

    const draft = await backend.applications.ensureDraft({
      userId: user.id,
      programId: 'prog-a',
      fullName: user.name,
    });
    expect(draft.status).toBe('draft');
    expect(draft.documents.length).toBeGreaterThan(0);
    expect(draft.documents.some((d) => d.type === 'boarding_pass')).toBe(true);

    const uploadRes = await backend.applications.uploadDocument({
      applicationId: draft.id,
      documentType: 'form',
      fileName: 'form.jpg', // Program A expects PDF for form -> wrong_format
      mimeType: 'image/jpeg',
      pageCount: 1,
      qualityScore: 3,
    });
    expect(uploadRes.document.status).toBe('wrong_format');

    const admin = await backend.auth.loginAdmin({
      username: 'admin',
      password: '123123',
    });

    const verifyRes = await backend.applications.verifyDocument({
      applicationId: draft.id,
      documentId: uploadRes.document.id,
      status: 'wrong_format',
      verifiedByUserId: admin.id,
      note: 'Form PDF olmalı',
    });

    expect(verifyRes.document.verifiedAt).toBeTruthy();
    expect(verifyRes.application.status).toBe('needs_fix');

    const logs = await backend.audit.list();
    expect(logs.length).toBeGreaterThan(0);
  });
});
