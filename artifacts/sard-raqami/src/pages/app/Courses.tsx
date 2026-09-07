import React, { useState, useEffect } from 'react';
import {
  Star, Users, Clock, BookOpen, Search, Filter, PlayCircle,
  Award, Sparkles, MessageSquare, CheckCircle2, ArrowRight,
  GraduationCap, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Course, coursesService } from '@/services/coursesService';
import CourseDetailView from '@/components/courses/CourseDetailView';
import CourseGroupChat from '@/components/courses/CourseGroupChat';

const CATEGORIES = [
  'الكل',
  'برمجة',
  'تقنية',
  'تطوير ذاتي',
  'تصميم',
  'ريادة أعمال',
];

const LEVEL_BADGES: Record<string, string> = {
  مبتدئ: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  متوسط: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  متقدم: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
  'جميع المستويات': 'bg-primary/10 text-primary border-primary/20',
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeChatCourse, setActiveChatCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load courses
  useEffect(() => {
    setIsLoading(true);
    coursesService.getCourses({ category }).then((data) => {
      setCourses(data);
      setIsLoading(false);
    });
  }, [category]);

  const filtered = courses.filter((c) => {
    const s = search.trim().toLowerCase();
    const matchSearch =
      (c.title || '').toLowerCase().includes(s) ||
      (c.instructor?.name || '').toLowerCase().includes(s) ||
      (c.org?.name || '').toLowerCase().includes(s) ||
      (c.description || '').toLowerCase().includes(s);
    return matchSearch;
  });

  const enrolled = courses.filter((c) => c.enrolled);

  // If chat is open for a course, show CourseGroupChat
  if (activeChatCourse) {
    return (
      <div className="p-4 sm:p-6" dir="rtl">
        <CourseGroupChat
          course={activeChatCourse}
          onBack={() => {
            // Return to course details
            setSelectedCourse(activeChatCourse);
            setActiveChatCourse(null);
          }}
        />
      </div>
    );
  }

  // If a course is selected, show CourseDetailView
  if (selectedCourse) {
    return (
      <div className="p-4 sm:p-6" dir="rtl">
        <CourseDetailView
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
          onOpenChat={(course) => {
            setActiveChatCourse(course);
          }}
          onEnrollSuccess={(courseId) => {
            setCourses((prev) =>
              prev.map((c) => (c.id === courseId ? { ...c, enrolled: true, students: c.students + 1 } : c))
            );
          }}
        />
      </div>
    );
  }

  function CourseCard({ course }: { course: Course }) {
    return (
      <Card
        onClick={() => setSelectedCourse(course)}
        className="border-card-border/90 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group overflow-hidden bg-card/90"
      >
        {/* Course Card Top Banner */}
        <div
          className={`h-28 w-full relative bg-gradient-to-r ${
            course.coverGradient || 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]'
          }`}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          <div className="absolute top-3 start-3 end-3 flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-[10px] h-5 border font-semibold ${
                LEVEL_BADGES[course.level] || 'bg-black/30 text-white border-white/20'
              }`}
            >
              {course.level}
            </Badge>

            <Badge
              className={`text-[10px] h-5 font-bold ${
                course.price === 'مجاني'
                  ? 'bg-amber-400 text-stone-900 border-0 shadow-2xs'
                  : 'bg-white/90 text-primary shadow-2xs'
              }`}
            >
              {course.price}
            </Badge>
          </div>

          <div className="absolute bottom-2.5 start-3 text-white/90 text-xs flex items-center gap-2 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              {course.totalHours} ساعة معتمدة
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <PlayCircle className="w-3 h-3 text-amber-300" />
              {course.lectures} محاضرة
            </span>
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] text-primary font-bold">{course.category}</span>
              <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 text-primary border-primary/30 bg-primary/5">
                دورة معتمدة
              </Badge>
            </div>

            <h3 className="font-bold text-sm sm:text-base mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {course.title}
            </h3>

            {/* Teacher info snippet */}
            <div className="flex items-center gap-2 my-2.5 py-2 px-2.5 rounded-xl bg-muted/40 border border-border/60">
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {(course.instructor?.name || 'م').slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{course.instructor?.name || 'مدرب معتمد'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{course.instructor?.title || 'مدرب وخبير تقني'}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
              {course.tagline || course.description}
            </p>
          </div>

          <div>
            {/* Progress if enrolled */}
            {course.enrolled && course.progress > 0 && (
              <div className="mb-3 p-2 rounded-lg bg-muted/30">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">نسبة إنجازك</span>
                  <span className="font-bold text-primary">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-1.5" />
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/60 gap-2">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Award className="w-3.5 h-3.5 text-primary" />
                شهادة إتمام معتمدة
              </span>

              {course.enrolled ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChatCourse(course);
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>غرفة المحادثة</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs font-bold gap-1 shadow-2xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(course);
                  }}
                >
                  <span>عرض التفاصيل</span>
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>أكاديمية سرد الرقمية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-foreground">
            الدورات التدريبية المعتمدة
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            طوّر مهاراتك مع برامج تدريبية تخصصية يقودها نخبة من الخبراء، مع مجتمعات وغرف محادثة تفاعلية لكل دورة.
          </p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3.5">
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث عن دورة بالاسم، اسم المعلم، أو الكلمات المفتاحية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 h-11 text-xs sm:text-sm bg-card border-border/80 focus-visible:ring-primary shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
                cat === category
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-5">
        <TabsList className="bg-muted/80 p-1 rounded-xl">
          <TabsTrigger value="all" className="font-bold text-xs gap-1.5 px-3.5 py-1.5">
            جميع الدورات ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="enrolled" className="font-bold text-xs gap-1.5 px-3.5 py-1.5">
            دوراتي المسجلة ({enrolled.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All Courses */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>جاري تحميل الدورات...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3 bg-card">
              <BookOpen className="w-12 h-12 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-foreground text-base">لم يتم العثور على دورات مطابقة</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                جرب البحث بكلمات مختلفة أو اختر تصنيفاً آخر من الشريط أعلاه.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Enrolled Courses */}
        <TabsContent value="enrolled">
          {enrolled.length === 0 ? (
            <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3 bg-card">
              <BookOpen className="w-12 h-12 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-foreground text-base">لم تسجل في أي دورة بعد</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                تصفح الدورات المتاحة وانضم إليها لبدء مسارك التعليمي والتواصل المباشر مع المعلمين في غرف المحادثة.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrolled.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
