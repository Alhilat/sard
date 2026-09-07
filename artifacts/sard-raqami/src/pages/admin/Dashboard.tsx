import { Link } from 'wouter';
import { Users, Building2, FileText, Calendar, BookOpen, Flag, AlertTriangle, TrendingUp, ArrowLeft } from 'lucide-react';
import { adminStats, adminAnalyticsData, systemLogs } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const kpis = [
  { label: 'إجمالي المستخدمين', value: adminStats.totalUsers.toLocaleString('ar'), icon: Users, color: 'bg-blue-500', change: '+1,240' },
  { label: 'المنظمات', value: adminStats.totalOrgs, icon: Building2, color: 'bg-emerald-500', change: '+5' },
  { label: 'المنشورات', value: adminStats.totalPosts.toLocaleString('ar'), icon: FileText, color: 'bg-purple-500', change: '+2,100' },
  { label: 'الأنشطة النشطة', value: adminStats.totalActivities.toLocaleString('ar'), icon: Calendar, color: 'bg-orange-500', change: '+23' },
];

const alerts = [
  { icon: Building2, text: `${adminStats.pendingOrgs} منظمة تنتظر التوثيق`, color: 'text-amber-600 bg-amber-50 border-amber-200', href: '/admin/organizations' },
  { icon: Flag, text: `${adminStats.reportedPosts} منشور مُبلّغ عنه`, color: 'text-red-600 bg-red-50 border-red-200', href: '/admin/reports' },
  { icon: AlertTriangle, text: '2 أخطاء في السجلات الأخيرة', color: 'text-orange-600 bg-orange-50 border-orange-200', href: '/admin/logs' },
];

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ color: 'hsl(213,31%,91%)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">لوحة الإدارة</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215,16%,47%)' }}>
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge className="bg-blue-600 text-white border-blue-700">مشرف النظام</Badge>
      </div>

      {/* Alerts */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {alerts.map((alert, i) => (
          <Link key={i} href={alert.href}>
            <div className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${alert.color}`}>
              <alert.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{alert.text}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-5" style={{ background: 'hsl(222,47%,12%)', border: '1px solid hsl(222,47%,18%)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'hsl(171,50%,15%)', color: 'hsl(171,77%,60%)' }}>
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-black mb-1" style={{ color: 'hsl(213,31%,91%)' }}>{kpi.value}</p>
            <p className="text-xs" style={{ color: 'hsl(215,16%,47%)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User growth chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'hsl(222,47%,12%)', border: '1px solid hsl(222,47%,18%)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">نمو المستخدمين</h2>
            <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(222,47%,25%)', color: 'hsl(215,16%,55%)' }}>آخر 7 أشهر</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={adminAnalyticsData.userGrowth}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221,83%,63%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(221,83%,63%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'Cairo', fill: 'hsl(215,16%,47%)' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'Cairo', fill: 'hsl(215,16%,47%)' }} />
              <Tooltip contentStyle={{ background: 'hsl(222,47%,14%)', border: '1px solid hsl(222,47%,22%)', color: 'hsl(213,31%,80%)' }} formatter={(v: any) => [v.toLocaleString('ar'), 'مستخدم']} />
              <Area type="monotone" dataKey="users" stroke="hsl(221,83%,63%)" fill="url(#adminGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Content by type */}
        <div className="rounded-2xl p-5" style={{ background: 'hsl(222,47%,12%)', border: '1px solid hsl(222,47%,18%)' }}>
          <h2 className="font-bold mb-4">المحتوى حسب النوع</h2>
          <div className="space-y-3">
            {adminAnalyticsData.contentByType.map((item, i) => {
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'];
              const max = Math.max(...adminAnalyticsData.contentByType.map(x => x.value));
              const pct = (item.value / max) * 100;
              return (
                <div key={item.type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'hsl(215,16%,60%)' }}>{item.type}</span>
                    <span style={{ color: 'hsl(213,31%,80%)' }}>{item.value.toLocaleString('ar')}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'hsl(222,47%,20%)' }}>
                    <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent logs */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'hsl(222,47%,12%)', border: '1px solid hsl(222,47%,18%)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">آخر سجلات النظام</h2>
            <Link href="/admin/logs">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" style={{ color: 'hsl(221,83%,63%)' }}>
                عرض الكل <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {systemLogs.slice(0, 4).map(log => (
              <div key={log.id} className="flex items-center gap-3 text-xs py-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'error' ? 'bg-red-500' : log.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="flex-1 truncate" style={{ color: 'hsl(213,31%,75%)' }}>{log.message}</span>
                <span className="flex-shrink-0" style={{ color: 'hsl(215,16%,40%)' }}>{log.time.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-5" style={{ background: 'hsl(222,47%,12%)', border: '1px solid hsl(222,47%,18%)' }}>
          <h2 className="font-bold mb-4">إجراءات سريعة</h2>
          <div className="space-y-2">
            {[
              { label: 'مراجعة طلبات التوثيق', href: '/admin/organizations', badge: adminStats.pendingOrgs },
              { label: 'مراجعة البلاغات', href: '/admin/reports', badge: adminStats.reportedPosts },
              { label: 'إدارة المستخدمين', href: '/admin/users', badge: null },
              { label: 'إعدادات المنصة', href: '/admin/settings', badge: null },
              { label: 'سجلات النظام', href: '/admin/logs', badge: null },
            ].map(action => (
              <Link key={action.label} href={action.href}>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:opacity-80"
                  style={{ background: 'hsl(222,47%,16%)' }}>
                  <span className="text-sm" style={{ color: 'hsl(213,31%,80%)' }}>{action.label}</span>
                  {action.badge && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">{action.badge}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
