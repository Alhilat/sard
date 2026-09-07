import { api } from '@/lib/api';

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
};
