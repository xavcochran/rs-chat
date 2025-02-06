import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Message, Chat } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  messageCount: {
    anonymous: 0,
    authenticated: {
      count: 0,
      hourStart: Date.now(),
    },
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createChat: (state) => {
      const newChat: Chat = {
        id: uuidv4(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.chats.push(newChat);
      state.currentChatId = newChat.id;
    },
    setCurrentChat: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Omit<Message, 'id' | 'timestamp'> }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.messages.push({
          ...action.payload.message,
          id: uuidv4(),
          timestamp: Date.now(),
        });
        chat.updatedAt = Date.now();
      }
    },
    incrementMessageCount: (state, action: PayloadAction<{ isAuthenticated: boolean }>) => {
      if (action.payload.isAuthenticated) {
        const now = Date.now();
        // Reset counter if an hour has passed
        if (now - state.messageCount.authenticated.hourStart >= 3600000) {
          state.messageCount.authenticated = {
            count: 1,
            hourStart: now,
          };
        } else {
          state.messageCount.authenticated.count++;
        }
      } else {
        state.messageCount.anonymous++;
      }
    },
    deleteChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(chat => chat.id !== action.payload);
      if (state.currentChatId === action.payload) {
        state.currentChatId = state.chats[0]?.id || null;
      }
    },
    updateChatTitle: (state, action: PayloadAction<{ chatId: string; title: string }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.title = action.payload.title;
      }
    },
  },
});

export const {
  createChat,
  setCurrentChat,
  addMessage,
  incrementMessageCount,
  deleteChat,
  updateChatTitle,
} = chatSlice.actions;

export default chatSlice.reducer; 