import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createTransform,
  type PersistConfig,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import userReducer from './slices/userSlice';
import { initialUserState } from './slices/userSlice';
import applicationReducer from './slices/applicationSlice';
import messageReducer from './slices/messageSlice';
import auditReducer from './slices/auditSlice';
import uiReducer from './slices/uiSlice';
import type { UserState } from '../types';

const rootReducer = combineReducers({
  user: userReducer,
  application: applicationReducer,
  message: messageReducer,
  audit: auditReducer,
  ui: uiReducer,
});
export type RootState = ReturnType<typeof rootReducer>;

const userPersistTransform = createTransform<UserState, UserState>(
  (inboundState) => {
    if (!inboundState.rememberMe) {
      return { ...initialUserState };
    }

    return {
      ...inboundState,
      isLoading: false,
      error: null,
    };
  },
  (outboundState) => {
    if (!outboundState?.rememberMe) {
      return { ...initialUserState };
    }

    return {
      ...initialUserState,
      ...outboundState,
      isLoading: false,
      error: null,
    };
  },
  { whitelist: ['user'] },
);

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  version: 4,
  storage: AsyncStorage,
  // Backend (mock/remote) is the source of truth. Persist only the session + UI prefs.
  whitelist: ['user', 'ui'],
  transforms: [userPersistTransform],
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
