import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { groupsService, Group } from '@/services/groupsService';
import { Users, Lock, Globe, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: Group) => void;
}

const CATEGORIES = [
  { id: 'تقنية', label: 'تقنية وابتكار' },
  { id: 'تطوع', label: 'عمل تطوعي' },
  { id: 'ريادة أعمال', label: 'ريادة أعمال' },
  { id: 'ثقافة وسرد', label: 'ثقافة وسرد' },
  { id: 'تصميم', label: 'تصميم وفنون' },
  { id: 'تعليم', label: 'تعليم ومعرفة' },
  { id: 'بيئة ومناخ', label: 'بيئة واستدامة' },
];

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [privacy, setPrivacy] = useState<'عام' | 'خاص'>('عام');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'اسم المجتمع مطلوب',
        description: 'يرجى كتابة اسم معبر للمجتمع قبل المتابعة.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await groupsService.createGroup({
        name: name.trim(),
        description:
          description.trim() ||
          'مجتمع معرفي جديد انضم إلى فضاء سرد رقمي لتبادل الرؤى والخبرات.',
        category,
        privacy,
      });

      toast({
        title: 'مبارك! تم تأسيس المجتمع بنجاح',
        description: `أهلاً بك في مجتمع "${created.name}". يمكنك الآن دعوة الأعضاء وبدء الحوارات الأولى.`,
      });

      onGroupCreated(created);
      setName('');
      setDescription('');
      onClose();
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر تأسيس المجتمع',
        description: 'حدث خطأ أثناء الإنشاء، يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-7" dir="rtl">
        <DialogHeader className="text-right space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>مبادرة جديدة</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            تأسيس مجتمع رقمي جديد
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            اجمع المهتمين والمبدعين حول اهتمام أو شغف مشترك، وساهم في إثراء المحتوى المعرفي العربي.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Group Name */}
          <div className="space-y-1.5">
            <Label htmlFor="group-name" className="text-xs font-bold text-foreground">
              اسم المجتمع *
            </Label>
            <Input
              id="group-name"
              placeholder="مثال: نادي السرد والقصة العربية الحديثة"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm h-10 border-border focus-visible:ring-primary"
              required
            />
          </div>

          {/* Category Chips */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">المجال والتصنيف</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    category === cat.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">طبيعة الانضمام والخصوصية</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPrivacy('عام')}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  privacy === 'عام'
                    ? 'border-primary bg-primary/5 text-primary shadow-2xs ring-1 ring-primary/20'
                    : 'border-border/80 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Globe className="w-4 h-4" />
                  <span>مجتمع عام (مفتوح)</span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  متاح لجميع رواد المنصة للانضمام الفوري والمشاركة.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy('خاص')}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  privacy === 'خاص'
                    ? 'border-amber-600/50 bg-amber-500/5 text-amber-700 dark:text-amber-400 shadow-2xs ring-1 ring-amber-500/20'
                    : 'border-border/80 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>مجتمع خاص (بدعوة)</span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  يتطلب انضمام الأعضاء موافقة مشرفي المجتمع.
                </span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="group-desc" className="text-xs font-bold text-foreground">
              رسالة المجتمع وأهدافه
            </Label>
            <Textarea
              id="group-desc"
              placeholder="اكتب نبذة تصف أهداف المجتمع والمواضيع الرئيسية التي سيتم تداولها..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs sm:text-sm min-h-[85px] resize-none border-border focus-visible:ring-primary leading-relaxed"
            />
          </div>

          <DialogFooter className="pt-3 flex gap-2 flex-row-reverse sm:justify-start">
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 font-bold gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التأسيس...' : 'تأسيس المجتمع'}</span>
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
