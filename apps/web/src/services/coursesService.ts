import { api } from '@/lib/api';

export type ChatPermissionMode = 'all' | 'instructor_only' | 'muted';

export interface CourseInstructor {
  id: string;
  name: string;
  title: string;
  role: string;
  avatar?: string;
  bio: string;
  experience: string;
  rating: number;
  studentsTaught: number;
}

export interface CourseSyllabusItem {
  title: string;
  hours: number;
  lessons: string[];
}

export interface Course {
  id: string;
  org_id?: string;
  title: string;
  tagline?: string;
  category: string;
  level: 'مبتدئ' | 'متوسط' | 'متقدم' | 'جميع المستويات' | string;
  duration: string;
  totalHours: number;
  lectures: number;
  students: number;
  rating: number;
  price: string;
  enrolled: boolean;
  progress: number;
  instructor: CourseInstructor;
  org: {
    id: string;
    name: string;
    avatar?: string;
  };
  description: string;
  syllabus: CourseSyllabusItem[];
  outcomes: string[];
  prerequisites: string[];
  certificate?: string;
  coverGradient?: string;
}

export interface ChatMessage {
  id: string;
  courseId: string;
  senderId: string;
  senderName: string;
  senderRole: 'instructor' | 'student' | 'admin';
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isAnnouncement?: boolean;
}

export interface CourseChatSettings {
  courseId: string;
  permissionMode: ChatPermissionMode;
  pinnedAnnouncement?: string;
  slowModeSeconds?: number;
}

const defaultInstructor: CourseInstructor = {
  id: 'inst_default',
  name: 'مدرب معتمد',
  title: 'مدرب وخبير تقني',
  role: 'instructor',
  bio: 'مدرب ومختص في تقديم البرامج التدريبية المعتمدة في المنصة',
  experience: 'خبرة تدريبية عملية',
  rating: 4.9,
  studentsTaught: 150,
};

const normalizeCourse = (c: any): Course => ({
  ...c,
  org_id: c.org_id || c.org?.id,
  instructor: c.instructor || defaultInstructor,
  org: c.org || { id: c.org_id || 'org_sard', name: 'أكاديمية سرد' },
  syllabus: c.syllabus || [],
  outcomes: c.outcomes || [],
  prerequisites: c.prerequisites || [],
  enrolled: Boolean(c.enrolled),
  progress: c.progress || 0,
});

let coursesState: Course[] = [];
const chatSettingsStore: Record<string, CourseChatSettings> = {};
const chatMessagesStore: Record<string, ChatMessage[]> = {};

export const coursesService = {
  getCourses: async (params?: { category?: string }): Promise<Course[]> => {
    let rawList: any[] = [];
    try {
      const res = await api.get<{ courses?: Course[]; data?: Course[] }>('/courses', params);
      if (Array.isArray(res)) rawList = res;
      else if (res?.courses && Array.isArray(res.courses)) rawList = res.courses;
      else if (res?.data && Array.isArray(res.data)) rawList = res.data;
    } catch {
      // fallback
    }

    let result = rawList.length > 0 ? rawList.map(normalizeCourse) : coursesState.map(normalizeCourse);
    if (params?.category && params.category !== 'الكل') {
      result = result.filter(
        (c) => c.category === params.category || c.category.includes(params.category!)
      );
    }
    return result;
  },

  getCourseById: async (courseId: string): Promise<Course | undefined> => {
    try {
      const res = await api.get<Course>(`/courses/${courseId}`);
      if (res && res.id) return normalizeCourse(res);
    } catch {
      // fallback
    }
    const found = coursesState.find((c) => c.id === courseId);
    return found ? normalizeCourse(found) : undefined;
  },

  createCourse: async (data: {
    title: string;
    tagline?: string;
    description?: string;
    category?: string;
    level?: string;
    duration?: string;
    totalHours?: number;
    lectures?: number;
    price?: string;
  }): Promise<{ success: boolean; id?: string; message?: string }> => {
    try {
      const res = await api.post<{ success: boolean; id?: string; message?: string }>('/courses', data);
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إنشاء الدورة' };
    }
  },

  deleteCourse: async (courseId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.delete<{ success: boolean; message?: string }>(`/courses/${courseId}`);
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حذف الدورة' };
    }
  },

  enrollInCourse: async (courseId: string): Promise<boolean> => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      return true;
    } catch {
      return false;
    }
  },

  getChatSettings: async (courseId: string): Promise<CourseChatSettings> => {
    try {
      const res = await api.get<CourseChatSettings>(`/courses/${courseId}/chat/settings`);
      if (res && res.courseId) {
        chatSettingsStore[courseId] = res;
        return res;
      }
    } catch {
      // fallback
    }
    if (!chatSettingsStore[courseId]) {
      chatSettingsStore[courseId] = {
        courseId,
        permissionMode: 'all',
      };
    }
    return { ...chatSettingsStore[courseId] };
  },

  updateChatSettings: async (
    courseId: string,
    updates: Partial<CourseChatSettings>
  ): Promise<CourseChatSettings> => {
    try {
      const res = await api.patch<CourseChatSettings>(`/courses/${courseId}/chat/settings`, updates);
      if (res && res.courseId) {
        chatSettingsStore[courseId] = res;
        return res;
      }
    } catch {
      // fallback
    }
    const current = chatSettingsStore[courseId] || {
      courseId,
      permissionMode: 'all',
    };

    chatSettingsStore[courseId] = {
      ...current,
      ...updates,
    };

    return { ...chatSettingsStore[courseId] };
  },

  getChatMessages: async (courseId: string): Promise<ChatMessage[]> => {
    try {
      const res = await api.get<any>(`/courses/${courseId}/chat/messages`);
      const list = Array.isArray(res) ? res : (res?.messages || res?.data);
      if (Array.isArray(list)) {
        chatMessagesStore[courseId] = list;
        return list;
      }
    } catch {
      // fallback
    }
    return chatMessagesStore[courseId] || [];
  },

  sendChatMessage: async (
    courseId: string,
    data: {
      senderId: string;
      senderName: string;
      senderRole: 'instructor' | 'student' | 'admin';
      content: string;
      isAnnouncement?: boolean;
    }
  ): Promise<ChatMessage> => {
    try {
      const res = await api.post<any>(`/courses/${courseId}/chat/messages`, data);
      const msg = res?.message || res?.data || (res?.id ? res : null);
      if (msg && msg.id) {
        if (!chatMessagesStore[courseId]) chatMessagesStore[courseId] = [];
        chatMessagesStore[courseId].push(msg);
        return msg;
      }
    } catch {
      // fallback
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      courseId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: data.content,
      timestamp: 'الآن',
      isAnnouncement: data.isAnnouncement,
    };

    if (!chatMessagesStore[courseId]) {
      chatMessagesStore[courseId] = [];
    }

    chatMessagesStore[courseId].push(newMessage);
    return newMessage;
  },
};
