import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
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

const rootReducer = combineReducers({
  user: userReducer,
  application: applicationReducer,
  message: messageReducer,
  audit: auditReducer,
  ui: uiReducer,
});

const persistConfig = {
  key: 'root',
  version: 3,
  storage: AsyncStorage,
  // Backend (mock/remote) is the source of truth. Persist only the session + UI prefs.
  whitelist: ['user', 'ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
