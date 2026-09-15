import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, CheckCircle2, Edit3, XCircle, ExternalLink, Check
} from 'lucide-react';
import { PetraArticle } from '@/services/petraService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ArticleReviewModalProps {
  article: PetraArticle | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitReview: (
    articleId: string,
    decision: 'approved' | 'needs_revision' | 'rejected',
    notes: string
  ) => Promise<void>;
}

export default function ArticleReviewModal({
  article,
  isOpen,
  isSubmitting,
  onClose,
  onSubmitReview,
}: ArticleReviewModalProps) {
  const { toast } = useToast();
  const [decision, setDecision] = useState<'approved' | 'needs_revision' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (article) {
      setDecision(article.status === 'pending' ? 'approved' : article.status || 'approved');
      setNotes(article.admin_notes || '');
    }
  }, [article]);

  if (!isOpen || !article) return null;

  const handleSubmit = async () => {
    if ((decision === 'needs_revision' || decision === 'rejected') && !notes.trim()) {
      toast({
        title: 'ملاحظات المراجعة مطلوبة',
        description:
          decision === 'needs_revision'
            ? 'يرجى كتابة النقاط المطلوب من الكاتب تعديلها.'
            : 'يرجى كتابة سبب رفض نشر المقال.',
        variant: 'destructive',
      });
      return;
    }

    await onSubmitReview(article.id, decision, notes.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[96vw] max-h-[92vh] overflow-y-auto bg-[#14101A] border-[#2E2437] text-white space-y-5 rtl">
        <DialogHeader className="text-start space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <DialogTitle className="text-lg font-bold text-white">
              المراجعة التحريرية للمقال
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#9A8AA7]">
            حدد القرار التحريري المناسب لهذا المقال وسيتم إشعار الكاتب تلقائياً وتحديث حالة المقال فوراً.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-start">
          {/* Article Overview Box */}
          <div className="p-3.5 rounded-xl bg-[#1C1623] border border-[#35273F] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#A898B5] font-semibold">
                الكاتب: {article.author_name} (@{article.author_username})
              </span>
              <Badge className="bg-[#2A1E35] text-[#D8B4FE] text-[10px] border border-[#483359]">
                {article.category}
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-white leading-snug">
              {article.title}
            </h4>
            {article.summary && (
              <p className="text-[#C5B7CF] text-xs line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-[#8A7999] pt-1">
              <span>{article.char_count} حرفاً</span>
              <span>•</span>
              <span>{article.read_time_minutes} دقيقة قراءة</span>
              <span>•</span>
              <a
                href={`/articles/${article.slug || article.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>معاينة المقال كاملاً</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 3 Decision Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white block">
              القرار التحريري (اختر واحدة من الحالات الثلاث):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Accept / Approved */}
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  decision === 'approved'
                    ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#1C1623] border-[#35273F] hover:border-emerald-500/50 text-[#C5B7CF]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    1. قبول ونشر المقال
                  </span>
                  {decision === 'approved' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-[#9A8AA7] leading-tight">
                  اعتماد المقال فوراً ليكون متاحاً لجميع الزوار والقراء.
                </p>
              </button>

              {/* Option 2: Edit this points / Needs Revision */}
              <button
                type="button"
                onClick={() => setDecision('needs_revision')}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  decision === 'needs_revision'
                    ? 'bg-orange-950/50 border-orange-500 ring-2 ring-orange-500/30 text-white'
                    : 'bg-[#1C1623] border-[#35273F] hover:border-orange-500/50 text-[#C5B7CF]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-orange-400 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4" />
                    2. طلب تعديل نقاط
                  </span>
                  {decision === 'needs_revision' && (
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                  )}
                </div>
                <p className="text-[10px] text-[#9A8AA7] leading-tight">
                  إرسال ملاحظات ونقاط محددة للكاتب لمراجعتها وإعادة الإرسال.
                </p>
              </button>

              {/* Option 3: Refuse to post / Rejected */}
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  decision === 'rejected'
                    ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/30 text-white'
                    : 'bg-[#1C1623] border-[#35273F] hover:border-red-500/50 text-[#C5B7CF]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-red-400 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    3. رفض النشر
                  </span>
                  {decision === 'rejected' && (
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                  )}
                </div>
                <p className="text-[10px] text-[#9A8AA7] leading-tight">
                  رفض نشر المقال نهائياً مع بيان الأسباب للكاتب.
                </p>
              </button>
            </div>
          </div>

          {/* Notes Input Area */}
          {(decision === 'needs_revision' || decision === 'rejected' || notes) && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>
                  {decision === 'needs_revision'
                    ? 'النقاط المطلوب من الكاتب تعديلها'
                    : decision === 'rejected'
                    ? 'سبب رفض نشر المقال'
                    : 'ملاحظات إضافية (اختياري)'}
                  {(decision === 'needs_revision' || decision === 'rejected') && (
                    <span className="text-red-400"> * (مطلوبة)</span>
                  )}
                </span>
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  decision === 'needs_revision'
                    ? 'اكتب النقاط المحددة المطلوب تعديلها (مثال: يرجى التوسع في فقرة الأمان، وتصحيح الكود البرمجي في الفقرة الثالثة...)'
                    : 'اكتب سبب رفض نشر هذا المقال (مثال: محتوى المقال مكرر، أو لا يطابق معايير النشر التقنية في سرد...)'
                }
                className="min-h-[100px] text-xs bg-[#1C1623] border-[#35273F] text-white focus-visible:ring-primary/40 leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-[#2E2437] flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs text-[#9A8AA7] hover:text-white cursor-pointer"
          >
            إلغاء
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`text-xs font-bold px-5 h-9 cursor-pointer gap-1.5 shadow-md ${
              decision === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : decision === 'needs_revision'
                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                : 'bg-red-700 hover:bg-red-600 text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {isSubmitting ? 'جارٍ الحفظ...' : 'تأكيد واعتماد القرار'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
