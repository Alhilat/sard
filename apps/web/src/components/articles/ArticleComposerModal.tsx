import { useState } from 'react';
import { articlesService } from '@/services/articlesService';
import { ARTICLE_CATEGORIES, PRESET_COVERS } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Image, Tag, Send, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

interface ArticleComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArticleCreated: () => void;
}

export default function ArticleComposerModal({
  open,
  onOpenChange,
  onArticleCreated,
}: ArticleComposerModalProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ثقافة وفكر');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [customCoverOpen, setCustomCoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MIN_CHARS = 500;
  const charCount = content.trim().length;
  const isMinCharsMet = charCount >= MIN_CHARS;
  const charsRemaining = Math.max(0, MIN_CHARS - charCount);
  const progressPercent = Math.min(100, Math.round((charCount / MIN_CHARS) * 100));

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 160));

  const isValid = title.trim().length >= 5 && isMinCharsMet;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);

      const res = await articlesService.createArticle({
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        coverImage,
      });

      if (res.success) {
        toast({
          title: 'تم نشر المقال بنجاح!',
          description: 'تم نشر مقالك وهو متاح الآن للقراءة والمشاركة.',
        });
        setTitle('');
        setContent('');
        setTagsInput('');
        onOpenChange(false);
        onArticleCreated();
      } else {
        toast({
          title: 'تعذر نشر المقال',
          description: res.message || 'يرجى مراجعة البيانات والمحاولة مجدداً',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'حدث خطأ غير متوقع',
        description: err?.message || 'تعذر الاتصال بالخادم',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-[96vw] max-h-[92vh] p-6 overflow-y-auto bg-background border-border/80 shadow-2xl space-y-6 rtl"
        aria-describedby={undefined}
      >
        <DialogHeader className="space-y-1 text-start">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl font-black text-foreground">
              كتابة مقال جديد
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            الحد الأدنى لنص المقال هو 500 حرف لتقديم فكرة متكاملة وقيمة عملية للقارئ.
          </DialogDescription>
        </DialogHeader>

        {/* 500-Character Constraint Banner */}
        <div
          className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
            isMinCharsMet
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isMinCharsMet ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
            )}
            <div className="text-xs">
              <span className="font-bold">
                {isMinCharsMet
                  ? `مستوفٍ للحد الأدنى (${charCount} حرفاً) • جاهز للنشر`
                  : `الحد الأدنى 500 حرف • متبقي ${charsRemaining} حرفاً`}
              </span>
              <span className="block text-[11px] opacity-80 mt-0.5">
                {wordCount} كلمة • حوالي {estimatedReadTime} دقائق قراءة
              </span>
            </div>
          </div>

          {/* Progress percentage pill */}
          <div className="text-end shrink-0">
            <span className="text-xs font-mono font-bold">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-start">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              عنوان المقال <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: كيف أعدنا هيكلة قاعدة البيانات لتسريع الاستعلامات..."
              className="text-base font-bold bg-muted/30 focus-visible:ring-primary/40"
              maxLength={150}
            />
          </div>

          {/* Category & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                التصنيف
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-muted/30 border border-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {ARTICLE_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                الوسوم (افصل بينها بفاصلة أو مسافة)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="برمجة، تصميم، قواعد-بيانات، تجربة-المستخدم"
                className="text-xs bg-muted/30"
              />
            </div>
          </div>

          {/* Cover Image Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" />
                غلاف المقال
              </label>
              <button
                type="button"
                onClick={() => setCustomCoverOpen(!customCoverOpen)}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {customCoverOpen ? 'اختيار من النماذج' : 'إدخال رابط مخصص'}
              </button>
            </div>

            {customCoverOpen ? (
              <Input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="رابط صورة مباشر (HTTPS)..."
                className="text-xs bg-muted/30"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PRESET_COVERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverImage(preset.url)}
                    className={`relative rounded-lg overflow-hidden h-16 border-2 transition-all cursor-pointer ${
                      coverImage === preset.url
                        ? 'border-primary ring-2 ring-primary/30 scale-102 shadow-sm'
                        : 'border-border/60 hover:border-primary/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 text-center truncate px-1">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                نص المقال الكامل <span className="text-red-500">* (500 حرف كحد أدنى)</span>
              </label>
              <span
                className={`text-xs font-mono font-bold ${
                  isMinCharsMet ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {charCount} / 500 حرف
              </span>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب محتوى المقال هنا... يمكنك تنظيم الأفكار في فقرات واستعراض التجارب والأكواد والنتائج."
              className="min-h-[260px] text-sm leading-relaxed bg-muted/30 border-border/80 focus-visible:ring-primary/40 selection:bg-primary/20"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            إلغاء
          </Button>

          <div className="flex items-center gap-3">
            {!isMinCharsMet && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                تبقى {charsRemaining} حرفاً لتفعيل زر النشر
              </span>
            )}
            <Button
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 px-5 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'جارٍ النشر...' : 'نشر المقال'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
