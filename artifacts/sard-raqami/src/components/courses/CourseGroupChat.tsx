import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, ArrowRight, Shield, Lock, Globe, VolumeX,
  Megaphone, Users, Send, Pin, AlertCircle, Sparkles, CheckCircle2,
  HelpCircle, Settings, UserCheck, Check, Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Course, ChatMessage, CourseChatSettings, ChatPermissionMode, coursesService
} from '@/services/coursesService';
import { useToast } from '@/hooks/use-toast';

interface CourseGroupChatProps {
  course: Course;
  onBack: () => void;
}

export default function CourseGroupChat({ course, onBack }: CourseGroupChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<CourseChatSettings>({
    courseId: course.id,
    permissionMode: 'all',
  });
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // User Role View Switcher: allows testing both Instructor and Student perspectives
  const [activeRole, setActiveRole] = useState<'instructor' | 'student'>('instructor');
  const [isInstructorControlOpen, setIsInstructorControlOpen] = useState(true);

  // Pinned announcement edit modal/state
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [pinText, setPinText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat settings and messages
  useEffect(() => {
    Promise.all([
      coursesService.getChatSettings(course.id),
      coursesService.getChatMessages(course.id),
    ]).then(([fetchedSettings, fetchedMessages]) => {
      setSettings(fetchedSettings);
      setPinText(fetchedSettings.pinnedAnnouncement || '');
      setMessages(fetchedMessages);
    });
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
      setIsEditingPin(false);
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

    // Check permissions if acting as student
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
      const isInst = activeRole === 'instructor';
      const created = await coursesService.sendChatMessage(course.id, {
        senderId: isInst ? course.instructor.id : 'user-student',
        senderName: isInst ? course.instructor.name : 'طالب مشارك (أنت)',
        senderRole: isInst ? 'instructor' : 'student',
        content,
        isAnnouncement: isInst && settings.permissionMode === 'instructor_only',
      });

      setMessages((prev) => [...prev, created]);
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
    activeRole === 'student' &&
    (settings.permissionMode === 'instructor_only' || settings.permissionMode === 'muted');

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12" dir="rtl">
      {/* Top Bar Navigation & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-card-border p-3.5 sm:p-4 rounded-2xl shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span>العودة إلى تفاصيل الدورة</span>
        </button>

        {/* Perspective / Role Toggle */}
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-xl border border-border/70 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-muted-foreground pe-1 hidden md:inline">
            تجربة العرض بصفتك:
          </span>
          <button
            type="button"
            onClick={() => setActiveRole('instructor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeRole === 'instructor'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>👨‍🏫 المعلم (صلاحيات التحكم)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeRole === 'student'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>🎓 طالب في الدورة</span>
          </button>
        </div>
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
                  غرفة نقاش: {course.title}
                </h1>
                <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary bg-primary/5">
                  مجتمع الدورة التفاعلي
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-foreground">{course.instructor.name}</span>
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
            {settings.permissionMode === 'instructor_only' && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs py-1 px-3 gap-1.5 font-bold">
                <Megaphone className="w-3.5 h-3.5" />
                <span>المعلم فقط (قناة إعلانات)</span>
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

        {/* INSTRUCTOR CONTROL PANEL (Shows when activeRole === 'instructor') */}
        {activeRole === 'instructor' && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/80">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span>لوحة تحكم المعلم في صلاحيات الغرفة</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                يمكنك كمعلم التحكم في من يحق له إرسال الرسائل وتثبيت التوجيهات
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
                  محادثة تفاعلية مفتوحة للنقاش والأسئلة للطلاب والمعلم.
                </span>
              </button>

              {/* Mode 2: Instructor only */}
              <button
                type="button"
                onClick={() => handleUpdatePermission('instructor_only')}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  settings.permissionMode === 'instructor_only'
                    ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-2xs ring-1 ring-amber-500/30'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                    <span>المعلم فقط (إعلانات)</span>
                  </div>
                  {settings.permissionMode === 'instructor_only' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <span className="text-[11px] opacity-80 leading-relaxed">
                  قناة رسمية: الطلاب يقرأون فقط، والمعلم وحده يرسل.
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
                    <VolumeX className="w-3.5 h-3.5 text-red-600" />
                    <span>إيقاف إرسال الرسائل</span>
                  </div>
                  {settings.permissionMode === 'muted' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                  )}
                </div>
                <span className="text-[11px] opacity-80 leading-relaxed">
                  تجميد مؤقت للرسائل أثناء البث المباشر أو أداء الاختبار.
                </span>
              </button>
            </div>

            {/* Pinned Notice Form */}
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsEditingPin(!isEditingPin)}
                className="flex items-center gap-1.5 font-bold text-primary hover:underline cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>{settings.pinnedAnnouncement ? 'تعديل الإعلان المثبت أعلى الغرفة' : 'تثبيت إعلان مهم أعلى الغرفة'}</span>
              </button>
            </div>

            {isEditingPin && (
              <div className="mt-2.5 p-3 rounded-xl bg-card border border-border space-y-2">
                <Input
                  value={pinText}
                  onChange={(e) => setPinText(e.target.value)}
                  placeholder="اكتب نص الإعلان التوجيهي أو رابط المحاضرة القادمة..."
                  className="text-xs h-9"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPin(false)}
                    className="h-8 text-xs"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSavePin}
                    className="h-8 text-xs font-bold gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>حفظ وتثبيت</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pinned Announcement Box (Always visible to all students if exists) */}
        {settings.pinnedAnnouncement && (
          <div className="p-3.5 sm:p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-3 text-xs text-foreground/90">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <Pin className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="font-bold text-amber-800 dark:text-amber-300 block text-[11px]">
                إعلان مثبت من معلم الدورة:
              </span>
              <p className="leading-relaxed">{settings.pinnedAnnouncement}</p>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="p-4 sm:p-6 space-y-4 min-h-[380px] max-h-[480px] overflow-y-auto bg-muted/10">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <MessageSquare className="w-12 h-12 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-foreground text-sm">لا توجد رسائل في الغرفة حتى الآن</p>
              <p className="text-xs">كن أول من يفتتح النقاش ويرحب بالزملاء والمعلم!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isInstructor = msg.senderRole === 'instructor';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 max-w-2xl ${
                    isInstructor ? 'me-auto' : 'ms-auto flex-row-reverse'
                  }`}
                >
                  {/* Monogram Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border ${
                      isInstructor
                        ? 'bg-gradient-to-br from-primary/30 to-primary/10 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {msg.senderName.slice(0, 1)}
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-1 ${isInstructor ? 'text-right' : 'text-right'}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-foreground">{msg.senderName}</span>
                      {isInstructor && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4.5 px-1.5 font-bold bg-primary/15 text-primary border-0 gap-1"
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                          معلم الدورة
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isInstructor
                          ? 'bg-card border-2 border-primary/25 text-foreground shadow-2xs rounded-tr-xs'
                          : 'bg-primary text-primary-foreground rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input & Permission Feedback Footer */}
        <div className="p-3.5 sm:p-4 border-t border-border/70 bg-card">
          {/* Permission restriction notice when student is blocked */}
          {isInputDisabled ? (
            <div className="p-3 rounded-xl bg-muted/60 border border-dashed border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {settings.permissionMode === 'instructor_only' ? (
                <>
                  <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>وضع الإعلانات مفعل:</strong> إرسال الرسائل مقتصر على معلم الدورة (
                    {course.instructor.name}) حالياً.
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>المحادثة متوقفة:</strong> تم إيقاف إرسال الرسائل مؤقتاً بواسطة معلم الدورة.
                  </span>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeRole === 'instructor'
                      ? `اكتب توجيهاً أو رداً لطلابك بصفتك (${course.instructor.name})...`
                      : 'اكتب سؤالك أو استفسارك في نقاش الدورة...'
                  }
                  className="text-xs sm:text-sm h-11 bg-background/80 border-border focus-visible:ring-primary"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="h-11 px-5 gap-2 font-bold shrink-0 shadow-xs"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                  <span className="hidden sm:inline">إرسال</span>
                </Button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <span>أنت ترسل الآن بصفتك:</span>
                  <strong className="text-foreground">
                    {activeRole === 'instructor' ? 'معلم الدورة 👨‍🏫' : 'طالب مشارك 🎓'}
                  </strong>
                </span>

                {activeRole === 'instructor' && (
                  <span className="text-primary font-semibold">
                    (يمكنك تغيير صلاحيات الإرسال لجميع الطلاب من اللوحة أعلاه)
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
