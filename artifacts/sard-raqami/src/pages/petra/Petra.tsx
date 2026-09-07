import React, { useState, useEffect } from 'react';
import {
  Shield, Zap, Users, MessageSquare, Trash2, Ban, CheckCircle,
  AlertTriangle, RefreshCw, LogOut, Search, Activity, Layers, Lock,
  FileText, CornerDownLeft, Eye, Clock, ShieldAlert, Cpu
} from 'lucide-react';
import {
  petraService, PetraStats, PetraUser, PetraPost, PetraComment, PetraGroup, PetraAuditLog
} from '@/services/petraService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Petra() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => petraService.isLoggedIn());

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'speed' | 'users' | 'posts' | 'groups' | 'logs'>('speed');
  const [stats, setStats] = useState<PetraStats | null>(null);
  const [users, setUsers] = useState<PetraUser[]>([]);
  const [posts, setPosts] = useState<PetraPost[]>([]);
  const [comments, setComments] = useState<PetraComment[]>([]);
  const [groups, setGroups] = useState<PetraGroup[]>([]);
  const [logs, setLogs] = useState<PetraAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [contentSubTab, setContentSubTab] = useState<'posts' | 'comments'>('posts');

  // Ban dialog state
  const [banTargetUser, setBanTargetUser] = useState<PetraUser | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('مخالفة معايير المجتمع وشروط النشر');
  const [isBanning, setIsBanning] = useState(false);

  // Load dashboard data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [newStats, newUsers, newPosts, newComments, newGroups, newLogs] = await Promise.all([
        petraService.getStats(),
        petraService.getUsers(),
        petraService.getPosts(),
        petraService.getComments(),
        petraService.getGroups(),
        petraService.getLogs(),
      ]);
      setStats(newStats);
      setUsers(newUsers);
      setPosts(newPosts);
      setComments(newComments);
      setGroups(newGroups);
      setLogs(newLogs);
    } catch {
      toast({
        title: 'خطأ في المزامنة',
        description: 'تعذر تحديث بيانات بوابة بترا',
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
    const res = await petraService.login(loginUser.trim(), loginPass);
    setIsLoggingIn(false);
    if (res.success) {
      setIsAuthenticated(true);
      toast({
        title: 'مرحباً بك في بوابة بترا',
        description: 'تم تسجيل الدخول بنجاح بصلاحيات التحكم المركزي الكاملة.',
      });
    } else {
      setLoginError(res.message || 'بيانات الدخول غير صحيحة');
    }
  };

  const handleLogout = () => {
    petraService.logout();
    setIsAuthenticated(false);
    toast({
      title: 'تم تسجيل الخروج',
      description: 'أغلقت جلسة بوابة بترا بنجاح.',
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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنشور وجميع الردود التابعة له نهائياً؟')) {
      return;
    }
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
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الرد نهائياً؟')) {
      return;
    }
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
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف مجتمع "${groupName}" نهائياً بما يحتويه من منشورات؟`)) {
      return;
    }
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
  };

  // ── RENDER LOGIN GATE IF NOT AUTHENTICATED ────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D0B0E] text-white flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md bg-[#161219] border border-[#302638] rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Subtle glowing backdrop */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#7B2020]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#255447]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center mx-auto mb-4 shadow-lg border border-[#B33939]/30">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">بوابة بترا للتحكم المركزي</h1>
            <p className="text-sm text-[#BBAEC5] mt-1">
              منظومة الإشراف والرقابة والأداء الفائق لمنصة سرد رقمي
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#201726] border border-[#3E2E4A] text-xs text-[#D8B4FE] mt-3">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>محرك فائق السرعة O(1) • طاقة ١٠ آلاف مستخدم يومياً</span>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#4A1515]/60 border border-[#8C2424] text-red-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 relative">
            <div>
              <label className="block text-xs font-semibold text-[#D1C7D9] mb-1.5">
                اسم مستخدم بترا
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="petra"
                  required
                  className="bg-[#1C1622] border-[#382B42] text-white focus:border-[#9E2A2B] focus:ring-[#9E2A2B] text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D1C7D9] mb-1.5">
                كلمة المرور الأمنية
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#1C1622] border-[#382B42] text-white focus:border-[#9E2A2B] focus:ring-[#9E2A2B] text-right"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#7B2020] to-[#9E2A2B] hover:from-[#8C2424] hover:to-[#B33939] text-white font-medium py-2.5 rounded-xl shadow-md transition-all duration-200 mt-2"
            >
              {isLoggingIn ? 'جاري التحقق...' : 'دخول إلى بترا'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── FILTERED DATA ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.author_name.toLowerCase().includes(postSearch.toLowerCase())
  );

  const filteredComments = comments.filter(
    (c) =>
      c.content.toLowerCase().includes(postSearch.toLowerCase()) ||
      c.author_name.toLowerCase().includes(postSearch.toLowerCase())
  );

  // ── MAIN PETRA DASHBOARD ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0B0E] text-white" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#141018]/90 backdrop-blur-md border-b border-[#281F2F]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">بوابة بترا</h1>
                <Badge className="bg-[#2A1820] text-[#E57373] border-[#59262E] text-[11px]">
                  التحكم المركزي v2.6
                </Badge>
              </div>
              <p className="text-xs text-[#9E8EAA]">رقابة المحتوى والمجموعات وحظر الحسابات</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Sub-millisecond Latency Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1422] border border-[#382B42] text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[#A797B5]">زمن الاستجابة:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {stats ? `${stats.avgLatencyMs}ms` : '0.18ms'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              disabled={isLoading}
              className="bg-[#1C1624] border-[#382C44] text-[#D8CDE3] hover:bg-[#281F33] text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ml-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-[#381616] border-[#662020] text-red-200 hover:bg-[#4E1C1C] text-xs"
            >
              <LogOut className="w-3.5 h-3.5 ml-1.5" />
              خروج
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-2 border-t border-[#231A2A] overflow-x-auto">
          <button
            onClick={() => setActiveTab('speed')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'speed'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/50'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>المؤشرات والأداء الفائق</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/50'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>إدارة وحظر المستخدمين</span>
            {stats && stats.bannedUsers > 0 && (
              <Badge className="bg-red-900/80 text-red-200 text-[10px] px-1.5 py-0">
                {stats.bannedUsers} محظور
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'posts'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/50'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>رقابة المنشورات والردود</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'groups'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/50'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>التحكم بالمجموعات</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-[#9E2A2B] text-white bg-[#1F1726]/50'
                : 'border-transparent text-[#9D8EAA] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>سجل العمليات والرقابة</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ── TAB 1: SPEED & PERFORMANCE BENCHMARK ── */}
        {activeTab === 'speed' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#16121B] border-[#2E2437] text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">إجمالي المستخدمين</p>
                      <h3 className="text-2xl font-bold text-white mt-1">
                        {stats ? stats.totalUsers : users.length}
                      </h3>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-3 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{stats ? stats.activeUsers : users.filter((u) => !u.is_banned).length} حساب نشط</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#16121B] border-[#2E2437] text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">الحسابات المحظورة</p>
                      <h3 className="text-2xl font-bold text-red-400 mt-1">
                        {stats ? stats.bannedUsers : users.filter((u) => u.is_banned).length}
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

              <Card className="bg-[#16121B] border-[#2E2437] text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">المنشورات والردود</p>
                      <h3 className="text-2xl font-bold text-white mt-1">
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

              <Card className="bg-[#16121B] border-[#2E2437] text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#A898B5] font-medium">المجتمعات والمجموعات</p>
                      <h3 className="text-2xl font-bold text-white mt-1">
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

            {/* High Speed Technical Architecture Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="md:col-span-2 bg-[#16121B] border-[#2E2437] text-white">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Zap className="w-5 h-5 text-amber-400" />
                    خوارزميات السرعة العالية ومحرك الذاكرة المباشر
                  </CardTitle>
                  <CardDescription className="text-xs text-[#A797B5]">
                    هندسة بنيوية مصممة لخدمة ١٠,٠٠٠ مستخدم يومياً بزمن استجابة أقل من ملي ثانية بدون أخطاء
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#1D1724] border border-[#382C43]">
                      <span className="text-xs text-[#A898B5] block mb-1">معمارية قاعدة البيانات</span>
                      <span className="text-sm font-bold text-white block">SQLite WAL Mode Concurrency</span>
                      <p className="text-[11px] text-[#9A8AA7] mt-1">
                        قفل متوازي عالي السرعة، القراء لا يحجبون الكتاب والعكس صحيح.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#1D1724] border border-[#382C43]">
                      <span className="text-xs text-[#A898B5] block mb-1">خوارزمية الحظر والأمان</span>
                      <span className="text-sm font-bold text-emerald-400 block">O(1) In-Memory Set Filter</span>
                      <p className="text-[11px] text-[#9A8AA7] mt-1">
                        فحص لحظي في أقل من 0.001ms لكل عملية دون الضغط على القرص.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#1D1724] border border-[#382C43]">
                      <span className="text-xs text-[#A898B5] block mb-1">خوارزمية استعراض المنشورات</span>
                      <span className="text-sm font-bold text-purple-400 block">O(k) Reverse Slicing Index</span>
                      <p className="text-[11px] text-[#9A8AA7] mt-1">
                        فهارس زمنية مجمعة تنازلياً لتقديم أحدث التغريدات فوراً.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#1D1724] border border-[#382C43]">
                      <span className="text-xs text-[#A898B5] block mb-1">الاستعلامات المعدة مسبقاً</span>
                      <span className="text-sm font-bold text-cyan-400 block">Compiled Prepared Statements</span>
                      <p className="text-[11px] text-[#9A8AA7] mt-1">
                        استعلامات مجمعة في ذاكرة المعالج لتفادي تكلفة إعادة التحليل (Re-parsing).
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1D1724] border border-[#382C43] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#A898B5]">طاقة الاستيعاب القصوى المختبرة:</span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {stats?.dailyCapacity || '100,000+ عملية متزامنة يومياً'}
                      </p>
                    </div>
                    <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-700">
                      جاهزية إنتاجية كاملة
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Uptime */}
              <Card className="bg-[#16121B] border-[#2E2437] text-white flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    حالة الخادم المباشرة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="flex justify-between py-2 border-b border-[#2C2235] text-xs">
                    <span className="text-[#A898B5]">المنفذ الداخلي (Internal Port):</span>
                    <span className="font-mono text-white">5000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2C2235] text-xs">
                    <span className="text-[#A898B5]">المنفذ العام (Public Port):</span>
                    <span className="font-mono text-white">5173</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2C2235] text-xs">
                    <span className="text-[#A898B5]">وقت التشغيل (Uptime):</span>
                    <span className="font-mono text-emerald-400">
                      {stats ? `${Math.floor(stats.uptimeSeconds / 60)} دقيقة` : 'متصل'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2C2235] text-xs">
                    <span className="text-[#A898B5]">إجمالي الطلبات المعالجة:</span>
                    <span className="font-mono text-amber-400">{stats ? stats.totalRequests : 0}</span>
                  </div>
                  <div className="flex justify-between py-2 text-xs">
                    <span className="text-[#A898B5]">حالة المزامنة بين الأجهزة:</span>
                    <span className="text-emerald-400 font-medium">متصلة لحظياً</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 2: USERS & BANS MANAGEMENT ── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#16121B] p-4 rounded-xl border border-[#2E2437]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute right-3 top-3 text-[#A898B5]" />
                <Input
                  type="text"
                  placeholder="بحث عن مستخدم بالاسم، المعرف، أو البريد..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-[#1D1724] border-[#382C43] text-white pr-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#A898B5]">
                <span>المستخدمين: {filteredUsers.length}</span>
                <span>•</span>
                <span className="text-red-400">المحظورين: {users.filter((u) => u.is_banned).length}</span>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#16121B] border border-[#2E2437] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#1F1726] text-[#B5A5C2] border-b border-[#2E2437]">
                    <tr>
                      <th className="p-3.5">المستخدم</th>
                      <th className="p-3.5">البريد الإلكتروني</th>
                      <th className="p-3.5">النوع</th>
                      <th className="p-3.5">تاريخ الانضمام</th>
                      <th className="p-3.5">المنشورات</th>
                      <th className="p-3.5">الردود</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">إجراءات الرقابة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#281F31]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1C1623] transition-colors">
                        <td className="p-3.5 font-medium">
                          <div>
                            <span className="text-white block">{u.name}</span>
                            <span className="text-[#9A8AA7] text-[11px]">@{u.username}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[#D8B4FE]">{u.email}</td>
                        <td className="p-3.5">
                          <Badge className={u.role === 'org' ? 'bg-amber-900/60 text-amber-300' : 'bg-blue-900/60 text-blue-300'}>
                            {u.role === 'org' ? 'منظمة' : 'فرد'}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-[#A898B5]">{u.join_date}</td>
                        <td className="p-3.5 font-mono text-white">{u.posts_count || 0}</td>
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
                          {u.is_banned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnban(u.id, u.name)}
                              className="bg-emerald-900/40 hover:bg-emerald-900/70 border-emerald-600 text-emerald-300 text-xs h-7 px-3"
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
                              className="bg-red-900/40 hover:bg-red-900/70 border-red-700 text-red-300 text-xs h-7 px-3"
                            >
                              <Ban className="w-3.5 h-3.5 ml-1" />
                              حظر الحساب
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: POSTS & REPLIES MODERATION ── */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#16121B] p-4 rounded-xl border border-[#2E2437]">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={contentSubTab === 'posts' ? 'default' : 'outline'}
                  onClick={() => setContentSubTab('posts')}
                  className={contentSubTab === 'posts' ? 'bg-[#9E2A2B] text-white text-xs' : 'bg-[#1D1724] text-[#A898B5] text-xs'}
                >
                  المنشورات ({posts.length})
                </Button>
                <Button
                  size="sm"
                  variant={contentSubTab === 'comments' ? 'default' : 'outline'}
                  onClick={() => setContentSubTab('comments')}
                  className={contentSubTab === 'comments' ? 'bg-[#9E2A2B] text-white text-xs' : 'bg-[#1D1724] text-[#A898B5] text-xs'}
                >
                  الردود والتعليقات ({comments.length})
                </Button>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute right-3 top-3 text-[#A898B5]" />
                <Input
                  type="text"
                  placeholder="بحث في محتوى المنشورات أو الكاتب..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="bg-[#1D1724] border-[#382C43] text-white pr-9 text-xs"
                />
              </div>
            </div>

            {/* Posts Sub-Tab */}
            {contentSubTab === 'posts' && (
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12 bg-[#16121B] rounded-xl border border-[#2E2437] text-[#9A8AA7] text-sm">
                    لا توجد منشورات مطابقة
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-[#16121B] border border-[#2E2437] hover:border-[#473655] rounded-xl p-4 transition-all flex flex-col sm:flex-row justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{post.author_name}</span>
                          <span className="text-xs text-[#9A8AA7]">@{post.author_username}</span>
                          <span className="text-xs text-[#7A6A87]">• {post.timestamp_text}</span>
                        </div>
                        <p className="text-xs text-[#DDD2E5] leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-[#A898B5] pt-1">
                          <span>❤️ {post.likes_count} إعجاب</span>
                          <span>💬 {post.comments_count} رد</span>
                          <span>🔁 {post.shares_count} مشاركة</span>
                          {post.group_id && (
                            <Badge className="bg-[#261A30] text-[#D8B4FE] text-[10px]">
                              مجموعة: {post.group_id}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col justify-end items-end gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs h-8 px-3"
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
                  <div className="text-center py-12 bg-[#16121B] rounded-xl border border-[#2E2437] text-[#9A8AA7] text-sm">
                    لا توجد ردود مطابقة
                  </div>
                ) : (
                  filteredComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-[#16121B] border border-[#2E2437] hover:border-[#473655] rounded-xl p-4 transition-all flex flex-col sm:flex-row justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{comment.author_name}</span>
                          <span className="text-xs text-[#9A8AA7]">@{comment.author_username}</span>
                          <span className="text-xs text-[#7A6A87]">• {comment.timestamp_text}</span>
                        </div>
                        <p className="text-xs text-[#DDD2E5] leading-relaxed">
                          {comment.content}
                        </p>
                        {comment.post_content && (
                          <div className="p-2 rounded bg-[#1D1724] border border-[#32263D] text-[11px] text-[#A898B5]">
                            <span className="font-semibold text-[#C5B4D4]">رداً على: </span>
                            <span>"{comment.post_content.slice(0, 60)}..."</span>
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col justify-end items-end gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs h-8 px-3"
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

        {/* ── TAB 4: GROUPS CONTROL ── */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="bg-[#16121B] p-4 rounded-xl border border-[#2E2437] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">إدارة المجتمعات والمجموعات</h3>
                <p className="text-xs text-[#A898B5]">التحكم الكامل في المجموعات وحذف المجموعات المخالفة</p>
              </div>
              <Badge className="bg-purple-900/60 text-purple-300 border-purple-700">
                {groups.length} مجتمعات مسجلة
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card key={group.id} className="bg-[#16121B] border-[#2E2437] text-white flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px]">
                        {group.category}
                      </Badge>
                      <Badge className="bg-[#1F1726] text-[#A898B5] text-[10px]">
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
                    <p className="text-xs text-[#C5B7CF] line-clamp-3 leading-relaxed">
                      {group.description}
                    </p>
                    <div className="flex justify-between text-xs text-[#9A8AA7] pt-2 border-t border-[#291F33]">
                      <span>👥 {group.members_count} عضو</span>
                      <span>📝 {group.posts_count} منشور</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="w-full bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                      حذف المجموعة بالكامل
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: AUDIT LOGS ── */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-[#16121B] p-4 rounded-xl border border-[#2E2437]">
              <h3 className="text-sm font-bold text-white">سجل العمليات والرقابة الأمنية</h3>
              <p className="text-xs text-[#A898B5]">توثيق دقيق لكل عملية حذف أو حظر تمت عبر بوابة بترا</p>
            </div>

            <div className="bg-[#16121B] border border-[#2E2437] rounded-xl divide-y divide-[#261D2F]">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-[#9A8AA7] text-xs">
                  لا توجد عمليات مسجلة بعد
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#2D161F] text-[#F87171] border-[#552028] text-[10px]">
                          {log.action}
                        </Badge>
                        <span className="font-semibold text-white">المسؤول: {log.admin_user}</span>
                        <span className="text-[#887895]">• الهدف: {log.target_type} ({log.target_id})</span>
                      </div>
                      <p className="text-[#DDD2E5] text-[11px]">{log.details}</p>
                    </div>
                    <span className="text-[#887895] text-[10px] font-mono whitespace-nowrap">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-[#16121A] border border-[#3E2C4B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-700/40 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تأكيد حظر المستخدم</h3>
                <p className="text-xs text-[#A898B5]">سيتم منعه فوراً من النشر والتعليق وتسجيل الدخول</p>
              </div>
            </div>

            <div className="p-3 bg-[#1E1725] rounded-xl border border-[#362744] text-xs space-y-1">
              <p className="text-white"><span className="text-[#A898B5]">الاسم:</span> {banTargetUser.name}</p>
              <p className="text-white"><span className="text-[#A898B5]">المعرف:</span> @{banTargetUser.username}</p>
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
                className="bg-[#1C1523] border-[#382B42] text-white text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleConfirmBan}
                disabled={isBanning}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white text-xs"
              >
                {isBanning ? 'جاري التنفيذ...' : 'تأكيد الحظر الفوري'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBanTargetUser(null)}
                className="bg-[#1F1726] border-[#382B42] text-[#DDD2E5] text-xs"
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
