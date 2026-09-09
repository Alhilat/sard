import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { activitiesService, Activity } from '@/services/activitiesService';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Users, Plus, Sparkles, Clock, Globe } from 'lucide-react';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated: (activity: Activity) => void;
}

const CATEGORIES = ['تطوع', 'تقنية', 'بيئة', 'ريادة أعمال', 'صحة', 'ثقافة', 'عام'];

export default function CreateActivityModal({ isOpen, onClose, onActivityCreated }: CreateActivityModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<'in_person' | 'online'>('in_person');
  const [capacity, setCapacity] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVerified = Boolean(user?.verified || user?.role === 'admin' || user?.role === 'org');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast({
        variant: 'destructive',
        title: 'خاصية مخصصة للحسابات الموثقة',
        description: 'تنظيم وإضافة الفعاليات متاح حصرياً للحسابات الموثقة والمنظمات.',
      });
      return;
    }

    if (!title.trim() || !date.trim()) {
      toast({
        variant: 'destructive',
        title: 'بيانات غير مكتملة',
        description: 'يرجى إدخال عنوان وتاريخ الفعالية على الأقل.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activitiesService.createActivity({
        title: title.trim(),
        description: description.trim(),
        category,
        date: date.trim(),
        time: time.trim(),
        location: location.trim() || (locationType === 'online' ? 'عبر الإنترنت (عن بُعد)' : 'الرياض'),
        locationType,
        capacity: parseInt(capacity) || 100,
      });

      if (res.success) {
        toast({
          title: 'تم إنشاء الفعالية بنجاح! 🎉',
          description: `تم إدراج فعاليتك "${title.trim()}" وأصبحت متاحة للتسجيل لجميع الأعضاء.`,
        });

        onActivityCreated({
          id: res.id || `act_${Date.now()}`,
          org_id: user?.id,
          title: title.trim(),
          description: description.trim(),
          category,
          date: date.trim(),
          time: time.trim(),
          location: location.trim() || (locationType === 'online' ? 'عبر الإنترنت (عن بُعد)' : 'الرياض'),
          locationType,
          capacity: parseInt(capacity) || 100,
          attendeesCount: 0,
          status: 'متاح للتسجيل',
          org: {
            id: user?.id || 'org_me',
            name: user?.name || 'جهة منظمة',
            avatar: user?.avatar,
          },
          orgName: user?.name || 'جهة منظمة',
          isRegistered: false,
        });

        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setLocation('');
        onClose();
      } else {
        toast({
          variant: 'destructive',
          title: 'تعذر إنشاء الفعالية',
          description: res.message || 'حدث خطأ أثناء الإنشاء.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'تعذر إنشاء الفعالية',
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
            <span>تنظيم وإدارة المبادرات</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground font-display flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            تنظيم فعالية أو ورشة عمل جديدة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            أنشئ نشاطاً مجتمعياً أو فعالية تقنية تتيح لأعضاء منصة سرد التسجيل والمشاركة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Activity Title */}
          <div className="space-y-1.5">
            <Label htmlFor="act-title" className="text-xs font-bold text-foreground">
              عنوان الفعالية / النشاط *
            </Label>
            <Input
              id="act-title"
              placeholder="مثال: ملتقى سرد للذكاء الاصطناعي وصناعة المحتوى"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm h-10 border-border focus-visible:ring-primary"
              required
            />
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">التصنيف</Label>
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

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="act-date" className="text-xs font-bold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                التاريخ *
              </Label>
              <Input
                id="act-date"
                type="text"
                placeholder="مثال: ١٥ أكتوبر ٢٠٢٦"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs sm:text-sm h-10 border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-time" className="text-xs font-bold text-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                التوقيت
              </Label>
              <Input
                id="act-time"
                placeholder="مثال: ٦:٠٠ م - ٩:٠٠ م"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="text-xs sm:text-sm h-10 border-border"
              />
            </div>
          </div>

          {/* Location Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">نوع الحضور والمقر</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationType('in_person')}
                className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer font-bold text-xs ${
                  locationType === 'in_person'
                    ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>حضوري في الموقع</span>
              </button>
              <button
                type="button"
                onClick={() => setLocationType('online')}
                className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer font-bold text-xs ${
                  locationType === 'online'
                    ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>افتراضي (عن بُعد)</span>
              </button>
            </div>
          </div>

          {/* Location & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="act-loc" className="text-xs font-bold text-foreground">
                الموقع أو المنصة
              </Label>
              <Input
                id="act-loc"
                placeholder={locationType === 'online' ? 'منصة Zoom / Google Meet' : 'الرياض - مركز المؤتمرات'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-xs sm:text-sm h-10 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-cap" className="text-xs font-bold text-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                السعة القصوى (المقاعد)
              </Label>
              <Input
                id="act-cap"
                type="number"
                min="1"
                placeholder="100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="text-xs sm:text-sm h-10 border-border"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="act-desc" className="text-xs font-bold text-foreground">
              نبذة وتفاصيل الفعالية
            </Label>
            <Textarea
              id="act-desc"
              placeholder="اكتب أهداف النشاط، الفئة المستهدفة، والبرنامج الزمني..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs sm:text-sm min-h-[75px] resize-none border-border focus-visible:ring-primary leading-relaxed"
            />
          </div>

          <DialogFooter className="pt-3 flex gap-2 flex-row-reverse sm:justify-start">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !date.trim()}
              className="flex-1 font-bold gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الإضافة...' : 'نشر الفعالية'}</span>
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
