import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, MessageState } from '../../types';

const initialState: MessageState = {
  messages: [],
  isLoading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
      state.error = null;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const message = state.messages.find(m => m.id === action.payload);
      if (message) {
        message.readAt = new Date().toISOString();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const {
  setMessages,
  addMessage,
  markAsRead,
  setLoading,
  setError,
  clearMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
