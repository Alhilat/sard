import React, { useState, useEffect } from 'react';
import {
  Shield, Zap, Users, MessageSquare, Trash2, Ban, CheckCircle,
  AlertTriangle, RefreshCw, LogOut, Search, Activity, Layers, Lock,
  FileText, CornerDownLeft, Eye, EyeOff, Clock, ShieldAlert, Cpu,
  ShieldCheck, KeyRound, X, Sparkles, Check, Server, BookOpen, ExternalLink, Heart
} from 'lucide-react';
import {
  petraService, PetraStats, PetraUser, PetraPost, PetraComment, PetraGroup, PetraAuditLog, PetraArticle
} from '@/services/petraService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Petra() {
  const { toast } = useToast();
  const { user, token: platformToken } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => petraService.isLoggedIn());

  // Environment variables detection state from server (Render environment)
  const [envStatus, setEnvStatus] = useState<{
    envConfigured: boolean;
    envUser: string;
    hasEnvPass: boolean;
    renderDetected: boolean;
  } | null>(null);

  // Login form state (initialized from env vars or defaults)
  const [loginUser, setLoginUser] = useState('petra');
  const [loginPass, setLoginPass] = useState('petra2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Helper for uptime formatting
  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'أقل من دقيقة';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} س و ${mins} د`;
    return `${mins} دقيقة`;
  };

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'articles' | 'groups' | 'logs'>('overview');
  const [stats, setStats] = useState<PetraStats | null>(null);
  const [users, setUsers] = useState<PetraUser[]>([]);
  const [posts, setPosts] = useState<PetraPost[]>([]);
  const [comments, setComments] = useState<PetraComment[]>([]);
  const [articles, setArticles] = useState<PetraArticle[]>([]);
  const [groups, setGroups] = useState<PetraGroup[]>([]);
  const [logs, setLogs] = useState<PetraAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'active' | 'banned' | 'verified' | 'org'>('all');
  const [postSearch, setPostSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('all');
  const [contentSubTab, setContentSubTab] = useState<'posts' | 'comments'>('posts');

  // Ban dialog state
  const [banTargetUser, setBanTargetUser] = useState<PetraUser | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('مخالفة معايير المجتمع وشروط النشر');
  const [isBanning, setIsBanning] = useState(false);

  // In-App Modern Confirmation Modal state (eliminates native window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
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
      if (status) {
        setEnvStatus(status);
        if (status.envUser) {
          setLoginUser(status.envUser);
        }
      }
    });

    if (petraService.isLoggedIn()) {
      petraService.verifySession().then((isValid) => {
        if (!isValid) {
          setIsAuthenticated(false);
        }
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

  // Check if current platform user is admin or creator
  const isPlatformAdmin = Boolean(user && (user.role === 'admin' || user.email === 'aaa@g.com'));

  const handlePlatformAdminEntry = () => {
    if (platformToken) {
      petraService.usePlatformToken(platformToken);
      setIsAuthenticated(true);
      toast({
        title: 'مرحباً بك يا مدير المنصة 🛡️',
        description: `تم الدخول بصلاحيات الإشراف عبر حساب (${user?.name || 'المدير العام'})`,
      });
    }
  };

  // Load dashboard data
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const res = await petraService.login(loginUser.trim(), loginPass.trim());
    setIsLoggingIn(false);
    if (res.success) {
      setIsAuthenticated(true);
      toast({
        title: 'مرحباً بك في بوابة بترا',
        description: 'تم تسجيل الدخول بنجاح عبر بيانات الاعتماد المعتمدة في متغيرات البيئة.',
      });
    } else {
      setLoginError(res.message || 'بيانات الدخول غير صحيحة');
    }
  };

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

  const handleConfirmBan = async () => {
    if (!banTargetUser) return;
    setIsBanning(true);
    const res = await petraService.banUser(banTargetUser.id, banReasonInput);
    setIsBanning(false);
    if (res.success) {
      toast({
        title: 'تم حظر المستخدم فوراً',
        description: `تم إيقاف حساب (${banTargetUser.name}) وحظر وصوله للمنصة`,
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

  // ── RENDER LOGIN GATE IF NOT AUTHENTICATED ────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A080C] text-white flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
        {/* Glowing backdrop elements */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#7B2020]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#255447]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6B1B1B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#141018]/95 backdrop-blur-2xl border border-[#34273E] rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          {/* Top Decorative Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9E2A2B] to-transparent" />

          {/* Header */}
          <div className="relative text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6B1B1B] via-[#8C2424] to-[#9E2A2B] flex items-center justify-center mx-auto mb-4 shadow-xl border border-[#B33939]/40 group hover:scale-105 transition-transform">
              <Shield className="w-9 h-9 text-white drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide font-display">بوابة الإدارة المركزية</h1>
            <p className="text-xs text-[#BBAEC5] mt-1.5 leading-relaxed">
              لوحة التحكم وإدارة المحتوى والمستخدمين لمنصة سرد رقمي
            </p>

            {/* Env Var Live Badge */}
            <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1625] border border-[#3E2E4E] text-[11px] text-[#D8B4FE]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {envStatus?.renderDetected ? 'متغيرات بيئة Render (PETRA_USER / PASS) نشطة' : 'متغيرات البيئة محملة من الخادم'}
              </span>
            </div>
          </div>

          {/* Platform Admin Instant Entry */}
          {isPlatformAdmin && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-[#1F1728] to-[#171220] border border-emerald-500/40 text-emerald-200 text-xs flex flex-col gap-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>تم التعرف على المشرف العام: {user?.name}</span>
                </div>
                <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-600/50 text-[10px]">
                  مالك المنصة
                </Badge>
              </div>
              <p className="text-[11px] text-[#BBAEC5]">
                حسابك الحالي يمتلك صلاحيات الإشراف الكاملة. يمكنك الدخول بضغطة زر واحدة.
              </p>
              <Button
                type="button"
                onClick={handlePlatformAdminEntry}
                className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs h-9 font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                الدخول الفوري بحساب الإدارة الحالي
              </Button>
            </div>
          )}

          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#4A1515]/80 border border-[#8C2424] text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 relative">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#D1C7D9]">
                  اسم مستخدم بترا (PETRA_USER)
                </label>
                {envStatus?.envUser && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    (Env: {envStatus.envUser})
                  </span>
                )}
              </div>
              <div className="relative">
                <Users className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999] pointer-events-none" />
                <Input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder={envStatus?.envUser || 'petra'}
                  required
                  className="bg-[#19131F] border-[#382B42] text-white focus:border-[#9E2A2B] focus:ring-[#9E2A2B] pr-10 text-xs h-11 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#D1C7D9]">
                  كلمة المرور الأمنية (PETRA_PASS)
                </label>
                <span className="text-[10px] text-[#A898B5]">
                  {envStatus?.hasEnvPass ? 'محملة من متغيرات البيئة' : 'كلمة المرور'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999] pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#19131F] border-[#382B42] text-white focus:border-[#9E2A2B] focus:ring-[#9E2A2B] pr-10 pl-10 text-xs h-11 rounded-xl font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7999] hover:text-white transition-colors cursor-pointer p-1"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetUser = envStatus?.envUser || 'petra';
                  setLoginUser(targetUser);
                  setLoginPass('petra2026');
                  toast({
                    title: 'تم تعيين بيانات الاعتماد المجهزة',
                    description: `المستخدم: ${targetUser} • كلمة المرور: جاهزة للدخول`,
                  });
                }}
                className="text-[11px] text-[#A898B5] hover:text-[#D8B4FE] underline cursor-pointer transition-colors"
              >
                تعبئة بيانات البيئة الافتراضية
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#7B2020] via-[#8C2424] to-[#9E2A2B] hover:from-[#8C2424] hover:to-[#B33939] text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-200 mt-2 cursor-pointer text-xs"
            >
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري التحقق من الاعتمادات...</span>
                </div>
              ) : (
                'دخول آمن إلى بوابة بترا'
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── SAFE FILTERED USERS DATA ──────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = (userSearch || '').trim().toLowerCase();
    const matchesSearch = !q || (
      (u?.name || '').toLowerCase().includes(q) ||
      (u?.email || '').toLowerCase().includes(q) ||
      (u?.username || '').toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;

    if (userFilterRole === 'active') return !u.is_banned;
    if (userFilterRole === 'banned') return Boolean(u.is_banned);
    if (userFilterRole === 'verified') return Boolean(u.verified);
    if (userFilterRole === 'org') return u.role === 'org';
    return true;
  });

  const filteredPosts = posts.filter((p) => {
    const q = (postSearch || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (p?.content || '').toLowerCase().includes(q) ||
      (p?.author_name || '').toLowerCase().includes(q) ||
      (p?.author_username || '').toLowerCase().includes(q)
    );
  });

  const filteredComments = comments.filter((c) => {
    const q = (postSearch || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (c?.content || '').toLowerCase().includes(q) ||
      (c?.author_name || '').toLowerCase().includes(q) ||
      (c?.author_username || '').toLowerCase().includes(q) ||
      (c?.post_content || '').toLowerCase().includes(q)
    );
  });

  const filteredArticles = articles.filter((a) => {
    const q = (articleSearch || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (a?.title || '').toLowerCase().includes(q) ||
      (a?.author_name || '').toLowerCase().includes(q) ||
      (a?.author_username || '').toLowerCase().includes(q) ||
      (a?.summary || '').toLowerCase().includes(q);
    const matchesCategory =
      articleCategoryFilter === 'all' || a.category === articleCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // User filter pill counters
  const activeCount = users.filter((u) => !u.is_banned).length;
  const bannedCount = users.filter((u) => u.is_banned).length;
  const verifiedCount = users.filter((u) => u.verified).length;
  const orgCount = users.filter((u) => u.role === 'org').length;

  // ── MAIN PETRA DASHBOARD ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B090E] text-white" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#120E16]/95 backdrop-blur-md border-b border-[#2A2033]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6B1B1B] via-[#8C2424] to-[#9E2A2B] flex items-center justify-center shadow-lg border border-[#B33939]/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide font-display">بوابة بترا</h1>
                <Badge className="bg-[#2A1820] text-[#E57373] border-[#59262E] text-[10px]">
                  لوحة الإدارة المركزية
                </Badge>
                {envStatus?.envConfigured && (
                  <Badge className="hidden md:inline-flex bg-emerald-950/60 text-emerald-300 border-emerald-800/60 text-[10px] items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>متغيرات البيئة مفعّلة (Render)</span>
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[#9E8EAA]">إدارة المحتوى والمجموعات والحسابات</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Real-time Server Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1422] border border-[#382B42] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#A797B5]">الخادم:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                متصل {stats?.nodeVersion ? `(${stats.nodeVersion})` : ''}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              disabled={isLoading}
              className="bg-[#1C1624] border-[#382C44] text-[#D8CDE3] hover:bg-[#281F33] text-xs h-8 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ml-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-[#381616] border-[#662020] text-red-200 hover:bg-[#4E1C1C] text-xs h-8 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 ml-1.5" />
              خروج
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1.5 border-t border-[#231A2A] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/70'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>نظرة عامة على النظام</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/70'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>إدارة وحظر المستخدمين</span>
            <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px] px-1.5 py-0">
              {users.length}
            </Badge>
            {bannedCount > 0 && (
              <Badge className="bg-red-900/80 text-red-200 text-[10px] px-1.5 py-0">
                {bannedCount} محظور
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'posts'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/70'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>إدارة المنشورات والردود</span>
            <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px] px-1.5 py-0">
              {posts.length + comments.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'articles'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/70'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>إدارة المقالات</span>
            <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px] px-1.5 py-0">
              {articles.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'groups'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/70'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>إدارة المجموعات</span>
            <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px] px-1.5 py-0">
              {groups.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/70'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>سجل التدقيق والعمليات</span>
            <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px] px-1.5 py-0">
              {logs.length}
            </Badge>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ── TAB 1: SYSTEM OVERVIEW & TELEMETRY ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-[#15111A] border-[#2E2437] text-white hover:border-[#4B375B] transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">إجمالي المستخدمين</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {stats ? stats.totalUsers : users.length}
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-3 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{stats ? stats.activeUsers : activeCount} حساب نشط</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#15111A] border-[#2E2437] text-white hover:border-[#4B375B] transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">الحسابات المحظورة</p>
                      <h3 className="text-2xl font-black text-red-400 mt-1">
                        {stats ? stats.bannedUsers : bannedCount}
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <Ban className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#A898B5] mt-3">
                    ممنوعون من النشر والتعليق والدخول
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#15111A] border-[#2E2437] text-white hover:border-[#4B375B] transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">المنشورات والردود</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {posts.length + comments.length}
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#A898B5] mt-3">
                    {posts.length} منشور • {comments.length} رد
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#15111A] border-[#2E2437] text-white hover:border-[#4B375B] transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">المقالات والتحليلات</p>
                      <h3 className="text-2xl font-black text-amber-400 mt-1">
                        {stats ? (stats.totalArticles ?? articles.length) : articles.length}
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#A898B5] mt-3">
                    {stats?.totalArticleComments ?? 0} تعليق ومناقشة
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#15111A] border-[#2E2437] text-white hover:border-[#4B375B] transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">المجتمعات والمجموعات</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {stats ? stats.totalGroups : groups.length}
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#A898B5] mt-3">
                    مجتمعات نشطة تحت الإشراف
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Server Health & Telemetry + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Server Telemetry Card */}
              <Card className="bg-[#15111A] border-[#2E2437] text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-white font-display">
                    <Server className="w-5 h-5 text-emerald-400" />
                    حالة الخادم والبيئة التقنية
                  </CardTitle>
                  <CardDescription className="text-xs text-[#A797B5]">
                    مؤشرات حية لأداء النظام وقاعدة البيانات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  <div className="flex justify-between py-2 border-b border-[#2A2033] text-xs">
                    <span className="text-[#A898B5]">محرك البيانات:</span>
                    <span className="font-mono text-white font-medium">{stats?.dbEngine || 'SQLite 3 (WAL)'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2A2033] text-xs">
                    <span className="text-[#A898B5]">بيئة التشغيل:</span>
                    <span className="font-mono text-emerald-400 font-medium">Node.js {stats?.nodeVersion || 'v22'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2A2033] text-xs">
                    <span className="text-[#A898B5]">استهلاك الذاكرة (Heap):</span>
                    <span className="font-mono text-cyan-300">
                      {stats?.memoryHeapUsedMb ? `${stats.memoryHeapUsedMb} MB / ${stats.memoryHeapTotalMb || 0} MB` : '32 MB'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2A2033] text-xs">
                    <span className="text-[#A898B5]">وقت التشغيل المستمر:</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {formatUptime(stats?.uptimeSeconds)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2A2033] text-xs">
                    <span className="text-[#A898B5]">إجمالي الطلبات المعالجة:</span>
                    <span className="font-mono text-amber-400 font-bold">{stats?.totalRequests || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2A2033] text-xs">
                    <span className="text-[#A898B5]">البث اللحظي (WebSocket):</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      متصل على /ws
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-xs">
                    <span className="text-[#A898B5]">مصدر بيانات الاعتماد:</span>
                    <span className="font-mono text-[#D8B4FE]">
                      {envStatus?.renderDetected ? 'Render Env (PETRA_USER / PASS)' : 'Environment Variables'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Users Activity Card */}
              <Card className="bg-[#15111A] border-[#2E2437] text-white flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-white font-display">
                      <Users className="w-5 h-5 text-blue-400" />
                      أحدث الحسابات المنضمة
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('users')}
                      className="text-xs text-blue-400 hover:text-blue-300 p-0 h-auto cursor-pointer"
                    >
                      إدارة الكل ({users.length}) ←
                    </Button>
                  </div>
                  <CardDescription className="text-xs text-[#A797B5]">
                    آخر المستخدمين المسجلين في المنصة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 flex-1">
                  {users.slice(0, 4).map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-[#1C1623] border border-[#35273F] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {u.name?.slice(0, 1) || 'س'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white truncate">{u.name}</span>
                            {u.verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-[#8E7E9E] font-mono block truncate">
                            @{u.username || 'user'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {u.is_banned ? (
                          <Badge className="bg-red-950 text-red-300 border-red-800 text-[10px]">
                            محظور
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-950/70 text-emerald-300 border-emerald-800 text-[10px]">
                            نشط
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-xs text-[#8E7E9E] text-center py-6">لا يوجد مستخدمون حالياً</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Content Card */}
              <Card className="bg-[#15111A] border-[#2E2437] text-white flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-white font-display">
                      <MessageSquare className="w-5 h-5 text-purple-400" />
                      أحدث المنشورات في الساحة
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('posts')}
                      className="text-xs text-purple-400 hover:text-purple-300 p-0 h-auto cursor-pointer"
                    >
                      إدارة الكل ({posts.length}) ←
                    </Button>
                  </div>
                  <CardDescription className="text-xs text-[#A797B5]">
                    متابعة المحتوى المطروح مؤخراً
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 flex-1">
                  {posts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-[#1C1623] border border-[#35273F] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate max-w-[140px]">
                          {p.author_name}
                        </span>
                        <span className="text-[10px] text-[#8E7E9E] font-mono">
                          {p.timestamp_text || new Date(p.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#C4B6CF] line-clamp-2 leading-relaxed">
                        {p.content}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-[#8E7E9E] pt-1">
                        <span>❤️ {p.likes_count || 0} إعجاب</span>
                        <span>💬 {p.comments_count || 0} رد</span>
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <p className="text-xs text-[#8E7E9E] text-center py-6">لا توجد منشورات حالياً</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 2: USERS & BANS MANAGEMENT ── */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search & Filter Header */}
            <div className="flex flex-col gap-3 bg-[#15111A] p-4 rounded-2xl border border-[#2E2437]">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999]" />
                  <Input
                    type="text"
                    placeholder="بحث عن مستخدم بالاسم، المعرف، أو البريد الإلكتروني..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-[#1C1623] border-[#35273F] text-white pr-10 pl-9 text-xs h-10 rounded-xl"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7999] hover:text-white p-1"
                      title="مسح البحث"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setUserFilterRole('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      userFilterRole === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-[#1C1623] border border-[#35273F] text-[#A898B5] hover:text-white'
                    }`}
                  >
                    الكل ({users.length})
                  </button>

                  <button
                    onClick={() => setUserFilterRole('active')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      userFilterRole === 'active'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#1C1623] border border-[#35273F] text-emerald-300 hover:text-emerald-200'
                    }`}
                  >
                    النشطين ({activeCount})
                  </button>

                  <button
                    onClick={() => setUserFilterRole('banned')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      userFilterRole === 'banned'
                        ? 'bg-red-700 text-white'
                        : 'bg-[#1C1623] border border-[#35273F] text-red-300 hover:text-red-200'
                    }`}
                  >
                    المحظورين ({bannedCount})
                  </button>

                  <button
                    onClick={() => setUserFilterRole('verified')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      userFilterRole === 'verified'
                        ? 'bg-amber-700 text-white'
                        : 'bg-[#1C1623] border border-[#35273F] text-amber-300 hover:text-amber-200'
                    }`}
                  >
                    الموثقين ({verifiedCount})
                  </button>

                  <button
                    onClick={() => setUserFilterRole('org')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      userFilterRole === 'org'
                        ? 'bg-purple-700 text-white'
                        : 'bg-[#1C1623] border border-[#35273F] text-purple-300 hover:text-purple-200'
                    }`}
                  >
                    منظمات ({orgCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#15111A] border border-[#2E2437] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#1D1724] text-[#B5A5C2] border-b border-[#2A2033]">
                    <tr>
                      <th className="p-3.5">المستخدم</th>
                      <th className="p-3.5">البريد الإلكتروني</th>
                      <th className="p-3.5">النوع</th>
                      <th className="p-3.5">التوثيق والصلاحيات</th>
                      <th className="p-3.5">تاريخ الانضمام</th>
                      <th className="p-3.5">المنشورات</th>
                      <th className="p-3.5">المقالات</th>
                      <th className="p-3.5">الردود</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#241A2D]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-[#9A8AA7] text-xs">
                          لا يوجد مستخدمين مطابقين للفلاتر المحددة
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const initial = (u.name || 'م')[0];
                        return (
                          <tr key={u.id} className="hover:bg-[#1A1421] transition-colors">
                            <td className="p-3.5 font-medium">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs">
                                  {initial}
                                </div>
                                <div>
                                  <span className="text-white block font-bold">{u.name || 'بدون اسم'}</span>
                                  <span className="text-[#9A8AA7] text-[11px] font-mono">@{u.username || 'user'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[#D8B4FE]">{u.email}</td>
                            <td className="p-3.5">
                              <Badge className={u.role === 'org' ? 'bg-amber-900/60 text-amber-300 border-amber-700/50' : 'bg-blue-900/60 text-blue-300 border-blue-700/50'}>
                                {u.role === 'org' ? 'منظمة' : 'فرد'}
                              </Badge>
                            </td>
                            <td className="p-3.5">
                              {u.verified ? (
                                <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 gap-1 font-bold">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>موثق (كامل الصلاحيات)</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[#A898B5] border-[#3E3048]">
                                  عادي (انضمام فقط)
                                </Badge>
                              )}
                            </td>
                            <td className="p-3.5 text-[#A898B5]">{u.join_date || 'غير محدد'}</td>
                            <td className="p-3.5 font-mono text-white">{u.posts_count || 0}</td>
                            <td className="p-3.5 font-mono text-amber-300 font-bold">{u.articles_count || 0}</td>
                            <td className="p-3.5 font-mono text-white">{u.comments_count || 0}</td>
                            <td className="p-3.5">
                              {u.is_banned ? (
                                <div>
                                  <Badge className="bg-red-900/80 text-red-200 border-red-700">
                                    محظور
                                  </Badge>
                                  {u.ban_reason && (
                                    <span className="block text-[10px] text-red-300 mt-0.5 truncate max-w-[120px]" title={u.ban_reason}>
                                      {u.ban_reason}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-700">
                                  نشط
                                </Badge>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {u.verified ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnverify(u.id, u.name)}
                                    className="bg-amber-950/40 hover:bg-amber-900/60 border-amber-700 text-amber-300 text-[11px] h-7 px-2 cursor-pointer"
                                    title="تحويل الحساب إلى عادي (انضمام فقط)"
                                  >
                                    إلغاء التوثيق
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVerify(u.id, u.name)}
                                    className="bg-emerald-950/50 hover:bg-emerald-900/70 border-emerald-600 text-emerald-300 text-[11px] h-7 px-2 cursor-pointer"
                                    title="منح صلاحية إنشاء المجموعات والدورات والأنشطة"
                                  >
                                    <ShieldCheck className="w-3 h-3 ml-1 text-emerald-400" />
                                    توثيق الحساب
                                  </Button>
                                )}

                                {u.is_banned ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnban(u.id, u.name)}
                                    className="bg-emerald-900/40 hover:bg-emerald-900/70 border-emerald-600 text-emerald-300 text-xs h-7 px-3 cursor-pointer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 ml-1" />
                                    إلغاء الحظر
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setBanTargetUser(u);
                                      setBanReasonInput('مخالفة معايير المجتمع وشروط النشر');
                                    }}
                                    className="bg-red-900/40 hover:bg-red-900/70 border-red-700 text-red-300 text-xs h-7 px-3 cursor-pointer"
                                  >
                                    <Ban className="w-3.5 h-3.5 ml-1" />
                                    حظر الحساب
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: POSTS & REPLIES MODERATION ── */}
        {activeTab === 'posts' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#15111A] p-4 rounded-2xl border border-[#2E2437]">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={contentSubTab === 'posts' ? 'default' : 'outline'}
                  onClick={() => setContentSubTab('posts')}
                  className={contentSubTab === 'posts' ? 'bg-[#9E2A2B] text-white text-xs cursor-pointer' : 'bg-[#1C1623] text-[#A898B5] text-xs cursor-pointer'}
                >
                  المنشورات ({posts.length})
                </Button>
                <Button
                  size="sm"
                  variant={contentSubTab === 'comments' ? 'default' : 'outline'}
                  onClick={() => setContentSubTab('comments')}
                  className={contentSubTab === 'comments' ? 'bg-[#9E2A2B] text-white text-xs cursor-pointer' : 'bg-[#1C1623] text-[#A898B5] text-xs cursor-pointer'}
                >
                  الردود والتعليقات ({comments.length})
                </Button>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999]" />
                <Input
                  type="text"
                  placeholder="بحث في محتوى المنشورات أو اسم الكاتب..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="bg-[#1C1623] border-[#35273F] text-white pr-10 pl-9 text-xs h-10 rounded-xl"
                />
                {postSearch && (
                  <button
                    onClick={() => setPostSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7999] hover:text-white p-1"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Posts Sub-Tab */}
            {contentSubTab === 'posts' && (
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16 bg-[#15111A] rounded-2xl border border-[#2E2437] text-[#9A8AA7] text-xs">
                    لا توجد منشورات مطابقة للبحث
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-[#15111A] border border-[#2E2437] hover:border-[#473655] rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {(post.author_name || 'م')[0]}
                          </div>
                          <span className="font-bold text-white text-sm">{post.author_name}</span>
                          <span className="text-xs text-[#9A8AA7] font-mono">@{post.author_username}</span>
                          <span className="text-xs text-[#7A6A87]">• {post.timestamp_text}</span>
                        </div>
                        <p className="text-xs text-[#DDD2E5] leading-relaxed whitespace-pre-line bg-[#1A1421] p-3 rounded-xl border border-[#2B2035]">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-[#A898B5] pt-1">
                          <span>❤️ {post.likes_count} إعجاب</span>
                          <span>💬 {post.comments_count} رد</span>
                          <span>🔁 {post.shares_count} مشاركة</span>
                          {post.group_id && (
                            <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px]">
                              مجموعة: {post.group_id}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col justify-end items-end gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-8 px-3 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                          حذف المنشور والردود
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Comments Sub-Tab */}
            {contentSubTab === 'comments' && (
              <div className="space-y-3">
                {filteredComments.length === 0 ? (
                  <div className="text-center py-16 bg-[#15111A] rounded-2xl border border-[#2E2437] text-[#9A8AA7] text-xs">
                    لا توجد ردود مطابقة للبحث
                  </div>
                ) : (
                  filteredComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-[#15111A] border border-[#2E2437] hover:border-[#473655] rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#255447] to-[#347A67] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {(comment.author_name || 'م')[0]}
                          </div>
                          <span className="font-bold text-white text-sm">{comment.author_name}</span>
                          <span className="text-xs text-[#9A8AA7] font-mono">@{comment.author_username}</span>
                          <span className="text-xs text-[#7A6A87]">• {comment.timestamp_text}</span>
                        </div>
                        <p className="text-xs text-[#DDD2E5] leading-relaxed bg-[#1A1421] p-3 rounded-xl border border-[#2B2035]">
                          {comment.content}
                        </p>
                        {comment.post_content && (
                          <div className="p-2.5 rounded-xl bg-[#1C1625] border border-[#32263D] text-[11px] text-[#A898B5]">
                            <span className="font-semibold text-[#C5B4D4]">رداً على المنشور: </span>
                            <span>"{comment.post_content.slice(0, 70)}..."</span>
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col justify-end items-end gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-8 px-3 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                          حذف الرد
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: ARTICLES MANAGEMENT ── */}
        {activeTab === 'articles' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#15111A] p-4 rounded-2xl border border-[#2E2437]">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'برمجة وتطوير', label: 'برمجة وتطوير' },
                  { id: 'تصميم وتجربة المستخدم', label: 'تصميم' },
                  { id: 'قواعد بيانات', label: 'قواعد بيانات' },
                  { id: 'ثقافة وفكر', label: 'ثقافة وفكر' },
                  { id: 'تقنية وذكاء اصطناعي', label: 'تقنية' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setArticleCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      articleCategoryFilter === cat.id
                        ? 'bg-[#9E2A2B] text-white font-bold'
                        : 'bg-[#1C1623] border border-[#35273F] text-[#A898B5] hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999]" />
                <Input
                  type="text"
                  placeholder="بحث في عنوان المقال، الكاتب، أو المحتوى..."
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  className="bg-[#1C1623] border-[#35273F] text-white pr-10 pl-9 text-xs h-10 rounded-xl"
                />
                {articleSearch && (
                  <button
                    onClick={() => setArticleSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7999] hover:text-white p-1 cursor-pointer"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-16 bg-[#15111A] rounded-2xl border border-[#2E2437] text-[#9A8AA7] text-xs">
                  لا توجد مقالات مطابقة للبحث
                </div>
              ) : (
                filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-[#15111A] border border-[#2E2437] hover:border-[#473655] rounded-2xl p-4 sm:p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Meta Top Line */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {(art.author_name || 'ك')[0]}
                        </div>
                        <span className="font-bold text-white text-sm">{art.author_name}</span>
                        <span className="text-xs text-[#9A8AA7] font-mono">@{art.author_username}</span>
                        <span className="text-[#7A6A87]">•</span>
                        <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px] px-2 py-0.5 border border-[#3E2E4E]">
                          {art.category}
                        </Badge>
                        <span className="text-xs text-[#7A6A87]">• {art.timestamp_text}</span>
                      </div>

                      {/* Title & Summary */}
                      <div>
                        <h4 className="text-base font-bold text-white leading-snug">
                          {art.title}
                        </h4>
                        {art.summary && (
                          <p className="text-xs text-[#C5B7CF] line-clamp-2 mt-1 leading-relaxed">
                            {art.summary}
                          </p>
                        )}
                      </div>

                      {/* Metrics Pill Row */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#A898B5]">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          {art.views_count || 0} قراءة
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-400" />
                          {art.likes_count || 0} إعجاب
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          {art.comments_count || 0} رد
                        </span>
                        <span className="text-[#7A6A87]">•</span>
                        <span className="font-mono text-amber-300/90">
                          {art.char_count.toLocaleString('ar-EG')} حرف
                        </span>
                        <span className="text-[#7A6A87]">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {art.read_time_minutes || 1} دقيقة
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <a
                        href={`/articles/${art.slug || art.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-[#1C1623] hover:bg-[#2A2033] border-[#3E3048] text-white text-xs h-9 gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          <span>معاينة المقال</span>
                        </Button>
                      </a>

                      <Button
                        size="sm"
                        onClick={() => handleDeleteArticle(art)}
                        className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-9 gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف المقال</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 5: GROUPS CONTROL ── */}
        {activeTab === 'groups' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#15111A] p-4 rounded-2xl border border-[#2E2437] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white font-display">إدارة المجتمعات والمجموعات</h3>
                <p className="text-xs text-[#A898B5]">التحكم الكامل في المجموعات وحذف المجموعات المخالفة</p>
              </div>
              <Badge className="bg-purple-900/60 text-purple-300 border-purple-700">
                {groups.length} مجتمعات مسجلة
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-[#15111A] rounded-2xl border border-[#2E2437] text-[#9A8AA7] text-xs">
                  لا توجد مجموعات مسجلة بعد
                </div>
              ) : (
                groups.map((group) => (
                  <Card key={group.id} className="bg-[#15111A] border-[#2E2437] text-white flex flex-col justify-between hover:border-[#4B375B] transition-colors rounded-2xl overflow-hidden shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px]">
                          {group.category}
                        </Badge>
                        <Badge className="bg-[#1C1623] text-[#A898B5] text-[10px]">
                          {group.privacy}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-white mt-2">
                        {group.name}
                      </CardTitle>
                      {group.tagline && (
                        <CardDescription className="text-xs text-[#A898B5] line-clamp-2">
                          {group.tagline}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-2 space-y-3">
                      <p className="text-xs text-[#C5B7CF] line-clamp-3 leading-relaxed bg-[#1A1421] p-2.5 rounded-xl border border-[#2A2033]">
                        {group.description || 'بدون وصف'}
                      </p>
                      <div className="flex justify-between text-xs text-[#9A8AA7] pt-2 border-t border-[#261D2F]">
                        <span>👥 {group.members_count || 1} عضو</span>
                        <span>📝 {group.posts_count || 0} منشور</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="w-full bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-8 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                        حذف المجموعة بالكامل
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 5: AUDIT LOGS ── */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#15111A] p-4 rounded-2xl border border-[#2E2437] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white font-display">سجل تدقيق العمليات الإدارية</h3>
                <p className="text-xs text-[#A898B5]">توثيق دقيق لكل عملية إدارية تمت عبر لوحة التحكم</p>
              </div>
              <Badge className="bg-[#241A2D] text-[#D8B4FE] text-xs">
                {logs.length} عملية مسجلة
              </Badge>
            </div>

            <div className="bg-[#15111A] border border-[#2E2437] rounded-2xl divide-y divide-[#261D2F] overflow-hidden shadow-xl">
              {logs.length === 0 ? (
                <div className="text-center py-16 text-[#9A8AA7] text-xs">
                  لا توجد عمليات مسجلة بعد
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-[#1A1421] transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#2D161F] text-[#F87171] border-[#552028] text-[10px]">
                          {log.action}
                        </Badge>
                        <span className="font-semibold text-white">المسؤول: {log.admin_user}</span>
                        <span className="text-[#887895]">• الهدف: {log.target_type} ({log.target_id})</span>
                      </div>
                      <p className="text-[#DDD2E5] text-[11px] leading-relaxed">{log.details}</p>
                    </div>
                    <span className="text-[#887895] text-[10px] font-mono whitespace-nowrap bg-[#1D1726] px-2 py-1 rounded-md border border-[#32253E]">
                      {new Date(log.created_at).toLocaleTimeString('ar-SA')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── BAN USER MODAL ─────────────────────────────────────────────────── */}
      {banTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-[#15111A] border border-[#3E2C4B] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-11 h-11 rounded-2xl bg-red-900/30 border border-red-700/50 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">تأكيد حظر المستخدم</h3>
                <p className="text-xs text-[#A898B5]">سيتم منعه فوراً من النشر والتعليق وتسجيل الدخول</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#1C1623] rounded-2xl border border-[#362744] text-xs space-y-1.5">
              <p className="text-white"><span className="text-[#A898B5]">الاسم:</span> <span className="font-bold">{banTargetUser.name}</span></p>
              <p className="text-white"><span className="text-[#A898B5]">المعرف:</span> <span className="font-mono text-emerald-400">@{banTargetUser.username}</span></p>
              <p className="text-white font-mono"><span className="text-[#A898B5]">البريد:</span> {banTargetUser.email}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D0C2DD] mb-1.5">
                سبب الحظر (سيظهر للمستخدم عند محاولة الدخول)
              </label>
              <Input
                type="text"
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="اكتب سبب الحظر هنا..."
                className="bg-[#1C1523] border-[#382B42] text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleConfirmBan}
                disabled={isBanning}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white text-xs font-bold h-10 rounded-xl cursor-pointer"
              >
                {isBanning ? 'جاري التنفيذ...' : 'تأكيد الحظر الفوري'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBanTargetUser(null)}
                className="bg-[#1C1623] border-[#382B42] text-[#DDD2E5] hover:bg-[#2A1F33] text-xs h-10 rounded-xl cursor-pointer"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── IN-APP MODERN CONFIRMATION MODAL (REPLACES BROWSER WINDOW.CONFIRM) ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-[#15111A] border border-[#3E2C4B] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                confirmModal.isDestructive
                  ? 'bg-red-900/30 border border-red-700/50 text-red-400'
                  : 'bg-amber-900/30 border border-amber-700/50 text-amber-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">{confirmModal.title}</h3>
                <p className="text-xs text-[#A898B5] mt-0.5">عملية إدارية مركزية</p>
              </div>
            </div>

            <p className="text-xs text-[#DDD2E5] leading-relaxed bg-[#1C1623] p-3.5 rounded-2xl border border-[#362744]">
              {confirmModal.description}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={confirmModal.onConfirm}
                className={`flex-1 text-xs font-bold h-10 rounded-xl cursor-pointer ${
                  confirmModal.isDestructive
                    ? 'bg-red-700 hover:bg-red-800 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {confirmModal.confirmText}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="bg-[#1C1623] border-[#382B42] text-[#DDD2E5] hover:bg-[#2A1F33] text-xs h-10 rounded-xl cursor-pointer"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
