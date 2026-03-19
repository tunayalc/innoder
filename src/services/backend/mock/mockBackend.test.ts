import AsyncStorage from '@react-native-async-storage/async-storage';

import { appConfig } from '../../../config/appConfig';
import { createGeneralChatThreadId } from '../../../types';
import { createProgramDraftInput } from '../../programFactory';
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

  it('registers candidate and blocks login until credentials are provisioned', async () => {
    const backend = createMockBackend();

    const user = await backend.auth.registerCandidate({
      fullName: 'Test User',
      email: 'test@example.com',
      kvkkAccepted: true,
    });

    expect(user.status).toBe('verified');

    await expect(
      backend.auth.loginCandidate({
        email: 'test@example.com',
        password: '123456',
      }),
    ).rejects.toThrow();

    // Demo candidate is seeded as verified with credentials.
    const loggedIn = await backend.auth.loginCandidate({
      email: 'aday@inno.com',
      password: '123123',
    });

    expect(loggedIn.role).toBe('candidate');

    const draft = await backend.applications.ensureDraft({
      userId: loggedIn.id,
      program: createProgramDraftInput({
        name: 'Program A',
        year: 2026,
        documentTypes: ['identity', 'form', 'boarding_pass', 'extra'],
      }),
      fullName: loggedIn.name,
    });
    expect(['draft', 'under_review']).toContain(draft.status);
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
      note: 'Form PDF olmali',
    });

    expect(verifyRes.document.verifiedAt).toBeTruthy();
    expect(verifyRes.application.status).toBe('needs_fix');

    const logs = await backend.audit.list();
    expect(logs.length).toBeGreaterThan(0);
  });

  it('creates a password request and allows admin to provision login credentials', async () => {
    const backend = createMockBackend();

    const candidate = await backend.auth.registerCandidate({
      fullName: 'Password User',
      email: 'password@example.com',
      kvkkAccepted: true,
    });

    const requested = await backend.auth.requestCandidatePassword({
      fullName: candidate.name,
      email: candidate.email,
    });

    expect(requested.credentialRequestPending).toBe(true);
    expect(requested.credentialRequestedAt).toBeTruthy();

    const generalThread = await backend.messages.listByApplicationId({
      applicationId: createGeneralChatThreadId(candidate.id),
    });
    expect(generalThread[generalThread.length - 1]?.content).toContain('şifre talep ediyorum');

    const updated = await backend.auth.sendCandidatePassword({
      candidateUserId: candidate.id,
      password: 'inno-pass-2026',
      adminUserId: 'admin-001',
    });

    expect(updated.credentialRequestPending).toBe(false);
    expect(updated.credentialSentAt).toBeTruthy();

    const loggedIn = await backend.auth.loginCandidate({
      email: candidate.email,
      password: 'inno-pass-2026',
    });
    expect(loggedIn.id).toBe(candidate.id);
  });
});
