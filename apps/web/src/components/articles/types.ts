import { Article, ArticleComment } from '@/services/articlesService';

export interface CommentWithReplies extends ArticleComment {
  replies?: CommentWithReplies[];
}

export function buildArticleCommentTree(comments: ArticleComment[]): CommentWithReplies[] {
  const map = new Map<string, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export interface ArticleCategory {
  id: string;
  label: string;
  count?: number;
}

export type ArticleStatus = 'pending' | 'approved' | 'needs_revision' | 'rejected';

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, { label: string; color: string }> = {
  approved: { label: 'مقبول ومنشور', color: 'emerald' },
  pending: { label: 'قيد المراجعة', color: 'amber' },
  needs_revision: { label: 'يتطلب تعديل نقاط', color: 'orange' },
  rejected: { label: 'مرفوض', color: 'red' },
};

export const PRESET_COVERS = [
  {
    label: 'أكواد وبرمجة',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'تصميم وواجهات',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'خوادم وشبكات',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'فريق عمل وإنتاجية',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'مساحة عمل هادئة',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
  },
];
