import type { Application, PersonalInfo, ProgramDraftInput } from '../../types';
import type { ApplicationBackend } from '../../services/backend/types';
import { getBackend } from '../../services/backend';
import { apiClient,ApiError,requireData } from '../../services/api/apiClient';
import {
  setApplicationPage,
  setApplications,
  setCurrentApplication,
  setLoading,
  setError,
  updateApplication,
} from '../slices/applicationSlice';
import { getErrorMessage } from './errors';
import { reloadAuditLogs } from './auditThunks';
import type { AppThunk } from './authThunks';

export type { AppThunk } from './authThunks';
type Result = AppThunk<Promise<boolean>>;
let adminListRequest=0;
type Params<K extends keyof ApplicationBackend> = Parameters<
  NonNullable<ApplicationBackend[K]>
>[0];

const mutate =
  (
    run: (backend: ApplicationBackend, userId: string) => Promise<Application>,
    fallback: string,
    select = false,
  ): Result =>
  async (dispatch, getState) => {
    const user = getState().user.user;
    if (!user) return false;
    const version = apiClient.getVersion();
    const current = () =>
      getState().user.user?.id === user.id &&
      apiClient.getVersion() === version;
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const app = await run(getBackend().applications, user.id);
      if (!current()) return false;
      if (getState().application.applications.some(item => item.id === app.id))
        dispatch(updateApplication(app));
      else
        dispatch(
          setApplications([app, ...getState().application.applications]),
        );
      if (select) dispatch(setCurrentApplication(app));
      if (user.role !== 'candidate') dispatch(reloadAuditLogs());
      return true;
    } catch (error) {
      if(current()&&error instanceof ApiError&&error.status===409){
        const id=error.issues&&typeof error.issues==='object'&&'applicationId' in error.issues?String(error.issues.applicationId):undefined;
        if(id)try{dispatch(updateApplication(requireData(await apiClient.get<Application>(`/applications/${id}`))));}catch{ /* Keep the draft and original conflict message. */ }
      }
      if (current()) dispatch(setError(getErrorMessage(error, fallback)));
      return false;
    } finally {
      if (current()) dispatch(setLoading(false));
    }
  };

export const ensureDraftApplication =
  (params: { program: ProgramDraftInput }): Result =>
  async (dispatch, getState) => {
    const user = getState().user.user;
    if (!user) return false;
    return dispatch(
      mutate(
        backend =>
          backend.ensureDraft({
            ...params,
            userId: user.id,
            fullName: user.name,
          }),
        'Başvuru oluşturulamadı.',
        true,
      ),
    );
  };
export const assignProgramToCandidate = (
  params: Params<'assignProgram'>,
): Result =>
  mutate(
    backend => backend.assignProgram(params),
    'Program ataması yapılamadı.',
  );
export const updatePersonalInfoDraft = (params: {
  applicationId: string;
  patch: Partial<PersonalInfo>;
  programId: string;
}): Result =>
  mutate(
    backend => backend.updatePersonalInfo(params),
    'Bilgiler kaydedilemedi.',
    true,
  );
export const submitApplication = (params: Params<'submit'>): Result =>
  mutate(backend => backend.submit(params), 'Başvuru gönderilemedi.', true);
export const uploadDocument = (params: Params<'uploadDocument'>): Result =>
  mutate(
    async backend => (await backend.uploadDocument(params)).application,
    'Belge yüklenemedi.',
    true,
  );
export const uploadAdminDocument = (params: Omit<Params<'uploadDocument'>, 'adminUserId'>): Result =>
  async (dispatch, getState) => {
    const actor = getState().user.user;
    if (actor?.role !== 'admin' && actor?.role !== 'super_admin') return false;
    return dispatch(mutate(
      async backend => (await backend.uploadDocument({ ...params, adminUserId: actor.id })).application,
      'Belge yüklenemedi.',
    ));
  };
export const verifyDocument = (
  params: Omit<Params<'verifyDocument'>, 'verifiedByUserId'>,
): Result =>
  mutate(
    async (backend, userId) =>
      (await backend.verifyDocument({ ...params, verifiedByUserId: userId }))
        .application,
    'Doğrulama kaydedilemedi.',
  );
export const approveApplication = (params: { applicationId: string }): Result =>
  mutate(
    (backend, userId) => backend.approve({ ...params, adminUserId: userId }),
    'Onay işlemi başarısız.',
  );
export const setApplicationStage = (
  params: Omit<Params<'setStage'>, 'adminUserId'>,
): Result =>
  mutate(
    (backend, userId) => backend.setStage({ ...params, adminUserId: userId }),
    'Aşama güncellenemedi.',
  );
export const setDocumentPhysicalDelivery = (
  params: Omit<Params<'setPhysicalDelivery'>, 'adminUserId'>,
): Result =>
  mutate(
    async (backend, userId) =>
      (await backend.setPhysicalDelivery({ ...params, adminUserId: userId }))
        .application,
    'Teslim bilgisi güncellenemedi.',
  );
export const rejectApplication = (params: {
  applicationId: string;
  reason: string;
}): Result =>
  mutate(
    (backend, userId) => backend.reject({ ...params, adminUserId: userId }),
    'Reddetme işlemi başarısız.',
  );
export const restoreApplicationDecision = (params: {
  applicationId: string;
}): Result =>
  mutate(
    (backend, userId) =>
      backend.setDecision({ ...params, adminUserId: userId, status: 'active' }),
    'Karar güncellenemedi.',
  );

export const loadAdminApplications =
  (
    filters: Params<'listForAdmin'> & { page?: number; append?: boolean } = {},
  ): Result =>
  async (dispatch, getState) => {
    const user = getState().user.user;
    const version = apiClient.getVersion();
    const request=++adminListRequest;
    const current = () =>
      getState().user.user?.id === user?.id &&
      apiClient.getVersion() === version && request===adminListRequest;
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const backend = getBackend().applications;
      if (backend.listPage) {
        const page = await backend.listPage({
          ...filters,
          page: filters.page || 1,
          pageSize: 25,
        });
        if (!current()) return false;
        dispatch(setApplicationPage({ ...page, append: filters.append }));
        return true;
      }
      const apps = await getBackend().applications.listForAdmin(filters);
      if (!current()) return false;
      dispatch(setApplications(apps));
      return true;
    } catch (error) {
      if (current())
        dispatch(setError(getErrorMessage(error, 'Başvurular yüklenemedi.')));
      return false;
    } finally {
      if (current()) dispatch(setLoading(false));
    }
  };
