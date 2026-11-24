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
      noticeAccepted: true,
      noticeVersion: '2026-01',
      consentVersion: '2026-01',
    });

    expect(user.status).toBe('pending');

    await expect(
      backend.auth.loginCandidate({
        email: 'test@example.com',
        password: '123456',
      }),
    ).rejects.toThrow();

    await backend.auth.sendCandidatePassword({
      candidateUserId: user.id,
      password: 'StrongPassword123',
      adminUserId: 'admin-test',
    });
    const loggedIn = await backend.auth.loginCandidate({
      email: user.email,
      password: 'StrongPassword123',
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
    expect(draft.status).toBe('application_stage');
    expect(draft.documents.length).toBeGreaterThan(0);
    expect(draft.documents.some((d) => d.type === 'boarding_pass_outbound')).toBe(true);
    expect(draft.documents.some((d) => d.type === 'boarding_pass_return')).toBe(true);

    const uploadRes = await backend.applications.uploadDocument({
      applicationId: draft.id,
      documentType: 'form',
      fileName: 'form.jpg', // Program A expects PDF for form -> wrong_format
      mimeType: 'image/jpeg',
      pageCount: 1,
      qualityScore: 3,
    });
    expect(uploadRes.document.status).toBe('wrong_format');

    const verifyRes = await backend.applications.verifyDocument({
      applicationId: draft.id,
      documentId: uploadRes.document.id,
      status: 'wrong_format',
      verifiedByUserId: 'admin-test',
      note: 'Form PDF olmali',
    });

    expect(verifyRes.document.verifiedAt).toBeTruthy();
    expect(verifyRes.application.status).toBe('application_stage');

    const erasmus = await backend.applications.approve({
      applicationId: draft.id,
      adminUserId: 'admin-test',
    });
    const rejected = await backend.applications.reject({
      applicationId: draft.id,
      adminUserId: 'admin-test',
      reason: 'Uygunluk koşulları karşılanmadı',
    });
    expect(erasmus.status).toBe('erasmus_stage');
    expect(rejected.status).toBe('erasmus_stage');
    expect(rejected.decisionStatus).toBe('rejected');

    const logs = await backend.audit.list();
    expect(logs.length).toBeGreaterThan(0);
  });

  it('creates a password request and allows admin to provision login credentials', async () => {
    const backend = createMockBackend();

    const candidate = await backend.auth.registerCandidate({
      fullName: 'Password User',
      email: 'password@example.com',
      kvkkAccepted: true,
      noticeAccepted: true,
      noticeVersion: '2026-01',
      consentVersion: '2026-01',
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
      password: 'InnoTemporary2026',
      adminUserId: 'admin-001',
    });

    expect(updated.credentialRequestPending).toBe(false);
    expect(updated.credentialSentAt).toBeTruthy();

    expect(updated.mustChangePassword).toBe(true);

    const loggedIn = await backend.auth.loginCandidate({
      email: candidate.email,
      password: 'InnoTemporary2026',
    });
    expect(loggedIn.id).toBe(candidate.id);

    await backend.auth.changePassword({
      userId: candidate.id,
      currentPassword: 'InnoTemporary2026',
      newPassword: 'PersonalPassword2026',
    });
    await expect(backend.auth.loginCandidate({
      email: candidate.email,
      password: 'PersonalPassword2026',
    })).resolves.toMatchObject({ id: candidate.id });
  });
});
