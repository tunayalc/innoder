import type { InnoBackend } from '../types';
import { BackendError } from '../types';
import type { AuditLog, Message } from '../../../types';
import { authService, applicationService } from '../../api';
import { PROGRAM_CATALOG } from '../../programCatalog';

/**
 * Remote backend implementation (real API).
 *
 * NOTE: The real API is currently unavailable in this environment. This file is
 * kept as the drop-in implementation for when backend access is restored.
 */
export const createRemoteBackend = (): InnoBackend => ({
  auth: {
    async loginCandidate({ email, password }) {
      const res = await authService.login({ email, password });
      if (!res) throw new BackendError('UNKNOWN', 'Login failed');
      return res.user;
    },
    async registerCandidate(params) {
      const res = await authService.register({
        name: params.fullName,
        email: params.email,
        phone: params.phone || '',
        password: params.password,
        kvkkAccepted: params.kvkkAccepted,
      });
      if (!res) throw new BackendError('UNKNOWN', 'Registration failed');
      return res.user;
    },
    async loginAdmin({ username, password }) {
      // TODO: replace with real admin auth endpoint/flow when available.
      // For now, try the same login endpoint if backend supports it.
      const res = await authService.login({ email: username, password });
      if (!res) throw new BackendError('UNKNOWN', 'Admin login failed');
      return res.user;
    },
    async logout() {
      await authService.logout();
    },
    async updateProfile() {
      // TODO: implement /users/me PATCH when API is available.
      throw new BackendError('NOT_FOUND', 'updateProfile endpoint not implemented');
    },
  },

  programs: {
    async listPrograms() {
      // TODO: fetch from API. Static fallback keeps UI functional.
      return PROGRAM_CATALOG;
    },
    async getProgram(programId: string) {
      const program = PROGRAM_CATALOG.find((p) => p.id === programId);
      if (!program) throw new BackendError('NOT_FOUND', 'Program bulunamadı.');
      return program;
    },
  },

  applications: {
    async listForAdmin() {
      return applicationService.getApplications();
    },
    async getForCandidate({ userId }) {
      // TODO: call /applications/me (or similar). Temporary fallback filters locally.
      const all = await applicationService.getApplications();
      return all.find((a) => a.userId === userId) || null;
    },
    async ensureDraft({ programId }) {
      const app = await applicationService.createApplication(programId);
      if (!app) throw new BackendError('UNKNOWN', 'Draft application create failed');
      return app;
    },
    async updatePersonalInfo({ applicationId, patch }) {
      const app = await applicationService.updatePersonalInfo(applicationId, patch);
      if (!app) throw new BackendError('UNKNOWN', 'Personal info update failed');
      return app;
    },
    async submit({ applicationId }) {
      const app = await applicationService.submitApplication(applicationId);
      if (!app) throw new BackendError('UNKNOWN', 'Submit failed');
      return app;
    },
    async uploadDocument({ applicationId, documentType, fileUrl = '', fileName }) {
      const doc = await applicationService.uploadDocument(
        applicationId,
        documentType,
        fileUrl,
      );
      if (!doc) throw new BackendError('UNKNOWN', 'Upload failed');
      // Remote doc model should match our `Document` type.
      const app = await applicationService.getApplicationById(applicationId);
      if (!app) throw new BackendError('UNKNOWN', 'Application fetch failed');
      return { application: app, document: { ...doc, fileName } as any };
    },
    async verifyDocument({ applicationId, documentId, status, note }) {
      const doc = await applicationService.verifyDocument(
        applicationId,
        documentId,
        status as any,
        note,
      );
      if (!doc) throw new BackendError('UNKNOWN', 'Verify failed');
      const app = await applicationService.getApplicationById(applicationId);
      if (!app) throw new BackendError('UNKNOWN', 'Application fetch failed');
      return { application: app, document: doc as any };
    },
    async approve({ applicationId }) {
      const app = await applicationService.approveApplication(applicationId);
      if (!app) throw new BackendError('UNKNOWN', 'Approve failed');
      return app;
    },
    async reject({ applicationId, reason }) {
      const app = await applicationService.rejectApplication(applicationId, reason);
      if (!app) throw new BackendError('UNKNOWN', 'Reject failed');
      return app;
    },
  },

  messages: {
    async listByApplicationId() {
      // TODO: implement /messages?applicationId
      return [] as Message[];
    },
    async send() {
      // TODO: implement /messages POST
      throw new BackendError('NOT_FOUND', 'messages.send endpoint not implemented');
    },
    async markThreadRead() {
      // TODO: implement /messages/read (or similar)
    },
  },

  audit: {
    async list() {
      // TODO: implement /audit endpoint
      return [] as AuditLog[];
    },
    async append() {
      // In real backend, audit is server-generated.
      throw new BackendError('NOT_FOUND', 'audit.append not supported on remote backend');
    },
  },
});
