import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { postsService, Post, Comment } from '@/services/postsService';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ShareModal from '@/components/share/ShareModal';
import { tokenStorage, api } from '@/lib/api';
import UserProfileModal, { UserProfileData } from '@/components/profile/UserProfileModal';

// Modular Feed Components
import { TRENDS, SuggestedUser } from '@/components/feed/types';
import FeedBanner from '@/components/feed/FeedBanner';
import FeedComposer from '@/components/feed/FeedComposer';
import FeedTabs from '@/components/feed/FeedTabs';
import PostCard from '@/components/feed/PostCard';
import FeedSidebar from '@/components/feed/FeedSidebar';

export default function Feed() {
  const { toast } = useToast();
  const { user } = useAuth();
  const currentAuthorName = user?.name || 'مستخدم سرد';

  // Feed & Tab states
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following' | 'trending'>('forYou');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Modals state
  const [activeSharePost, setActiveSharePost] = useState<Post | null>(null);
  const [profileModalUser, setProfileModalUser] = useState<{
    id?: string;
    username?: string;
    initialUser?: Partial<UserProfileData>;
  } | null>(null);

  // Active replies drawer & comments map
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});

  // Followed & suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Bookmarks & Highlighting
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

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

  // Fetch real suggestions from SQLite
  useEffect(() => {
    const activeToken = tokenStorage.get() || localStorage.getItem('sard_auth_token') || localStorage.getItem('sard_token') || '';
    fetch('/api/users/suggestions', {
      headers: {
        'Authorization': activeToken ? `Bearer ${activeToken}` : '',
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

  // Load and continuously sync posts across devices
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

  // Deep-linking to a specific post via ?post=postId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetPostId = params.get('post');
    if (!targetPostId) return;

    setSelectedTagFilter(null);
    setActiveTab('forYou');
    setExpandedPostId(targetPostId);

    postsService.getComments(targetPostId).then((fetched) => {
      setCommentsMap((prev) => ({ ...prev, [targetPostId]: fetched }));
    });

    setHighlightedPostId(targetPostId);

    const timer = setTimeout(() => {
      const el = document.getElementById(`post-${targetPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350);

    const unhighlightTimer = setTimeout(() => {
      setHighlightedPostId(null);
    }, 4500);

    return () => {
      clearTimeout(timer);
      clearTimeout(unhighlightTimer);
    };
  }, [posts.length]);

  // Comments toggle
  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);
    const fetched = await postsService.getComments(postId);
    setCommentsMap((prev) => ({ ...prev, [postId]: fetched }));
  };

  // Publish new sard
  const handlePublishSard = async (content: string): Promise<boolean> => {
    try {
      const newPost = await postsService.createPost({ content });
      setPosts((prev) => [newPost, ...prev]);
      toast({
        title: 'تم نشر السردة في المجتمع العام! 🚀',
        description: 'سردتك متاحة الآن في ساحة النقاش للجميع.',
      });
      return true;
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر نشر السردة، يرجى المحاولة ثانية.',
      });
      return false;
    }
  };

  // Submit reply to a post or comment
  const handleSendReply = async (postId: string, text: string, parentCommentId?: string) => {
    try {
      const comment = await postsService.addComment(postId, text, parentCommentId);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
      );
      toast({
        title: parentCommentId ? 'تم إرسال الرد على التعليق بنجاح' : 'تم إرسال الرد بنجاح',
        description: 'ردك مضاف الآن إلى سلسلة الحوار.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر إرسال الرد.',
      });
    }
  };

  // Toggle Like with optimistic update
  const handleToggleLike = async (postId: string) => {
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

  // Toggle Follow
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

  // Report post
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

  // Delete post
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

  // Filter posts based on active tab and selected tag
  let displayPosts = posts;
  if (selectedTagFilter) {
    displayPosts = displayPosts.filter((p) => p.tags && p.tags.includes(selectedTagFilter));
  } else if (activeTab === 'following') {
    displayPosts = displayPosts.filter((p) => Boolean(followingMap[p.author.id] || followingMap[p.author.username]));
  } else if (activeTab === 'trending') {
    displayPosts = [...displayPosts].sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
  }

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-5 pb-24 lg:pb-6 w-full min-w-0 overflow-x-hidden" dir="rtl">
      {/* Top Banner */}
      <FeedBanner />

      <div className="grid lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-4 w-full min-w-0">
          {/* Twitter Composer */}
          <FeedComposer
            currentAuthorName={currentAuthorName}
            onPublishPost={handlePublishSard}
          />

          {/* Navigation Tabs & Filter */}
          <FeedTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedTagFilter={selectedTagFilter}
            onClearTagFilter={() => setSelectedTagFilter(null)}
          />

          {/* Posts Feed */}
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
              displayPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isHighlighted={highlightedPostId === post.id}
                  isBookmarked={Boolean(bookmarkedMap[post.id])}
                  isCommentsOpen={expandedPostId === post.id}
                  comments={commentsMap[post.id] || []}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                  currentUserName={user?.name}
                  onToggleLike={handleToggleLike}
                  onToggleBookmark={handleToggleBookmark}
                  onToggleComments={handleToggleComments}
                  onShare={(p) => setActiveSharePost(p)}
                  onReport={handleReportPost}
                  onDelete={handleDeletePost}
                  onOpenUserProfile={handleOpenUserProfile}
                  onTagClick={setSelectedTagFilter}
                  onSendReply={handleSendReply}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <FeedSidebar
          trends={TRENDS}
          suggestedUsers={suggestedUsers}
          followingMap={followingMap}
          onSelectTag={setSelectedTagFilter}
          onToggleFollow={handleToggleFollow}
          onOpenUserProfile={handleOpenUserProfile}
        />
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
