import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuditLog, AuditState } from '../../types';

const initialState: AuditState = {
  logs: [],
  isLoading: false,
  error: null,
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    setLogs: (state, action: PayloadAction<AuditLog[]>) => {
      state.logs = action.payload;
      state.error = null;
    },
    addLog: (state, action: PayloadAction<AuditLog>) => {
      state.logs.unshift(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearLogs: (state) => {
      state.logs = [];
    },
  },
});

export const {
  setLogs,
  addLog,
  setLoading,
  setError,
  clearLogs,
} = auditSlice.actions;

export default auditSlice.reducer;
