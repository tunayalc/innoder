export const GENERAL_CHAT_THREAD_PREFIX = 'general:';

export const createGeneralChatThreadId = (userId: string) =>
  `${GENERAL_CHAT_THREAD_PREFIX}${userId}`;

export const isGeneralChatThreadId = (threadId: string) =>
  threadId.startsWith(GENERAL_CHAT_THREAD_PREFIX) ||
  threadId.startsWith('general-user:');

export interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  senderRole: 'candidate' | 'admin';
  content: string;
  createdAt: string;
  readAt?: string;
  readBy?: string[];
  relatedDocumentId?: string;
}

export interface MessageState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
