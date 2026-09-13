export interface PetraStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalComments: number;
  totalGroups: number;
  totalArticles?: number;
  totalArticleComments?: number;
  totalRequests: number;
  uptimeSeconds: number;
  nodeVersion?: string;
  platform?: string;
  memoryHeapUsedMb?: number;
  memoryHeapTotalMb?: number;
  memoryRssMb?: number;
  dbEngine?: string;
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
  articles_count?: number;
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

export interface PetraArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  cover_image: string;
  read_time_minutes: number;
  char_count: number;
  word_count: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: number;
  timestamp_text: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_email: string;
}

const PETRA_TOKEN_KEY = 'petra_auth_session_token';

function getPetraToken(): string | null {
  if (typeof window === 'undefined') return null;
  const petraToken = sessionStorage.getItem(PETRA_TOKEN_KEY) || localStorage.getItem(PETRA_TOKEN_KEY);
  if (petraToken) return petraToken;

  // Fallback: If platform user is logged in, check if token exists
  const sardToken = localStorage.getItem('sard_auth_token');
  return sardToken || null;
}

function getPetraAuthHeaders(): Record<string, string> {
  const token = getPetraToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PETRA_TOKEN_KEY);
    localStorage.removeItem(PETRA_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('petra:unauthorized'));
  }
}

export const petraService = {
  getToken: getPetraToken,

  isLoggedIn: (): boolean => {
    const token = getPetraToken();
    return Boolean(token && token.length > 10);
  },

  verifySession: async (): Promise<boolean> => {
    const token = getPetraToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/petra/stats', { headers: getPetraAuthHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      return res.ok;
    } catch {
      return false;
    }
  },

  getConfigStatus: async (): Promise<{
    envConfigured: boolean;
    envUser: string;
    hasEnvPass: boolean;
    renderDetected: boolean;
  } | null> => {
    try {
      const res = await fetch('/api/petra/config-status');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
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

  usePlatformToken: (token: string) => {
    if (token) {
      sessionStorage.setItem(PETRA_TOKEN_KEY, token);
      localStorage.setItem(PETRA_TOKEN_KEY, token);
    }
  },

  logout: () => {
    try {
      fetch('/api/petra/logout', { method: 'POST', headers: getPetraAuthHeaders() }).catch(() => {});
    } catch {}
    sessionStorage.removeItem(PETRA_TOKEN_KEY);
    localStorage.removeItem(PETRA_TOKEN_KEY);
  },

  getStats: async (): Promise<PetraStats | null> => {
    try {
      const res = await fetch('/api/petra/stats', { headers: getPetraAuthHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return null;
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return [];
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'فشل إلغاء التوثيق' };
    }
  },

  getPosts: async (): Promise<PetraPost[]> => {
    try {
      const res = await fetch('/api/petra/posts', { headers: getPetraAuthHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return [];
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'تعذر حذف المنشور' };
    }
  },

  getComments: async (): Promise<PetraComment[]> => {
    try {
      const res = await fetch('/api/petra/comments', { headers: getPetraAuthHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return [];
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'تعذر حذف الرد' };
    }
  },

  getGroups: async (): Promise<PetraGroup[]> => {
    try {
      const res = await fetch('/api/petra/groups', { headers: getPetraAuthHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return [];
      }
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
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'تعذر حذف المجموعة' };
    }
  },

  getLogs: async (): Promise<PetraAuditLog[]> => {
    try {
      const res = await fetch('/api/petra/logs', { headers: getPetraAuthHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return [];
      }
      if (!res.ok) return [];
      const data = await res.json();
      return data.logs || [];
    } catch {
      return [];
    }
  },

  getArticles: async (): Promise<PetraArticle[]> => {
    try {
      const res = await fetch('/api/petra/articles', { headers: getPetraAuthHeaders() });
      if (res.status === 401) {
        handleUnauthorized();
        return [];
      }
      if (!res.ok) return [];
      const data = await res.json();
      return data.articles || [];
    } catch {
      return [];
    }
  },

  deleteArticle: async (articleId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/petra/articles/${articleId}`, {
        method: 'DELETE',
        headers: getPetraAuthHeaders(),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'انتهت صلاحية الجلسة' };
      }
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message };
    } catch {
      return { success: false, message: 'تعذر حذف المقال' };
    }
  },
};
