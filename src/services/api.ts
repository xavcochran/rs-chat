import { post } from '@aws-amplify/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
    id: string;
    label: 'user';
    properties: {
        username: string;
        cognito_id: string;
        created_at: string;
    };
}

export interface ChatMessage {
    message: string;
    message_type: 'user' | 'assistant';
    created_at: string;
}

export interface ChatDetails {
    chat_id: string;
    chat_name: string;
    messages: ChatMessage[];
}

export type ChatsAndMessages = {
    [chat_id: string]: ChatDetails;
};

class ApiService {
    private async callApi<T>(path: string, data: any): Promise<T> {
        try {
            const response = await post({
                apiName: 'chatApi',
                path,
                options: {
                    body: data
                }
            }).response;

            return await response.body.json() as T;
        } catch (error) {
            console.error('API call failed:', error);
            throw new Error(error instanceof Error ? error.message : 'API call failed');
        }
    }

    async createUser(cognitoId: string, username: string): Promise<User> {
        return this.callApi<User>('/create_user', {
            cognito_id: cognitoId,
            username,
        });
    }

    async createChat(chatName: string): Promise<string> {
        return this.callApi<string>('/create_chat', {
            chat_name: chatName,
        });
    }

    async addMessage(
        cognitoId: string,
        chatId: string,
        chatName: string,
        messageType: 'user' | 'assistant',
        message: string
    ): Promise<string> {
        return this.callApi<string>('/add_message', {
            cognito_id: cognitoId,
            chat_id: chatId,
            chat_name: chatName,
            message_type: messageType,
            message,
        });
    }

    async getChatsAndMessages(cognitoId: string): Promise<ChatsAndMessages> {
        return this.callApi<ChatsAndMessages>('/get_chats_and_messages', {
            cognito_id: cognitoId,
        });
    }
}

export const apiService = new ApiService(); 