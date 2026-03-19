import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkAction } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import type { Message } from '../../types';
import { getBackend } from '../../services/backend';
import {
  addMessage,
  setMessages,
  setLoading as setMessageLoading,
  setError as setMessageError,
} from '../slices/messageSlice';
import { getErrorMessage } from './errors';
import { reloadAuditLogs } from './auditThunks';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

const mergeThreadMessages = (all: Message[], thread: Message[], applicationId: string) => {
  const withoutThread = all.filter((m) => m.applicationId !== applicationId);
  return [...withoutThread, ...thread].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

export const loadMessageThread =
  (params: { applicationId: string }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    dispatch(setMessageLoading(true));
    dispatch(setMessageError(null));
    try {
      const thread = await backend.messages.listByApplicationId({
        applicationId: params.applicationId,
      });
      const merged = mergeThreadMessages(
        getState().message.messages,
        thread,
        params.applicationId,
      );
      dispatch(setMessages(merged));
    } catch (err) {
      dispatch(setMessageError(getErrorMessage(err, 'Mesajlar yüklenemedi.')));
    } finally {
      dispatch(setMessageLoading(false));
    }
  };

export const sendMessageThunk =
  (params: { applicationId: string; content: string; relatedDocumentId?: string }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const user = getState().user.user;
    if (!user) return;

    dispatch(setMessageLoading(true));
    dispatch(setMessageError(null));
    try {
      const msg = await backend.messages.send({
        applicationId: params.applicationId,
        senderId: user.id,
        senderRole: user.role,
        content: params.content,
        relatedDocumentId: params.relatedDocumentId,
      });
      dispatch(addMessage(msg));
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setMessageError(getErrorMessage(err, 'Mesaj gönderilemedi.')));
    } finally {
      dispatch(setMessageLoading(false));
    }
  };

export const markThreadRead =
  (params: { applicationId: string }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const user = getState().user.user;
    if (!user) return;

    dispatch(setMessageLoading(true));
    dispatch(setMessageError(null));
    try {
      await backend.messages.markThreadRead({
        applicationId: params.applicationId,
        readerId: user.id,
      });
      // Reload the thread so readAt timestamps are reflected in UI.
      dispatch(loadMessageThread({ applicationId: params.applicationId }));
    } catch (err) {
      dispatch(setMessageError(getErrorMessage(err, 'Okunma durumu güncellenemedi.')));
    } finally {
      dispatch(setMessageLoading(false));
    }
  };
