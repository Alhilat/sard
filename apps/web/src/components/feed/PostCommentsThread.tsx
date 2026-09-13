import React, { useState } from 'react';
import { MessageCircle, CornerDownLeft, X, Send } from 'lucide-react';
import { Comment } from '@/services/postsService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatArabicRelativeTime } from '@/lib/utils';
import { buildCommentTree } from './types';

interface PostCommentsThreadProps {
  postId: string;
  postAuthorName: string;
  comments: Comment[];
  currentUserName?: string;
  onSendReply: (postId: string, text: string, parentCommentId?: string) => Promise<void>;
  onClose: () => void;
  onOpenUserProfile: (target: {
    id?: string;
    name: string;
    username?: string;
    avatar?: string;
    role?: string;
    verified?: boolean;
  }) => void;
}

export default function PostCommentsThread({
  postId,
  postAuthorName,
  comments,
  currentUserName,
  onSendReply,
  onClose,
  onOpenUserProfile,
}: PostCommentsThreadProps) {
  const [replyInput, setReplyInput] = useState('');
  const [replyingToTarget, setReplyingToTarget] = useState<{
    id: string;
    authorName: string;
    username: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    const text = replyInput.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSendReply(postId, text, replyingToTarget?.id);
      setReplyInput('');
      setReplyingToTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const threadedComments = buildCommentTree(comments);

  return (
    <div className="mt-4 pt-4 border-t border-border/70 space-y-4 animate-in fade-in-50 duration-200">
      {/* Replies Header */}
      <div className="flex items-center justify-between text-xs font-bold text-foreground px-1">
        <span className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span>الردود والمناقشات</span>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </span>
        {comments.length > 0 && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            إخفاء
          </button>
        )}
      </div>

      {/* Sleek Reply Composer */}
      <div className="rounded-2xl bg-muted/40 border border-border/70 p-2.5 sm:p-3 space-y-2 transition-all focus-within:border-primary/50 focus-within:bg-card focus-within:shadow-xs">
        {/* Active Replying Target Chip */}
        {replyingToTarget && (
          <div className="flex items-center justify-between px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-xs text-primary w-fit max-w-full animate-in fade-in-50 duration-150">
            <span className="flex items-center gap-1.5 truncate text-[11px] font-medium">
              <CornerDownLeft className="w-3 h-3 text-primary shrink-0" />
              <span>
                الرد على <b>{replyingToTarget.authorName}</b> (@{replyingToTarget.username})
              </span>
            </span>
            <button
              type="button"
              onClick={() => setReplyingToTarget(null)}
              className="ms-2 text-primary/80 hover:text-destructive p-0.5 rounded-full hover:bg-primary/20 cursor-pointer transition-colors"
              title="إلغاء توجيه الرد"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input Form with User Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {currentUserName ? currentUserName.slice(0, 1) : 'س'}
          </div>
          <div className="flex-1 relative min-w-0">
            <Input
              placeholder={
                replyingToTarget
                  ? `اكتب ردك على @${replyingToTarget.username}...`
                  : `أضف رداً على ${postAuthorName}...`
              }
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              className="text-xs sm:text-sm h-9 bg-transparent border-0 shadow-none focus-visible:ring-0 px-1 placeholder:text-muted-foreground/70"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply();
                }
              }}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || !replyInput.trim()}
            onClick={handleSubmitReply}
            className="h-8 px-3.5 text-xs font-bold shrink-0 gap-1.5 rounded-xl shadow-xs transition-all"
          >
            <span>رد</span>
            <Send className="w-3 h-3 rtl:-scale-x-100" />
          </Button>
        </div>
      </div>

      {/* Threaded Comments List */}
      <div className="space-y-4 pt-1">
        {threadedComments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground space-y-1">
            <MessageCircle className="w-6 h-6 mx-auto opacity-30 mb-1" />
            <p className="text-xs font-medium">لا توجد ردود بعد</p>
            <p className="text-[11px] text-muted-foreground/70">كن أول من يشارك في هذا النقاش!</p>
          </div>
        ) : (
          threadedComments.map((comment) => {
            const replies = comment.replies || [];
            const hasReplies = replies.length > 0;
            return (
              <div key={comment.id} className="relative group/thread">
                {/* Parent Comment Item */}
                <div className="flex items-start gap-3 relative">
                  {/* Avatar Column with Thread Line */}
                  <div className="flex flex-col items-center shrink-0 relative">
                    <button
                      type="button"
                      onClick={() => onOpenUserProfile(comment.author)}
                      className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 hover:border-primary flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer shadow-2xs hover:scale-105"
                      title={comment.author.name}
                    >
                      {comment.author.name.slice(0, 1)}
                    </button>

                    {/* Continuous vertical line to child replies */}
                    {hasReplies && (
                      <div className="w-0.5 bg-border/80 flex-1 my-1.5 rounded-full min-h-[16px]" />
                    )}
                  </div>

                  {/* Comment Content Area */}
                  <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenUserProfile(comment.author)}
                          className="font-bold text-xs sm:text-[13px] text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                        >
                          {comment.author.name}
                        </button>
                        {comment.author.verified && (
                          <Badge className="h-3.5 px-1 text-[9px] bg-sky-500 hover:bg-sky-600 text-white border-0">
                            موثق
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          @{comment.author.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatArabicRelativeTime(comment.created_at, comment.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    {/* Action Bar */}
                    <div className="flex items-center gap-3 pt-1 text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToTarget({
                            id: comment.id,
                            authorName: comment.author.name,
                            username: comment.author.username,
                          });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer py-0.5 px-2 rounded-md hover:bg-primary/10"
                      >
                        <CornerDownLeft className="w-3 h-3" />
                        <span>رد</span>
                      </button>

                      {hasReplies && (
                        <span className="text-[11px] text-muted-foreground/80 font-medium">
                          {replies.length} {replies.length === 1 ? 'رد' : 'ردود'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Replies */}
                {hasReplies && (
                  <div className="ms-4 sm:ms-5 ps-3.5 sm:ps-4 border-s-2 border-border/80 space-y-3 pt-2">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2.5 relative group/reply">
                        <button
                          type="button"
                          onClick={() => onOpenUserProfile(reply.author)}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-muted border border-border/80 text-foreground/80 hover:border-primary flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 transition-all cursor-pointer mt-0.5"
                          title={reply.author.name}
                        >
                          {reply.author.name.slice(0, 1)}
                        </button>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onOpenUserProfile(reply.author)}
                              className="font-bold text-xs text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                            >
                              {reply.author.name}
                            </button>
                            {reply.author.verified && (
                              <Badge className="h-3 px-1 text-[8px] bg-sky-500 text-white border-0">
                                موثق
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground font-mono">
                              @{reply.author.username}
                            </span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatArabicRelativeTime(reply.created_at, reply.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToTarget({
                                  id: comment.id,
                                  authorName: reply.author.name,
                                  username: reply.author.username,
                                });
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-primary/10"
                            >
                              <CornerDownLeft className="w-2.5 h-2.5" />
                              <span>رد</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
