import { useState, useEffect, useRef } from 'react';
import { articlesService } from '@/services/articlesService';
import { PRESET_COVERS } from './types';
import ArticleMarkdown from './ArticleMarkdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles, Image, Tag, Send, CheckCircle2, AlertCircle, BookOpen,
  Bold, Italic, Heading2, Heading3, Quote, List, ListOrdered,
  Code, Link2, Minus, Eye, Edit3, Plus, Check, Undo2, ShieldCheck
} from 'lucide-react';

interface ArticleComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArticleCreated: () => void;
}

const DEFAULT_SUGGESTED_CATEGORIES = [
  'تقنية',
  'برمجة وتطوير',
  'تصميم وتجربة المستخدم',
  'ذكاء اصطناعي',
  'ريادة أعمال',
  'أمن سيبراني',
  'قواعد بيانات',
  'عام',
];

export default function ArticleComposerModal({
  open,
  onOpenChange,
  onArticleCreated,
}: ArticleComposerModalProps) {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [customCoverOpen, setCustomCoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Categories state
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_SUGGESTED_CATEGORIES);
  const [category, setCategory] = useState('تقنية');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Editor vs Live Preview mode
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Load existing categories from backend on open
  useEffect(() => {
    if (open) {
      articlesService.getCategories().then((serverCats) => {
        if (serverCats && serverCats.length > 0) {
          const merged = Array.from(new Set([...serverCats, ...DEFAULT_SUGGESTED_CATEGORIES]));
          setAvailableCategories(merged);
          if (!category || !merged.includes(category)) {
            setCategory(merged[0]);
          }
        }
      });
    }
  }, [open]);

  const MIN_CHARS = 500;
  const charCount = content.trim().length;
  const isMinCharsMet = charCount >= MIN_CHARS;
  const charsRemaining = Math.max(0, MIN_CHARS - charCount);
  const progressPercent = Math.min(100, Math.round((charCount / MIN_CHARS) * 100));

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 160));

  const isValid = title.trim().length >= 5 && isMinCharsMet && Boolean(category.trim());

  // Smart text formatting insertion
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
      } else if (defaultPlaceholder) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
      } else {
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      }
    }, 10);
  };

  // Keyboard shortcut listener (Ctrl+B, Ctrl+I)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'نص عريض');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'نص مائل');
    }
  };

  // Add custom category
  const handleAddNewCategory = () => {
    const clean = newCategoryName.trim();
    if (!clean) return;

    if (!availableCategories.includes(clean)) {
      setAvailableCategories((prev) => [clean, ...prev]);
    }
    setCategory(clean);
    setNewCategoryName('');
    setIsAddingNewCategory(false);
  };

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
        category: category.trim(),
        tags,
        coverImage,
      });

      if (res.success) {
        toast({
          title: 'تم إرسال المقال بنجاح!',
          description: res.message || 'المقال قيد المراجعة التحريرية من قبل الإدارة وسوف يظهر للعامة فور اعتماده.',
        });
        setTitle('');
        setContent('');
        setTagsInput('');
        setIsAddingNewCategory(false);
        setActiveTab('edit');
        onOpenChange(false);
        onArticleCreated();
      } else {
        toast({
          title: 'تعذر إرسال المقال',
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <DialogTitle className="text-xl font-black text-foreground">
                كتابة مقال جديد
              </DialogTitle>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مراجعة تحريرية قبل النشر</span>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            الحد الأدنى لنص المقال هو 500 حرف لتقديم محتوى متكامل وقيمة معرفية للمجتمع.
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
                  ? `مستوفٍ للحد الأدنى (${charCount} حرفاً) • جاهز للإرسال للمراجعة`
                  : `الحد الأدنى 500 حرف • متبقي ${charsRemaining} حرفاً`}
              </span>
              <span className="block text-[11px] opacity-80 mt-0.5">
                {wordCount} كلمة • حوالي {estimatedReadTime} دقائق قراءة
              </span>
            </div>
          </div>

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
              placeholder="مثال: رحلتنا في تحسين بنية البيانات وتقليص زمن الاستجابة إلى 50ms..."
              className="text-base font-bold bg-muted/30 focus-visible:ring-primary/40"
              maxLength={150}
            />
          </div>

          {/* Dynamic Category & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Selector with dynamic addition */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  التصنيف <span className="text-red-500">*</span>
                </label>
                {!isAddingNewCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(true)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة تصنيف جديد</span>
                  </button>
                )}
              </div>

              {isAddingNewCategory ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="اكتب اسم التصنيف الجديد (مثال: أمن سيبراني)..."
                    className="h-10 text-xs bg-muted/40 focus-visible:ring-primary/40"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewCategory}
                    disabled={!newCategoryName.trim()}
                    className="h-10 px-3 bg-primary text-primary-foreground text-xs gap-1 shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>إضافة</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingNewCategory(false)}
                    className="h-10 px-2 text-xs text-muted-foreground shrink-0 cursor-pointer"
                    title="إلغاء والعودة للقائمة"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingNewCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-md bg-muted/30 border border-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__add_new__" className="text-primary font-bold">
                      + إضافة تصنيف جديد مخصص...
                    </option>
                  </select>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                الوسوم (افصل بينها بفاصلة أو مسافة)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="برمجة، ذكاء-اصطناعي، تجربة-المستخدم"
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
                className="text-xs text-primary hover:underline cursor-pointer font-semibold"
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

          {/* Content Area with Rich Text Toolbar and Preview Tab */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>نص المقال الكامل</span>
                <span className="text-red-500">* (الحد الأدنى 500 حرف)</span>
              </label>

              {/* Edit / Preview Tabs */}
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'edit'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>المحرر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة حية</span>
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <div className="space-y-1.5">
                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/40 rounded-t-xl border border-border/80 border-b-0 text-muted-foreground">
                  {/* Bold Button */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'نص عريض')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    title="عريض (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  {/* Italic Button */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'نص مائل')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    title="مائل (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-border/80 mx-1" />

                  {/* Heading 2 */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n\n## ', '\n', 'عنوان رئيسي')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-black"
                    title="عنوان رئيسي (H2)"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>

                  {/* Heading 3 */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n\n### ', '\n', 'عنوان فرعي')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-bold"
                    title="عنوان فرعي (H3)"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-border/80 mx-1" />

                  {/* Blockquote */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n\n> ', '\n', 'اقتباس أو فكرة مميزة')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    title="اقتباس"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  {/* Bullet List */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n- ', '', 'عنصر في القائمة')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    title="قائمة نقطية"
                  >
                    <List className="w-4 h-4" />
                  </button>

                  {/* Numbered List */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n1. ', '', 'خطوة مرقمة')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    title="قائمة رقمية"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-border/80 mx-1" />

                  {/* Code Block / Inline Code */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n```javascript\n', '\n```\n', '// اكتب كودك البرمجي هنا')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer font-mono text-xs"
                    title="كتلة برمجية"
                  >
                    <Code className="w-4 h-4" />
                  </button>

                  {/* Link */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('[', '](https://example.com)', 'عنوان الرابط')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    title="رابط إلكتروني"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  {/* Divider */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n\n---\n\n', '')}
                    className="p-1.5 rounded-md hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    title="فاصل أفقي"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="ms-auto text-[11px] text-muted-foreground/80 font-mono hidden sm:inline px-1">
                    يدعم Markdown • Ctrl+B
                  </span>
                </div>

                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب محتوى المقال هنا... استخدم الأزرار العلوية لتنسيق العناوين، النصوص العريضة، القوائم، أو الأكواد البرمجية."
                  className="min-h-[280px] text-sm leading-relaxed bg-muted/20 border-border/80 rounded-t-none focus-visible:ring-primary/40 selection:bg-primary/20 font-sans"
                />
              </div>
            ) : (
              /* Live Preview */
              <div className="min-h-[280px] p-5 rounded-xl border border-border/80 bg-card/60 overflow-y-auto max-h-[380px]">
                {content.trim() ? (
                  <ArticleMarkdown content={content} />
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <Eye className="w-8 h-8 opacity-40 mx-auto" />
                    <p>المعاينة فارغة. اكتب نصاً في المحرر واستخدم أزرار التنسيق لمشاهدة المظهر النهائي هنا.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>{wordCount} كلمة • {estimatedReadTime} دقيقة قراءة</span>
              <span
                className={`font-mono font-bold ${
                  isMinCharsMet ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {charCount} / 500 حرف
              </span>
            </div>
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
                تبقى {charsRemaining} حرفاً لتفعيل زر الإرسال
              </span>
            )}
            <Button
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 px-6 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'جارٍ الإرسال للمراجعة...' : 'إرسال المقال للمراجعة'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
