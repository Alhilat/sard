import React from 'react';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  CheckCircle2, Copy, Flag, Trash2
} from 'lucide-react';
import { Post, Comment } from '@/services/postsService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatArabicRelativeTime } from '@/lib/utils';
import PostCommentsThread from './PostCommentsThread';

interface PostCardProps {
  post: Post;
  isHighlighted?: boolean;
  isBookmarked?: boolean;
  isCommentsOpen?: boolean;
  comments?: Comment[];
  currentUserId?: string;
  currentUserRole?: string;
  currentUserName?: string;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  onShare: (post: Post) => void;
  onReport: (postId: string) => void;
  onDelete: (postId: string) => void;
  onOpenUserProfile: (target: {
    id?: string;
    name: string;
    username?: string;
    avatar?: string;
    role?: string;
    verified?: boolean;
  }) => void;
  onTagClick: (tag: string) => void;
  onSendReply: (postId: string, text: string, parentCommentId?: string) => Promise<void>;
}

export default function PostCard({
  post,
  isHighlighted = false,
  isBookmarked = false,
  isCommentsOpen = false,
  comments = [],
  currentUserId,
  currentUserRole,
  currentUserName,
  onToggleLike,
  onToggleBookmark,
  onToggleComments,
  onShare,
  onReport,
  onDelete,
  onOpenUserProfile,
  onTagClick,
  onSendReply,
}: PostCardProps) {
  const canDelete =
    currentUserId === post.author?.id ||
    currentUserRole === 'admin' ||
    currentUserRole === 'org';

  return (
    <Card
      id={`post-${post.id}`}
      className={`border-card-border/80 shadow-xs hover:border-primary/40 transition-all bg-card/90 overflow-hidden ${
        isHighlighted
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/15 border-primary/80 animate-in fade-in duration-300'
          : ''
      }`}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Post Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onOpenUserProfile(post.author)}
              className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0 hover:scale-105 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs"
              title={`عرض الملف الشخصي لـ ${post.author.name}`}
            >
              {post.author.name.slice(0, 1)}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onOpenUserProfile(post.author)}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer text-start"
                >
                  {post.author.name}
                </button>
                {post.author.verified && (
                  <Badge className="h-4 px-1 text-[10px] bg-sky-500 hover:bg-sky-600 text-white border-0 gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>موثق</span>
                  </Badge>
                )}
                {post.author.role && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    · {post.author.role}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formatArabicRelativeTime(post.createdAt || post.timestamp, post.timestamp)}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs"
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/app/feed?post=${post.id}`);
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                نسخ رابط المنشور
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                onClick={() => onReport(post.id)}
              >
                <Flag className="w-3.5 h-3.5" />
                إبلاغ عن محتوى
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-xs text-destructive"
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف المنشور
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content with hashtag highlighting */}
        <p className="text-sm sm:text-base text-foreground/90 leading-relaxed mb-3.5 whitespace-pre-wrap font-normal">
          {post.content.split(' ').map((word, i) => {
            if (word.startsWith('#')) {
              const rawTag = word.replace('#', '');
              return (
                <button
                  type="button"
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick(rawTag);
                  }}
                  className="text-primary font-bold hover:underline cursor-pointer inline mx-0.5"
                >
                  {word}{' '}
                </button>
              );
            }
            return word + ' ';
          })}
        </p>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-muted-foreground w-full gap-2">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            {/* Reply Button */}
            <button
              type="button"
              onClick={() => onToggleComments(post.id)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-muted ${
                isCommentsOpen ? 'text-primary bg-primary/10' : 'hover:text-primary'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments > 0 ? `${post.comments} ردود` : 'رد'}</span>
            </button>

            {/* Like Button */}
            <button
              type="button"
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-muted ${
                post.isLiked ? 'text-red-600 bg-red-500/10' : 'hover:text-red-500'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  post.isLiked ? 'fill-current text-red-600 scale-110' : ''
                }`}
              />
              <span>{post.likes > 0 ? `${post.likes} إعجاب` : 'إعجاب'}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={() => onShare(post)}
              className="flex items-center gap-1.5 text-xs font-bold text-foreground/80 hover:text-primary transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-primary/10"
              title="مشاركة المنشور"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>{post.shares > 0 ? `${post.shares} مشاركة` : 'مشاركة'}</span>
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={() => onToggleBookmark(post.id)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isBookmarked ? 'text-primary bg-primary/10' : 'hover:bg-muted hover:text-foreground'
            }`}
            title={isBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-primary' : ''}`} />
          </button>
        </div>

        {/* Interactive Thread Replies */}
        {isCommentsOpen && (
          <PostCommentsThread
            postId={post.id}
            postAuthorName={post.author.name}
            comments={comments}
            currentUserName={currentUserName}
            onSendReply={onSendReply}
            onClose={() => onToggleComments(post.id)}
            onOpenUserProfile={onOpenUserProfile}
          />
        )}
      </CardContent>
    </Card>
  );
}
