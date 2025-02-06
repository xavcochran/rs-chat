import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Message, Chat } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';
import { ChatsAndMessages } from '@/services/api';

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
    createChat: (state, action: PayloadAction<{ chatId: string }>) => {
      const now = new Date().toISOString();
      const newChat: Chat = {
        id: action.payload.chatId,
        title: 'New Chat',
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      state.chats.push(newChat);
      state.currentChatId = newChat.id;
    },
    setCurrentChat: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Omit<Message, 'id'> }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.messages.push({
          ...action.payload.message,
          id: uuidv4(),
        });
        chat.updatedAt = new Date().toISOString();
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
    setChats: (state, action: PayloadAction<ChatsAndMessages>) => {
      // Convert the ChatsAndMessages format to our Chat format
      state.chats = Object.entries(action.payload).map(([chatId, chatDetails]) => ({
        id: chatId,
        title: chatDetails.chat_name,
        messages: chatDetails.messages.map(msg => ({
          id: uuidv4(),
          content: msg.message,
          role: msg.message_type,
          created_at: msg.created_at,
        })),
        createdAt: chatDetails.messages[0]?.created_at || new Date().toISOString(),
        updatedAt: chatDetails.messages[chatDetails.messages.length - 1]?.created_at || new Date().toISOString(),
      }));

      // Set current chat if none is selected
      if (!state.currentChatId && state.chats.length > 0) {
        state.currentChatId = state.chats[0].id;
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
  setChats,
} = chatSlice.actions;

export default chatSlice.reducer; 