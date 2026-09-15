import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowRight, Bold, Italic, Underline, Heading2, Heading3, Quote,
  List, ListOrdered, Code, Link2, Minus, Sparkles, Send, Eye,
  AlertTriangle, Check, Image as ImageIcon, X, HelpCircle, FileText, CheckCircle2
} from 'lucide-react';
import { articlesService, Article } from '@/services/articlesService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function markdownToHtml(md: string): string {
  if (!md) return '';
  // If it already looks like HTML, return as-is
  if (/<(p|h[1-6]|ul|ol|li|blockquote|strong|em|pre|code|hr|a)\b/i.test(md)) {
    return md;
  }

  const lines = md.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith('### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }
      htmlLines.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }
      htmlLines.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }
      htmlLines.push(`<h2>${formatInline(line.slice(2))}</h2>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }
      htmlLines.push(`<blockquote>${formatInline(line.slice(2))}</blockquote>`);
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }
      htmlLines.push('<hr />');
      continue;
    }

    // Bullet list
    if (/^[-*•]\s+/.test(line)) {
      if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }
      if (!inList) { htmlLines.push('<ul>'); inList = true; }
      const itemText = line.replace(/^[-*•]\s+/, '');
      htmlLines.push(`<li>${formatInline(itemText)}</li>`);
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      if (!inOrderedList) { htmlLines.push('<ol>'); inOrderedList = true; }
      const itemText = line.replace(/^\d+\.\s+/, '');
      htmlLines.push(`<li>${formatInline(itemText)}</li>`);
      continue;
    }

    // Normal line
    if (inList) { htmlLines.push('</ul>'); inList = false; }
    if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }

    if (line.trim() === '') {
      htmlLines.push('<p><br></p>');
    } else {
      htmlLines.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inList) htmlLines.push('</ul>');
  if (inOrderedList) htmlLines.push('</ol>');

  return htmlLines.join('');
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export default function ArticleEditor() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get('id');

  // Form states
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('تقنية');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Existing article state (for editing)
  const [existingArticle, setExistingArticle] = useState<Article | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(Boolean(editId));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Content stats
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // WYSIWYG Editor Reference
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Load available categories
  useEffect(() => {
    articlesService.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setAvailableCategories(cats);
        if (!editId) setCategory(cats[0]);
      } else {
        setAvailableCategories(['تقنية', 'برمجة', 'ذكاء اصطناعي', 'ريادة أعمال', 'تصميم', 'أمن سيبراني', 'عام']);
      }
    });
  }, [editId]);

  // Load article if editing
  useEffect(() => {
    if (!editId) return;

    setIsLoadingArticle(true);
    articlesService.getArticle(editId)
      .then((art) => {
        if (!art) {
          toast({
            title: 'المقال غير موجود',
            description: 'تعذر العثور على المقال المطلوب للتعديل.',
            variant: 'destructive',
          });
          navigate('/articles');
          return;
        }

        // Verify author permissions
        if (user && art.author?.id && user.id !== art.author.id && user.role !== 'admin') {
          toast({
            title: 'غير مصرح',
            description: 'لا يمكنك تعديل مقال لا يتبع لحسابك.',
            variant: 'destructive',
          });
          navigate('/articles');
          return;
        }

        setExistingArticle(art);
        setTitle(art.title || '');
        setSummary(art.summary || '');
        setCategory(art.category || 'عام');
        setCoverImage(art.coverImage || '');
        setTagsInput(Array.isArray(art.tags) ? art.tags.join('، ') : '');

        // Prepopulate visual editor with HTML
        const html = markdownToHtml(art.content || '');
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
          updateCounts();
        }
      })
      .catch((err) => {
        toast({
          title: 'خطأ',
          description: 'تعذر تحميل بيانات المقال',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsLoadingArticle(false);
      });
  }, [editId, user]);

  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    setCharCount(cleanText.length);
    setWordCount(cleanText ? cleanText.split(' ').filter(Boolean).length : 0);
  };

  // WYSIWYG Formatting actions (Real visual - NO RAW STARS!)
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateCounts();
  };

  const handleCreateHeading = (level: 'h2' | 'h3') => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('formatBlock', false, `<${level}>`);
    updateCounts();
  };

  const handleCreateParagraph = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('formatBlock', false, '<p>');
    updateCounts();
  };

  const handleCreateBlockquote = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('formatBlock', false, '<blockquote>');
    updateCounts();
  };

  const handleInsertCodeBlock = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    const text = selection?.toString() || 'اكتب الكود البرمجي هنا...';
    document.execCommand(
      'insertHTML',
      false,
      `<pre class="code-block" style="background:#15121b;color:#4ade80;padding:14px;border-radius:12px;font-family:monospace;direction:ltr;text-align:left;border:1px solid #2e2638;margin:12px 0;"><code>${text}</code></pre><p><br></p>`
    );
    updateCounts();
  };

  const handleInsertLink = () => {
    const url = window.prompt('أدخل رابط الموقع (URL):', 'https://');
    if (!url || url.trim() === 'https://') return;
    execFormat('createLink', url.trim());
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (!availableCategories.includes(trimmed)) {
      setAvailableCategories((prev) => [trimmed, ...prev]);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'تسجيل الدخول مطلوب',
        description: 'يجب تسجيل الدخول لنشر أو تعديل المقالات.',
        variant: 'destructive',
      });
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast({
        title: 'عنوان المقال مطلوب',
        description: 'يرجى كتابة عنوان رئيسي للمقال.',
        variant: 'destructive',
      });
      return;
    }

    const htmlContent = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.innerText || '';
    const cleanChars = plainText.replace(/\s+/g, ' ').trim().length;

    if (cleanChars < 500) {
      toast({
        title: 'المقال قصير جداً',
        description: `المحتوى الحالي (${cleanChars} حرف). يجب ألا يقل المقال عن 500 حرف لإرساله للتدقيق التحريري.`,
        variant: 'destructive',
      });
      return;
    }

    const tags = tagsInput
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      if (existingArticle) {
        // Update existing article
        const res = await articlesService.updateArticle(existingArticle.id, {
          title: cleanTitle,
          content: htmlContent,
          summary: summary.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
          category,
          tags,
        });

        if (res.success) {
          toast({
            title: 'تم تحديث المقال بنجاح 🚀',
            description: 'تم إرسال المقال إلى لوحة الإدارة لإعادة مراجعته واعتماد نشره.',
          });
          const targetSlug = existingArticle.slug || existingArticle.id;
          navigate(`/articles/${targetSlug}`);
        } else {
          toast({
            title: 'تعذر حفظ التعديل',
            description: res.message || 'حدث خطأ أثناء حفظ المقال.',
            variant: 'destructive',
          });
        }
      } else {
        // Create new article
        const res = await articlesService.createArticle({
          title: cleanTitle,
          content: htmlContent,
          summary: summary.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
          category,
          tags,
        });

        if (res.success && res.article) {
          toast({
            title: 'تم إرسال المقال للمراجعة التحريرية 🎉',
            description: 'سيتم فحص المقال من قِبل المشرفين في بوابة بترا وإشعارك فور اعتماده ونشره.',
          });
          const targetSlug = res.article.slug || res.article.id;
          navigate(`/articles/${targetSlug}`);
        } else {
          toast({
            title: 'تعذر نشر المقال',
            description: res.message || 'حدث خطأ أثناء إرسال المقال.',
            variant: 'destructive',
          });
        }
      }
    } catch (err: any) {
      toast({
        title: 'خطأ غير متوقع',
        description: err?.message || 'يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center rtl">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">جارٍ تجهيز محرر المقال...</p>
        </div>
      </div>
    );
  }

  const isNeedsRevision = existingArticle?.status === 'needs_revision';

  return (
    <div className="min-h-screen bg-background text-foreground rtl flex flex-col selection:bg-primary/25">
      {/* 1. Sticky Full-Screen Top Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border py-2.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(existingArticle ? `/articles/${existingArticle.slug || existingArticle.id}` : '/articles')}
            className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden sm:inline">العودة</span>
          </Button>

          <span className="text-border hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {existingArticle ? 'تعديل المقال' : 'كتابة مقال جديد'}
            </span>
            {existingArticle && (
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  isNeedsRevision
                    ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                    : existingArticle.status === 'pending'
                    ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                    : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                }`}
              >
                {isNeedsRevision ? 'مطلوب تعديل نقاط' : existingArticle.status === 'pending' ? 'قيد المراجعة' : 'معتمد'}
              </Badge>
            )}
          </div>
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-3">
          {/* Character counter pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className={`font-mono font-bold ${charCount >= 500 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {charCount} / 500 حرف
            </span>
            {charCount >= 500 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <span className="text-[10px] text-muted-foreground">(الحد الأدنى 500)</span>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || charCount < 500}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'جارٍ الحفظ...' : existingArticle ? 'حفظ التعديلات وإرسال للمراجعة' : 'إرسال المقال للمراجعة التحريرية'}</span>
          </Button>
        </div>
      </header>

      {/* 2. Admin Revision Advisory Banner (If needs_revision) */}
      {isNeedsRevision && existingArticle?.adminNotes && (
        <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 sm:px-8 py-3.5">
          <div className="max-w-4xl mx-auto flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-start">
              <h4 className="text-xs font-black text-orange-600 dark:text-orange-400">
                ملاحظات المشرف التحريري المطلوب تعديلها:
              </h4>
              <p className="text-xs text-foreground/90 font-medium leading-relaxed bg-background/60 p-2.5 rounded-xl border border-orange-500/30">
                "{existingArticle.adminNotes}"
              </p>
              <p className="text-[11px] text-muted-foreground">
                يرجى تعديل النقاط المذكورة أعلاه في نص المقال ثم الضغط على زر "حفظ التعديلات وإرسال للمراجعة".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Writing Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title Input */}
        <div>
          <Textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان المقال الرئيسي هنا..."
            rows={1}
            className="w-full text-2xl sm:text-4xl font-black bg-transparent border-0 border-b border-border/60 focus-visible:ring-0 focus-visible:border-primary rounded-none px-0 py-2 placeholder:text-muted-foreground/50 resize-none leading-snug"
          />
        </div>

        {/* Categories & Cover Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-card border border-border/70 text-start">
          {/* Category Pill Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground block">
              التصنيف:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {!isAddingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  + تصنيف جديد
                </button>
              ) : (
                <form onSubmit={handleCreateCategory} className="flex items-center gap-1">
                  <Input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="اسم التصنيف..."
                    autoFocus
                    className="h-7 text-xs w-28 px-2 bg-background border-primary"
                  />
                  <Button type="submit" size="sm" className="h-7 px-2 text-xs font-bold cursor-pointer">
                    إضافة
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCategory(false)}
                    className="h-7 px-1.5 text-xs text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>رابط صورة الغلاف (اختياري):</span>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="text-destructive hover:underline text-[11px]"
                >
                  إزالة الصورة
                </button>
              )}
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="pr-9 text-xs h-9 bg-background/70 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Cover Preview if provided */}
        {coverImage && (
          <div className="relative w-full h-52 sm:h-72 rounded-2xl overflow-hidden border border-border shadow-xs bg-muted">
            <img
              src={coverImage}
              alt="معاينة الغلاف"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Summary / Subtitle */}
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block text-start">
            الموجز أو المقدمة التشويقية (يظهر في البطاقة وبداية المقال):
          </label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="مقدمة سريعة للمقال تشرح الفكرة وتجذب القارئ..."
            rows={2}
            className="text-xs bg-card border-border/70 rounded-xl"
          />
        </div>

        {/* 4. REAL WYSIWYG TOOLBAR (Visual buttons - No stars!) */}
        <div className="sticky top-14 z-30 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-1.5 shadow-sm flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Bold */}
            <button
              type="button"
              onClick={() => execFormat('bold')}
              title="خط عريض (Bold)"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted font-black text-sm text-foreground transition-colors cursor-pointer"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => execFormat('italic')}
              title="خط مائل (Italic)"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted italic text-sm text-foreground transition-colors cursor-pointer"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => execFormat('underline')}
              title="تسطير (Underline)"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-sm text-foreground transition-colors cursor-pointer"
            >
              <Underline className="w-4 h-4" />
            </button>

            <span className="w-px h-5 bg-border mx-1" />

            {/* Heading 2 */}
            <button
              type="button"
              onClick={() => handleCreateHeading('h2')}
              title="عنوان رئيسي (H2)"
              className="h-8 px-2 rounded-lg flex items-center gap-1 hover:bg-muted font-black text-xs text-foreground transition-colors cursor-pointer"
            >
              <Heading2 className="w-4 h-4" />
              <span className="hidden sm:inline">عنوان رئيسي</span>
            </button>

            {/* Heading 3 */}
            <button
              type="button"
              onClick={() => handleCreateHeading('h3')}
              title="عنوان فرعي (H3)"
              className="h-8 px-2 rounded-lg flex items-center gap-1 hover:bg-muted font-bold text-xs text-foreground transition-colors cursor-pointer"
            >
              <Heading3 className="w-4 h-4" />
              <span className="hidden sm:inline">فرعي</span>
            </button>

            {/* Paragraph */}
            <button
              type="button"
              onClick={handleCreateParagraph}
              title="فقرة عادية"
              className="h-8 px-2 rounded-lg flex items-center gap-1 hover:bg-muted text-xs text-foreground transition-colors cursor-pointer font-medium"
            >
              <span>فقرة</span>
            </button>

            <span className="w-px h-5 bg-border mx-1" />

            {/* Blockquote */}
            <button
              type="button"
              onClick={handleCreateBlockquote}
              title="اقتباس مميز"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Quote className="w-4 h-4" />
            </button>

            {/* Bullet List */}
            <button
              type="button"
              onClick={() => execFormat('insertUnorderedList')}
              title="قائمة نقطية"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <List className="w-4 h-4" />
            </button>

            {/* Ordered List */}
            <button
              type="button"
              onClick={() => execFormat('insertOrderedList')}
              title="قائمة رقمية"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            {/* Code Block */}
            <button
              type="button"
              onClick={handleInsertCodeBlock}
              title="كتلة كود برمجي"
              className="h-8 px-2 rounded-lg flex items-center gap-1 hover:bg-muted text-xs font-mono text-emerald-400 transition-colors cursor-pointer"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">كود</span>
            </button>

            {/* Link */}
            <button
              type="button"
              onClick={handleInsertLink}
              title="إضافة رابط"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
            </button>

            {/* Divider */}
            <button
              type="button"
              onClick={() => execFormat('insertHorizontalRule')}
              title="فاصل أفقي"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pe-2">
            <span>{wordCount} كلمة</span>
          </div>
        </div>

        {/* 5. VISUAL CONTENTEDITABLE CANVAS (WHAT YOU SEE IS WHAT YOU GET) */}
        <div className="min-h-[480px] bg-card/60 border border-border/80 rounded-2xl p-6 sm:p-10 text-start shadow-inner">
          <div
            ref={editorRef}
            contentEditable
            onInput={updateCounts}
            onKeyUp={updateCounts}
            data-placeholder="ابدأ بكتابة مقالك هنا مباشرة بتنسيق بصري كامل... التنسيق يظهر فوراً بدون نجوم أو رموز برمجية!"
            className="article-wysiwyg-canvas outline-none text-base sm:text-lg leading-[2.1] text-foreground min-h-[420px] prose dark:prose-invert max-w-none focus:outline-none"
            dir="rtl"
          />
        </div>

        {/* Tags input */}
        <div className="text-start space-y-1.5 pt-2">
          <label className="text-xs font-bold text-muted-foreground block">
            الوسوم والكلمات المفتاحية (مفصولة بفاصلة):
          </label>
          <Input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="مثال: ذكاء اصطناعي، رياكت، أداء الويب، تجربة المستخدم"
            className="text-xs bg-card border-border/70 rounded-xl"
          />
        </div>

        {/* Bottom Submission Bar */}
        <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-start">
            <span className="font-bold text-foreground">معايير النشر: </span>
            <span>يجب أن يتضمن المقال محتوى مفيداً وأصلياً لا يقل عن 500 حرف. المقال يدخل المراجعة التحريرية فور حفظه.</span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || charCount < 500}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold text-sm h-11 px-8 rounded-xl gap-2 cursor-pointer shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'جارٍ الإرسال...' : existingArticle ? 'حفظ التعديلات وإرسال للمراجعة' : 'إرسال المقال للمراجعة التحريرية'}</span>
          </Button>
        </div>
      </main>

      {/* Editor CSS styles for rich visual formatting */}
      <style>{`
        .article-wysiwyg-canvas:empty:before {
          content: attr(data-placeholder);
          color: rgba(156, 163, 175, 0.5);
          pointer-events: none;
          display: block;
        }
        .article-wysiwyg-canvas h2 {
          font-size: 1.65rem;
          font-weight: 900;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: inherit;
          border-bottom: 1px solid rgba(156, 163, 175, 0.2);
          padding-bottom: 0.35rem;
        }
        .article-wysiwyg-canvas h3 {
          font-size: 1.35rem;
          font-weight: 800;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: inherit;
        }
        .article-wysiwyg-canvas p {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          line-height: 2.1;
        }
        .article-wysiwyg-canvas blockquote {
          border-right: 4px solid var(--primary, #9E2A2B);
          padding: 0.75rem 1.25rem;
          margin: 1.25rem 0;
          background: rgba(158, 42, 43, 0.05);
          border-radius: 0 12px 12px 0;
          font-style: italic;
        }
        .article-wysiwyg-canvas ul {
          list-style-type: disc;
          padding-right: 1.5rem;
          margin: 0.75rem 0;
        }
        .article-wysiwyg-canvas ol {
          list-style-type: decimal;
          padding-right: 1.5rem;
          margin: 0.75rem 0;
        }
        .article-wysiwyg-canvas li {
          margin-bottom: 0.35rem;
        }
        .article-wysiwyg-canvas hr {
          border: 0;
          border-top: 1px solid rgba(156, 163, 175, 0.3);
          margin: 2rem 0;
        }
        .article-wysiwyg-canvas a {
          color: var(--primary, #9E2A2B);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
