import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Users, Building2, FileText, Calendar,
  BookOpen, Flag, Settings, ScrollText, Menu, X, ChevronDown,
  Bell, Shield,
  type LucideIcon
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  badge?: number;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'الرئيسية',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم', exact: true },
    ]
  },
  {
    label: 'إدارة المحتوى',
    items: [
      { href: '/admin/users', icon: Users, label: 'المستخدمون' },
      { href: '/admin/organizations', icon: Building2, label: 'المنظمات', badge: 12 },
      { href: '/admin/posts', icon: FileText, label: 'المنشورات', badge: 47 },
      { href: '/admin/activities', icon: Calendar, label: 'الأنشطة' },
      { href: '/admin/courses', icon: BookOpen, label: 'الدورات' },
    ]
  },
  {
    label: 'إشراف ومراقبة',
    items: [
      { href: '/admin/reports', icon: Flag, label: 'التقارير', badge: 47 },
      { href: '/admin/logs', icon: ScrollText, label: 'سجلات النظام' },
    ]
  },
  {
    label: 'إعدادات',
    items: [
      { href: '/admin/settings', icon: Settings, label: 'إعدادات المنصة' },
    ]
  },
];

// Brand admin colors — خمري داكن جداً
const ADMIN = {
  bg:       'hsl(0, 62%, 7%)',
  sidebar:  'hsl(0, 62%, 9%)',
  border:   'hsl(0, 50%, 14%)',
  hover:    'hsl(0, 50%, 14%)',
  active:   'hsl(0, 61%, 26%)',   // primary brand color
  header:   'hsl(0, 62%, 8%)',
  groupLabel: 'hsl(33, 15%, 42%)',
  text:     'hsl(33, 40%, 92%)',
  textMuted:'rgba(255,255,255,0.40)',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="flex min-h-screen" dir="rtl" style={{ background: ADMIN.bg }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — خمري داكن */}
      <aside className={`
        fixed top-0 start-0 h-full w-72 z-50 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:sticky lg:top-0 lg:h-screen
      `} style={{ background: ADMIN.sidebar, borderInlineStart: `1px solid ${ADMIN.border}` }}>

        {/* Logo */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${ADMIN.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ADMIN.active }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">لوحة الإدارة</p>
              <p className="text-xs" style={{ color: ADMIN.textMuted }}>سرد رقمي</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navGroups.map(group => (
            <div key={group.label} className="mb-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: ADMIN.groupLabel }}>
                {group.label}
              </p>
              {group.items.map(item => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 cursor-pointer transition-colors"
                      style={{
                        background: active ? ADMIN.active : 'transparent',
                        color: active ? '#ffffff' : ADMIN.textMuted,
                      }}
                      onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = ADMIN.hover; el.style.color = 'rgba(255,255,255,0.75)'; } }}
                      onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = ADMIN.textMuted; } }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge className="h-5 min-w-5 text-xs bg-red-500/20 text-red-400 border-red-500/30 px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Switch */}
        <div className="p-3" style={{ borderTop: `1px solid ${ADMIN.border}` }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: ADMIN.textMuted }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ADMIN.textMuted; }}
              >
                <ChevronDown className="w-4 h-4" />
                <span className="flex-1 text-start">تغيير الواجهة</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild><Link href="/app">👤 واجهة المستخدم</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/org">🏢 واجهة المنظمة</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin">⚙️ لوحة الإدارة</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/">🏠 الصفحة الرئيسية</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur h-16 flex items-center px-6 gap-4"
          style={{ background: ADMIN.header, borderBottom: `1px solid ${ADMIN.border}` }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: 'hsl(33,60%,68%)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>مشرف النظام</span>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <button className="p-2 rounded-xl transition-colors relative" style={{ color: 'rgba(255,255,255,0.40)' }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: ADMIN.active }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>
        <main className="flex-1 page-enter" style={{ color: ADMIN.text }}>
          {children}
        </main>
      </div>
    </div>
  );
}
