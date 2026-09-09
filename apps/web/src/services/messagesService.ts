import { api } from '@/lib/api';

export interface MessageItem {
  id: string;
  conversation_id?: string;
  sender: 'me' | 'other';
  sender_id?: string;
  senderName?: string;
  content: string;
  time: string;
  created_at?: number;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ConversationItem {
  id: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    online: boolean;
    role?: string;
    verified?: boolean;
  };
  lastMessage: string;
  time: string;
  updated_at?: number;
}

export interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  verified?: boolean;
}

export const messagesService = {
  getConversations: async (): Promise<ConversationItem[]> => {
    try {
      const res = await api.get<{ conversations?: ConversationItem[]; data?: ConversationItem[] }>('/conversations');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).conversations)) return (res as any).conversations;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    return [];
  },

  getMessages: async (convId: string): Promise<MessageItem[]> => {
    try {
      const res = await api.get<{ messages?: MessageItem[]; data?: MessageItem[] }>(`/conversations/${convId}/messages`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).messages)) return (res as any).messages;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
    } catch (err) {
      console.error('Error fetching messages for conversation:', err);
    }
    return [];
  },

  sendMessage: async (convId: string, content: string): Promise<MessageItem | null> => {
    try {
      const res = await api.post<{ message?: MessageItem; data?: MessageItem }>(`/conversations/${convId}/messages`, { content });
      return res?.message || res?.data || (res as any);
    } catch (err) {
      console.error('Error sending direct message:', err);
      return null;
    }
  },

  startConversation: async (recipientId: string): Promise<ConversationItem | null> => {
    try {
      const res = await api.post<{ conversation?: ConversationItem; data?: ConversationItem }>('/conversations', { recipientId });
      return res?.conversation || res?.data || (res as any);
    } catch (err) {
      console.error('Error starting conversation:', err);
      return null;
    }
  },

  searchUsersByName: async (query: string): Promise<UserSearchResult[]> => {
    try {
      const res = await api.get<UserSearchResult[]>('/users', { q: query });
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.error('Error searching users:', err);
    }
    return [];
  },
};
