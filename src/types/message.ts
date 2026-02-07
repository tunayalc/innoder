export interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  senderRole: 'candidate' | 'admin';
  content: string;
  createdAt: string;
  readAt?: string;
  relatedDocumentId?: string;
}

export interface MessageState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
