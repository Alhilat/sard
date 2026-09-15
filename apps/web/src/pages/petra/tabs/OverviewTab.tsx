import React from 'react';
import {
  Users, MessageSquare, BookOpen, Layers, CheckCircle, Ban, Server
} from 'lucide-react';
import { PetraStats, PetraUser, PetraPost, PetraComment, PetraArticle, PetraGroup } from '@/services/petraService';
import { PetraTab } from '../components/PetraNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OverviewTabProps {
  stats: PetraStats | null;
  users: PetraUser[];
  posts: PetraPost[];
  comments: PetraComment[];
  articles: PetraArticle[];
  groups: PetraGroup[];
  envStatus: {
    envConfigured: boolean;
    envUser: string;
    hasEnvPass: boolean;
    renderDetected: boolean;
  } | null;
  onNavigateTab: (tab: PetraTab) => void;
}

export default function OverviewTab({
  stats,
  users,
  posts,
  comments,
  articles,
  groups,
  envStatus,
  onNavigateTab,
}: OverviewTabProps) {
  const activeCount = users.filter((u) => !u.is_banned).length;
  const bannedCount = users.filter((u) => u.is_banned).length;

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'أقل من دقيقة';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} س و ${mins} د`;
    return `${mins} دقيقة`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="bg-[#140F1B] border-[#291F34] text-white hover:border-[#47365C] transition-colors rounded-2xl shadow-sm">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9F8EAE] font-medium">إجمالي المستخدمين</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {stats ? stats.totalUsers : users.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-400 mt-2.5 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{stats ? stats.activeUsers : activeCount} حساب نشط</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#140F1B] border-[#291F34] text-white hover:border-[#47365C] transition-colors rounded-2xl shadow-sm">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9F8EAE] font-medium">الحسابات المحظورة</p>
                <h3 className="text-2xl font-black text-red-400 mt-1">
                  {stats ? stats.bannedUsers : bannedCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Ban className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#9F8EAE] mt-2.5">
              ممنوعون من النشر والتفاعل
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#140F1B] border-[#291F34] text-white hover:border-[#47365C] transition-colors rounded-2xl shadow-sm">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9F8EAE] font-medium">المنشورات والردود</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {posts.length + comments.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#9F8EAE] mt-2.5">
              {posts.length} منشور • {comments.length} رد
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#140F1B] border-[#291F34] text-white hover:border-[#47365C] transition-colors rounded-2xl shadow-sm">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9F8EAE] font-medium">المقالات والتحليلات</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1">
                  {stats ? (stats.totalArticles ?? articles.length) : articles.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#9F8EAE] mt-2.5">
              {stats?.totalArticleComments ?? 0} تعليق ومناقشة
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#140F1B] border-[#291F34] text-white hover:border-[#47365C] transition-colors rounded-2xl shadow-sm">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9F8EAE] font-medium">المجتمعات والمجموعات</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {stats ? stats.totalGroups : groups.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#9F8EAE] mt-2.5">
              مجتمعات نشطة تحت الإشراف
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Server Health & Telemetry + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Server Telemetry Card */}
        <Card className="bg-[#140F1B] border-[#291F34] text-white rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white font-display">
              <Server className="w-4 h-4 text-emerald-400" />
              حالة الخادم والبيئة التقنية
            </CardTitle>
            <CardDescription className="text-xs text-[#9F8EAE]">
              مؤشرات حية لأداء النظام وقاعدة البيانات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-1">
            <div className="flex justify-between py-2 border-b border-[#241B2E] text-xs">
              <span className="text-[#9F8EAE]">محرك البيانات:</span>
              <span className="font-mono text-white font-medium">{stats?.dbEngine || 'SQLite 3 (WAL)'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#241B2E] text-xs">
              <span className="text-[#9F8EAE]">بيئة التشغيل:</span>
              <span className="font-mono text-emerald-400 font-medium">Node.js {stats?.nodeVersion || 'v22'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#241B2E] text-xs">
              <span className="text-[#9F8EAE]">استهلاك الذاكرة (Heap):</span>
              <span className="font-mono text-cyan-300">
                {stats?.memoryHeapUsedMb ? `${stats.memoryHeapUsedMb} MB / ${stats.memoryHeapTotalMb || 0} MB` : '32 MB'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#241B2E] text-xs">
              <span className="text-[#9F8EAE]">وقت التشغيل المستمر:</span>
              <span className="font-mono text-emerald-400 font-medium">
                {formatUptime(stats?.uptimeSeconds)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#241B2E] text-xs">
              <span className="text-[#9F8EAE]">إجمالي الطلبات المعالجة:</span>
              <span className="font-mono text-amber-400 font-bold">{stats?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#241B2E] text-xs">
              <span className="text-[#9F8EAE]">البث اللحظي (WebSocket):</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                متصل على /ws
              </span>
            </div>
            <div className="flex justify-between py-2 text-xs">
              <span className="text-[#9F8EAE]">مصدر بيانات الاعتماد:</span>
              <span className="font-mono text-[#D8B4FE]">
                {envStatus?.renderDetected ? 'Render Env (PETRA_USER / PASS)' : 'Environment Variables'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users Activity Card */}
        <Card className="bg-[#140F1B] border-[#291F34] text-white flex flex-col justify-between rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-white font-display">
                <Users className="w-4 h-4 text-blue-400" />
                أحدث الحسابات المنضمة
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('users')}
                className="text-xs text-blue-400 hover:text-blue-300 p-0 h-auto cursor-pointer"
              >
                إدارة الكل ({users.length}) ←
              </Button>
            </div>
            <CardDescription className="text-xs text-[#9F8EAE]">
              آخر المستخدمين المسجلين في المنصة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 flex-1">
            {users.slice(0, 4).map((u) => (
              <div
                key={u.id}
                className="p-2.5 rounded-xl bg-[#1B1424] border border-[#30243C] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs shrink-0">
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
        <Card className="bg-[#140F1B] border-[#291F34] text-white flex flex-col justify-between rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-white font-display">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                أحدث المنشورات في الساحة
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('posts')}
                className="text-xs text-purple-400 hover:text-purple-300 p-0 h-auto cursor-pointer"
              >
                إدارة الكل ({posts.length}) ←
              </Button>
            </div>
            <CardDescription className="text-xs text-[#9F8EAE]">
              متابعة المحتوى المطروح مؤخراً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 flex-1">
            {posts.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-[#1B1424] border border-[#30243C] text-xs space-y-1.5"
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
  );
}
