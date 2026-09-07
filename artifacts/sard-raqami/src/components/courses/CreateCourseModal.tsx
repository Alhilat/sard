import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { coursesService, Course } from '@/services/coursesService';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Clock, Award, Plus, Sparkles, BookOpen, Layers } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
}

const CATEGORIES = ['برمجة', 'تقنية', 'تطوير ذاتي', 'تصميم', 'ريادة أعمال', 'ثقافة'];
const LEVELS = ['مبتدئ', 'متوسط', 'متقدم', 'جميع المستويات'];

export default function CreateCourseModal({ isOpen, onClose, onCourseCreated }: CreateCourseModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  const [duration, setDuration] = useState('٤ أسابيع');
  const [totalHours, setTotalHours] = useState('20');
  const [lectures, setLectures] = useState('10');
  const [price, setPrice] = useState('مجاني');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVerified = Boolean(user?.verified || user?.role === 'admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast({
        variant: 'destructive',
        title: 'خاصية مخصصة للحسابات الموثقة',
        description: 'إضافة وإدارة الدورات متاح حصرياً للحسابات الموثقة والمدربين المعتمدين.',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'عنوان الدورة مطلوب',
        description: 'يرجى إدخال عنوان معبر للدورة التدريبية.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await coursesService.createCourse({
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        category,
        level,
        duration: duration.trim() || '٤ أسابيع',
        totalHours: parseInt(totalHours) || 20,
        lectures: parseInt(lectures) || 10,
        price: price.trim() || 'مجاني',
      });

      if (res.success) {
        toast({
          title: 'تم إضافة الدورة بنجاح! 🎓',
          description: `تم إدراج دورتك "${title.trim()}" وأصبحت متاحة لجميع الطلاب والأعضاء.`,
        });

        onCourseCreated({
          id: res.id || `crs_${Date.now()}`,
          org_id: user?.id,
          title: title.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
          category,
          level,
          duration: duration.trim() || '٤ أسابيع',
          totalHours: parseInt(totalHours) || 20,
          lectures: parseInt(lectures) || 10,
          students: 0,
          rating: 5.0,
          price: price.trim() || 'مجاني',
          enrolled: false,
          progress: 0,
          instructor: {
            id: user?.id || 'inst_me',
            name: user?.name || 'مدرب معتمد',
            title: 'مدرب ومختص معتمد',
            role: 'instructor',
            avatar: user?.avatar,
            bio: user?.bio || '',
            experience: 'خبرة تدريبية',
            rating: 5.0,
            studentsTaught: 0,
          },
          org: {
            id: user?.id || 'org_me',
            name: user?.name || 'أكاديمية سرد',
            avatar: user?.avatar,
          },
          syllabus: [],
          outcomes: [],
          prerequisites: [],
        });

        setTitle('');
        setTagline('');
        setDescription('');
        onClose();
      } else {
        toast({
          variant: 'destructive',
          title: 'تعذر إضافة الدورة',
          description: res.message || 'حدث خطأ أثناء إنشاء الدورة.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'تعذر إضافة الدورة',
        description: err?.message || 'حدث خطأ غير متوقع.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>إضافة برنامج تعليمي</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground font-display flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            إضافة دورة تدريبية جديدة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            شارك خبرتك ومعرفتك مع رواد منصة سرد، وأنشئ مجتمعاً تعليمياً متفاعلاً.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="crs-title" className="text-xs font-bold text-foreground">
              عنوان الدورة *
            </Label>
            <Input
              id="crs-title"
              placeholder="مثال: هندسة النماذج اللغوية والتطبيقات الذكية"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm h-10 border-border focus-visible:ring-primary"
              required
            />
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <Label htmlFor="crs-tagline" className="text-xs font-bold text-foreground">
              شعار مختصر للدورة (Tagline)
            </Label>
            <Input
              id="crs-tagline"
              placeholder="مثال: دليلك العملي لبناء تطبيقات الذكاء الاصطناعي من الصفر"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="text-xs sm:text-sm h-10 border-border"
            />
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">المجال والتصنيف</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Level Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">المستوى المستهدف</Label>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    level === lvl
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Hours & Lectures */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="crs-dur" className="text-xs font-bold text-foreground">
                المدة
              </Label>
              <Input
                id="crs-dur"
                placeholder="٤ أسابيع"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="text-xs h-9 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crs-hours" className="text-xs font-bold text-foreground">
                الساعات
              </Label>
              <Input
                id="crs-hours"
                type="number"
                min="1"
                placeholder="20"
                value={totalHours}
                onChange={(e) => setTotalHours(e.target.value)}
                className="text-xs h-9 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crs-lec" className="text-xs font-bold text-foreground">
                المحاضرات
              </Label>
              <Input
                id="crs-lec"
                type="number"
                min="1"
                placeholder="10"
                value={lectures}
                onChange={(e) => setLectures(e.target.value)}
                className="text-xs h-9 border-border"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="crs-price" className="text-xs font-bold text-foreground">
              سعر الدورة
            </Label>
            <Input
              id="crs-price"
              placeholder="مثال: مجاني أو 199 ر.س"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-xs sm:text-sm h-10 border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="crs-desc" className="text-xs font-bold text-foreground">
              وصف الدورة ومنهجها
            </Label>
            <Textarea
              id="crs-desc"
              placeholder="اكتب أهداف الدورة التدريبية، المخرجات التعليمية المتوقعة، والمواضيع التي سيتم تغطيتها..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs sm:text-sm min-h-[75px] resize-none border-border focus-visible:ring-primary leading-relaxed"
            />
          </div>

          <DialogFooter className="pt-3 flex gap-2 flex-row-reverse sm:justify-start">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 font-bold gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الإضافة...' : 'نشر الدورة التدريبية'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border font-medium"
            >
              إلغاء الأمر
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
