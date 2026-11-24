import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
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
import applicationReducer from './slices/applicationSlice';
import messageReducer from './slices/messageSlice';
import auditReducer from './slices/auditSlice';
import uiReducer from './slices/uiSlice';
import { apiClient } from '../services/api/apiClient';

const rootReducer = combineReducers({
  user: userReducer,
  application: applicationReducer,
  message: messageReducer,
  audit: auditReducer,
  ui: uiReducer,
});
export type RootState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  version: 5,
  storage: AsyncStorage,
  whitelist: ['ui'],
  // Drop legacy profile/session data even when an older persisted object is rehydrated.
  migrate: async state =>
    state
      ? ({
          ui: (state as unknown as RootState).ui,
          _persist: state._persist,
        } as typeof state)
      : state,
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
apiClient.setRevisionProvider(path => {
  const state = store.getState();
  if (path === '/users/me') return state.user.user?.revision;
  const match = path.match(/^\/applications\/([^/]+)(?:\/documents\/([^/]+))?/);
  if (!match) return undefined;
  const application = state.application.applications.find(
    item => item.id === match[1],
  );
  return match[2]
    ? application?.documents.find(item => item.id === match[2])?.revision
    : application?.revision;
});

export type AppDispatch = typeof store.dispatch;
