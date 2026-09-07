import { useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Calendar, BookOpen, Info, CheckCheck } from 'lucide-react';
import { notifications as initialNotifs } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/layouts/AppLayout';

const icons: Record<string, any> = {
  like: { icon: Heart, color: 'bg-red-100 text-red-500' },
  comment: { icon: MessageCircle, color: 'bg-blue-100 text-blue-500' },
  follow: { icon: UserPlus, color: 'bg-purple-100 text-purple-500' },
  activity: { icon: Calendar, color: 'bg-orange-100 text-orange-500' },
  course: { icon: BookOpen, color: 'bg-emerald-100 text-emerald-500' },
  system: { icon: Info, color: 'bg-muted text-muted-foreground' },
};

export default function Notifications() {
  const [notifs, setNotifs] = useState(initialNotifs);
  const [filter, setFilter] = useState('الكل');

  const filters = ['الكل', 'غير مقروءة', 'إعجابات', 'تعليقات', 'متابعون'];

  const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));

  const filtered = notifs.filter(n => {
    if (filter === 'غير مقروءة') return !n.read;
    if (filter === 'إعجابات') return n.type === 'like';
    if (filter === 'تعليقات') return n.type === 'comment';
    if (filter === 'متابعون') return n.type === 'follow';
    return true;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black">الإشعارات</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">{unreadCount} جديد</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-2 text-primary">
            <CheckCheck className="w-4 h-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">لا توجد إشعارات</p>
          </div>
        ) : (
          filtered.map(notif => {
            const { icon: Icon, color } = icons[notif.type] || icons.system;
            return (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${!notif.read ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-muted/50'}`}
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar name={notif.user.name} />
                  <div className={`absolute -bottom-1 -end-1 w-5 h-5 rounded-full ${color} flex items-center justify-center border-2 border-background`}>
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold">{notif.user.name}</span>
                    {' '}{notif.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
