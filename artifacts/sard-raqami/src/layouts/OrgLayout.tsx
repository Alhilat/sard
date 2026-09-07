import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Calendar, BookOpen, Users, BarChart3,
  FileText, Building2, Settings, Menu, X, ChevronDown,
  Bell, LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { currentOrg } from '@/lib/mock-data';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/org', icon: LayoutDashboard, label: 'لوحة التحكم', exact: true },
  { href: '/org/activities', icon: Calendar, label: 'الأنشطة' },
  { href: '/org/courses', icon: BookOpen, label: 'الدورات' },
  { href: '/org/members', icon: Users, label: 'الأعضاء' },
  { href: '/org/analytics', icon: BarChart3, label: 'التحليلات' },
  { href: '/org/posts', icon: FileText, label: 'المنشورات' },
  { href: '/org/profile', icon: Building2, label: 'ملف المنظمة' },
  { href: '/org/settings', icon: Settings, label: 'الإعدادات' },
];

const ORG = {
  bg: '#2C1D11',
  border: '#3D2B1C',
  active: '#D48B38',
  hover: 'rgba(212,139,56,0.12)',
  statBg: 'rgba(255,255,255,0.06)',
};

function OrgAvatar({ name }: { name: string }) {
  const safeName = name || 'م';
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
      style={{ background: ORG.active }}
    >
      {safeName.slice(0, 2)}
    </div>
  );
}

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const orgDisplayName = (user?.role === 'org' && user?.name) ? user.name : currentOrg.name;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — بني دافئ */}
      <aside className={`
        fixed top-0 start-0 h-full w-72 z-50 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:sticky lg:top-0 lg:h-screen
      `} style={{ background: ORG.bg, borderInlineStart: `1px solid ${ORG.border}` }}>

        {/* Logo */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${ORG.border}` }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ORG.active }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base text-white">لوحة المنظمة</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Org info */}
        <div className="p-4" style={{ borderBottom: `1px solid ${ORG.border}` }}>
          <div className="flex items-center gap-3">
            <OrgAvatar name={orgDisplayName} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-white truncate">{orgDisplayName}</p>
                <span style={{ color: ORG.active }} className="text-xs font-bold">✓</span>
              </div>
              <p className="text-xs text-white/50 truncate">منظمة مجتمعية معتمدة</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="text-center rounded-lg py-1.5" style={{ background: ORG.statBg }}>
              <p className="text-white font-bold text-sm">{currentOrg.activities}</p>
              <p className="text-white/50 text-xs">نشاط مجتمعي</p>
            </div>
            <div className="text-center rounded-lg py-1.5" style={{ background: ORG.statBg }}>
              <p className="text-white font-bold text-sm">{currentOrg.courses}</p>
              <p className="text-white/50 text-xs">دورات تدريبية</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(item => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 cursor-pointer transition-colors"
                  style={{
                    background: active ? ORG.active : 'transparent',
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ORG.hover; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Switch */}
        <div className="p-3" style={{ borderTop: `1px solid ${ORG.border}` }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white text-sm transition-colors cursor-pointer">
                <ChevronDown className="w-4 h-4" />
                <span className="flex-1 text-start">الواجهات والحساب</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 text-xs">
              <DropdownMenuItem asChild><Link href="/app">👤 واجهة المستخدم (سرد)</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/org">🏢 واجهة المنظمة</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/">🏠 الصفحة الرئيسية</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-bold">
                <LogOut className="w-3.5 h-3.5 ms-1" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border h-16 flex items-center px-6 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold" style={{ background: 'hsl(33,55%,88%)', color: 'hsl(15,55%,28%)', border: '1px solid hsl(33,30%,80%)' }}>
              منظمة موثّقة ✓
            </Badge>
            <span className="text-sm font-semibold text-foreground">{orgDisplayName}</span>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>
            <OrgAvatar name={orgDisplayName} />
          </div>
        </header>
        <main className="flex-1 page-enter">{children}</main>
      </div>
    </div>
  );
}
