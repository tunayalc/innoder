import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Application,
  ApplicationState,
  Document,
  PersonalInfo,
} from '../../types';

const initialState: ApplicationState = {
  applications: [],
  currentApplication: null,
  isLoading: false,
  error: null,
  page: 1,
  total: 0,
  hasMore: false,
};

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setApplicationPage: (
      state,
      action: PayloadAction<{
        items: Application[];
        total: number;
        page: number;
        pageSize: number;
        append?: boolean;
      }>,
    ) => {
      const page = action.payload;
      state.applications = page.append
        ? [
            ...state.applications.filter(
              item => !page.items.some(next => next.id === item.id),
            ),
            ...page.items,
          ]
        : page.items;
      state.page = page.page;
      state.total = page.total;
      state.hasMore = page.page * page.pageSize < page.total;
      state.error = null;
    },
    setApplications: (state, action: PayloadAction<Application[]>) => {
      state.applications = action.payload;
      state.error = null;
    },
    setCurrentApplication: (
      state,
      action: PayloadAction<Application | null>,
    ) => {
      state.currentApplication = action.payload;
    },
    addApplication: (state, action: PayloadAction<Application>) => {
      state.applications.push(action.payload);
    },
    updateApplication: (state, action: PayloadAction<Application>) => {
      const index = state.applications.findIndex(
        app => app.id === action.payload.id,
      );
      if (index !== -1) {
        state.applications[index] = action.payload;
      }
      if (state.currentApplication?.id === action.payload.id) {
        state.currentApplication = action.payload;
      }
    },
    updatePersonalInfo: (
      state,
      action: PayloadAction<{
        applicationId: string;
        info: Partial<PersonalInfo>;
      }>,
    ) => {
      const app = state.applications.find(
        a => a.id === action.payload.applicationId,
      );
      if (app) {
        app.personalInfo = { ...app.personalInfo, ...action.payload.info };
      }
      if (state.currentApplication?.id === action.payload.applicationId) {
        state.currentApplication.personalInfo = {
          ...state.currentApplication.personalInfo,
          ...action.payload.info,
        };
      }
    },
    updateDocument: (
      state,
      action: PayloadAction<{ applicationId: string; document: Document }>,
    ) => {
      const app = state.applications.find(
        a => a.id === action.payload.applicationId,
      );
      if (app) {
        const docIndex = app.documents.findIndex(
          d => d.id === action.payload.document.id,
        );
        if (docIndex !== -1) {
          app.documents[docIndex] = action.payload.document;
        } else {
          app.documents.push(action.payload.document);
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearApplications: state => {
      state.applications = [];
      state.currentApplication = null;
      state.page = 1;
      state.total = 0;
      state.hasMore = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setApplicationPage,
  setApplications,
  setCurrentApplication,
  addApplication,
  updateApplication,
  updatePersonalInfo,
  updateDocument,
  setLoading,
  setError,
  clearApplications,
} = applicationSlice.actions;

export default applicationSlice.reducer;
