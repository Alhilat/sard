import { api, tokenStorage } from '@/lib/api';
import { postsService, Post } from './postsService';

function getActiveGroupAuthor() {
  const user = tokenStorage.getUser<any>();
  if (user && user.name) {
    return {
      id: user.id || 'usr-me',
      name: user.name,
      username: user.username || user.email?.split('@')[0] || 'user',
      avatar: user.avatar || '',
    };
  }
  return {
    id: 'usr-default',
    name: 'مستخدم سرد',
    username: 'user',
    avatar: '',
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  privacy: 'عام' | 'خاص' | string;
  avatar?: string;
  coverGradient?: string;
  accentColor?: string;
  members: number;
  posts: number;
  joined?: boolean;
  rules?: string[];
  created_at?: string;
  tagline?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  username: string;
  role: 'مؤسس' | 'مشرف' | 'عضو متميز' | 'عضو نشط' | 'عضو';
  avatar?: string;
  joined_at: string;
}
let currentGroups: Group[] = [];
const groupPostsStore: Record<string, Post[]> = {};
const groupMembersStore: Record<string, GroupMember[]> = {};

export const groupsService = {
  getGroups: async (query?: { search?: string; category?: string }): Promise<Group[]> => {
    try {
      const res = await api.get<{ groups?: any[]; data?: any[] }>('/groups', query);
      if (Array.isArray(res)) return res;
      if (res?.groups && Array.isArray(res.groups)) return res.groups;
      if (res?.data && Array.isArray(res.data)) return res.data;
    } catch {
      // Fall back to local store
    }

    let result = [...currentGroups];
    if (query?.search) {
      const s = query.search.trim().toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(s) ||
          g.description.toLowerCase().includes(s) ||
          (g.tagline && g.tagline.toLowerCase().includes(s))
      );
    }
    if (query?.category && query.category !== 'الكل') {
      const cat = query.category;
      result = result.filter((g) => g.category.includes(cat) || cat.includes(g.category));
    }
    return result;
  },

  getGroupById: async (groupId: string): Promise<Group | undefined> => {
    try {
      const res = await api.get<Group>(`/groups/${groupId}`);
      if (res) return res;
    } catch {
      // fallback
    }
    return currentGroups.find((g) => g.id === groupId);
  },

  createGroup: async (data: {
    name: string;
    description: string;
    category: string;
    privacy: 'عام' | 'خاص';
    rules?: string[];
  }): Promise<Group> => {
    try {
      const res = await api.post<any>('/groups', {
        name: data.name,
        description: data.description,
        category: data.category,
        privacy: data.privacy,
        visibility: data.privacy === 'عام' ? 'public' : 'private',
        rules: data.rules,
      });
      const groupData = res?.group || res?.data || res;
      if (groupData && (groupData.id || groupData.groupId)) {
        const fullGroup: Group = {
          id: groupData.id || groupData.groupId,
          name: groupData.name || data.name,
          tagline: groupData.tagline || 'مجتمع جديد انضم إلى فضاء منصة سرد رقمي',
          description: groupData.description || data.description,
          category: groupData.category || data.category,
          privacy: groupData.privacy || data.privacy,
          members: groupData.members || 1,
          posts: groupData.posts || 0,
          joined: true,
          coverGradient: groupData.coverGradient || 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]',
          accentColor: groupData.accentColor || '#8C2424',
          rules: groupData.rules || data.rules || ['الاحترام المتبادل بين جميع الأعضاء ومراعاة آداب الحوار.'],
          created_at: 'الآن',
        };
        currentGroups.unshift(fullGroup);
        return fullGroup;
      }
    } catch {
      // fallback
    }

    const newGroup: Group = {
      id: `g-${Date.now()}`,
      name: data.name,
      tagline: 'مجتمع جديد انضم إلى فضاء منصة سرد رقمي',
      description: data.description,
      category: data.category,
      privacy: data.privacy,
      members: 1,
      posts: 0,
      joined: true,
      coverGradient: 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]',
      accentColor: '#8C2424',
      rules: data.rules && data.rules.length > 0 ? data.rules : [
        'الاحترام المتبادل بين جميع الأعضاء ومراعاة آداب الحوار.',
        'مشاركة المحتوى المرتبط بمجال واهتمامات المجتمع فقط.',
        'الحفاظ على خصوصية الأعضاء ومنع الإعلانات العشوائية.',
      ],
      created_at: 'الآن',
    };

    const author = getActiveGroupAuthor();

    currentGroups.unshift(newGroup);
    groupPostsStore[newGroup.id] = [];
    groupMembersStore[newGroup.id] = [
      { id: author.id, name: author.name, username: author.username, role: 'مؤسس', joined_at: 'الآن' },
    ];

    return newGroup;
  },

  toggleMembership: async (groupId: string, currentlyJoined: boolean): Promise<boolean> => {
    const targetState = !currentlyJoined;
    try {
      if (targetState) {
        await api.post(`/groups/${groupId}/join`);
      } else {
        await api.delete(`/groups/${groupId}/leave`);
      }
    } catch {
      // Fallback
    }

    currentGroups = currentGroups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          joined: targetState,
          members: targetState ? g.members + 1 : Math.max(1, g.members - 1),
        };
      }
      return g;
    });

    return targetState;
  },

  getGroupPosts: async (groupId: string): Promise<Post[]> => {
    try {
      const posts = await postsService.getFeed(1, 50, groupId);
      if (Array.isArray(posts) && posts.length > 0) {
        groupPostsStore[groupId] = posts;
        return posts;
      }
    } catch {
      // fallback
    }
    return groupPostsStore[groupId] || [];
  },

  createGroupPost: async (groupId: string, content: string): Promise<Post> => {
    try {
      const newPost = await postsService.createPost({
        content,
        groupId,
      });
      if (newPost && newPost.id) {
        if (!groupPostsStore[groupId]) {
          groupPostsStore[groupId] = [];
        }
        groupPostsStore[groupId].unshift(newPost);
        currentGroups = currentGroups.map((g) => (g.id === groupId ? { ...g, posts: g.posts + 1 } : g));
        return newPost;
      }
    } catch {
      // fallback
    }

    const author = getActiveGroupAuthor();
    const newPost: Post = {
      id: `gp-${Date.now()}`,
      groupId,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        avatar: author.avatar,
      },
      content,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'الآن',
      isLiked: false,
    };

    if (!groupPostsStore[groupId]) {
      groupPostsStore[groupId] = [];
    }
    groupPostsStore[groupId].unshift(newPost);

    // Increment group post count
    currentGroups = currentGroups.map((g) => (g.id === groupId ? { ...g, posts: g.posts + 1 } : g));

    return newPost;
  },

  getGroupMembers: async (groupId: string): Promise<GroupMember[]> => {
    try {
      const res = await api.get<{ members?: GroupMember[]; data?: GroupMember[] }>(`/groups/${groupId}/members`);
      if (Array.isArray(res)) return res;
      if (res?.members && Array.isArray(res.members) && res.members.length > 0) return res.members;
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    const author = getActiveGroupAuthor();
    return (
      groupMembersStore[groupId] || [
        { id: author.id, name: author.name, username: author.username, role: 'عضو نشط', joined_at: 'منذ قليل' },
      ]
    );
  },
};
