import type { InnoBackend } from '../types';
import { BackendError } from '../types';
import type { AuditLog, Message } from '../../../types';
import { authService, applicationService } from '../../api';

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
        phone: '',
        password: '',
        kvkkAccepted: params.kvkkAccepted,
      });
      if (!res) throw new BackendError('UNKNOWN', 'Registration failed');
      return res.user;
    },
    async requestCandidatePassword() {
      throw new BackendError('NOT_FOUND', 'requestCandidatePassword endpoint not implemented');
    },
    async loginAdmin({ username, password }) {
      const res = await authService.login({ email: username, password });
      if (!res) throw new BackendError('UNKNOWN', 'Admin login failed');
      return res.user;
    },
    async logout() {
      await authService.logout();
    },
    async updateProfile() {
      throw new BackendError('NOT_FOUND', 'updateProfile endpoint not implemented');
    },
    async listCandidates() {
      throw new BackendError('NOT_FOUND', 'listCandidates endpoint not implemented');
    },
    async sendCandidatePassword() {
      throw new BackendError('NOT_FOUND', 'sendCandidatePassword endpoint not implemented');
    },
  },

  programs: {
    async listPrograms() {
      return [];
    },
    async getProgram(programId: string) {
      throw new BackendError('NOT_FOUND', `Program ${programId} not found`);
    },
  },

  applications: {
    async listForAdmin() {
      return applicationService.getApplications();
    },
    async getForCandidate({ userId }) {
      const all = await applicationService.getApplications();
      return all.find((a) => a.userId === userId) || null;
    },
    async listForCandidate({ userId }) {
      const all = await applicationService.getApplications();
      return all.filter((a) => a.userId === userId);
    },
    async ensureDraft({ program }) {
      const app = await applicationService.createApplication(program);
      if (!app) throw new BackendError('UNKNOWN', 'Draft application create failed');
      return app;
    },
    async assignProgram() {
      throw new BackendError('NOT_FOUND', 'assignProgram endpoint not implemented');
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
      return [] as Message[];
    },
    async send() {
      throw new BackendError('NOT_FOUND', 'messages.send endpoint not implemented');
    },
    async markThreadRead() {},
  },

  audit: {
    async list() {
      return [] as AuditLog[];
    },
    async append() {
      throw new BackendError('NOT_FOUND', 'audit.append not supported on remote backend');
    },
  },
});
