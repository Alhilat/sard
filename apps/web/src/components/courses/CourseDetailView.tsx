import React, { useState } from 'react';
import {
  BookOpen, Star, Users, Clock, Award, CheckCircle2, ArrowRight,
  Sparkles, MessageSquare, ShieldCheck, GraduationCap, ChevronDown,
  ChevronUp, UserCheck, Calendar, PlayCircle, ExternalLink, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Course, coursesService } from '@/services/coursesService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
  onOpenChat: (course: Course) => void;
  onEnrollSuccess?: (courseId: string) => void;
  onCourseDeleted?: (courseId: string) => void;
}

export default function CourseDetailView({
  course,
  onBack,
  onOpenChat,
  onEnrollSuccess,
  onCourseDeleted,
}: CourseDetailViewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentCourse, setCurrentCourse] = useState<Course>(course);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedSyllabus, setExpandedSyllabus] = useState<number | null>(0); // First unit open by default

  const canManage = Boolean(
    (currentCourse.org_id && user?.id && currentCourse.org_id === user.id) ||
    user?.role === 'admin'
  );

  const handleDeleteCourse = async () => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف دورة "${currentCourse.title}" نهائياً؟`)) {
      return;
    }
    setIsDeleting(true);
    const res = await coursesService.deleteCourse(currentCourse.id);
    setIsDeleting(false);
    if (res.success) {
      toast({
        title: 'تم حذف الدورة بنجاح',
        description: `تم إزالة دورة "${currentCourse.title}" من الأكاديمية.`,
      });
      onCourseDeleted?.(currentCourse.id);
      onBack();
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف الدورة',
        description: res.message || 'حدث خطأ أثناء محاولة الحذف.',
      });
    }
  };

  const handleJoinCourse = async () => {
    if (currentCourse.enrolled) {
      // Already enrolled -> go straight to chat
      onOpenChat(currentCourse);
      return;
    }

    setIsEnrolling(true);
    try {
      await coursesService.enrollInCourse(currentCourse.id);
      setCurrentCourse((prev) => ({
        ...prev,
        enrolled: true,
        students: prev.students + 1,
      }));
      onEnrollSuccess?.(currentCourse.id);
      toast({
        title: 'تم الانضمام إلى الدورة بنجاح! 🎉',
        description: `أهلاً بك في "${currentCourse.title}". تم نقلك إلى غرفة المحادثة التفاعلية لمقابلة المعلم والزملاء.`,
      });
      // Move immediately to group chat as requested
      setTimeout(() => {
        onOpenChat({ ...currentCourse, enrolled: true });
      }, 350);
    } catch {
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'تعذر إتمام الانضمام للدورة. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span>العودة إلى دليل الدورات</span>
        </button>

        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5 font-medium">
          <span>الدورات التدريبية</span>
          <span>/</span>
          <span>{currentCourse.category}</span>
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-xs">{currentCourse.title}</span>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="border-card-border overflow-hidden shadow-sm bg-card">
        <div
          className={`p-6 sm:p-8 text-white relative bg-gradient-to-r ${
            currentCourse.coverGradient || 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]'
          }`}
        >
          {/* Subtle Arabesque dot pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1.5px, transparent 1.5px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative z-10 space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-xs text-xs font-bold px-2.5">
                {currentCourse.category}
              </Badge>
              <Badge className="bg-amber-400/20 text-amber-200 border-amber-300/30 text-xs font-bold">
                المستوى: {currentCourse.level}
              </Badge>
              <Badge className="bg-black/30 text-white border-white/20 text-xs">
                {currentCourse.price}
              </Badge>
              {currentCourse.enrolled && (
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 text-xs font-bold gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  أنت مسجل في هذه الدورة
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display leading-tight">
              {currentCourse.title}
            </h1>

            {currentCourse.tagline && (
              <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
                {currentCourse.tagline}
              </p>
            )}

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-white/80 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                <strong className="text-white">{currentCourse.totalHours}</strong> ساعة تدريبية
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-amber-300" />
                <strong className="text-white">{currentCourse.lectures}</strong> محاضرة
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-300" />
                <strong className="text-white">شهادة إتمام معتمدة</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-300" />
                <strong className="text-white">غرفة نقاش مع المدرب</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Strip */}
        <div className="p-4 sm:p-5 bg-card border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">الجهة المقدمة</p>
              <p className="text-xs text-muted-foreground">{currentCourse.org.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {canManage && (
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={handleDeleteCourse}
                className="gap-2 font-bold px-4 h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive shadow-2xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'جاري الحذف...' : 'حذف وإدارة الدورة'}</span>
              </Button>
            )}

            {currentCourse.enrolled ? (
              <Button
                onClick={() => onOpenChat(currentCourse)}
                className="w-full sm:w-auto gap-2 font-bold px-6 h-11 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <MessageSquare className="w-4 h-4" />
                <span>دخول غرفة المحادثة والمجتمع التفاعلي</span>
              </Button>
            ) : (
              <Button
                onClick={handleJoinCourse}
                disabled={isEnrolling}
                className="w-full sm:w-auto gap-2 font-bold px-6 h-11 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isEnrolling ? 'جاري الانضمام...' : 'الانضمام إلى الدورة وغرفة النقاش'}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructor Card (Who is Teacher) */}
          <Card className="border-card-border p-5 sm:p-6 bg-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <span>معلم الدورة والمدرب المعتمد</span>
              </h2>
              <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                مدرب معتمد
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border-2 border-primary/30 text-primary flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xs shrink-0 font-display">
                {currentCourse.instructor.name.slice(0, 1)}
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {currentCourse.instructor.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    {currentCourse.instructor.title}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {currentCourse.instructor.bio}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    {currentCourse.instructor.experience}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مدرب معتمد في المنصة
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Course Overview */}
          <Card className="border-card-border p-5 sm:p-6 bg-card space-y-3">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>نبذة شاملة عن الدورة</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {currentCourse.description}
            </p>
          </Card>

          {/* Course Syllabus / Curriculum (Hours & Lectures) */}
          <Card className="border-card-border p-5 sm:p-6 bg-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>محاور المنهج وساعات التدريب</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  إجمالي {currentCourse.totalHours} ساعة تدريبية موزعة على {currentCourse.syllabus.length} وحدات تعليمية
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {currentCourse.syllabus.map((unit, idx) => {
                const isOpen = expandedSyllabus === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/80 overflow-hidden bg-muted/20 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedSyllabus(isOpen ? null : idx)}
                      className="w-full p-4 text-right flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-xs sm:text-sm text-foreground block">
                          {unit.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{unit.hours} ساعات تدريبية</span>
                          <span>•</span>
                          <span>{unit.lessons.length} دروس ومحاضرات</span>
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-background border border-border/80 flex items-center justify-center text-muted-foreground shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4 pt-1 bg-background/50 border-t border-border/60 space-y-2">
                        {unit.lessons.map((lesson, lIdx) => (
                          <div
                            key={lIdx}
                            className="flex items-center gap-2.5 text-xs text-foreground/85 py-1.5 px-2 rounded-lg hover:bg-muted/30"
                          >
                            <PlayCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{lesson}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Learning Outcomes */}
          <Card className="border-card-border p-5 sm:p-6 bg-card space-y-3">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>مخرجات التعلم وما ستكتسبه في هذه الدورة</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              {currentCourse.outcomes.map((outcome, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm text-foreground/90 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Info Card (1 Col) */}
        <div className="space-y-5">
          {/* Quick Details Card */}
          <Card className="border-card-border p-5 bg-card space-y-4">
            <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border/60">
              بطاقة معلومات الدورة
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">الساعات التدريبية</span>
                <span className="font-bold text-foreground">{currentCourse.totalHours} ساعة معتمدة</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">مدة البرنامج</span>
                <span className="font-bold text-foreground">{currentCourse.duration}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">عدد المحاضرات</span>
                <span className="font-bold text-foreground">{currentCourse.lectures} محاضرة</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">مستوى الدورة</span>
                <span className="font-bold text-foreground">{currentCourse.level}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">لغة التدريس</span>
                <span className="font-bold text-foreground">اللغة العربية</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">الشهادة الممنوحة</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">شهادة إتمام معتمدة</span>
              </div>
            </div>

            {/* CTA in Sidebar */}
            <div className="pt-2">
              {currentCourse.enrolled ? (
                <Button
                  onClick={() => onOpenChat(currentCourse)}
                  className="w-full gap-2 font-bold h-11 shadow-xs bg-primary text-primary-foreground"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>دخول غرفة محادثة الدورة</span>
                </Button>
              ) : (
                <Button
                  onClick={handleJoinCourse}
                  disabled={isEnrolling}
                  className="w-full gap-2 font-bold h-11 shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isEnrolling ? 'جاري الانضمام...' : 'انضم إلى الدورة الآن'}</span>
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                الانضمام يتيح لك التواصل المباشر مع المعلم في غرفة المحادثة الخاصة
              </p>
            </div>
          </Card>

          {/* Prerequisites */}
          <Card className="border-card-border p-5 bg-card space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              المتطلبات السابقة
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {currentCourse.prerequisites.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
