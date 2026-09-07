import { api, tokenStorage } from '@/lib/api';

function getActiveUserAuthor() {
  const user = tokenStorage.getUser<any>();
  if (user && user.name) {
    return {
      id: user.id || 'usr-me',
      name: user.name,
      username: user.username || user.email?.split('@')[0] || 'user',
      avatar: user.avatar || '',
      verified: !!user.verified,
      role: user.role === 'org' ? 'منظمة' : 'عضو نشط',
    };
  }
  return {
    id: 'usr-default',
    name: 'مستخدم سرد',
    username: 'user',
    verified: false,
    role: 'عضو',
  };
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
    role?: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
  scope?: string;
  groupId?: string;
  org?: string | null;
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  created_at: string;
  likes_count: number;
  isLiked?: boolean;
}

let inMemoryPosts: Post[] = [];
const sessionComments: Record<string, Comment[]> = {};

export const postsService = {
  getFeed: async (page = 1, limit = 20, groupId?: string): Promise<Post[]> => {
    try {
      const response = await api.get<{ posts?: Post[]; data?: Post[] }>('/posts', {
        page,
        limit,
        group_id: groupId,
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as any).posts)) {
        return (response as any).posts;
      }
      return [];
    } catch {
      return groupId ? inMemoryPosts.filter((p) => p.groupId === groupId) : inMemoryPosts;
    }
  },

  createPost: async (data: {
    content: string;
    scope?: string;
    mediaIds?: string[];
    groupId?: string;
    tags?: string[];
  }): Promise<Post> => {
    try {
      const res = await api.post<Post>('/posts', {
        content: data.content,
        visibility: 'public',
        group_id: data.groupId,
        media_ids: data.mediaIds,
      });
      if (res && res.id) {
        inMemoryPosts.unshift(res);
        return res;
      }
    } catch {
      // fallback
    }

    // Extract hashtags from content if any
    const hashtagRegex = /#([^\s#]+)/g;
    const matches = data.content.match(hashtagRegex);
    const extractedTags = matches ? matches.map((m) => m.slice(1)) : (data.tags || ['سرد_رقمي']);

    const author = getActiveUserAuthor();

    const newPost: Post = {
      id: `sard-${Date.now()}`,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        verified: author.verified,
        role: author.role,
        avatar: author.avatar,
      },
      content: data.content,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'الآن',
      isLiked: false,
      tags: extractedTags,
      groupId: data.groupId,
    };

    inMemoryPosts.unshift(newPost);
    return newPost;
  },

  likePost: async (postId: string): Promise<boolean> => {
    try {
      await api.post(`/posts/${postId}/like`);
    } catch {
      // fallback
    }

    inMemoryPosts = inMemoryPosts.map((p) => {
      if (p.id === postId) {
        const nextLiked = !p.isLiked;
        return {
          ...p,
          isLiked: nextLiked,
          likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      }
      return p;
    });

    return true;
  },

  sharePost: async (
    postId: string,
    commentary?: string
  ): Promise<{ success: boolean; sharesCount?: number }> => {
    try {
      const res = await api.post(`/posts/${postId}/share`, { commentary });
      return { success: true, sharesCount: res?.shares_count };
    } catch {
      // fallback
    }

    inMemoryPosts = inMemoryPosts.map((p) => {
      if (p.id === postId) {
        return { ...p, shares: p.shares + 1 };
      }
      return p;
    });

    return { success: true };
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    try {
      const res = await api.get<{ comments: Comment[] }>(`/posts/${postId}/comments`);
      if (res && Array.isArray(res.comments)) return res.comments;
    } catch {
      // fallback
    }
    return sessionComments[postId] || [];
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    try {
      const res = await api.post<Comment>(`/posts/${postId}/comments`, { content });
      if (res && res.id) return res;
    } catch {
      // fallback
    }

    const commentAuthor = getActiveUserAuthor();

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: {
        id: commentAuthor.id,
        name: commentAuthor.name,
        username: commentAuthor.username,
        verified: commentAuthor.verified,
        avatar: commentAuthor.avatar,
      },
      content,
      created_at: 'الآن',
      likes_count: 0,
      isLiked: false,
    };

    if (!sessionComments[postId]) {
      sessionComments[postId] = [];
    }
    sessionComments[postId].unshift(newComment);

    // Increment comment count on post
    inMemoryPosts = inMemoryPosts.map((p) =>
      p.id === postId ? { ...p, comments: p.comments + 1 } : p
    );

    return newComment;
  },

  likeComment: async (postId: string, commentId: string): Promise<boolean> => {
    if (sessionComments[postId]) {
      sessionComments[postId] = sessionComments[postId].map((c) => {
        if (c.id === commentId) {
          const next = !c.isLiked;
          return {
            ...c,
            isLiked: next,
            likes_count: next ? c.likes_count + 1 : Math.max(0, c.likes_count - 1),
          };
        }
        return c;
      });
    }
    return true;
  },
};
