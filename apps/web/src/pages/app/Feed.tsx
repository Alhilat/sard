import React, { useState, useEffect } from 'react';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Image as ImageIcon,
  Smile, Send, Sparkles, CheckCircle2, TrendingUp, Users, Hash,
  BarChart2, X, Globe, Pin, CornerDownLeft, Repeat2, Flame, Award
} from 'lucide-react';
import { postsService, Post, Comment } from '@/services/postsService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ShareModal from '@/components/share/ShareModal';
import { tokenStorage, api } from '@/lib/api';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Flag, Trash2, Copy } from 'lucide-react';
import UserProfileModal, { UserProfileData } from '@/components/profile/UserProfileModal';

const MAX_CHARS = 280;

const TRENDS = [
  { id: 't1', tag: 'سرد_رقمي', category: 'المجتمع والتقنية' },
  { id: 't2', tag: 'الذكاء_الاصطناعي', category: 'تقنيات المستقبل' },
  { id: 't3', tag: 'تطوير_البرمجيات', category: 'علوم الحاسب والبرمجة' },
  { id: 't4', tag: 'رؤية_السعودية', category: 'اقتصاد ومبادرات' },
  { id: 't5', tag: 'عمل_تطوعي', category: 'مبادرات مجتمعية' },
];

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  role?: string;
  isFollowing?: boolean;
}

