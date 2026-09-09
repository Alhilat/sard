import { api } from '@/lib/api';

export type ActivityChatPermissionMode = 'all' | 'organizer_only' | 'muted';

export interface ActivityChatMessage {
  id: string;
  activityId: string;
  senderId: string;
  senderName: string;
  senderRole: 'organizer' | 'attendee' | 'admin';
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isAnnouncement?: boolean;
  created_at?: number;
}

export interface ActivityChatSettings {
  activityId: string;
  permissionMode: ActivityChatPermissionMode;
  pinnedAnnouncement?: string;
  slowModeSeconds?: number;
}

export interface Activity {
  id: string;
  org_id?: string;
  title: string;
  organization?: {
    id: string;
    name: string;
    avatar?: string;
  };
  org?: {
    id: string;
    name: string;
    avatar?: string;
  };
  orgName?: string;
  date: string;
  time?: string;
  location: string;
  locationType?: 'in_person' | 'online';
  capacity?: number;
  seats?: number;
  attendeesCount?: number;
  registered?: number;
  price?: string;
  category: string;
  image?: string;
  status?: string;
  description?: string;
  isRegistered?: boolean;
  tags?: string[];
}

const chatSettingsStore: Record<string, ActivityChatSettings> = {};
const chatMessagesStore: Record<string, ActivityChatMessage[]> = {};

export const activitiesService = {
  getActivities: async (params?: { category?: string; status?: string; page?: number; limit?: number }): Promise<Activity[]> => {
    try {
      const response = await api.get<{ activities?: Activity[]; data?: Activity[] }>('/activities', params);
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as any).activities)) return (response as any).activities;
      if (response && Array.isArray((response as any).data)) return (response as any).data;
      return [];
    } catch {
      return [];
    }
  },

  getActivityById: async (activityId: string): Promise<Activity | undefined> => {
    try {
      return await api.get<Activity>(`/activities/${activityId}`);
    } catch {
      return undefined;
    }
  },

  createActivity: async (data: {
    title: string;
    description?: string;
    category?: string;
    date: string;
    time?: string;
    location?: string;
    locationType?: string;
    capacity?: number;
  }): Promise<{ success: boolean; id?: string; message?: string }> => {
    try {
      const res = await api.post<{ success: boolean; id?: string; message?: string }>('/activities', data);
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إنشاء الفعالية' };
    }
  },

  deleteActivity: async (activityId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.delete<{ success: boolean; message?: string }>(`/activities/${activityId}`);
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حذف الفعالية' };
    }
  },

  register: async (activityId: string): Promise<boolean> => {
    try {
      await api.post(`/activities/${activityId}/register`);
      return true;
    } catch {
      return false;
    }
  },

  getChatSettings: async (activityId: string): Promise<ActivityChatSettings> => {
    try {
      const res = await api.get<ActivityChatSettings>(`/activities/${activityId}/chat/settings`);
      if (res && res.activityId) {
        chatSettingsStore[activityId] = res;
        return res;
      }
    } catch {
      // fallback to cached/default
    }
    if (!chatSettingsStore[activityId]) {
      chatSettingsStore[activityId] = {
        activityId,
        permissionMode: 'all',
      };
    }
    return { ...chatSettingsStore[activityId] };
  },

  updateChatSettings: async (
    activityId: string,
    updates: Partial<ActivityChatSettings>
  ): Promise<ActivityChatSettings> => {
    try {
      const res = await api.patch<ActivityChatSettings>(`/activities/${activityId}/chat/settings`, updates);
      if (res && res.activityId) {
        chatSettingsStore[activityId] = res;
        return res;
      }
    } catch {
      // fallback
    }
    const current = chatSettingsStore[activityId] || {
      activityId,
      permissionMode: 'all',
    };

    chatSettingsStore[activityId] = {
      ...current,
      ...updates,
    };

    return { ...chatSettingsStore[activityId] };
  },

  getChatMessages: async (activityId: string): Promise<ActivityChatMessage[]> => {
    try {
      const res = await api.get<any>(`/activities/${activityId}/chat/messages`);
      const list = Array.isArray(res) ? res : (res?.messages || res?.data);
      if (Array.isArray(list)) {
        chatMessagesStore[activityId] = list;
        return list;
      }
    } catch {
      // fallback to cached
    }
    return chatMessagesStore[activityId] || [];
  },

  sendChatMessage: async (
    activityId: string,
    payload: {
      content: string;
      senderName: string;
      senderRole?: 'organizer' | 'attendee' | 'admin';
      isAnnouncement?: boolean;
    }
  ): Promise<ActivityChatMessage> => {
    try {
      const res = await api.post<any>(`/activities/${activityId}/chat/messages`, payload);
      const created = res?.message || res?.data || res;
      if (created && created.id) {
        if (!chatMessagesStore[activityId]) chatMessagesStore[activityId] = [];
        chatMessagesStore[activityId].push(created);
        return created;
      }
    } catch (err: any) {
      // If error occurs, rethrow or fallback
      throw err;
    }

    const fallback: ActivityChatMessage = {
      id: `amsg_${Date.now()}_local`,
      activityId,
      senderId: 'usr_me',
      senderName: payload.senderName,
      senderRole: payload.senderRole || 'attendee',
      content: payload.content,
      timestamp: 'الآن',
      isAnnouncement: Boolean(payload.isAnnouncement),
      created_at: Date.now(),
    };
    if (!chatMessagesStore[activityId]) chatMessagesStore[activityId] = [];
    chatMessagesStore[activityId].push(fallback);
    return fallback;
  },
};
