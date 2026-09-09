import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Star, Users, Edit, Trash2, Eye, BookOpen, GraduationCap } from 'lucide-react';
import { coursesService, Course } from '@/services/coursesService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import CreateCourseModal from '@/components/courses/CreateCourseModal';

export default function OrgCourses() {
  const { toast } = useToast();
  const [items, setItems] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await coursesService.getCourses();
      setItems(data);
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر تحميل الدورات التدريبية',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleRemove = async (courseId: string, courseTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف دورة "${courseTitle}" نهائياً؟`)) {
      return;
    }

    const res = await coursesService.deleteCourse(courseId);
    if (res.success) {
      setItems((prev) => prev.filter((c) => c.id !== courseId));
      toast({
        title: 'تم حذف الدورة بنجاح 🗑️',
        description: `تم إزالة دورة "${courseTitle}" من المنصة.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف الدورة',
        description: res.message || 'حدث خطأ أثناء الحذف.',
      });
    }
  };

  const handleCourseCreated = (newCourse: Course) => {
    setItems((prev) => [newCourse, ...prev]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الدورات التدريبية</h1>
          <p className="text-muted-foreground text-sm">إدارة وتقديم البرامج التدريبية المعتمدة للمنظمة</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          دورة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي الدورات', value: items.length },
          { label: 'إجمالي المسجّلين', value: items.reduce((s, c) => s + (c.students || 0), 0).toLocaleString('ar') },
          { label: 'الدورات المتاحة', value: items.length },
        ].map((stat) => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">جارٍ تحميل الدورات...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="border-card-border p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-base font-bold text-foreground">لا توجد دورات تدريبية حالياً</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            ابدأ بنشر أول برنامج تدريبي معتمد لمنظمتك لمشاركة المعرفة مع المجتمع.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة أول دورة
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((course) => (
            <Card key={course.id} className="border-card-border hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted cursor-pointer">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer"
                        onClick={() => setViewingCourse(course)}
                      >
                        <Eye className="w-4 h-4" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer"
                        onClick={() => toast({ title: 'تعديل الدورة', description: 'يمكنك تعديل بيانات الدورة وحفظها.' })}
                      >
                        <Edit className="w-4 h-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive cursor-pointer"
                        onClick={() => handleRemove(course.id, course.title)}
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-bold text-sm mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{course.level} · {course.duration}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {course.rating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {course.rating}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">دورة معتمدة</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {(course.students || 0).toLocaleString('ar')} مسجل
                  </span>
                  <Badge
                    variant={course.price === 'مجاني' ? 'secondary' : 'outline'}
                    className={`text-xs ${
                      course.price === 'مجاني'
                        ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
                        : 'font-bold text-primary'
                    }`}
                  >
                    {course.price}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCourseCreated={handleCourseCreated}
      />

      {/* View Course Details Dialog */}
      <Dialog open={Boolean(viewingCourse)} onOpenChange={(open) => !open && setViewingCourse(null)}>
        <DialogContent className="max-w-md p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {viewingCourse?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {viewingCourse?.category} · {viewingCourse?.level} · المدة: {viewingCourse?.duration}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            {viewingCourse?.tagline && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {viewingCourse.tagline}
              </p>
            )}
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {viewingCourse?.description || 'لا يوجد وصف مفصل لهذه الدورة حالياً.'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl">
              <div>
                <span className="text-muted-foreground">المسجلون: </span>
                <span className="font-bold">{(viewingCourse?.students || 0).toLocaleString('ar')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">السعر: </span>
                <span className="font-bold text-primary">{viewingCourse?.price || 'مجاني'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">إجمالي الساعات: </span>
                <span className="font-bold">{viewingCourse?.totalHours || 20} ساعة</span>
              </div>
              <div>
                <span className="text-muted-foreground">المحاضرات: </span>
                <span className="font-bold">{viewingCourse?.lectures || 10} محاضرة</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setViewingCourse(null)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
