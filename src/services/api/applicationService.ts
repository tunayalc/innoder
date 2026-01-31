import { apiClient } from './apiClient';
import { Application, Document, PersonalInfo } from '../../types';

class ApplicationService {
  async getApplications(): Promise<Application[]> {
    const response = await apiClient.get<Application[]>('/applications');
    return response.data || [];
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const response = await apiClient.get<Application>(`/applications/${id}`);
    return response.data || null;
  }

  async createApplication(programId: string): Promise<Application | null> {
    const response = await apiClient.post<Application>('/applications', { programId });
    return response.data || null;
  }

  async updatePersonalInfo(
    applicationId: string,
    info: Partial<PersonalInfo>
  ): Promise<Application | null> {
    const response = await apiClient.patch<Application>(
      `/applications/${applicationId}/personal-info`,
      info
    );
    return response.data || null;
  }

  async submitApplication(applicationId: string): Promise<Application | null> {
    const response = await apiClient.post<Application>(
      `/applications/${applicationId}/submit`,
      {}
    );
    return response.data || null;
  }

  async uploadDocument(
    applicationId: string,
    documentType: Document['type'],
    fileUri: string
  ): Promise<Document | null> {
    // For file uploads, you'd typically use FormData
    // This is a simplified version
    const response = await apiClient.post<Document>(
      `/applications/${applicationId}/documents`,
      { type: documentType, fileUri }
    );
    return response.data || null;
  }

  // Admin methods
  async verifyDocument(
    applicationId: string,
    documentId: string,
    status: Document['status'],
    note?: string
  ): Promise<Document | null> {
    const response = await apiClient.patch<Document>(
      `/applications/${applicationId}/documents/${documentId}/verify`,
      { status, note }
    );
    return response.data || null;
  }

  async approveApplication(applicationId: string): Promise<Application | null> {
    const response = await apiClient.post<Application>(
      `/applications/${applicationId}/approve`,
      {}
    );
    return response.data || null;
  }

  async rejectApplication(
    applicationId: string,
    reason: string
  ): Promise<Application | null> {
    const response = await apiClient.post<Application>(
      `/applications/${applicationId}/reject`,
      { reason }
    );
    return response.data || null;
  }

  async requestFix(
    applicationId: string,
    message: string
  ): Promise<Application | null> {
    const response = await apiClient.post<Application>(
      `/applications/${applicationId}/request-fix`,
      { message }
    );
    return response.data || null;
  }
}

export const applicationService = new ApplicationService();
export default applicationService;
