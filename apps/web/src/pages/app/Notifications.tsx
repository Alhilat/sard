import { useState, useEffect } from 'react';
import {
  Bell, Heart, MessageCircle, UserPlus, Calendar, BookOpen, Info,
  CheckCheck, Smartphone, Volume2, ShieldCheck, Sparkles, Send
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { deviceNotificationService } from '@/services/deviceNotificationService';

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
  like: { icon: Heart, color: 'bg-red-100 dark:bg-red-950/40 text-red-500' },
  comment: { icon: MessageCircle, color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-500' },
  follow: { icon: UserPlus, color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-500' },
  activity: { icon: Calendar, color: 'bg-orange-100 dark:bg-orange-950/40 text-orange-500' },
  course: { icon: BookOpen, color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' },
  system: { icon: Info, color: 'bg-muted text-muted-foreground' },
};

export default function Notifications() {
  const { toast } = useToast();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');
  const [devicePermission, setDevicePermission] = useState<NotificationPermission>('default');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const filters = ['الكل', 'غير مقروءة', 'إعجابات', 'تعليقات', 'متابعون'];

  const fetchNotifications = () => {
    api.get<any>('/notifications')
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.notifications || res?.data || []);
        if (Array.isArray(list)) {
          setNotifs(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    if (deviceNotificationService.isSupported()) {
      setDevicePermission(deviceNotificationService.getPermission());
    }
  }, []);

  const handleEnableDeviceNotifications = async () => {
    const perm = await deviceNotificationService.requestPermission();
    setDevicePermission(perm);
    if (perm === 'granted') {
      toast({
        title: 'تم تفعيل إشعارات الجهاز بنجاح! 🔔',
        description: 'ستصلك الآن التنبيهات المباشرة ورسائل الأنشطة والدورات على جهازك حتى عند إغلاق التطبيق.',
      });
      fetchNotifications();
    } else if (perm === 'denied') {
      toast({
        variant: 'destructive',
        title: 'الإشعارات محظورة',
        description: 'يرجى السماح بالإشعارات من إعدادات المتصفح لجهازك لتلقي التنبيهات الفورية.',
      });
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      await deviceNotificationService.sendTestNotification();
      toast({
        title: 'تم إرسال إشعار تجريبي 🔔⚡',
        description: 'تحقق من التنبيه على شاشة جهازك وصوت المنبه الهادئ.',
      });
      fetchNotifications();
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر إرسال الإشعار التجريبي.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

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
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black font-display">الإشعارات</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs font-bold">{unreadCount} جديد</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-2 text-primary text-xs font-bold">
            <CheckCheck className="w-4 h-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {/* Device Notifications Banner Card */}
      <Card className="border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-foreground">إشعارات الجهاز والمنبه الفوري</h2>
                {devicePermission === 'granted' ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] h-5 gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    مفعلة على هذا الجهاز
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-600 bg-amber-500/10">
                    غير مفعلة بعد
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                استقبل إشعارات الرسائل وغرف الأنشطة وتنبيهات المنصة مباشرة على هاتفك أو حاسوبك مصحوبة بنغمة هادئة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {devicePermission !== 'granted' ? (
              <Button
                size="sm"
                onClick={handleEnableDeviceNotifications}
                className="text-xs font-bold gap-1.5 h-9 px-4 shadow-xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>تفعيل إشعارات جهازي</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendTestNotification}
                disabled={isSendingTest}
                className="text-xs font-bold gap-1.5 h-9 px-3.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'جاري الإرسال...' : 'إرسال إشعار تجريبي للجهاز'}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

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
              ستظهر هنا تنبيهات الإعجابات والتعليقات ومتابعات الأعضاء وغرف الأنشطة فور حدوثها.
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
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {notif.title || actorName}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.content}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
