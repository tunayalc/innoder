import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isDarkMode: boolean;
  isOnline: boolean;
  globalLoading: boolean;
  language: 'tr' | 'en';
}

const initialState: UIState = {
  isDarkMode: false,
  isOnline: true,
  globalLoading: false,
  language: 'tr',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'tr' | 'en'>) => {
      state.language = action.payload;
    },
  },
});

export const {
  setDarkMode,
  toggleDarkMode,
  setOnlineStatus,
  setGlobalLoading,
  setLanguage,
} = uiSlice.actions;

export default uiSlice.reducer;
