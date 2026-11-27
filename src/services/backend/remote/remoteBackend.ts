import type { InnoBackend } from '../types';
import { BackendError } from '../types';
import type { AuditLog, Message } from '../../../types';
import { authService, applicationService } from '../../api';
import { apiClient, requireData } from '../../api/apiClient';

/**
 * Remote backend implementation (real API).
 *
 * NOTE: The real API is currently unavailable in this environment. This file is
 * kept as the drop-in implementation for when backend access is restored.
 */
export const createRemoteBackend = (): InnoBackend => ({
  auth: {
    async loginCandidate({ email, password, rememberMe }) {
      const res = await authService.login({ email, password, rememberMe });
      if (!res) throw new BackendError('UNKNOWN', 'Login failed');
      return res.user;
    },
    async registerCandidate(params) {
      const res = await authService.register({
        name: params.fullName,
        email: params.email,
        eventLink: params.eventLink,
        noticeAccepted: params.noticeAccepted,
        noticeVersion: params.noticeVersion,
        consentAccepted: params.kvkkAccepted,
        consentVersion: params.consentVersion,
      });
      if (!res) throw new BackendError('UNKNOWN', 'Registration failed');
      return res.user;
    },
    async requestCandidatePassword() {
      throw new BackendError(
        'NOT_FOUND',
        'requestCandidatePassword endpoint not implemented',
      );
    },
    async loginAdmin({ username, password, rememberMe }) {
      const res = await authService.login({
        email: username,
        password,
        rememberMe,
      });
      if (!res) throw new BackendError('UNKNOWN', 'Admin login failed');
      return res.user;
    },
    async logout() {
      await authService.logout();
    },
    async changePassword({ currentPassword, newPassword }) {
      await authService.changePassword(currentPassword, newPassword);
    },
    async updateProfile({ patch }) {
      const response = await apiClient.patch<any>('/users/me', patch);
      return requireData(response);
    },
    async listCandidates() {
      const response = await apiClient.get<any[]>('/admin/candidates');
      return requireData(response);
    },
    async sendCandidatePassword({ candidateUserId, password, eventLinkApproved }) {
      const response = await apiClient.post<any>(
        `/admin/candidates/${candidateUserId}/temporary-password`,
        { password, eventLinkApproved },
      );
      if (!response.data)
        throw new BackendError(
          'UNKNOWN',
          response.error || 'Geçici şifre kaydedilemedi.',
        );
      return response.data.user;
    },
  },

  programs: {
    async save(input) {
      const { id, ...patch } = input;
      return requireData(
        id
          ? await apiClient.patch(`/programs/${id}`, patch)
          : await apiClient.post('/programs', patch),
      );
    },
    async listPrograms() {
      const response = await apiClient.get<any[]>('/programs');
      return requireData(response);
    },
    async getProgram(programId: string) {
      const response = await apiClient.get<any>(`/programs/${programId}`);
      if (!response.data)
        throw new BackendError('NOT_FOUND', `Program ${programId} not found`);
      return response.data;
    },
  },

  applications: {
    async listPage(filters) {
      const query = new URLSearchParams({
        page: String(filters.page || 1),
        pageSize: String(filters.pageSize || 25),
      });
      if (filters.query) query.append('q', filters.query);
      if (filters.status) query.append('status', filters.status);
      if (filters.programId) query.append('programId', filters.programId);
      if (filters.createdAfterISO)
        query.append('createdAfterISO', filters.createdAfterISO);
      if (filters.hasIssues !== undefined)
        query.append('hasIssues', String(filters.hasIssues));
      return requireData(await apiClient.get(`/applications?${query}`));
    },
    async listForAdmin() {
      return applicationService.getApplications();
    },
    async getForCandidate({ userId }) {
      const all = await applicationService.getApplications();
      return all.find(a => a.userId === userId) || null;
    },
    async listForCandidate({ userId }) {
      const all = await applicationService.getApplications();
      return all.filter(a => a.userId === userId);
    },
    async ensureDraft({ program }) {
      const programs = await apiClient.get<any[]>('/programs');
      const remoteProgram = programs.data?.find(
        item => item.name === program.name && item.year === program.year,
      );
      if (!remoteProgram)
        throw new BackendError(
          'NOT_FOUND',
          'Bu program henüz yönetici tarafından açılmamış.',
        );
      const app = await applicationService.createApplication({
        ...program,
        id: remoteProgram.id,
      } as any);
      if (!app)
        throw new BackendError('UNKNOWN', 'Draft application create failed');
      return app;
    },
    async assignProgram({ userId, program }) {
      const programs = requireData(await apiClient.get<any[]>('/programs'));
      let remoteProgram = programs.find(item =>
        program.id
          ? item.id === program.id
          : item.name === program.name && item.year === program.year,
      );
      if (!remoteProgram) {
        remoteProgram = requireData(
          await apiClient.post<any>('/programs', program),
        );
      }
      if (!remoteProgram)
        throw new BackendError('UNKNOWN', 'Program oluşturulamadı.');
      const response = await apiClient.post<any>('/applications', {
        userId,
        programId: remoteProgram.id,
      });
      if (!response.data)
        throw new BackendError(
          'UNKNOWN',
          response.error || 'Program atanamadı.',
        );
      return response.data;
    },
    async updatePersonalInfo({ applicationId, patch }) {
      const app = await applicationService.updatePersonalInfo(
        applicationId,
        patch,
      );
      if (!app)
        throw new BackendError('UNKNOWN', 'Personal info update failed');
      return app;
    },
    async submit({ applicationId }) {
      const app = await applicationService.submitApplication(applicationId);
      if (!app) throw new BackendError('UNKNOWN', 'Submit failed');
      return app;
    },
    async uploadDocument({
      applicationId,
      documentType,
      requirementKey,
      fileUrl = '',
      fileName,
      mimeType,
      signal,
      onProgress,
      idempotencyKey,
    }) {
      const doc = await applicationService.uploadDocument(
        applicationId,
        documentType,
        fileUrl,
        fileName,
        mimeType,
        {
          signal,
          onProgress,
          headers: idempotencyKey
            ? { 'Idempotency-Key': idempotencyKey }
            : undefined,
        },
        requirementKey,
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
    async setStage({ applicationId, stage }) {
      const response = await apiClient.patch<any>(
        `/applications/${applicationId}/stage`,
        { stage },
      );
      return requireData(response);
    },
    async reject({ applicationId, reason }) {
      const app = await applicationService.rejectApplication(
        applicationId,
        reason,
      );
      if (!app) throw new BackendError('UNKNOWN', 'Reject failed');
      return app;
    },
    async setDecision({ applicationId, status, reason }) {
      const response = await apiClient.patch<any>(
        `/applications/${applicationId}/decision`,
        { status, reason },
      );
      return requireData(response);
    },
    async setPhysicalDelivery({ applicationId, documentId, status }) {
      const response = await apiClient.patch<any>(
        `/applications/${applicationId}/documents/${documentId}/physical-delivery`,
        { status },
      );
      const document = requireData(response);
      const application = await applicationService.getApplicationById(
        applicationId,
      );
      if (!application) throw new BackendError('UNKNOWN', 'Başvuru alınamadı.');
      return { application, document };
    },
  },

  messages: {
    async listPage({ applicationId, page, pageSize = 25 }) {
      return requireData(
        await apiClient.get<{
          items: Message[];
          total: number;
          page: number;
          pageSize: number;
        }>(
          `/messages/${encodeURIComponent(
            applicationId,
          )}?page=${page}&pageSize=${pageSize}`,
        ),
      );
    },
    async listByApplicationId({ applicationId }) {
      const response = await apiClient.get<Message[]>(
        `/messages/${encodeURIComponent(applicationId)}`,
      );
      return requireData(response);
    },
    async send({ applicationId, content, relatedDocumentId }) {
      const response = await apiClient.post<Message>(
        `/messages/${encodeURIComponent(applicationId)}`,
        { content, relatedDocumentId },
      );
      if (!response.data)
        throw new BackendError(
          'UNKNOWN',
          response.error || 'Mesaj gönderilemedi.',
        );
      return response.data;
    },
    async markThreadRead({ applicationId }) {
      const response = await apiClient.post(
        `/messages/${encodeURIComponent(applicationId)}/read`,
        {},
      );
      if (response.error) throw new Error(response.error);
    },
  },

  audit: {
    async list() {
      const response = await apiClient.get<AuditLog[]>(
        '/admin/audit?limit=200',
      );
      return requireData(response);
    },
    async append() {
      throw new BackendError(
        'NOT_FOUND',
        'audit.append not supported on remote backend',
      );
    },
  },
});
