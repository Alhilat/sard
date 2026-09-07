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

// Initial Twitter-style Sard Posts
const initialSardPosts: Post[] = [
  {
    id: 'p1',
    author: {
      id: '2',
      name: 'سارة عبدالله الأحمد',
      username: 'sara.ahmad',
      verified: true,
      role: 'مهندسة حلول سحابية',
    },
    content: 'المستقبل يصنعه أولئك الذين يبنون اليوم. مع تسارع تقنيات الذكاء الاصطناعي، تظل القيمة الحقيقية في فهم الاحتياج البشري وصياغة الحلول التي تمكّن الإنسان، لا أن تلغيه. ما هو أكثر مجال ترون فيه أثراً واعداً؟ #سرد_رقمي #الذكاء_الاصطناعي',
    likes: 0,
    comments: 2,
    shares: 0,
    timestamp: 'منذ ١٥ دقيقة',
    isLiked: false,
    tags: ['سرد_رقمي', 'الذكاء_الاصطناعي'],
  },
  {
    id: 'p2',
    author: {
      id: 'org1',
      name: 'منظمة رواد التطوع',
      username: 'rwad',
      verified: true,
      role: 'مؤسسة غير ربحية معتمدة',
    },
    content: 'يسعدنا الإعلان رسمياً عن فتح باب الانضمام إلى "ملتقى التطوع الرقمي ٢٠٢٥". نسعى لتدريب الشباب والشابات على إطلاق مبادرات مجتمعية نوعية. لا تنتظر الفرصة، بل اصنعها بنفسك! 🌿✨ #عمل_تطوعي #صناع_الأثر',
    likes: 0,
    comments: 1,
    shares: 0,
    timestamp: 'منذ ساعتين',
    isLiked: false,
    tags: ['عمل_تطوعي', 'صناع_الأثر'],
  },
  {
    id: 'p3',
    author: {
      id: '3',
      name: 'م. طارق بن خالد العتيبي',
      username: 'tariq.otaibi',
      verified: true,
      role: 'مستشار بنيات برمجية',
    },
    content: 'نصيحة أشاركها دائماً مع المطورين الشباب:\n١. احرص على فهم المعمارية قبل كتابة أول سطر كود.\n٢. وثّق قراراتك البرمجية (ADRs).\n٣. بسّط الحلول قدر المستطاع، فالكود الأفضل هو الكود الذي يسهل حذفه واستبداله لاحقاً. #تطوير_البرمجيات #هندسة_النظم',
    likes: 0,
    comments: 1,
    shares: 0,
    timestamp: 'منذ ٤ ساعات',
    isLiked: false,
    tags: ['تطوير_البرمجيات', 'هندسة_النظم'],
  },
  {
    id: 'p4',
    author: {
      id: '4',
      name: 'د. ليلى السليمان',
      username: 'layla.sulaiman',
      verified: true,
      role: 'أستاذة الأدب والنقد',
    },
    content: 'في فضاء "سرد"، كل حرف يُكتب هو لبنة في صرح الثقافة والمعرفة. جميل أن نرى منصة عربية تجمع المطور والكاتب والمصمم في حوار مفتوح يثري المحتوى الرقمي بلغتنا العربية الأصيلة. فخورين بهذا الحراك! 🖋️📖 #سرد_رقمي #اللغة_العربية',
    likes: 0,
    comments: 0,
    shares: 0,
    timestamp: 'أمس الساعة ٦:٠٠ م',
    isLiked: false,
    tags: ['سرد_رقمي', 'اللغة_العربية'],
  },
  {
    id: 'p5',
    author: {
      id: '1',
      name: 'أحمد محمد الزهراني',
      username: 'ahmed.zahrani',
      verified: false,
      role: 'عضو نشط',
    },
    content: 'أنهيت اليوم تطبيق نظام محادثة جماعي متكامل مع صلاحيات تحكم المعلم. الشعور بالإنجاز لا يُضاهى حين ترى الكود يتحول إلى تجربة مستخدم حية وتفاعلية. شكراً لكل من ساعد وقدّم ملاحظات! 🚀💻 #سرد #تحدي_البرمجة',
    likes: 0,
    comments: 0,
    shares: 0,
    timestamp: 'أمس',
    isLiked: false,
    tags: ['سرد', 'تحدي_البرمجة'],
  },
];

let inMemoryPosts: Post[] = [...initialSardPosts];

const sessionComments: Record<string, Comment[]> = {
  p1: [
    {
      id: 'c101',
      author: { id: '3', name: 'م. طارق بن خالد العتيبي', username: 'tariq.otaibi', verified: true },
      content: 'أتفق معك تماماً يا سارة. الأتمتة والذكاء الاصطناعي التوليدي في مجال الرعاية الصحية والتعليم سيكون لهما أعظم الأثر الاجتماعي خلال العقد الحالي.',
      created_at: 'منذ ١٠ دقائق',
      likes_count: 12,
    },
    {
      id: 'c102',
      author: { id: '4', name: 'د. ليلى السليمان', username: 'layla.sulaiman', verified: true },
      content: 'المعضلة الأخلاقية تظل هي التحدي الأكبر: كيف نحافظ على أصالة التفكير الإنساني مع كل هذه الأدوات التوليدية؟ طرح ملهم ومحفز للتأمل.',
      created_at: 'منذ ٥ دقائق',
      likes_count: 8,
    },
  ],
  p2: [
    {
      id: 'c201',
      author: { id: '1', name: 'أحمد محمد الزهراني', username: 'ahmed.zahrani' },
      content: 'تم التسجيل في البرنامج بحمد الله! متحمس جداً للمشاركة في مسار المبادرات التقنية.',
      created_at: 'منذ ساعة',
      likes_count: 4,
    },
  ],
  p3: [
    {
      id: 'c301',
      author: { id: '2', name: 'سارة عبدالله الأحمد', username: 'sara.ahmad', verified: true },
      content: 'القاعدة الثالثة ذهبية: "الكود الأفضل هو الكود الذي يسهل حذفه". البساطة هي قمة الاحترافية دائماً.',
      created_at: 'منذ ٣ ساعات',
      likes_count: 24,
    },
  ],
};

export const postsService = {
  getFeed: async (page = 1, limit = 20, groupId?: string): Promise<Post[]> => {
    try {
      const response = await api.get<{ posts?: Post[]; data?: Post[] }>('/posts', {
        page,
        limit,
        group_id: groupId,
      });
      if (Array.isArray(response) && response.length > 0) return response;
      if (response && Array.isArray((response as any).posts) && (response as any).posts.length > 0) {
        return (response as any).posts;
      }
    } catch {
      // fallback
    }

    if (groupId) {
      return inMemoryPosts.filter((p) => p.groupId === groupId);
    }
    return [...inMemoryPosts];
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
