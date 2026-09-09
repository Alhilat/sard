import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { postsService } from '@/services/postsService';
import {
  Share2, Copy, Check, Repeat2, Send, ExternalLink,
  MessageCircle, Globe
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    author: {
      name: string;
      username: string;
      avatar?: string;
    };
    shares?: number;
  };
  onShareSuccess?: (newShareCount: number) => void;
}

// Global in-memory cooldown to avoid rapid duplicate submissions across the UI
const clientCooldowns = new Map<string, number>();

export default function ShareModal({ isOpen, onClose, post, onShareSuccess }: ShareModalProps) {
  const { toast } = useToast();
  const [commentary, setCommentary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Generate canonical post permalink
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const postUrl = `${origin}/app/feed?post=${post.id}`;
  const encodedUrl = encodeURIComponent(postUrl);
  const shareSummary = `${post.author.name} على منصة سرد رقمي: "${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"`;
  const encodedText = encodeURIComponent(shareSummary);

  // Fast clipboard copy with zero DB impact
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        // Fallback for older/unsecured contexts
        const textarea = document.createElement('textarea');
        textarea.value = postUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopied(true);
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط المنشور إلى الحافظة بنجاح.',
      });
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر النسخ',
        description: 'يرجى نسخ الرابط يدوياً.',
      });
    }
  };

  // Native Web Share API (Zero DB impact)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'سرد رقمي',
          text: shareSummary,
          url: postUrl,
        });
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Structured Repost / Share to Feed with Client-side Throttling & Optimistic UI
  const handleInternalShare = async () => {
    const now = Date.now();
    const lastShared = clientCooldowns.get(post.id) || 0;
    
    // Algorithm: 2-second rate-limiting threshold per post to prevent spamming the DB
    if (now - lastShared < 2000) {
      toast({
        title: 'مهلاً قليلاً',
        description: 'تمت معالجة طلب المشاركة مؤخراً.',
      });
      return;
    }

    clientCooldowns.set(post.id, now);
    setIsSubmitting(true);

    // Optimistically update count
    const optimisticCount = (post.shares || 0) + 1;
    onShareSuccess?.(optimisticCount);

    try {
      await postsService.sharePost(post.id, commentary.trim() || undefined);
      setShareSuccess(true);
      toast({
        title: 'تمت إعادة النشر',
        description: 'تمت مشاركة المنشور في مجتمع سرد رقمي بنجاح.',
      });
      setTimeout(() => {
        setShareSuccess(false);
        setCommentary('');
        onClose();
      }, 1200);
    } catch {
      // Revert optimistic count on actual failure
      onShareSuccess?.(post.shares || 0);
      toast({
        variant: 'destructive',
        title: 'تعذر المشاركة',
        description: 'حدث خطأ أثناء إعادة النشر. حاول مرة أخرى.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            مشاركة المنشور
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            اختر طريقة مشاركة المنشور مع مجتمعك أو عبر المنصات الخارجية
          </DialogDescription>
        </DialogHeader>

        {/* Post Snippet Card */}
        <div className="rounded-xl bg-muted/60 p-3.5 border border-border/80 my-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {post.author.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-xs font-bold">{post.author.name}</p>
              <p className="text-[11px] text-muted-foreground">@{post.author.username}</p>
            </div>
          </div>
          <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Option 1: Repost to Sard Raqami Community */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Repeat2 className="w-4 h-4 text-primary" />
            إعادة النشر في سرد رقمي
          </label>
          <Textarea
            placeholder="أضف تعليقك أو أفكارك حول هذا المنشور (اختياري)..."
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            className="text-xs min-h-[70px] resize-none"
            maxLength={280}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {280 - commentary.length} حرف متبقٍ
            </span>
            <Button
              onClick={handleInternalShare}
              disabled={isSubmitting || shareSuccess}
              size="sm"
              className="gap-1.5 font-bold h-9"
            >
              {shareSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  تمت المشاركة!
                </>
              ) : isSubmitting ? (
                'جاري المشاركة...'
              ) : (
                <>
                  <Repeat2 className="w-4 h-4" />
                  إعادة نشر
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-background px-2 text-muted-foreground">أو شارك بالرابط المباشر</span>
          </div>
        </div>

        {/* Option 2: Copy Direct Link (0 DB requests) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 text-xs bg-muted/80 rounded-lg text-muted-foreground truncate font-mono select-all">
            {postUrl}
          </div>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className={`gap-1.5 h-9 shrink-0 transition-all ${hasCopied ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}`}
          >
            {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {hasCopied ? 'تم النسخ' : 'نسخ الرابط'}
          </Button>
        </div>

        {/* Option 3: External Social Networks (0 DB requests) */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2.5">
            مشاركة عبر المنصات الاجتماعية:
          </p>
          <div className="grid grid-cols-4 gap-2">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-card hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all text-center gap-1 group"
            >
              <span className="text-lg">💬</span>
              <span className="text-[11px] font-medium">واتساب</span>
            </a>

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-card hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition-all text-center gap-1 group"
            >
              <span className="text-lg">𝕏</span>
              <span className="text-[11px] font-medium">تويتر</span>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-card hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all text-center gap-1 group"
            >
              <span className="text-lg">✈️</span>
              <span className="text-[11px] font-medium">تيليجرام</span>
            </a>

            {/* Native Share / General */}
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all text-center gap-1 group"
            >
              <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-[11px] font-medium">المزيد</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