export default function Feed() {
  const { toast } = useToast();
  const { user } = useAuth();
  const currentAuthorName = user?.name || 'مستخدم سرد';
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following' | 'trending'>('forYou');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Tweet composer state
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');

  // Repost modal
  const [activeSharePost, setActiveSharePost] = useState<Post | null>(null);

  // User profile modal
  const [profileModalUser, setProfileModalUser] = useState<{
    id?: string;
    username?: string;
    initialUser?: Partial<UserProfileData>;
  } | null>(null);

  const handleOpenUserProfile = (target: {
    id?: string;
    name: string;
    username?: string;
    avatar?: string;
    role?: string;
    verified?: boolean;
  }) => {
    setProfileModalUser({
      id: target.id,
      username: target.username,
      initialUser: {
        id: target.id,
        name: target.name,
        username: target.username,
        avatar: target.avatar,
        role: target.role,
        verified: target.verified,
      },
    });
  };

  // Active replies drawer
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Real Followed users and dynamic suggestions state
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Bookmarks
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

  // Fetch real suggestions from SQLite
  useEffect(() => {
    fetch('/api/users/suggestions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sard_token') || ''}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.users;
        if (Array.isArray(list)) {
          setSuggestedUsers(list);
          const map: Record<string, boolean> = {};
          list.forEach((u: SuggestedUser) => {
            if (u.isFollowing) map[u.id] = true;
          });
          setFollowingMap(map);
        }
      })
      .catch(() => {});
  }, []);

  // Load and continuously sync posts across all connected devices in real time
  useEffect(() => {
    const fetchLatestFeed = () => {
      postsService.getFeed().then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        }
      });
    };

    fetchLatestFeed();
    const syncInterval = setInterval(fetchLatestFeed, 3500);
    return () => clearInterval(syncInterval);
  }, []);

  // When expanding comments for a post
  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);
    const fetched = await postsService.getComments(postId);
    setCommentsMap((prev) => ({ ...prev, [postId]: fetched }));
  };

  // Submit new tweet / sard
  const handlePublishSard = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsPosting(true);
    try {
      const newPost = await postsService.createPost({
        content: trimmed,
      });

      setPosts((prev) => [newPost, ...prev]);
      setContent('');
      setShowPoll(false);
      setPollOption1('');
      setPollOption2('');

      toast({
        title: 'تم نشر السردة في المجتمع العام! 🚀',
        description: 'سردتك متاحة الآن في ساحة النقاش للجميع.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر نشر السردة، يرجى المحاولة ثانية.',
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Submit a reply to a post
  const handleSendReply = async (postId: string) => {
    const text = (replyInputMap[postId] || '').trim();
    if (!text) return;

    setIsSubmittingReply(true);
    try {
      const comment = await postsService.addComment(postId, text);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [comment, ...(prev[postId] || [])],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
      );
      setReplyInputMap((prev) => ({ ...prev, [postId]: '' }));

      toast({
        title: 'تم إرسال الرد بنجاح',
        description: 'ردك مضاف الآن إلى سلسلة الحوار.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر إرسال الرد.',
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Toggle Like on post
  const handleToggleLike = async (postId: string) => {
    // Optimistic toggle
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const next = !p.isLiked;
          return {
            ...p,
            isLiked: next,
            likes: next ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );

    const result = await postsService.likePost(postId);
    if (result && typeof result.liked === 'boolean') {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: result.liked, likes: result.likes }
            : p
        )
      );
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = (postId: string) => {
    const next = !bookmarkedMap[postId];
    setBookmarkedMap((prev) => ({ ...prev, [postId]: next }));
    toast({
      title: next ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة',
      description: next ? 'يمكنك الرجوع إلى هذه السردة في أي وقت.' : 'تم حذف السردة من عناصرك المحفوظة.',
    });
  };

  // Toggle Follow (persisted in SQLite)
  const handleToggleFollow = async (userId: string, name: string) => {
    try {
      const token = tokenStorage.get() || localStorage.getItem('sard_token') || '';
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      const isNowFollowing = Boolean(data?.following);
      setFollowingMap((prev) => ({ ...prev, [userId]: isNowFollowing }));
      toast({
        title: isNowFollowing ? `بدأت متابعة ${name}` : `تم إلغاء متابعة ${name}`,
        description: isNowFollowing ? 'ستصلك سردات هذا الحساب في تبويب المتابعين.' : '',
      });
    } catch {
      const next = !followingMap[userId];
      setFollowingMap((prev) => ({ ...prev, [userId]: next }));
    }
  };

  const handleReportPost = async (postId: string) => {
    try {
      await api.post('/reports', {
        target_type: 'post',
        target_id: postId,
        reason: 'محتوى غير لائق أو مخالف لمعايير المجتمع',
      });
      toast({
        title: 'تم إرسال البلاغ بنجاح 🚨',
        description: 'شكراً لمساعدتنا في الحفاظ على مجتمع سرد آمناً ومحترماً.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال البلاغ',
        description: 'حدث خطأ أثناء محاولة إرسال البلاغ.',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنشور؟')) return;
    const res = await postsService.deletePost(postId);
    if (res.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: 'تم حذف المنشور 🗑️',
        description: 'تمت إزالة المنشور بنجاح.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف المنشور',
        description: res.message || 'غير مصرح لك بحذف هذا المنشور.',
      });
    }
  };

  // Character calculation
  const charsLeft = MAX_CHARS - content.length;
  const charPercent = Math.min(100, (content.length / MAX_CHARS) * 100);

  // Filter posts
  let displayPosts = posts;
  if (selectedTagFilter) {
    displayPosts = displayPosts.filter((p) => p.tags && p.tags.includes(selectedTagFilter));
  } else if (activeTab === 'following') {
    displayPosts = displayPosts.filter((p) => Boolean(followingMap[p.author.id] || followingMap[p.author.username]));
  } else if (activeTab === 'trending') {
    displayPosts = [...displayPosts].sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
  }

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-5" dir="rtl">
      {/* Top Banner: Introducing Sard */}
      <div className="bg-gradient-to-r from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E] text-white p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0 text-xs font-bold gap-1 px-2.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                المجتمع العام المفتوح
              </Badge>
              <span className="text-xs text-white/80">· شبكة السرد الرقمي الكبرى</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              ساحة «سرد»
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              الفضاء العام لجميع رواد المنصة: اسرد أفكارك، شارك في النقاشات الحية، تابع أبرز المؤثرين والمواضيع الرائجة لحظة بلحظة.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-white/15 text-xs">
            <Flame className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-bold text-white">النقاشات الحية</p>
              <p className="text-[11px] text-white/70">مفتوحة للجميع دون قيود</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed Column (Twitter Style) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Twitter Composer (صندوق السرد) */}
          <Card className="border-card-border shadow-xs bg-card overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handlePublishSard} className="space-y-3">
                <div className="flex items-start gap-3">
                  {/* Current user monogram avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                    {currentAuthorName.slice(0, 1) || 'س'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Textarea
                      placeholder="ماذا يدور في ذهنك؟ اسرد فكرتك للعالم..."
                      value={content}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_CHARS) {
                          setContent(e.target.value);
                        }
                      }}
                      className="resize-none border-0 bg-transparent text-sm sm:text-base focus-visible:ring-0 min-h-[95px] p-0 placeholder:text-muted-foreground/70 leading-relaxed"
                    />

                    {/* Quick hashtag suggestions */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                      <span className="text-muted-foreground shrink-0 font-medium">وسوم مقترحة:</span>
                      {['#سرد_رقمي', '#الذكاء_الاصطناعي', '#ريادة_الأعمال', '#تطوير_البرمجيات'].map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => setContent((prev) => (prev ? `${prev} ${tag}` : tag))}
                          className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground whitespace-nowrap"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* Poll Simulator */}
                    {showPoll && (
                      <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 animate-in fade-in-50 duration-150">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                          <span className="flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5 text-primary" />
                            استطلاع رأي
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPoll(false)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Input
                          placeholder="الخيار الأول (مثال: نعم)"
                          value={pollOption1}
                          onChange={(e) => setPollOption1(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                        <Input
                          placeholder="الخيار الثاني (مثال: لا)"
                          value={pollOption2}
                          onChange={(e) => setPollOption2(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Composer Toolbar & Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1 text-primary">
                    <button
                      type="button"
                      onClick={() => setShowPoll(!showPoll)}
                      title="إضافة استطلاع رأي"
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setContent((prev) => `${prev} ✨`)}
                      title="إضافة رموز تعبيرية"
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Character Countdown Progress Ring */}
                    {content.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            charsLeft < 20 ? 'text-destructive' : 'text-muted-foreground'
                          }`}
                        >
                          {charsLeft}
                        </span>
                        <div className="w-5 h-5 rounded-full border-2 border-border relative flex items-center justify-center">
                          <div
                            className={`w-3.5 h-3.5 rounded-full ${
                              charPercent > 90
                                ? 'bg-destructive'
                                : charPercent > 70
                                ? 'bg-amber-500'
                                : 'bg-primary'
                            }`}
                            style={{ opacity: charPercent / 100 }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isPosting || !content.trim()}
                      className="gap-2 font-bold px-5 h-9 shadow-xs rounded-xl"
                    >
                      <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                      <span>{isPosting ? 'جاري السرد...' : 'اسرد الآن'}</span>
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Active Tag Filter Indicator */}
          {selectedTagFilter && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-primary">
                <Hash className="w-4 h-4" />
                تصفية حسب الوسم: #{selectedTagFilter}
              </span>
              <button
                type="button"
                onClick={() => setSelectedTagFilter(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                عرض جميع السردات
              </button>
            </div>
          )}

          {/* Twitter Style Sticky Navigation Tabs */}
          <div className="flex border-b border-border/80 bg-card/60 backdrop-blur-xs rounded-xl overflow-hidden p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('forYou');
                setSelectedTagFilter(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all rounded-lg cursor-pointer ${
                activeTab === 'forYou' && !selectedTagFilter
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              لك (المقترحة)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('following');
                setSelectedTagFilter(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all rounded-lg cursor-pointer ${
                activeTab === 'following' && !selectedTagFilter
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              المتابعون
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('trending');
                setSelectedTagFilter(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all rounded-lg cursor-pointer ${
                activeTab === 'trending' && !selectedTagFilter
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              الرائجة والأكثر تفاعلاً
            </button>
          </div>

          {/* Posts Feed (Twitter Cards) */}
          <div className="space-y-3.5">
            {displayPosts.length === 0 ? (
              <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3 bg-card">
                <Sparkles className="w-12 h-12 mx-auto opacity-30 text-primary" />
                <p className="font-bold text-foreground text-base">لا توجد سردات مطابقة حالياً</p>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  كن أول من يبدأ الحديث وينشر سردة ملهمة في هذا الموضوع!
                </p>
              </Card>
            ) : (
              displayPosts.map((post) => {
                const isBookmarked = bookmarkedMap[post.id];
                const isCommentsOpen = expandedPostId === post.id;
                const postComments = commentsMap[post.id] || [];

                return (
                  <Card
                    key={post.id}
                    className="border-card-border/80 shadow-xs hover:border-primary/40 transition-all bg-card/90 overflow-hidden"
                  >
                    <CardContent className="p-4 sm:p-5">
                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenUserProfile(post.author)}
                            className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0 hover:scale-105 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs"
                            title={`عرض الملف الشخصي لـ ${post.author.name}`}
                          >
                            {post.author.name.slice(0, 1)}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleOpenUserProfile(post.author)}
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
                              <span>{post.timestamp}</span>
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
                                navigator.clipboard?.writeText(window.location.origin + '/app/feed');
                                toast({ title: 'تم نسخ الرابط! 📋', description: 'تم نسخ رابط المنشور إلى الحافظة.' });
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              نسخ رابط المنشور
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                              onClick={() => handleReportPost(post.id)}
                            >
                              <Flag className="w-3.5 h-3.5" />
                              إبلاغ عن محتوى
                            </DropdownMenuItem>
                            {(user?.id === post.author?.id || user?.role === 'admin' || user?.role === 'org') && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs text-destructive"
                                onClick={() => handleDeletePost(post.id)}
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
                                  setSelectedTagFilter(rawTag);
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

                      {/* Twitter Action Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/60 text-muted-foreground">
                        <div className="flex items-center gap-4 sm:gap-6">
                          {/* Reply Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleComments(post.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                              isCommentsOpen ? 'text-primary' : 'hover:text-primary'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments > 0 ? `${post.comments} ردود` : 'رد'}</span>
                          </button>

                          {/* Repost / Share Button */}
                          <button
                            type="button"
                            onClick={() => setActiveSharePost(post)}
                            className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            <Repeat2 className="w-4 h-4" />
                            <span>{post.shares > 0 ? `${post.shares} مشاركة` : 'مشاركة'}</span>
                          </button>

                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                              post.isLiked
                                ? 'text-red-600'
                                : 'hover:text-red-500'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform ${
                                post.isLiked ? 'fill-current text-red-600 scale-110' : ''
                              }`}
                            />
                            <span>{post.likes > 0 ? `${post.likes} إعجاب` : 'إعجاب'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Bookmark */}
                          <button
                            type="button"
                            onClick={() => handleToggleBookmark(post.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBookmarked ? 'text-primary bg-primary/10' : 'hover:bg-muted hover:text-foreground'
                            }`}
                            title={isBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-primary' : ''}`} />
                          </button>

                          {/* Share Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setActiveSharePost(post)}
                            className="p-1.5 rounded-lg hover:bg-muted hover:text-primary transition-colors cursor-pointer"
                            title="مشاركة الرابط"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Interactive Thread Replies Drawer (Twitter Style) */}
                      {isCommentsOpen && (
                        <div className="mt-4 pt-4 border-t border-border/80 space-y-3.5 animate-in fade-in-50 duration-200">
                          <div className="flex items-center justify-between text-xs font-bold text-foreground">
                            <span className="flex items-center gap-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-primary" />
                              الردود والحوارات ({postComments.length})
                            </span>
                          </div>

                          {/* Reply Input Form */}
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder={`أضف رداً على @${post.author.username}...`}
                              value={replyInputMap[post.id] || ''}
                              onChange={(e) =>
                                setReplyInputMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              className="text-xs sm:text-sm h-10 bg-background/80 border-border"
                              disabled={isSubmittingReply}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendReply(post.id);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSubmittingReply || !(replyInputMap[post.id] || '').trim()}
                              onClick={() => handleSendReply(post.id)}
                              className="h-10 px-4 font-bold shrink-0 gap-1.5 shadow-xs"
                            >
                              <CornerDownLeft className="w-3.5 h-3.5" />
                              <span>رد</span>
                            </Button>
                          </div>

                          {/* Threaded Replies List */}
                          <div className="space-y-2.5 pt-1">
                            {postComments.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                لا توجد ردود بعد. كن أول من يفتح باب النقاش!
                              </p>
                            ) : (
                              postComments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-1.5 relative ms-3"
                                >
                                  {/* Visual Thread Connector Line */}
                                  <div className="absolute top-0 -start-3 bottom-0 w-0.5 bg-border" />

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenUserProfile(comment.author)}
                                        className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
                                      >
                                        {comment.author.name}
                                      </button>
                                      {comment.author.verified && (
                                        <Badge className="h-3.5 px-1 text-[9px] bg-sky-500 text-white border-0">
                                          موثق
                                        </Badge>
                                      )}
                                      <span className="text-[10px] text-muted-foreground font-mono">
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
                );
              })
            )}
          </div>
        </div>

        {/* Twitter Sidebar Column */}
        <div className="space-y-5">
          {/* Trending in Sard (ترند سرد - ما يحدث الآن) */}
          <Card className="border-card-border p-5 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>المتداول في سرد (الترند)</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {TRENDS.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTagFilter(t.tag)}
                  className="group cursor-pointer flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{t.category}</p>
                    <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                      #{t.tag}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                    متداول
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Who to Follow (من نتابع في سرد) */}
          <Card className="border-card-border p-5 bg-card space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border/60 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>اقتراحات المتابعة</span>
            </h3>

            <div className="space-y-3">
              {suggestedUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 leading-relaxed">
                  لا توجد اقتراحات حالياً. عند انضمام أعضاء جدد ستظهر حساباتهم هنا تلقائياً.
                </p>
              ) : (
                suggestedUsers.map((u) => {
                  const isFollowing = !!followingMap[u.id];
                  return (
                    <div key={u.id} className="flex items-center justify-between gap-3">
                      <div
                        onClick={() => handleOpenUserProfile(u)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                        title={`عرض الملف الشخصي لـ ${u.name}`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          {u.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">{u.name}</p>
                            {u.verified && (
                              <CheckCircle2 className="w-3 h-3 text-sky-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">@{u.username}</p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isFollowing ? 'outline' : 'default'}
                        onClick={() => handleToggleFollow(u.id, u.name)}
                        className={`h-7 px-3 text-xs font-bold shadow-2xs ${
                          isFollowing
                            ? 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/40'
                            : ''
                        }`}
                      >
                        {isFollowing ? 'تتابع' : 'متابعة'}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Community Notice */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 text-xs text-muted-foreground space-y-2">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-primary" />
              <span>فضاء سرد المفتوح</span>
            </p>
            <p className="leading-relaxed text-[11px]">
              ساحة سرد مصممة كشبكة محتوى عامة تجمع جميع رواد المنصة. احرص على نشر المعرفة، ومشاركة الأفكار البنّاءة، واحترام التنوع الفكري.
            </p>
          </div>
        </div>
      </div>

      {/* Share / Repost Modal */}
      {activeSharePost && (
        <ShareModal
          isOpen={!!activeSharePost}
          onClose={() => setActiveSharePost(null)}
          post={{
            id: activeSharePost.id,
            content: activeSharePost.content,
            author: activeSharePost.author,
            shares: activeSharePost.shares,
          }}
          onShareSuccess={(newCount) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === activeSharePost.id ? { ...p, shares: newCount } : p))
            );
          }}
        />
      )}

      {/* User Profile Modal on Avatar / Author click */}
      <UserProfileModal
        isOpen={!!profileModalUser}
        onClose={() => setProfileModalUser(null)}
        userId={profileModalUser?.id}
        username={profileModalUser?.username}
        initialUser={profileModalUser?.initialUser}
      />
    </div>
  );
}
