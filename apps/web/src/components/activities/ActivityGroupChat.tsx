import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, ArrowRight, Shield, Lock, Globe, VolumeX,
  Megaphone, Users, Send, Pin, AlertCircle, Sparkles, CheckCircle2,
  Calendar, MapPin, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Activity, ActivityChatMessage, ActivityChatSettings, ActivityChatPermissionMode, activitiesService
} from '@/services/activitiesService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityGroupChatProps {
  activity: Activity;
  onBack: () => void;
}

export default function ActivityGroupChat({ activity, onBack }: ActivityGroupChatProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Only verified users, admins, organizations, or the activity organizer can moderate or stop/open chat
  const isVerifiedModerator = Boolean(
    user?.verified ||
    user?.role === 'admin' ||
    user?.role === 'org' ||
    user?.id === activity.org_id ||
    user?.id === activity.organization?.id ||
    user?.id === activity.org?.id
  );

  const [messages, setMessages] = useState<ActivityChatMessage[]>([]);
  const [settings, setSettings] = useState<ActivityChatSettings>({
    activityId: activity.id,
    permissionMode: 'all',
  });
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Active role is strictly organizer if verified moderator, otherwise strictly attendee
  const activeRole: 'organizer' | 'attendee' = isVerifiedModerator ? 'organizer' : 'attendee';

  // Pinned announcement edit modal/state
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [pinText, setPinText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat settings and messages, with 2.5s polling so everyone receives messages live
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [fetchedSettings, fetchedMessages] = await Promise.all([
          activitiesService.getChatSettings(activity.id),
          activitiesService.getChatMessages(activity.id),
        ]);
        if (!isMounted) return;
        setSettings(fetchedSettings);
        setPinText(fetchedSettings.pinnedAnnouncement || '');
        setMessages(fetchedMessages);
      } catch (err) {
        console.error('Failed to load initial activity chat:', err);
      }
    };

    fetchInitialData();

    // Poll every 2.5 seconds to receive messages from other participants live
    const pollTimer = setInterval(async () => {
      try {
        const [newSettings, newMessages] = await Promise.all([
          activitiesService.getChatSettings(activity.id),
          activitiesService.getChatMessages(activity.id),
        ]);
        if (!isMounted) return;

        setSettings((prev) => {
          if (
            prev.permissionMode !== newSettings.permissionMode ||
            prev.pinnedAnnouncement !== newSettings.pinnedAnnouncement
          ) {
            return newSettings;
          }
          return prev;
        });

        setMessages((prev) => {
          if (
            newMessages.length !== prev.length ||
            (newMessages.length > 0 &&
              newMessages[newMessages.length - 1].id !== prev[prev.length - 1]?.id)
          ) {
            return newMessages;
          }
          return prev;
        });
      } catch {
        // silent polling error
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [activity.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Organizer permission change handler
  const handleUpdatePermission = async (mode: ActivityChatPermissionMode) => {
    try {
      const updated = await activitiesService.updateChatSettings(activity.id, {
        permissionMode: mode,
      });
      setSettings(updated);

      const modeTitles: Record<ActivityChatPermissionMode, string> = {
        all: 'المحادثة مفتوحة للجميع',
        organizer_only: 'وضع إعلانات المنظم فقط',
        muted: 'إيقاف إرسال الرسائل مؤقتاً',
      };

      toast({
        title: 'تم تحديث صلاحيات الغرفة',
        description: `الوضع الحالي الآن: ${modeTitles[mode]}. تم تطبيقه على جميع المشاركين.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر تحديث إعدادات الغرفة.',
      });
    }
  };

  // Organizer update pinned announcement
  const handleSavePin = async () => {
    try {
      const updated = await activitiesService.updateChatSettings(activity.id, {
        pinnedAnnouncement: pinText.trim() || undefined,
      });
      setSettings(updated);
      setIsEditingPin(false);
      toast({
        title: pinText.trim() ? 'تم تثبيت الإعلان' : 'تمت إزالة التثبيت',
        description: pinText.trim() ? 'يظهر الإعلان الآن أعلى المحادثة لجميع المشاركين.' : 'تم حذف الإعلان المثبت.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر حفظ الإعلان.',
      });
    }
  };

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content) return;

    // Check permissions if acting as attendee
    if (activeRole === 'attendee') {
      if (settings.permissionMode === 'organizer_only') {
        toast({
          variant: 'destructive',
          title: 'غير مسموح بالإرسال',
          description: 'إرسال الرسائل مقتصر على منظم الفعالية فقط في هذا الوقت.',
        });
        return;
      }
      if (settings.permissionMode === 'muted') {
        toast({
          variant: 'destructive',
          title: 'المحادثة مغلقة مؤقتاً',
          description: 'تم إيقاف إرسال الرسائل مؤقتاً بواسطة منظم الفعالية.',
        });
        return;
      }
    }

    setIsSending(true);
    try {
      const isOrg = isVerifiedModerator;
      const senderName = isOrg
        ? user?.name || activity.org?.name || activity.organization?.name || 'منظم الفعالية'
        : user?.name || 'مشارك';
      const senderRole: 'organizer' | 'attendee' = isOrg ? 'organizer' : 'attendee';

      const created = await activitiesService.sendChatMessage(activity.id, {
        senderName,
        senderRole,
        content,
        isAnnouncement: isOrg && settings.permissionMode === 'organizer_only',
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created];
      });
      setInputText('');
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر إرسال الرسالة.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Determine if input is disabled for current user
  const isInputDisabled =
    !isVerifiedModerator &&
    (settings.permissionMode === 'organizer_only' || settings.permissionMode === 'muted');

  const orgDisplayName = activity.org?.name || activity.organization?.name || activity.orgName || 'الجهة المنظمة';

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12" dir="rtl">
      {/* Top Bar Navigation & Role Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-card-border p-3.5 sm:p-4 rounded-2xl shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span>العودة إلى تفاصيل الفعالية</span>
        </button>

        {/* Verification / Role Badge */}
        {isVerifiedModerator ? (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-xl self-start sm:self-auto text-xs font-bold text-primary">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>حساب موثق / منظم الفعالية 🛡️ (صلاحيات التحكم)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-muted/60 border border-border px-3.5 py-1.5 rounded-xl self-start sm:self-auto text-xs font-semibold text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>مشارك مسجل في الفعالية 🎟️</span>
          </div>
        )}
      </div>

      {/* Main Chat Header Card */}
      <Card className="border-card-border overflow-hidden shadow-xs bg-card">
        <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-foreground font-display">
                  غرفة نقاش: {activity.title}
                </h1>
                <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary bg-primary/5">
                  مجتمع الفعالية المباشر
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-foreground">{orgDisplayName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {activity.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  محادثة نشطة
                </span>
              </p>
            </div>
          </div>

          {/* Current Chat Mode Badge */}
          <div className="flex items-center gap-2">
            {settings.permissionMode === 'all' && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs py-1 px-3 gap-1.5 font-bold">
                <Globe className="w-3.5 h-3.5" />
                <span>محادثة مفتوحة للجميع</span>
              </Badge>
            )}
            {settings.permissionMode === 'organizer_only' && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs py-1 px-3 gap-1.5 font-bold">
                <Megaphone className="w-3.5 h-3.5" />
                <span>المنظم فقط (قناة إعلانات)</span>
              </Badge>
            )}
            {settings.permissionMode === 'muted' && (
              <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 text-xs py-1 px-3 gap-1.5 font-bold">
                <VolumeX className="w-3.5 h-3.5" />
                <span>موقوفة مؤقتاً</span>
              </Badge>
            )}
          </div>
        </div>

        {/* ORGANIZER CONTROL PANEL (Only shows for verified users / organizers) */}
        {isVerifiedModerator && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/80">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span>لوحة تحكم المنظم المعتمد في صلاحيات الغرفة</span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                بصفتك حساباً موثقاً أو منظم الفعالية، يمكنك التحكم في صلاحيات الإرسال وتثبيت الإعلانات
              </span>
            </div>

            {/* Three Mode Options */}
            <div className="grid sm:grid-cols-3 gap-2.5">
              {/* Mode 1: All can send */}
              <button
                type="button"
                onClick={() => handleUpdatePermission('all')}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  settings.permissionMode === 'all'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-2xs ring-1 ring-emerald-500/30'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الجميع يمكنهم الإرسال</span>
                  </div>
                  {settings.permissionMode === 'all' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <span className="text-[11px] opacity-80 leading-relaxed">
                  محادثة تفاعلية مفتوحة للنقاش والأسئلة لجميع الحضور والمنظمين.
                </span>
              </button>

              {/* Mode 2: Organizer only */}
              <button
                type="button"
                onClick={() => handleUpdatePermission('organizer_only')}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  settings.permissionMode === 'organizer_only'
                    ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-2xs ring-1 ring-amber-500/30'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                    <span>إعلانات المنظم فقط</span>
                  </div>
                  {settings.permissionMode === 'organizer_only' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <span className="text-[11px] opacity-80 leading-relaxed">
                  يقتصر الإرسال على المنظمين لبث التحديثات والتوجيهات التنظيمية.
                </span>
              </button>

              {/* Mode 3: Muted */}
              <button
                type="button"
                onClick={() => handleUpdatePermission('muted')}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  settings.permissionMode === 'muted'
                    ? 'border-red-600 bg-red-500/10 text-red-800 dark:text-red-300 shadow-2xs ring-1 ring-red-500/30'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-red-600" />
                    <span>إيقاف المحادثة مؤقتاً</span>
                  </div>
                  {settings.permissionMode === 'muted' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                  )}
                </div>
                <span className="text-[11px] opacity-80 leading-relaxed">
                  إغلاق الغرفة مؤقتاً ومنع أي رسائل جديدة حتى فتحها مجدداً.
                </span>
              </button>
            </div>

            {/* Pinned Announcement Editor */}
            <div className="mt-3.5 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Pin className="w-3.5 h-3.5 text-amber-600" />
                <span>إعلان مثبت في أعلى الغرفة:</span>
                <span className="text-muted-foreground text-[11px] truncate max-w-xs">
                  {settings.pinnedAnnouncement || 'لا يوجد إعلان مثبت حالياً'}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1 text-primary border-primary/30"
                onClick={() => setIsEditingPin(!isEditingPin)}
              >
                <Sparkles className="w-3 h-3" />
                <span>{isEditingPin ? 'إلغاء التعديل' : 'تعديل أو تثبيت إعلان'}</span>
              </Button>
            </div>

            {isEditingPin && (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={pinText}
                  onChange={(e) => setPinText(e.target.value)}
                  placeholder="اكتب الإعلان أو رابط البث المباشر لتثبيته أعلى الغرفة..."
                  className="text-xs h-8 bg-background"
                />
                <Button size="sm" className="text-xs h-8 px-3 shrink-0" onClick={handleSavePin}>
                  حفظ وتثبيت
                </Button>
              </div>
            )}
          </div>
        )}

        {/* PINNED ANNOUNCEMENT BANNER */}
        {settings.pinnedAnnouncement && (
          <div className="p-3 sm:px-5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 text-xs">
              <Pin className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-black text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                إعلان مثبت
              </span>
              <span className="font-semibold">{settings.pinnedAnnouncement}</span>
            </div>
            {isVerifiedModerator && (
              <button
                type="button"
                onClick={() => {
                  setPinText('');
                  handleSavePin();
                }}
                className="text-[11px] text-amber-700 dark:text-amber-400 underline hover:text-amber-950 transition-colors shrink-0"
              >
                إلغاء التثبيت
              </button>
            )}
          </div>
        )}

        {/* MESSAGES LIST AREA */}
        <div className="h-[460px] overflow-y-auto p-4 sm:p-5 space-y-4 bg-muted/5 flex flex-col">
          {messages.length === 0 ? (
            <div className="m-auto text-center py-12 max-w-sm text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground/60 border border-border">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm text-foreground mb-1">لا توجد رسائل بعد</p>
              <p className="text-xs leading-relaxed">
                كن أول من يشارك بسؤال أو ترحيب في غرفة نقاش هذه الفعالية!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = user?.id ? msg.senderId === user.id : false;
              const isOrgMsg = msg.senderRole === 'organizer';
              const isAnnouncement = Boolean(msg.isAnnouncement);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] ${
                    isMe ? 'self-end' : 'self-start'
                  }`}
                >
                  {/* Sender Name & Role Header */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">{msg.senderName}</span>
                    {isOrgMsg ? (
                      <span className="bg-primary/15 text-primary border border-primary/20 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        منظم الفعالية
                      </span>
                    ) : (
                      <span className="bg-muted text-muted-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                        مشارك
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-[10px] opacity-75">{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs relative ${
                      isAnnouncement
                        ? 'bg-amber-500/15 border-2 border-amber-500/40 text-amber-950 dark:text-amber-100 rounded-tr-none'
                        : isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : isOrgMsg
                        ? 'bg-primary/10 border border-primary/25 text-foreground rounded-tl-none'
                        : 'bg-card border border-border text-foreground rounded-tl-none'
                    }`}
                  >
                    {isAnnouncement && (
                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-300 mb-1.5 pb-1 border-b border-amber-500/20">
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>إعلان رسمي من منظم الفعالية</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT COMPOSER / DISABLED NOTICE */}
        <div className="p-3 sm:p-4 border-t border-border bg-card">
          {isInputDisabled ? (
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground text-center">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span>
                {settings.permissionMode === 'organizer_only'
                  ? 'إرسال الرسائل مقتصر على منظم الفعالية في الوقت الحالي (وضع الإعلانات).'
                  : 'تم إيقاف المحادثة مؤقتاً بواسطة منظم الفعالية.'}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isVerifiedModerator
                    ? settings.permissionMode === 'organizer_only'
                      ? 'اكتب إعلاناً رسمياً لجميع المشاركين...'
                      : 'اكتب رسالة أو توجيهاً بصفتك منظم الفعالية...'
                    : 'شارك سؤالك أو تعليقك في غرفة نقاش الفعالية...'
                }
                className="text-xs sm:text-sm h-11 bg-muted/30 focus-visible:ring-primary"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="h-11 px-5 gap-2 shrink-0 font-bold"
              >
                <span>إرسال</span>
                <Send className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
