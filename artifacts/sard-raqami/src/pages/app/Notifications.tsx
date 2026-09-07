import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Calendar, BookOpen, Info, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/layouts/AppLayout';

interface NotificationItem {
  id: string;
  type: string;
  title?: string;
  content: string;
  read: boolean;
  time: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

const icons: Record<string, any> = {
  like: { icon: Heart, color: 'bg-red-100 text-red-500' },
  comment: { icon: MessageCircle, color: 'bg-blue-100 text-blue-500' },
  follow: { icon: UserPlus, color: 'bg-purple-100 text-purple-500' },
  activity: { icon: Calendar, color: 'bg-orange-100 text-orange-500' },
  course: { icon: BookOpen, color: 'bg-emerald-100 text-emerald-500' },
  system: { icon: Info, color: 'bg-muted text-muted-foreground' },
};

export default function Notifications() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');

  const filters = ['الكل', 'غير مقروءة', 'إعجابات', 'تعليقات', 'متابعون'];

  useEffect(() => {
    api.get<any>('/notifications')
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.notifications || res?.data || []);
        if (Array.isArray(list)) {
          setNotifs(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/mark-all-read', {});
    } catch {
      // best-effort
    }
  };

  const markRead = async (id: string) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch {
      // best-effort
    }
  };

  const filtered = notifs.filter((n) => {
    if (filter === 'غير مقروءة') return !n.read;
    if (filter === 'إعجابات') return n.type === 'like';
    if (filter === 'تعليقات') return n.type === 'comment';
    if (filter === 'متابعون') return n.type === 'follow';
    return true;
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black font-display">الإشعارات</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount} جديد</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-2 text-primary text-xs">
            <CheckCheck className="w-4 h-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
              filter === f
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-xs">جاري تحميل الإشعارات...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-3 bg-card rounded-2xl border border-border">
            <Bell className="w-12 h-12 mx-auto opacity-20 text-primary" />
            <p className="font-bold text-sm text-foreground">لا توجد إشعارات جديدة</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              ستظهر هنا تنبيهات الإعجابات والتعليقات ومتابعات الأعضاء الجدد فور حدوثها.
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const { icon: Icon, color } = icons[notif.type] || icons.system;
            const actorName = notif.user?.name || 'سرد';
            return (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-colors border ${
                  !notif.read
                    ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                    : 'bg-card border-border/60 hover:bg-muted/40'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar name={actorName} size="sm" />
                  <div className={`absolute -bottom-1 -end-1 w-4.5 h-4.5 rounded-full ${color} flex items-center justify-center border-2 border-background`}>
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground">
                    <span className="font-bold">{actorName}</span>{' '}
                    <span>{notif.content || notif.title}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{notif.time}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
