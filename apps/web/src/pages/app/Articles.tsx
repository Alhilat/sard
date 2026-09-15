import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Article, articlesService } from '@/services/articlesService';
import ArticleCard from '@/components/articles/ArticleCard';
import ArticleComposerModal from '@/components/articles/ArticleComposerModal';
import GuestAuthModal from '@/components/articles/GuestAuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen, Plus, Search, Sparkles, Filter, Newspaper,
  TrendingUp, RefreshCw
} from 'lucide-react';

export default function ArticlesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [composerOpen, setComposerOpen] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestModalAction, setGuestModalAction] = useState('للتفاعل مع المقالات وكتابة محتوى جديد');

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const serverCats = await articlesService.getCategories();
      if (serverCats && serverCats.length > 0) {
        setCategories(serverCats);
      }
    } catch (err) {
      console.error('Failed to load article categories:', err);
    }
  }, []);

  // Load articles
  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await articlesService.getArticles({
        category: selectedCategory,
        search: searchQuery,
      });
      setArticles(res.articles || []);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // If URL has ?article= query param, redirect to full screen article page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleParam = params.get('article');
    if (articleParam) {
      const isApp = location.startsWith('/app');
      navigate(`${isApp ? '/app/articles' : '/articles'}/${articleParam}`);
    }
  }, [location, navigate]);

  // Navigate to full screen reading page
  const handleOpenReader = (art: Article) => {
    const isApp = location.startsWith('/app');
    navigate(`${isApp ? '/app/articles' : '/articles'}/${art.slug || art.id}`);
  };

  const handleRequireAuth = (actionText: string) => {
    setGuestModalAction(actionText);
    setGuestModalOpen(true);
  };

  const handleWriteClick = () => {
    if (!user) {
      handleRequireAuth('لكتابة ونشر مقال معمق في المنصة');
      return;
    }
    navigate('/articles/editor');
  };

  const handleLike = async (art: Article) => {
    if (!user) {
      handleRequireAuth('لتسجيل الإعجاب بالمقال ودعم الكاتب');
      return;
    }
    try {
      const res = await articlesService.likeArticle(art.id);
      setArticles((prev) =>
        prev.map((a) =>
          a.id === art.id
            ? { ...a, isLiked: res.isLiked, likesCount: res.likesCount }
            : a
        )
      );
    } catch (err: any) {
      toast({
        title: 'تعذر تسجيل الإعجاب',
        description: err?.message || 'يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    }
  };

  const handleBookmark = async (art: Article) => {
    if (!user) {
      handleRequireAuth('لحفظ المقال في قائمتك المفضلة للرجوع إليه لاحقاً');
      return;
    }
    try {
      const res = await articlesService.bookmarkArticle(art.id);
      setArticles((prev) =>
        prev.map((a) =>
          a.id === art.id ? { ...a, isBookmarked: res.isBookmarked } : a
        )
      );
      toast({
        title: res.isBookmarked ? 'تم حفظ المقال' : 'تمت إزالة المقال من المحفوظات',
        description: res.isBookmarked ? 'يمكنك الرجوع للمقال لاحقاً في أي وقت.' : '',
      });
    } catch (err: any) {
      toast({
        title: 'تعذر حفظ المقال',
        description: err?.message || 'يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 rtl">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/90 to-primary/10 border border-border/80 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3.5 text-start">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
            <Newspaper className="w-3.5 h-3.5" />
            <span>مقالات المجتمع</span>
            <span className="opacity-40">•</span>
            <span>الحد الأدنى 500 حرف</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
            المقالات والتجارب التقنية
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            مقالات وأدلة عملية يكتبها مطورون ومصممون وصناع محتوى في البرمجة، الواجهات، وتطوير المنتجات.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleWriteClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              كتابة مقال جديد
            </Button>

            {!user && (
              <Button
                variant="outline"
                onClick={() => navigate('/auth/login')}
                className="text-xs font-semibold cursor-pointer"
              >
                تسجيل الدخول
              </Button>
            )}
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute top-0 end-0 -translate-y-12 translate-x-12 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Filter and Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في عناوين ومحتوى المقالات..."
              className="ps-9 pe-8 text-xs bg-card border-border/70 focus-visible:ring-primary/40 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 cursor-pointer"
                title="مسح البحث"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadArticles}
            disabled={isLoading}
            className="text-xs text-muted-foreground gap-1.5 self-end sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {(() => {
            const dynamicCategories = Array.from(
              new Set([...categories, ...articles.map((a) => a.category).filter(Boolean)])
            );
            const allPills = [
              { id: 'all', label: 'جميع المقالات' },
              ...dynamicCategories.map((c) => ({ id: c, label: c })),
            ];

            return allPills.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                      : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/70'
                  }`}
                >
                  {cat.label}
                </button>
              );
            });
          })()}
        </div>
      </section>

      {/* Articles Grid */}
      <main className="min-h-[300px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-muted/40 rounded-2xl animate-pulse border border-border/60"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-card border border-border/80 rounded-2xl p-8">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                لا توجد مقالات في هذا القسم حالياً
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                كن أول من يثري هذا التصنيف بمقال مفصل وتجربة تقنية غنية.
              </p>
            </div>
            <Button
              onClick={handleWriteClick}
              size="sm"
              className="font-bold gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              كتابة مقال
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onRead={handleOpenReader}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onEdit={(art) => navigate(`/articles/editor?id=${art.id}`)}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Article Composer Modal */}
      <ArticleComposerModal
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onArticleCreated={() => {
          loadArticles();
          loadCategories();
        }}
      />

      {/* Guest Auth Modal */}
      <GuestAuthModal
        open={guestModalOpen}
        onOpenChange={setGuestModalOpen}
        actionText={guestModalAction}
      />
    </div>
  );
}
