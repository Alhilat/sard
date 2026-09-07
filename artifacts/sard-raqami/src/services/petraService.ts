export interface PetraStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalComments: number;
  totalGroups: number;
  avgLatencyMs: number;
  totalRequests: number;
  uptimeSeconds: number;
  databaseEngine: string;
  dailyCapacity: string;
}

export interface PetraUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  verified?: boolean;
  is_banned: boolean;
  ban_reason: string;
  join_date: string;
  created_at: number;
  posts_count: number;
  comments_count: number;
}

export interface PetraPost {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_email: string;
  content: string;
  tags: string;
  group_id?: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: number;
  timestamp_text: string;
}

export interface PetraComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  content: string;
  post_content?: string;
  likes_count: number;
  created_at: number;
  timestamp_text: string;
}

export interface PetraGroup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  privacy: string;
  members_count: number;
  posts_count: number;
  creator_name?: string;
  created_at: number;
}

export interface PetraAuditLog {
  id: string;
  admin_user: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: number;
}

const PETRA_TOKEN_KEY = 'petra_auth_session_token';

function getPetraAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(PETRA_TOKEN_KEY) || localStorage.getItem(PETRA_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const petraService = {
  isLoggedIn: (): boolean => {
    const token = sessionStorage.getItem(PETRA_TOKEN_KEY) || localStorage.getItem(PETRA_TOKEN_KEY);
    return Boolean(token && token.startsWith('petra_session_'));
  },

  login: async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/petra/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        sessionStorage.setItem(PETRA_TOKEN_KEY, data.token);
        localStorage.setItem(PETRA_TOKEN_KEY, data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'بيانات الدخول غير صحيحة' };
    } catch {
      return { success: false, message: 'تعذر الاتصال بخادم بترا المركزي' };
    }
  },

  logout: () => {
    sessionStorage.removeItem(PETRA_TOKEN_KEY);
    localStorage.removeItem(PETRA_TOKEN_KEY);
  },

  getStats: async (): Promise<PetraStats | null> => {
    try {
      const res = await fetch('/api/petra/stats', { headers: getPetraAuthHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data.stats || null;
    } catch {
      return null;
    }
  },

  getUsers: async (): Promise<PetraUser[]> => {
    try {
      const res = await fetch('/api/petra/users', { headers: getPetraAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch {
      return [];
    }
  },

  banUser: async (userId: string, reason: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/users/${userId}/ban`, {
        method: 'POST',
        headers: getPetraAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'فشل تنفيذ الحظر' };
    }
  },

  unbanUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/users/${userId}/unban`, {
        method: 'POST',
        headers: getPetraAuthHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'فشل إلغاء الحظر' };
    }
  },

  verifyUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/users/${userId}/verify`, {
        method: 'POST',
        headers: getPetraAuthHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'فشل توثيق الحساب' };
    }
  },

  unverifyUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/users/${userId}/unverify`, {
        method: 'POST',
        headers: getPetraAuthHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'فشل إلغاء التوثيق' };
    }
  },

  getPosts: async (): Promise<PetraPost[]> => {
    try {
      const res = await fetch('/api/petra/posts', { headers: getPetraAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.posts || [];
    } catch {
      return [];
    }
  },

  deletePost: async (postId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/posts/${postId}`, {
        method: 'DELETE',
        headers: getPetraAuthHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'تعذر حذف المنشور' };
    }
  },

  getComments: async (): Promise<PetraComment[]> => {
    try {
      const res = await fetch('/api/petra/comments', { headers: getPetraAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.comments || [];
    } catch {
      return [];
    }
  },

  deleteComment: async (commentId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/comments/${commentId}`, {
        method: 'DELETE',
        headers: getPetraAuthHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'تعذر حذف الرد' };
    }
  },

  getGroups: async (): Promise<PetraGroup[]> => {
    try {
      const res = await fetch('/api/petra/groups', { headers: getPetraAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.groups || [];
    } catch {
      return [];
    }
  },

  deleteGroup: async (groupId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/groups/${groupId}`, {
        method: 'DELETE',
        headers: getPetraAuthHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'تعذر حذف المجموعة' };
    }
  },

  getLogs: async (): Promise<PetraAuditLog[]> => {
    try {
      const res = await fetch('/api/petra/logs', { headers: getPetraAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.logs || [];
    } catch {
      return [];
    }
  },
};
