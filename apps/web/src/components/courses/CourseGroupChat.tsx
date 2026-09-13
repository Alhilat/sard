import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, ArrowRight, Shield, Lock, Globe, VolumeX,
  Megaphone, Users, Send, Pin, Sparkles, CheckCircle2,
  BookOpen, Settings, X, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Course, ChatMessage, CourseChatSettings, ChatPermissionMode, coursesService
} from '@/services/coursesService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CourseGroupChatProps {
  course: Course;
  onBack: () => void;
}

export default function CourseGroupChat({ course, onBack }: CourseGroupChatProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Only verified users, admins, organizations, or the course instructor can moderate or stop/open chat
  const isVerifiedModerator = Boolean(
    user?.verified ||
    user?.role === 'admin' ||
    user?.role === 'org' ||
    user?.id === course.instructor?.id ||
    user?.id === course.org_id ||
    user?.id === (course as any).instructor_id
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<CourseChatSettings>({
    courseId: course.id,
    permissionMode: 'all',
  });
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [pinText, setPinText] = useState('');

  const activeRole: 'instructor' | 'student' = isVerifiedModerator ? 'instructor' : 'student';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat settings and messages, with 2.5s polling so everyone receives messages
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [fetchedSettings, fetchedMessages] = await Promise.all([
          coursesService.getChatSettings(course.id),
          coursesService.getChatMessages(course.id),
        ]);
        if (!isMounted) return;
        setSettings(fetchedSettings);
        setPinText(fetchedSettings.pinnedAnnouncement || '');
        setMessages(fetchedMessages);
      } catch (err) {
        console.error('Failed to load initial course chat:', err);
      }
    };

    fetchInitialData();

    const pollTimer = setInterval(async () => {
      try {
        const [newSettings, newMessages] = await Promise.all([
          coursesService.getChatSettings(course.id),
          coursesService.getChatMessages(course.id),
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
  }, [course.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Instructor permission change handler
  const handleUpdatePermission = async (mode: ChatPermissionMode) => {
    try {
      const updated = await coursesService.updateChatSettings(course.id, {
        permissionMode: mode,
      });
      setSettings(updated);

      const modeTitles: Record<ChatPermissionMode, string> = {
        all: 'المحادثة مفتوحة للجميع',
        instructor_only: 'وضع إعلانات المعلم فقط',
        muted: 'إيقاف إرسال الرسائل مؤقتاً',
      };

      toast({
        title: 'تم تحديث صلاحيات الغرفة',
        description: `الوضع الحالي الآن: ${modeTitles[mode]}. تم تطبيقه على جميع الطلاب.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر تحديث إعدادات الغرفة.',
      });
    }
  };

  // Instructor update pinned announcement
  const handleSavePin = async () => {
    try {
      const updated = await coursesService.updateChatSettings(course.id, {
        pinnedAnnouncement: pinText.trim() || undefined,
      });
      setSettings(updated);
      toast({
        title: pinText.trim() ? 'تم تثبيت الإعلان' : 'تمت إزالة التثبيت',
        description: pinText.trim() ? 'يظهر الإعلان الآن أعلى المحادثة لجميع الطلاب.' : 'تم حذف الإعلان المثبت.',
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

    if (activeRole === 'student') {
      if (settings.permissionMode === 'instructor_only') {
        toast({
          variant: 'destructive',
          title: 'غير مسموح بالإرسال',
          description: 'إرسال الرسائل مقتصر على معلم الدورة فقط في هذا الوقت.',
        });
        return;
      }
      if (settings.permissionMode === 'muted') {
        toast({
          variant: 'destructive',
          title: 'المحادثة مغلقة مؤقتاً',
          description: 'تم إيقاف إرسال الرسائل مؤقتاً بواسطة معلم الدورة.',
        });
        return;
      }
    }

    setIsSending(true);
    try {
      const isInstructor = isVerifiedModerator;
      const senderName = isInstructor
        ? user?.name || course.instructor?.name || 'معلم الدورة'
        : user?.name || 'طالب';
      const senderRole: 'instructor' | 'student' = isInstructor ? 'instructor' : 'student';

      const created = await coursesService.sendChatMessage(course.id, {
        senderName,
        senderRole,
        content,
        isAnnouncement: isInstructor && settings.permissionMode === 'instructor_only',
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

  const isInputDisabled =
    !isVerifiedModerator &&
    (settings.permissionMode === 'instructor_only' || settings.permissionMode === 'muted');

  const instructorDisplayName = course.instructor?.name || 'المدرب المعتمد';

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col h-[100dvh] w-full overflow-hidden" dir="rtl">
      {/* 1. Full-Screen Chat Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3 shrink-0 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
            title="العودة"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black text-foreground font-display truncate">
                {course.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                مجتمع تفاعلي
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
              <span className="font-semibold text-foreground/80">{instructorDisplayName}</span>
              <span>•</span>
              <span>غرفة طلاب الدورة</span>
            </p>
          </div>
        </div>

        {/* Status Badge & Authorized Controls Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Room Mode Badge */}
          {settings.permissionMode === 'all' && (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] sm:text-xs py-1 px-2.5 gap-1 font-bold">
              <Globe className="w-3 h-3" />
              <span className="hidden sm:inline">مفتوحة للجميع</span>
            </Badge>
          )}
          {settings.permissionMode === 'instructor_only' && (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] sm:text-xs py-1 px-2.5 gap-1 font-bold">
              <Megaphone className="w-3 h-3" />
              <span className="hidden sm:inline">إعلانات المعلم فقط</span>
            </Badge>
          )}
          {settings.permissionMode === 'muted' && (
            <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 text-[10px] sm:text-xs py-1 px-2.5 gap-1 font-bold">
              <VolumeX className="w-3 h-3" />
              <span className="hidden sm:inline">موقوفة مؤقتاً</span>
            </Badge>
          )}

          {/* Small button for authorized users to show controls */}
          {isVerifiedModerator && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsControlsModalOpen(true)}
              className="gap-1.5 text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10 h-8 sm:h-9 px-2.5 sm:px-3 shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعدادات الغرفة</span>
            </Button>
          )}
        </div>
      </header>

      {/* 2. Pinned Announcement Bar (Slim 1-line) */}
      {settings.pinnedAnnouncement && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-bold text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded shrink-0">
              إعلان مثبت
            </span>
            <span className="truncate font-semibold">{settings.pinnedAnnouncement}</span>
          </div>
          {isVerifiedModerator && (
            <button
              type="button"
              onClick={() => {
                setPinText('');
                handleSavePin();
              }}
              className="text-[11px] text-amber-800 dark:text-amber-300 underline hover:opacity-80 shrink-0 cursor-pointer"
            >
              إلغاء التثبيت
            </button>
          )}
        </div>
      )}

      {/* 3. Messages List Area (Takes 100% of remaining screen height) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 bg-muted/10 flex flex-col">
        {messages.length === 0 ? (
          <div className="m-auto text-center py-12 max-w-sm text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground/60 border border-border">
              <MessageSquare className="w-7 h-7" />
            </div>
            <p className="font-bold text-sm text-foreground mb-1">لا توجد رسائل بعد</p>
            <p className="text-xs leading-relaxed">
              كن أول من يبدأ النقاش، يطرح استفساراً، أو يرحب بالزملاء في هذه الدورة!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user?.id ? msg.senderId === user.id : false;
            const isInstructorMsg = msg.senderRole === 'instructor';
            const isAnnouncement = Boolean(msg.isAnnouncement);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[75%] ${
                  isMe ? 'self-end' : 'self-start'
                }`}
              >
                {/* Sender Header */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">{msg.senderName}</span>
                  {isInstructorMsg ? (
                    <span className="bg-primary/15 text-primary border border-primary/20 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      معلم الدورة
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                      طالب
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
                      : isInstructorMsg
                      ? 'bg-primary/10 border border-primary/25 text-foreground rounded-tl-none'
                      : 'bg-card border border-border text-foreground rounded-tl-none'
                  }`}
                >
                  {isAnnouncement && (
                    <div className="flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-300 mb-1.5 pb-1 border-b border-amber-500/20">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>إعلان رسمي من معلم الدورة</span>
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

      {/* 4. Bottom Message Input Area */}
      <footer className="p-3 sm:p-4 bg-card border-t border-border/80 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {isInputDisabled ? (
          <div className="bg-muted/60 border border-border p-3 rounded-xl text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {settings.permissionMode === 'instructor_only'
                ? 'إرسال الرسائل مقتصر حالياً على معلم الدورة فقط (وضع الإعلانات).'
                : 'تم إيقاف إرسال الرسائل في هذه الغرفة مؤقتاً.'}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isVerifiedModerator && settings.permissionMode === 'instructor_only'
                  ? 'اكتب إعلاناً رسمياً لجميع الطلاب...'
                  : 'اكتب رسالتك في مجتمع الدورة...'
              }
              className="h-10 sm:h-11 bg-background text-xs sm:text-sm rounded-xl"
              disabled={isSending}
            />

            <Button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl font-bold gap-1.5 shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
              <span className="hidden sm:inline">{isSending ? 'جاري الإرسال...' : 'إرسال'}</span>
            </Button>
          </form>
        )}
      </footer>

      {/* 5. Authorized Users Controls Modal */}
      <Dialog open={isControlsModalOpen} onOpenChange={setIsControlsModalOpen}>
        <DialogContent className="max-w-md w-[92vw] rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black font-display text-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>إعدادات وصلاحيات غرفة الدورة</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              التحكم في صلاحيات إرسال الرسائل للطلاب وتثبيت الإعلانات الأكاديمية.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Permission Modes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">صلاحيات الإرسال في الغرفة:</label>
              <div className="grid gap-2">
                {/* Mode 1: All can send */}
                <button
                  type="button"
                  onClick={() => handleUpdatePermission('all')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    settings.permissionMode === 'all'
                      ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">مفتوحة للجميع</p>
                      <p className="text-[11px] opacity-75">محادثة تفاعلية مفتوحة للنقاش والأسئلة لجميع الطلاب</p>
                    </div>
                  </div>
                  {settings.permissionMode === 'all' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>

                {/* Mode 2: Instructor only */}
                <button
                  type="button"
                  onClick={() => handleUpdatePermission('instructor_only')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    settings.permissionMode === 'instructor_only'
                      ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30'
                      : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">إعلانات المعلم فقط</p>
                      <p className="text-[11px] opacity-75">قناة إعلانات أكاديمية - الطلاب للقراءة فقط</p>
                    </div>
                  </div>
                  {settings.permissionMode === 'instructor_only' && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                </button>

                {/* Mode 3: Muted */}
                <button
                  type="button"
                  onClick={() => handleUpdatePermission('muted')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    settings.permissionMode === 'muted'
                      ? 'border-red-600 bg-red-500/10 text-red-800 dark:text-red-300 ring-1 ring-red-500/30'
                      : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">إيقاف المحادثة مؤقتاً</p>
                      <p className="text-[11px] opacity-75">إغلاق الغرفة مؤقتاً لجميع الطلاب</p>
                    </div>
                  </div>
                  {settings.permissionMode === 'muted' && <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />}
                </button>
              </div>
            </div>

            {/* Pinned Announcement Setting */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-600" />
                <span>إعلان مثبت أعلى الغرفة:</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={pinText}
                  onChange={(e) => setPinText(e.target.value)}
                  placeholder="اكتب إعلاناً أو رابط الدرس لتثبيته..."
                  className="text-xs h-9 bg-background"
                />
                <Button size="sm" className="text-xs h-9 px-3 shrink-0 font-bold" onClick={handleSavePin}>
                  تثبيت
                </Button>
                {settings.pinnedAnnouncement && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-9 px-2.5 shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      setPinText('');
                      handleSavePin();
                    }}
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsControlsModalOpen(false)}
              className="w-full sm:w-auto font-bold rounded-xl"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
