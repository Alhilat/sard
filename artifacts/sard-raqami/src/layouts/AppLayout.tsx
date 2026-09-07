import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home, Sparkles, Newspaper, Calendar, BookOpen, Users, MessageSquare,
  Bell, Search, Settings, LogOut, Menu, X, ChevronDown,
  Building2, User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/app', icon: Home, label: 'الرئيسية', exact: true },
  { href: '/app/feed', icon: Sparkles, label: 'سرد' },
  { href: '/app/activities', icon: Calendar, label: 'الأنشطة' },
  { href: '/app/courses', icon: BookOpen, label: 'الدورات' },
  { href: '/app/groups', icon: Users, label: 'المجموعات' },
  { href: '/app/messages', icon: MessageSquare, label: 'الرسائل' },
  { href: '/app/notifications', icon: Bell, label: 'الإشعارات' },
  { href: '/app/search', icon: Search, label: 'البحث' },
  { href: '/app/settings', icon: Settings, label: 'الإعدادات' },
];

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const safeName = name || 'م';
  const initials = safeName.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('');
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0 shadow-2xs`}>
      {initials || 'س'}
    </div>
  );
}

export { UserAvatar };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      api.get<any>('/notifications/unread-count')
        .then((data) => {
          const count = typeof data?.count === 'number' ? data.count : (data?.unreadCount || 0);
          setUnreadCount(count);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    return () => clearInterval(interval);
  }, [user, location]);

  const displayName = user?.name || 'مستخدم سرد';
  const displayUsername = user?.username || (user?.email ? user.email.split('@')[0] : 'user');

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 start-0 h-full w-72 bg-sidebar text-sidebar-foreground z-50
        flex flex-col border-e border-sidebar-border
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:sticky lg:top-0 lg:h-screen
      `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-lg font-display">س</span>
            </div>
            <span className="font-bold text-xl text-sidebar-foreground font-display">سرد رقمي</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User profile mini */}
        <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/30">
          <Link href="/app/profile" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <UserAvatar name={displayName} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">@{displayUsername}</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer
                  transition-colors duration-150 group select-none
                  ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-2xs'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }
                `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.href === '/app/notifications' && unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User & Role Switcher */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground text-xs font-semibold transition-colors cursor-pointer">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="flex-1 text-start">الواجهات والحساب</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuItem asChild>
                <Link href="/app/profile" className="cursor-pointer">👤 الملف الشخصي</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/settings" className="cursor-pointer">⚙️ إعدادات الحساب</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app" className="cursor-pointer">📱 واجهة المستخدم (سرد)</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/org" className="cursor-pointer">🏢 واجهة المنظمات</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">🏠 الصفحة العامة للمنصة</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer font-bold"
              >
                <LogOut className="w-3.5 h-3.5 ms-1" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border h-16 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <Link href="/app/search">
              <div className="flex items-center gap-2 bg-muted/60 border border-border/60 rounded-xl px-4 py-2 text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors">
                <Search className="w-4 h-4" />
                <span>ابحث عن أشخاص، أنشطة، دورات، وسردات...</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <Link href="/app/notifications">
              <button
                className="relative p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 end-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>
            <Link href="/app/messages">
              <button
                className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                title="الرسائل"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/app/profile" title={displayName}>
              <UserAvatar name={displayName} size="sm" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 page-enter pb-20 lg:pb-6 overflow-x-hidden">{children}</main>

        {/* Mobile Sticky Bottom Navigation Bar */}
        <nav
          aria-label="التنقل السريع للهاتف"
          className="lg:hidden fixed bottom-0 start-0 end-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/80 px-2 py-1.5 flex items-center justify-around shadow-lg"
        >
          {[
            { href: '/app', icon: Home, label: 'الرئيسية', exact: true },
            { href: '/app/feed', icon: Sparkles, label: 'سرد' },
            { href: '/app/activities', icon: Calendar, label: 'الأنشطة' },
            { href: '/app/groups', icon: Users, label: 'المجموعات' },
            { href: '/app/profile', icon: UserIcon, label: 'حسابي' },
          ].map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'text-primary font-bold scale-105'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

