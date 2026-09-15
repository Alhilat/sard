import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Article, ArticleComment, articlesService } from '@/services/articlesService';
import { buildArticleCommentTree, CommentWithReplies } from '@/components/articles/types';
import GuestAuthModal from '@/components/articles/GuestAuthModal';
import ArticleMarkdown from '@/components/articles/ArticleMarkdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight, Heart, Bookmark, Share2, MessageSquare, Clock, Eye,
  CheckCircle2, Send, CornerDownLeft, Sparkles, LogIn, Maximize2,
  Minimize2, BookOpen, AlertCircle, ShieldAlert, Edit3
} from 'lucide-react';

interface ArticleDetailProps {
  slug?: string;
}

export default function ArticleDetail({ slug: propSlug }: ArticleDetailProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Extract slug from URL if not passed as prop
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(Boolean);
  const detectedSlug = propSlug || pathParts[pathParts.length - 1] || '';

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Reading preferences
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isZenMode, setIsZenMode] = useState(false);

  // Comments state
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Guest auth modal
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestModalAction, setGuestModalAction] = useState('للتفاعل مع المقالات');

  // Load article
  useEffect(() => {
    if (!detectedSlug) return;
    setIsLoading(true);
    setNotFound(false);

    articlesService.getArticle(detectedSlug)
      .then((data) => {
        if (data) {
          setArticle(data);
          document.title = `${data.title} | مقالات سرد`;
          // Load comments
          setIsLoadingComments(true);
          articlesService.getComments(data.id)
            .then(setComments)
            .finally(() => setIsLoadingComments(false));
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [detectedSlug]);

  // Window scroll progress listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    const isApp = location.startsWith('/app');
    navigate(isApp ? '/app/articles' : '/articles');
  };

  const handleShare = () => {
    if (!article) return;
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast({
        title: 'تم نسخ الرابط بنجاح',
        description: 'يمكنك الآن مشاركة المقال مباشرة مع أصدقائك.',
      });
    }
  };

  const handleLike = async () => {
    if (!user) {
      setGuestModalAction('لتسجيل الإعجاب بالمقال ودعم الكاتب');
      setGuestModalOpen(true);
      return;
    }
    if (!article) return;

    try {
      const res = await articlesService.likeArticle(article.id);
      setArticle((prev) =>
        prev ? { ...prev, isLiked: res.isLiked, likesCount: res.likesCount } : null
      );
    } catch (err: any) {
      toast({
        title: 'تعذر تسجيل الإعجاب',
        description: err?.message || 'يرجى المحاولة مجدداً',
        variant: 'destructive',
      });
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      setGuestModalAction('لحفظ هذا المقال في قائمتك المفضلة للرجوع إليه لاحقاً');
      setGuestModalOpen(true);
      return;
    }
    if (!article) return;

    try {
      const res = await articlesService.bookmarkArticle(article.id);
      setArticle((prev) =>
        prev ? { ...prev, isBookmarked: res.isBookmarked } : null
      );
      toast({
        title: res.isBookmarked ? 'تم حفظ المقال' : 'تمت إزالة المقال من المحفوظات',
      });
    } catch (err: any) {
      toast({
        title: 'تعذر حفظ المقال',
        description: err?.message || 'يرجى المحاولة مجدداً',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (parentId?: string | null) => {
    if (!user) {
      setGuestModalAction('للمشاركة في مناقشة المقال وإضافة رد');
      setGuestModalOpen(true);
      return;
    }
    if (!article) return;

    const text = parentId ? replyText.trim() : newCommentText.trim();
    if (!text) return;

    setSubmittingComment(true);
    try {
      const res = await articlesService.addComment(article.id, text, parentId);
      if (res.success && res.comment) {
        setComments((prev) => [...prev, res.comment!]);
        setArticle((prev) =>
          prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null
        );
        if (parentId) {
          setReplyingToId(null);
          setReplyText('');
        } else {
          setNewCommentText('');
        }
        toast({
          title: 'تمت إضافة مشاركتك بنجاح',
          description: 'تم نشر تعليقك بنجاح.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'تعذر إضافة الرد',
        description: err?.message || 'يرجى المحاولة لاحقاً',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const fontClasses = {
    normal: 'text-base sm:text-lg leading-[2.1]',
    large: 'text-lg sm:text-xl leading-[2.3]',
    xlarge: 'text-xl sm:text-2xl leading-[2.5]',
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 rtl">
        <div className="h-6 w-32 bg-muted/60 rounded-lg animate-pulse" />
        <div className="h-12 w-3/4 bg-muted/60 rounded-xl animate-pulse" />
        <div className="h-64 w-full bg-muted/40 rounded-2xl animate-pulse" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (notFound || !article) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 text-center bg-card border border-border rounded-3xl shadow-sm space-y-5 rtl">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">المقال غير متوفر</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            المقال الذي تحاول قراءته غير موجود أو ربما تم حذفه من قِبل الكاتب.
          </p>
        </div>
        <Button onClick={handleBack} className="font-bold gap-2 cursor-pointer">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المقالات
        </Button>
      </div>
    );
  }

  const commentTree = buildArticleCommentTree(comments);

  return (
    <div className={`min-h-screen bg-background rtl transition-all duration-300 ${isZenMode ? 'zen-reading-mode' : ''}`}>
      {/* 1. Sticky Top Reading Progress Bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-1 bg-muted/50">
        <div
          className="h-full bg-primary transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Sticky Floating Reading Action Header */}
      <div className="sticky top-1 z-40 bg-background/90 backdrop-blur-md border-b border-border/70 py-3 px-4 sm:px-8 flex items-center justify-between transition-all">
        {/* Back link & Category */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden sm:inline">العودة للمقالات</span>
          </Button>

          <span className="text-border hidden sm:inline">|</span>

          <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5">
            {article.category}
          </Badge>

          <span className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {article.readTimeMinutes} دقائق قراءة
          </span>
        </div>

        {/* Reader Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Adjuster */}
          <div className="flex items-center bg-muted/60 rounded-xl p-0.5 border border-border/70 text-xs font-bold text-muted-foreground">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                fontSize === 'normal' ? 'bg-background text-foreground shadow-2xs font-black' : 'hover:text-foreground'
              }`}
              title="خط عادي"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                fontSize === 'large' ? 'bg-background text-foreground shadow-2xs font-black' : 'hover:text-foreground'
              }`}
              title="خط مريح"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                fontSize === 'xlarge' ? 'bg-background text-foreground shadow-2xs font-black' : 'hover:text-foreground'
              }`}
              title="خط كبير"
            >
              A+
            </button>
          </div>

          {/* Zen Focus Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsZenMode(!isZenMode)}
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            title={isZenMode ? 'الخروج من وضع التركيز' : 'وضع القراءة المركزة (Zen Mode)'}
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            title="مشاركة المقال"
          >
            <Share2 className="w-4 h-4" />
          </Button>

          {/* Like */}
          <Button
            variant={article.isLiked ? 'default' : 'ghost'}
            size="sm"
            onClick={handleLike}
            className={`gap-1.5 h-8 px-3 rounded-xl cursor-pointer ${
              article.isLiked ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-muted-foreground hover:text-red-500'
            }`}
            title="إعجاب"
          >
            <Heart className={`w-4 h-4 ${article.isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">{article.likesCount}</span>
          </Button>

          {/* Bookmark */}
          <Button
            variant={article.isBookmarked ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleBookmark}
            className="h-8 w-8 p-0 rounded-xl cursor-pointer"
            title="حفظ المقال"
          >
            <Bookmark className={`w-4 h-4 ${article.isBookmarked ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      </div>

      {/* 3. Main Full Screen Article View Container */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Moderation Status Banner for Author / Admin */}
        {article.status && article.status !== 'approved' && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-start ${
              article.status === 'pending'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : article.status === 'needs_revision'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-900 dark:text-orange-200'
                : 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {article.status === 'pending'
                      ? 'هذا المقال قيد المراجعة والتدقيق التحريري'
                      : article.status === 'needs_revision'
                      ? 'مطلوب تعديل نقاط محددة في المقال قبل النشر'
                      : 'تم رفض نشر هذا المقال'}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {article.status === 'pending' ? 'بانتظار الإدارة' : article.status === 'needs_revision' ? 'بانتظار تعديلك' : 'مرفوض'}
                  </Badge>
                </div>
                {article.adminNotes && (
                  <p className="text-xs leading-relaxed opacity-90 bg-background/50 p-2.5 rounded-lg border border-border/40 font-medium">
                    <span className="font-bold">ملاحظات الإدارة: </span>
                    {article.adminNotes}
                  </p>
                )}
                {article.status === 'pending' && (
                  <p className="text-[11px] opacity-80">
                    تم إرسال مقالك إلى لوحة الإدارة لمراجعته، ولن يظهر لعموم الزوار حتى تتم الموافقة عليه.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Article Meta & Title Header */}
        <header className="space-y-6 text-start">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>نُشر {article.timestamp}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.viewsCount} قراءة
            </span>
            <span>•</span>
            <span className="font-mono">{article.charCount.toLocaleString('ar-EG')} حرفاً</span>
            <span>•</span>
            <span>{article.wordCount.toLocaleString('ar-EG')} كلمة</span>
            <span>•</span>
            <Badge variant="secondary" className="text-[11px] font-semibold">
              {article.category}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.25]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed border-s-4 border-primary/50 ps-4 py-1">
              {article.summary}
            </p>
          )}

          {/* Author Card Header */}
          <div className="pt-4 flex items-center justify-between border-t border-border/70">
            <div className="flex items-center gap-3.5">
              {article.author?.avatar ? (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-12 h-12 rounded-full object-cover border border-border shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-base shadow-xs">
                  {(article.author?.name || 'س')[0]}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-foreground">
                    {article.author?.name}
                  </span>
                  {article.author?.verified && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  @{article.author?.username} • {article.author?.role || 'كاتب في سرد'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="rounded-3xl overflow-hidden shadow-xl border border-border/80 max-h-[460px]">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Full Prose Content (Rich Markdown with Headings, Bold, Lists, Code) */}
        <div className={`font-sans ${fontClasses[fontSize]}`}>
          <ArticleMarkdown content={article.content} />
        </div>

        {/* Tags cloud */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-8 border-t border-border/70 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">الوسوم:</span>
            {article.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-3 py-1 font-mono rounded-lg">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Author Bio Banner & Social Appreciation */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4 text-start">
            <div className="w-14 h-14 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center text-lg shrink-0">
              {(article.author?.name || 'س')[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-foreground">
                  بقلم: {article.author?.name}
                </h3>
                {article.author?.verified && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                {article.author?.bio || 'كاتب ومطور في مجتمع سرد التقني.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handleLike}
              className={`font-bold gap-2 cursor-pointer shadow-sm ${
                article.isLiked ? 'bg-red-600 hover:bg-red-700 text-white' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${article.isLiked ? 'fill-current' : ''}`} />
              <span>{article.isLiked ? 'أعجبك المقال' : 'أعجبني المقال'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              مشاركة
            </Button>
          </div>
        </div>

        {/* Discussion & Threaded Comments Section */}
        <section className="pt-10 border-t border-border/80 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                التعليقات والمناقشة ({comments.length})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              شارك برأيك أو استفسارك
            </span>
          </div>

          {/* New Comment Composer */}
          {user ? (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-2xs">
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="اكتب تعليقك أو استفسارك هنا..."
                className="resize-none min-h-[100px] text-sm bg-muted/40 border-border/60 focus-visible:ring-primary/40 rounded-xl"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  اكتب بتفصيل ووضوح لإفادة القراء
                </span>
                <Button
                  size="sm"
                  disabled={!newCommentText.trim() || submittingComment}
                  onClick={() => handleAddComment(null)}
                  className="gap-2 font-bold cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  إرسال الرد
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/40 border border-dashed border-border/80 rounded-2xl p-6 text-center space-y-3">
              <Sparkles className="w-7 h-7 text-primary mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  سجل دخولك للمشاركة في التعليقات
                </h4>
                <p className="text-xs text-muted-foreground">
                  تصفح وقراءة المقالات متاح للجميع مجاناً، ولإضافة تعليق يرجى تسجيل الدخول.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setGuestModalAction('للمشاركة في مناقشة المقال');
                  setGuestModalOpen(true);
                }}
                className="gap-2 font-bold cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول / حساب جديد
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4 pt-2">
            {isLoadingComments ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                جارٍ تحميل النقاشات...
              </div>
            ) : commentTree.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border/60">
                لا توجد تعليقات بعد. كن أول من يشارك برأيه.
              </div>
            ) : (
              commentTree.map((root) => (
                <div key={root.id} className="space-y-3 bg-card border border-border/70 rounded-2xl p-5 shadow-2xs">
                  {/* Root Comment Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {root.author?.avatar ? (
                        <img
                          src={root.author.avatar}
                          alt={root.author.name}
                          className="w-8 h-8 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                          {(root.author?.name || 'س')[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {root.author?.name}
                          </span>
                          {root.author?.verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          {root.timestamp || 'مؤخراً'}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!user) {
                          setGuestModalAction('للرد على هذا التعليق');
                          setGuestModalOpen(true);
                          return;
                        }
                        setReplyingToId(root.id);
                        setReplyText('');
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                    >
                      <CornerDownLeft className="w-3 h-3" />
                      <span>رد</span>
                    </Button>
                  </div>

                  {/* Comment Body */}
                  <p className="text-sm text-foreground/90 leading-relaxed ps-2 border-s-2 border-primary/20">
                    {root.content}
                  </p>

                  {/* Inline Reply Box */}
                  {replyingToId === root.id && (
                    <div className="mt-3 pt-3 border-t border-border/60 space-y-2 ps-3">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`الرد على ${root.author?.name}...`}
                        className="text-xs min-h-[70px] bg-background border-border/80 rounded-xl"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingToId(null)}
                          className="h-7 text-xs cursor-pointer"
                        >
                          إلغاء
                        </Button>
                        <Button
                          size="sm"
                          disabled={!replyText.trim() || submittingComment}
                          onClick={() => handleAddComment(root.id)}
                          className="h-7 text-xs font-bold gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          إرسال الرد
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {root.replies && root.replies.length > 0 && (
                    <div className="mt-4 ps-4 border-s-2 border-primary/30 space-y-3">
                      {root.replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/30 border border-border/50 rounded-xl p-3.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            {reply.author?.avatar ? (
                              <img
                                src={reply.author.avatar}
                                alt={reply.author.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                                {(reply.author?.name || 'س')[0]}
                              </div>
                            )}
                            <span className="text-xs font-bold text-foreground">
                              {reply.author?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {reply.timestamp || 'مؤخراً'}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 leading-relaxed ps-1">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </article>

      {/* Guest Auth Prompt Modal */}
      <GuestAuthModal
        open={guestModalOpen}
        onOpenChange={setGuestModalOpen}
        actionText={guestModalAction}
      />
    </div>
  );
}
