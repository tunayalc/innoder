import {configureStore} from '@reduxjs/toolkit';
import userReducer,{setUser,clearUser} from '../slices/userSlice';
import applicationReducer,{setApplications} from '../slices/applicationSlice';
import messageReducer from '../slices/messageSlice';
import auditReducer from '../slices/auditSlice';
import uiReducer from '../slices/uiSlice';
import {getBackend} from '../../services/backend';
import {updatePersonalInfoDraft,uploadAdminDocument,uploadDocument} from './applicationThunks';
import type {Application,User} from '../../types';
jest.mock('../../services/backend',()=>({getBackend:jest.fn()}));
const user={id:'candidate-1',name:'Test',role:'candidate',status:'active'} as User;
const app={id:'app-1',userId:user.id,programId:'program-1',personalInfo:{fullName:'Original'},documents:[]} as unknown as Application;
const setup=()=>{const store=configureStore({reducer:{user:userReducer,application:applicationReducer,message:messageReducer,audit:auditReducer,ui:uiReducer}});store.dispatch(setUser(user));store.dispatch(setApplications([app]));return store;};
test('a failed save returns false without discarding application data',async()=>{
  jest.mocked(getBackend).mockReturnValue({applications:{updatePersonalInfo:jest.fn().mockRejectedValue(new Error('Offline'))}} as never);
  const store=setup();const result=await store.dispatch(updatePersonalInfoDraft({applicationId:app.id,programId:app.programId,patch:{fullName:'Draft'}}));
  expect(result).toBe(false);expect(store.getState().application.applications[0].personalInfo.fullName).toBe('Original');expect(store.getState().application.error).toBe('Offline');expect(store.getState().application.isLoading).toBe(false);
});
test('a late save after logout cannot reinsert the old account application',async()=>{
  let finish!:(value:Application)=>void;
  jest.mocked(getBackend).mockReturnValue({applications:{updatePersonalInfo:()=>new Promise<Application>(resolve=>{finish=resolve;})}} as never);
  const store=setup();const pending=store.dispatch(updatePersonalInfoDraft({applicationId:app.id,programId:app.programId,patch:{fullName:'Draft'}}));
  store.dispatch(clearUser());store.dispatch(setApplications([]));finish({...app,personalInfo:{fullName:'Draft'}});
  expect(await pending).toBe(false);expect(store.getState().application.applications).toEqual([]);
});
test('a failed upload reports failure so the caller can retain its selected file',async()=>{
  jest.mocked(getBackend).mockReturnValue({applications:{uploadDocument:jest.fn().mockRejectedValue(new Error('413'))}} as never);
  const store=setup();expect(await store.dispatch(uploadDocument({applicationId:app.id,documentType:'identity',fileName:'id.pdf',fileUrl:'file:///id.pdf',pageCount:1,mimeType:'application/pdf'}))).toBe(false);
});

test('only an admin can invoke the admin upload action for a selected application', async () => {
  const upload = jest.fn().mockResolvedValue({ application: app });
  jest.mocked(getBackend).mockReturnValue({ applications: { uploadDocument: upload } } as never);
  const store = setup();
  const data = {
    applicationId: app.id, documentType: 'extra' as const,
    fileName: 'reference.pdf', fileUrl: 'file:///reference.pdf',
    pageCount: 1, mimeType: 'application/pdf',
  };
  expect(await store.dispatch(uploadAdminDocument(data))).toBe(false);
  expect(upload).not.toHaveBeenCalled();
  store.dispatch(setUser({ ...user, id: 'admin-1', role: 'admin' }));
  expect(await store.dispatch(uploadAdminDocument(data))).toBe(true);
  expect(upload).toHaveBeenCalledWith({ ...data, adminUserId: 'admin-1' });
  expect(store.getState().application.applications[0].userId).toBe(user.id);
});
