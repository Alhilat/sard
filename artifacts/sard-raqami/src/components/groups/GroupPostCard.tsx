import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Share2, Send, CheckCircle, Sparkles } from 'lucide-react';
import { postsService, Post, Comment } from '@/services/postsService';
import ShareModal from '@/components/share/ShareModal';
import { useToast } from '@/hooks/use-toast';

interface GroupPostCardProps {
  post: Post;
  groupName: string;
}

export default function GroupPostCard({ post, groupName }: GroupPostCardProps) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);

  // Keep state synced with props
  useEffect(() => {
    setLiked(Boolean(post.isLiked));
    setLikesCount(post.likes || 0);
    setCommentsCount(post.comments || 0);
  }, [post.isLiked, post.likes, post.comments]);

  // Load comments when drawer is opened
  useEffect(() => {
    if (showComments) {
      postsService.getComments(post.id).then((data) => setComments(data));
    }
  }, [showComments, post.id]);

  // Real like with optimistic updates
  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await postsService.likePost(post.id);
      if (res && typeof res.liked === 'boolean') {
        setLiked(res.liked);
        setLikesCount(res.likes);
      }
    } catch {
      setLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Real comment submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentText.trim();
    if (!text) return;

    setIsSubmittingComment(true);
    try {
      const created = await postsService.addComment(post.id, text);
      setComments((prev) => [created, ...prev]);
      setCommentsCount((prev) => prev + 1);
      setNewCommentText('');
      toast({
        title: 'تم نشر التعقيب بنجاح',
        description: 'مشاركتك تثري الحوار في هذا المجتمع.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر النشر',
        description: 'يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <>
      <Card className="border-card-border/80 shadow-xs hover:shadow-sm transition-all overflow-hidden bg-card/90 backdrop-blur-xs">
        <CardContent className="p-5">
          {/* Post Header */}
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              {/* Author Monogram */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                {post.author.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer">
                    {post.author.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-medium bg-primary/10 text-primary border-0">
                    {groupName}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>@{post.author.username}</span>
                  <span>•</span>
                  <span>{post.timestamp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap font-normal">
            {post.content}
          </p>

          {/* Action Bar (Arabic-styled) */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  liked
                    ? 'text-red-600 bg-red-500/10 border border-red-500/20'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent'
                }`}
              >
                <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
                <span>{liked ? 'أعجبني' : 'إعجاب'}</span>
                {likesCount > 0 && (
                  <span className="text-[11px] opacity-80">({likesCount})</span>
                )}
              </button>

              {/* Comments Button */}
              <button
                type="button"
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  showComments
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{commentsCount > 0 ? `التعليقات (${commentsCount})` : 'تعليق'}</span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/80 hover:text-primary transition-all cursor-pointer select-none border border-transparent"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة</span>
                {sharesCount > 0 && (
                  <span className="text-[11px] opacity-80">({sharesCount.toLocaleString('ar-SA')})</span>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Comments Drawer */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-border/80 space-y-3.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  حوارات وتعقيبات الأعضاء ({commentsCount.toLocaleString('ar-SA')})
                </span>
              </div>

              {/* New Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                <Input
                  placeholder="أضف تعقيبك أو وجهة نظرك في هذا الموضوع..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="text-xs sm:text-sm h-10 bg-background/70 border-border/80 focus-visible:ring-primary"
                  disabled={isSubmittingComment}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="h-10 px-4 gap-1.5 font-bold shrink-0 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{isSubmittingComment ? 'جاري الإرسال...' : 'إرسال'}</span>
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-2 pt-1">
                {comments.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                    لا توجد تعقيبات بعد. كن أول من يثري هذا الحوار برأيك!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {comment.author.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            @{comment.author.username}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {comment.created_at}
                        </span>
                      </div>
                      <p className="text-foreground/90 leading-relaxed text-xs">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structured Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{
          id: post.id,
          content: post.content,
          author: post.author,
          shares: sharesCount,
        }}
        onShareSuccess={(newCount) => setSharesCount(newCount)}
      />
    </>
  );
}
