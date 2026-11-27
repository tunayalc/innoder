import { apiClient, requireData, type RequestOptions } from './apiClient';
import {
  Application,
  Document,
  PersonalInfo,
  ProgramDraftInput,
} from '../../types';

class ApplicationService {
  async getApplications(): Promise<Application[]> {
    const response = await apiClient.get<Application[]>('/applications');
    return requireData(response);
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const response = await apiClient.get<Application>(`/applications/${id}`);
    return requireData(response);
  }

  async createApplication(
    program: ProgramDraftInput,
  ): Promise<Application | null> {
    const programId = (program as ProgramDraftInput & { id?: string }).id;
    if (!programId) throw new Error('Program kimliği bulunamadı.');
    const response = await apiClient.post<Application>('/applications', {
      programId,
    });
    return requireData(response);
  }

  async updatePersonalInfo(
    applicationId: string,
    info: Partial<PersonalInfo>,
  ): Promise<Application | null> {
    const response = await apiClient.patch<Application>(
      `/applications/${applicationId}/personal-info`,
      info,
    );
    return requireData(response);
  }

  async submitApplication(applicationId: string): Promise<Application | null> {
    const response = await apiClient.post<Application>(
      `/applications/${applicationId}/submit`,
      {},
    );
    return requireData(response);
  }

  async uploadDocument(
    applicationId: string,
    documentType: Document['type'],
    fileUri: string,
    fileName: string,
    mimeType: string,
    options?: RequestOptions,
    requirementKey?: string,
  ): Promise<Document | null> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
    const response = await apiClient.postForm<Document>(
      `/applications/${applicationId}/documents/${documentType}${
        requirementKey ? `?requirement=${encodeURIComponent(requirementKey)}` : ''
      }`,
      formData,
      options,
    );
    return requireData(response);
  }

  // Admin methods
  async verifyDocument(
    applicationId: string,
    documentId: string,
    status: Document['status'],
    note: string,
  ): Promise<Document | null> {
    const response = await apiClient.patch<Document>(
      `/applications/${applicationId}/documents/${documentId}/verify`,
      { status, note },
    );
    return requireData(response);
  }

  async approveApplication(applicationId: string): Promise<Application | null> {
    const response = await apiClient.patch<Application>(
      `/applications/${applicationId}/stage`,
      { stage: 'erasmus_stage' },
    );
    return requireData(response);
  }

  async rejectApplication(
    applicationId: string,
    reason: string,
  ): Promise<Application | null> {
    const response = await apiClient.patch<Application>(
      `/applications/${applicationId}/decision`,
      { status: 'rejected', reason },
    );
    return requireData(response);
  }

  async requestFix(
    applicationId: string,
    message: string,
  ): Promise<Application | null> {
    const response = await apiClient.post<Application>(
      `/applications/${applicationId}/request-fix`,
      { message },
    );
    return requireData(response);
  }
}

export const applicationService = new ApplicationService();
export default applicationService;
