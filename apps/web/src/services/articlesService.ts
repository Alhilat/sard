import { api } from '@/lib/api';

export interface ArticleAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  verified?: boolean;
  bio?: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  parentId?: string | null;
  content: string;
  likesCount: number;
  createdAt: number;
  timestamp?: string;
  author: ArticleAuthor;
  replies?: ArticleComment[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  charCount: number;
  wordCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  author: ArticleAuthor;
  createdAt: number;
  updatedAt: number;
  timestamp?: string;
}

export interface ArticlesListResponse {
  success: boolean;
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateArticlePayload {
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
}

export const articlesService = {
  getArticles: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ArticlesListResponse> => {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.category && params.category !== 'all') queryParams.category = params.category;
      if (params?.search) queryParams.search = params.search;
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;

      const res = await api.get<ArticlesListResponse>('/articles', queryParams);
      if (res && Array.isArray(res.articles)) {
        return res;
      }
      return {
        success: true,
        articles: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
      };
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      return {
        success: false,
        articles: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
      };
    }
  },

  getArticle: async (idOrSlug: string): Promise<Article | null> => {
    try {
      const res = await api.get<{ success: boolean; article: Article }>(`/articles/${encodeURIComponent(idOrSlug)}`);
      return res?.article || null;
    } catch (err) {
      console.error('Failed to fetch article details:', err);
      return null;
    }
  },

  createArticle: async (payload: CreateArticlePayload): Promise<{ success: boolean; article?: any; message?: string }> => {
    try {
      const res = await api.post<{ success: boolean; message?: string; article?: any }>('/articles', payload);
      return res;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'تعذر نشر المقال، يرجى التأكد من استيفاء الحد الأدنى (500 حرف)',
      };
    }
  },

  deleteArticle: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      return await api.delete<{ success: boolean; message?: string }>(`/articles/${id}`);
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حذف المقال' };
    }
  },

  likeArticle: async (id: string): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> => {
    try {
      return await api.post<{ success: boolean; isLiked: boolean; likesCount: number }>(`/articles/${id}/like`);
    } catch (err: any) {
      throw new Error(err?.message || 'يجب تسجيل الدخول للإعجاب بالمقال');
    }
  },

  bookmarkArticle: async (id: string): Promise<{ success: boolean; isBookmarked: boolean; message?: string }> => {
    try {
      return await api.post<{ success: boolean; isBookmarked: boolean; message?: string }>(`/articles/${id}/bookmark`);
    } catch (err: any) {
      throw new Error(err?.message || 'يجب تسجيل الدخول لحفظ المقال');
    }
  },

  getComments: async (articleId: string): Promise<ArticleComment[]> => {
    try {
      const res = await api.get<{ success: boolean; comments: ArticleComment[] }>(`/articles/${articleId}/comments`);
      return res?.comments || [];
    } catch (err) {
      console.error('Failed to fetch article comments:', err);
      return [];
    }
  },

  addComment: async (
    articleId: string,
    content: string,
    parentId?: string | null
  ): Promise<{ success: boolean; comment?: ArticleComment; message?: string }> => {
    try {
      const res = await api.post<{ success: boolean; comment?: ArticleComment; message?: string }>(
        `/articles/${articleId}/comments`,
        { content, parentId }
      );
      return res;
    } catch (err: any) {
      throw new Error(err?.message || 'يرجى تسجيل الدخول للتعليق على المقال');
    }
  },
};
