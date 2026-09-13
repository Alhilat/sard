import { Comment } from '@/services/postsService';

export interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  role?: string;
  isFollowing?: boolean;
}

export interface ThreadedComment extends Comment {
  replies?: ThreadedComment[];
}

export interface TrendTopic {
  id: string;
  tag: string;
  category: string;
}

export const TRENDS: TrendTopic[] = [
  { id: 't1', tag: 'سرد_رقمي', category: 'المجتمع والتقنية' },
  { id: 't2', tag: 'الذكاء_الاصطناعي', category: 'تقنيات المستقبل' },
  { id: 't3', tag: 'تطوير_البرمجيات', category: 'علوم الحاسب والبرمجة' },
  { id: 't4', tag: 'رؤية_السعودية', category: 'اقتصاد ومبادرات' },
  { id: 't5', tag: 'عمل_تطوعي', category: 'مبادرات مجتمعية' },
];

export function buildCommentTree(comments: Comment[]): ThreadedComment[] {
  const commentMap = new Map<string, ThreadedComment>();
  const rootComments: ThreadedComment[] = [];

  // Pass 1: Clone with empty replies
  comments.forEach((c) => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  // Pass 2: Connect children to parent or add to roots
  comments.forEach((c) => {
    const item = commentMap.get(c.id)!;
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId)!.replies!.push(item);
    } else {
      rootComments.push(item);
    }
  });

  return rootComments;
}
