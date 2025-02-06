export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  parsedContent?: string[];
  codeBlocks?: {
    code: string;
    language: string;
  }[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  messageCount: {
    anonymous: number;  // For tracking anonymous user messages
    authenticated: {    // For tracking authenticated user messages per hour
      count: number;
      hourStart: number;
    };
  };
}

export interface UserState {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
} 