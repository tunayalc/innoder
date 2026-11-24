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
import { apiClient } from '../../services/api/apiClient';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

const mergeThreadMessages = (
  all: Message[],
  thread: Message[],
  applicationId: string,
) => {
  const withoutThread = all.filter(m => m.applicationId !== applicationId);
  return [...withoutThread, ...thread].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

export const loadMessageThread =
  (params: {
    applicationId: string;
    page?: number;
  }): AppThunk<Promise<{ page: number; hasMore: boolean } | undefined>> =>
  async (dispatch, getState) => {
    const userId = getState().user.user?.id,
      version = apiClient.getVersion();
    const current = () =>
      getState().user.user?.id === userId && apiClient.getVersion() === version;
    const backend = getBackend();
    dispatch(setMessageLoading(true));
    dispatch(setMessageError(null));
    try {
      const page = backend.messages.listPage
        ? await backend.messages.listPage({
            ...params,
            page: params.page || 1,
            pageSize: 25,
          })
        : null;
      const thread =
        page?.items ||
        (await backend.messages.listByApplicationId({
          applicationId: params.applicationId,
        }));
      if (!current()) return;
      const previous = getState().message.messages;
      const loaded =
        params.page && params.page > 1
          ? Array.from(
              new Map(
                [
                  ...thread,
                  ...previous.filter(
                    item => item.applicationId === params.applicationId,
                  ),
                ].map(item => [item.id, item]),
              ).values(),
            )
          : thread;
      const merged = mergeThreadMessages(
        previous,
        loaded,
        params.applicationId,
      );
      dispatch(setMessages(merged));
      return {
        page: page?.page || 1,
        hasMore: page ? loaded.length < page.total : false,
      };
    } catch (err) {
      if (current())
        dispatch(
          setMessageError(getErrorMessage(err, 'Mesajlar yüklenemedi.')),
        );
    } finally {
      if (current()) dispatch(setMessageLoading(false));
    }
  };

export const sendMessageThunk =
  (params: {
    applicationId: string;
    content: string;
    relatedDocumentId?: string;
  }): AppThunk<Promise<boolean>> =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const user = getState().user.user;
    if (!user) return false;
    const version = apiClient.getVersion();
    const current = () =>
      getState().user.user?.id === user.id &&
      apiClient.getVersion() === version;

    dispatch(setMessageLoading(true));
    dispatch(setMessageError(null));
    try {
      const msg = await backend.messages.send({
        applicationId: params.applicationId,
        senderId: user.id,
        senderRole: user.role === 'candidate' ? 'candidate' : 'admin',
        content: params.content,
        relatedDocumentId: params.relatedDocumentId,
      });
      if (!current()) return false;
      dispatch(addMessage(msg));
      if (user.role !== 'candidate') dispatch(reloadAuditLogs());
      return true;
    } catch (err) {
      if (current())
        dispatch(setMessageError(getErrorMessage(err, 'Mesaj gönderilemedi.')));
      return false;
    } finally {
      if (current()) dispatch(setMessageLoading(false));
    }
  };

export const markThreadRead =
  (params: { applicationId: string }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const user = getState().user.user;
    if (!user) return;
    const version = apiClient.getVersion();
    const current = () =>
      getState().user.user?.id === user.id &&
      version === apiClient.getVersion();
    try {
      await backend.messages.markThreadRead({
        applicationId: params.applicationId,
        readerId: user.id,
      });
      if (current())
        dispatch(
          setMessages(
            getState().message.messages.map(item =>
              item.applicationId === params.applicationId
                ? {
                    ...item,
                    readBy: Array.from(
                      new Set([...(item.readBy || []), user.id]),
                    ),
                  }
                : item,
            ),
          ),
        );
    } catch (err) {
      if (current())
        dispatch(
          setMessageError(
            getErrorMessage(err, 'Okunma durumu güncellenemedi.'),
          ),
        );
    }
  };
