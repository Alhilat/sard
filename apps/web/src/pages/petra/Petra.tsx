import React, { useState, useEffect } from 'react';
import {
  petraService, PetraStats, PetraUser, PetraPost, PetraComment, PetraGroup, PetraAuditLog, PetraArticle
} from '@/services/petraService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import PetraHeader from './components/PetraHeader';
import PetraNavigation, { PetraTab } from './components/PetraNavigation';
import PetraLogin from './components/PetraLogin';

import OverviewTab from './tabs/OverviewTab';
import UsersTab from './tabs/UsersTab';
import PostsTab from './tabs/PostsTab';
import ArticlesTab from './tabs/ArticlesTab';
import GroupsTab from './tabs/GroupsTab';
import AuditLogsTab from './tabs/AuditLogsTab';

import ConfirmActionModal from './modals/ConfirmActionModal';
import BanUserModal from './modals/BanUserModal';
import ArticleReviewModal from './modals/ArticleReviewModal';

export default function Petra() {
  const { toast } = useToast();
  const { user, token: platformToken } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => petraService.isLoggedIn());

  // Server & Environment status
  const [envStatus, setEnvStatus] = useState<{
    envConfigured: boolean;
    envUser: string;
    hasEnvPass: boolean;
    renderDetected: boolean;
  } | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<PetraTab>('overview');

  // Loaded collections
  const [stats, setStats] = useState<PetraStats | null>(null);
  const [users, setUsers] = useState<PetraUser[]>([]);
  const [posts, setPosts] = useState<PetraPost[]>([]);
  const [comments, setComments] = useState<PetraComment[]>([]);
  const [articles, setArticles] = useState<PetraArticle[]>([]);
  const [groups, setGroups] = useState<PetraGroup[]>([]);
  const [logs, setLogs] = useState<PetraAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [banTargetUser, setBanTargetUser] = useState<PetraUser | null>(null);
  const [isBanning, setIsBanning] = useState(false);

  const [reviewModalArticle, setReviewModalArticle] = useState<PetraArticle | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'تأكيد',
    isDestructive: false,
    onConfirm: () => {},
  });

  // Query environment status from backend on mount
  useEffect(() => {
    petraService.getConfigStatus().then((status) => {
      if (status) setEnvStatus(status);
    });

    if (petraService.isLoggedIn()) {
      petraService.verifySession().then((isValid) => {
        if (!isValid) setIsAuthenticated(false);
      });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Listen to 401 unauthorized session events
  useEffect(() => {
    const handleUnauth = () => {
      setIsAuthenticated(false);
      toast({
        title: 'انتهت الجلسة الأمنية',
        description: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً إلى بوابة بترا.',
        variant: 'destructive',
      });
    };
    window.addEventListener('petra:unauthorized', handleUnauth);
    return () => window.removeEventListener('petra:unauthorized', handleUnauth);
  }, [toast]);

  // Load dashboard collections
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [newStats, newUsers, newPosts, newComments, newGroups, newLogs, newArticles] = await Promise.all([
        petraService.getStats(),
        petraService.getUsers(),
        petraService.getPosts(),
        petraService.getComments(),
        petraService.getGroups(),
        petraService.getLogs(),
        petraService.getArticles(),
      ]);

      if (!petraService.isLoggedIn()) {
        setIsAuthenticated(false);
        return;
      }

      setStats(newStats);
      setUsers(newUsers || []);
      setPosts(newPosts || []);
      setComments(newComments || []);
      setGroups(newGroups || []);
      setLogs(newLogs || []);
      setArticles(newArticles || []);
    } catch {
      toast({
        title: 'خطأ في المزامنة',
        description: 'تعذر تحديث بيانات بوابة بترا، يرجى المحاولة ثانية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAllData();
    const interval = setInterval(loadAllData, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تسجيل الخروج من بترا',
      description: 'هل ترغب في إنهاء الجلسة الإدارية الحالية وإغلاق بوابة التحكم المركزي؟',
      confirmText: 'تسجيل الخروج',
      isDestructive: false,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        petraService.logout();
        setIsAuthenticated(false);
        toast({
          title: 'تم تسجيل الخروج',
          description: 'أغلقت جلسة بوابة بترا بنجاح.',
        });
      },
    });
  };

  // User Actions
  const handleConfirmBan = async (userId: string, reason: string) => {
    setIsBanning(true);
    const res = await petraService.banUser(userId, reason);
    setIsBanning(false);
    if (res.success) {
      toast({
        title: 'تم حظر المستخدم فوراً',
        description: 'تم إيقاف حساب المستخدم وحظر وصوله للمنصة',
      });
      setBanTargetUser(null);
      loadAllData();
    } else {
      toast({
        title: 'فشل الحظر',
        description: res.message,
        variant: 'destructive',
      });
    }
  };

  const handleUnban = async (userId: string, userName: string) => {
    const res = await petraService.unbanUser(userId);
    if (res.success) {
      toast({
        title: 'تم إلغاء الحظر',
        description: `تمت استعادة حساب (${userName}) وتفعيل صلاحياته مجدداً`,
      });
      loadAllData();
    } else {
      toast({
        title: 'فشل إلغاء الحظر',
        description: res.message,
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async (userId: string, userName: string) => {
    const res = await petraService.verifyUser(userId);
    if (res.success) {
      toast({
        title: 'تم توثيق الحساب بنجاح 🛡️',
        description: `تمت ترقية حساب (${userName}) إلى موثق، وأصبح بإمكانه إنشاء المجموعات والدورات والأنشطة`,
      });
      loadAllData();
    } else {
      toast({
        title: 'فشل التوثيق',
        description: res.message,
        variant: 'destructive',
      });
    }
  };

  const handleUnverify = async (userId: string, userName: string) => {
    const res = await petraService.unverifyUser(userId);
    if (res.success) {
      toast({
        title: 'تم إلغاء التوثيق',
        description: `تم تحويل حساب (${userName}) إلى حساب عادي (انضمام فقط)`,
      });
      loadAllData();
    } else {
      toast({
        title: 'فشل إلغاء التوثيق',
        description: res.message,
        variant: 'destructive',
      });
    }
  };

  // Post & Comment Actions
  const handleDeletePost = (postId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف المنشور والردود التابعة',
      description: 'هل أنت متأكد من رغبتك في حذف هذا المنشور وجميع الردود التابعة له نهائياً؟ سيتم حذفه من قاعدة البيانات المركزية فوراً.',
      confirmText: 'تأكيد الحذف النهائي',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const res = await petraService.deletePost(postId);
        if (res.success) {
          toast({
            title: 'تم حذف المنشور',
            description: 'أزيل المنشور وكافة ردوده من قاعدة البيانات المركزية فوراً',
          });
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          loadAllData();
        } else {
          toast({
            title: 'تعذر الحذف',
            description: res.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleDeleteComment = (commentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الرد نهائياً',
      description: 'هل أنت متأكد من حذف هذا التعليق؟ سيتم تحديث عداد الردود في المنشور الأصلي فوراً.',
      confirmText: 'حذف الرد',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const res = await petraService.deleteComment(commentId);
        if (res.success) {
          toast({
            title: 'تم حذف الرد',
            description: 'أزيل الرد من المنصة بنجاح',
          });
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          loadAllData();
        } else {
          toast({
            title: 'تعذر الحذف',
            description: res.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  // Group Actions
  const handleDeleteGroup = (groupId: string, groupName: string) => {
    setConfirmModal({
      isOpen: true,
      title: `حذف مجتمع "${groupName}"`,
      description: `سيتم حذف مجموعة "${groupName}" نهائياً بما تحتويه من منشورات وقوائم أعضاء.`,
      confirmText: 'تأكيد حذف المجموعة',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const res = await petraService.deleteGroup(groupId);
        if (res.success) {
          toast({
            title: 'تم حذف المجموعة',
            description: `أزيلت مجموعة "${groupName}" نهائياً من المنصة`,
          });
          setGroups((prev) => prev.filter((g) => g.id !== groupId));
          loadAllData();
        } else {
          toast({
            title: 'تعذر حذف المجموعة',
            description: res.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  // Article Actions
  const handleDeleteArticle = (art: PetraArticle) => {
    setConfirmModal({
      isOpen: true,
      title: `تأكيد حذف مقال "${art.title}"`,
      description: `سيتم حذف هذا المقال وجميع ردوده وتفاعلاته نهائياً من المنصة لكاتبه (${art.author_name}). هذا الإجراء لا يمكن التراجع عنه.`,
      confirmText: 'تأكيد حذف المقال',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const res = await petraService.deleteArticle(art.id);
        if (res.success) {
          toast({
            title: 'تم حذف المقال بنجاح',
            description: res.message || `أزيل مقال "${art.title}" من المنصة.`,
          });
          setArticles((prev) => prev.filter((a) => a.id !== art.id));
          loadAllData();
        } else {
          toast({
            title: 'تعذر حذف المقال',
            description: res.message || 'حدث خطأ أثناء محاولة الحذف.',
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleSubmitReview = async (
    articleId: string,
    decision: 'approved' | 'needs_revision' | 'rejected',
    notes: string
  ) => {
    setIsSubmittingReview(true);
    try {
      const res = await petraService.reviewArticle(articleId, decision, notes);
      if (res.success) {
        toast({
          title: 'تم تحديث قرار المقال بنجاح',
          description: res.message || 'تم حفظ القرار وإشعار الكاتب فوراً.',
        });
        setReviewModalArticle(null);
        await loadAllData();
      } else {
        toast({
          title: 'فشل حفظ القرار',
          description: res.message || 'تعذر حفظ قرار المراجعة',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطأ في الاتصال',
        description: 'حدث خطأ غير متوقع أثناء إرسال قرار المراجعة.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 1. Unauthenticated Login Gate
  if (!isAuthenticated) {
    return (
      <PetraLogin
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          loadAllData();
        }}
        envStatus={envStatus}
        currentUser={user}
        platformToken={platformToken}
      />
    );
  }

  const pendingArticlesCount = articles.filter((a) => (a.status || 'approved') === 'pending').length;

  // 2. Authenticated Central Dashboard
  return (
    <div className="min-h-screen bg-[#0A0710] text-[#E4DDE9] font-sans flex flex-col selection:bg-primary/30" dir="rtl">
      {/* Header Bar */}
      <PetraHeader
        isRefreshing={isLoading}
        onRefresh={loadAllData}
        onLogout={handleLogout}
        envStatus={envStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 space-y-4">
        {/* Top Navigation Tabs */}
        <PetraNavigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            users: users.length,
            posts: posts.length,
            articles: articles.length,
            pendingArticles: pendingArticlesCount,
            groups: groups.length,
            logs: logs.length,
          }}
        />

        {/* Tab Content Rendering */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            users={users}
            posts={posts}
            comments={comments}
            articles={articles}
            groups={groups}
            envStatus={envStatus}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onBanClick={(u) => setBanTargetUser(u)}
            onUnbanClick={handleUnban}
            onVerifyClick={handleVerify}
            onUnverifyClick={handleUnverify}
          />
        )}

        {activeTab === 'posts' && (
          <PostsTab
            posts={posts}
            comments={comments}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {activeTab === 'articles' && (
          <ArticlesTab
            articles={articles}
            onOpenReviewModal={(art) => setReviewModalArticle(art)}
            onDeleteArticle={handleDeleteArticle}
          />
        )}

        {activeTab === 'groups' && (
          <GroupsTab
            groups={groups}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {activeTab === 'logs' && (
          <AuditLogsTab
            logs={logs}
          />
        )}
      </main>

      {/* Modals */}
      <BanUserModal
        user={banTargetUser}
        isOpen={Boolean(banTargetUser)}
        isBanning={isBanning}
        onClose={() => setBanTargetUser(null)}
        onConfirmBan={handleConfirmBan}
      />

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ArticleReviewModal
        article={reviewModalArticle}
        isOpen={Boolean(reviewModalArticle)}
        isSubmitting={isSubmittingReview}
        onClose={() => setReviewModalArticle(null)}
        onSubmitReview={handleSubmitReview}
      />
    </div>
  );
}
