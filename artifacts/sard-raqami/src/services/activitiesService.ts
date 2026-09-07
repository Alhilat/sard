import { api } from '@/lib/api';
import { activities as mockActivities } from '@/lib/mock-data';

export interface Activity {
  id: string;
  title: string;
  organization?: {
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
  attendeesCount?: number;
  category: string;
  image?: string;
  status?: string;
  description?: string;
  isRegistered?: boolean;
}

export const activitiesService = {
  getActivities: async (params?: { category?: string; status?: string; page?: number; limit?: number }): Promise<Activity[]> => {
    try {
      const response = await api.get<{ activities?: Activity[]; data?: Activity[] }>('/activities', params);
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as any).activities)) return (response as any).activities;
      if (response && Array.isArray((response as any).data)) return (response as any).data;
      return mockActivities;
    } catch {
      return mockActivities;
    }
  },

  getActivityById: async (activityId: string): Promise<Activity | undefined> => {
    try {
      return await api.get<Activity>(`/activities/${activityId}`);
    } catch {
      return mockActivities.find((a) => a.id === activityId);
    }
  },

  register: async (activityId: string): Promise<boolean> => {
    try {
      await api.post(`/activities/${activityId}/register`);
      return true;
    } catch {
      return true;
    }
  },
};
