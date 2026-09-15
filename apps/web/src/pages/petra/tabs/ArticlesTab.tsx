import React, { useState } from 'react';
import {
  Search, X, Clock, CheckCircle2, Edit3, XCircle, Eye, Heart, MessageSquare,
  ShieldCheck, ExternalLink, Trash2
} from 'lucide-react';
import { PetraArticle } from '@/services/petraService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ArticlesTabProps {
  articles: PetraArticle[];
  onOpenReviewModal: (article: PetraArticle) => void;
  onDeleteArticle: (article: PetraArticle) => void;
}

export default function ArticlesTab({
  articles,
  onOpenReviewModal,
  onDeleteArticle,
}: ArticlesTabProps) {
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('all');
  const [articleStatusFilter, setArticleStatusFilter] = useState<'all' | 'pending' | 'approved' | 'needs_revision' | 'rejected'>('all');

  const pendingArticlesCount = articles.filter((a) => (a.status || 'approved') === 'pending').length;
  const approvedArticlesCount = articles.filter((a) => (a.status || 'approved') === 'approved').length;
  const needsRevisionArticlesCount = articles.filter((a) => a.status === 'needs_revision').length;
  const rejectedArticlesCount = articles.filter((a) => a.status === 'rejected').length;

  const dynamicCategories = ['all', ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))];

  const filteredArticles = articles.filter((a) => {
    const q = articleSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.title?.toLowerCase().includes(q) ||
      a.author_name?.toLowerCase().includes(q) ||
      a.author_username?.toLowerCase().includes(q) ||
      a.summary?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (articleCategoryFilter !== 'all' && a.category !== articleCategoryFilter) {
      return false;
    }

    const currentStatus = a.status || 'approved';
    if (articleStatusFilter !== 'all' && currentStatus !== articleStatusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200" dir="rtl">
      {/* Filter & Search Header */}
      <div className="space-y-3 bg-[#140F1B] p-4 rounded-2xl border border-[#291F34]">
        {/* Row 1: Editorial Review Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#241B2E] pb-3">
          <span className="text-xs font-bold text-[#9F8EAE] shrink-0 ps-1">
            حالة المراجعة:
          </span>
          {[
            { id: 'all', label: 'الكل', count: articles.length },
            { id: 'pending', label: 'قيد المراجعة', count: pendingArticlesCount, highlight: true },
            { id: 'approved', label: 'المقبولة والمنشورة', count: approvedArticlesCount },
            { id: 'needs_revision', label: 'تتطلب تعديل نقاط', count: needsRevisionArticlesCount },
            { id: 'rejected', label: 'المرفوضة', count: rejectedArticlesCount },
          ].map((st) => {
            const isSelected = articleStatusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setArticleStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#9E2A2B] text-white font-bold shadow-xs'
                    : 'bg-[#1B1424] border border-[#30243C] text-[#9F8EAE] hover:text-white'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : st.highlight && st.count > 0
                      ? 'bg-amber-400 text-black'
                      : 'bg-black/40 text-[#C5B7CF]'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Categories + Search */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-1">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setArticleCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  articleCategoryFilter === cat
                    ? 'bg-[#3A2449] border border-[#694285] text-white font-bold'
                    : 'bg-[#1B1424] border border-[#30243C] text-[#9F8EAE] hover:text-white'
                }`}
              >
                {cat === 'all' ? 'جميع التصنيفات' : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999]" />
            <Input
              type="text"
              placeholder="بحث في عنوان المقال، الكاتب، أو المحتوى..."
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="bg-[#1B1424] border-[#30243C] text-white pr-10 pl-9 text-xs h-9 rounded-xl"
            />
            {articleSearch && (
              <button
                onClick={() => setArticleSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7999] hover:text-white p-1 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-[#140F1B] rounded-2xl border border-[#291F34] text-[#9A8AA7] text-xs">
            لا توجد مقالات مطابقة لمعايير البحث والتصفية المحددة
          </div>
        ) : (
          filteredArticles.map((art) => {
            const status = art.status || 'approved';
            return (
              <div
                key={art.id}
                className={`bg-[#140F1B] border rounded-2xl p-4 sm:p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm ${
                  status === 'pending'
                    ? 'border-amber-500/50 bg-amber-500/[0.03]'
                    : status === 'needs_revision'
                    ? 'border-orange-500/40 bg-orange-500/[0.02]'
                    : status === 'rejected'
                    ? 'border-red-700/40 bg-red-950/[0.08]'
                    : 'border-[#291F34] hover:border-[#47365C]'
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0 text-start">
                  {/* Meta Top Line */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {(art.author_name || 'ك')[0]}
                    </div>
                    <span className="font-bold text-white text-sm">{art.author_name}</span>
                    <span className="text-xs text-[#9A8AA7] font-mono">@{art.author_username}</span>
                    <span className="text-[#7A6A87]">•</span>
                    <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px] px-2 py-0.5 border border-[#3E2E4E]">
                      {art.category}
                    </Badge>

                    {/* 3 Review Status Badges */}
                    {status === 'pending' && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] px-2 py-0.5 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3" />
                        <span>قيد المراجعة التحريرية</span>
                      </Badge>
                    )}
                    {status === 'approved' && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] px-2 py-0.5 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مقبول ومنشور</span>
                      </Badge>
                    )}
                    {status === 'needs_revision' && (
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px] px-2 py-0.5 flex items-center gap-1 font-bold">
                        <Edit3 className="w-3 h-3" />
                        <span>يتطلب تعديل نقاط</span>
                      </Badge>
                    )}
                    {status === 'rejected' && (
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px] px-2 py-0.5 flex items-center gap-1 font-bold">
                        <XCircle className="w-3 h-3" />
                        <span>مرفوض</span>
                      </Badge>
                    )}

                    <span className="text-xs text-[#7A6A87]">• {art.timestamp_text}</span>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h4 className="text-base font-bold text-white leading-snug">
                      {art.title}
                    </h4>
                    {art.summary && (
                      <p className="text-xs text-[#C5B7CF] line-clamp-2 mt-1 leading-relaxed">
                        {art.summary}
                      </p>
                    )}
                  </div>

                  {/* Admin Notes Box if present */}
                  {art.admin_notes && (
                    <div className="p-2.5 rounded-xl bg-[#1E1626] border border-[#3A2A48] text-xs space-y-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <span>ملاحظات المراجعة التحريرية:</span>
                      </span>
                      <p className="text-[#E0D5EB] leading-relaxed">{art.admin_notes}</p>
                    </div>
                  )}

                  {/* Metrics Pill Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#A898B5]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      {art.views_count || 0} قراءة
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      {art.likes_count || 0} إعجاب
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      {art.comments_count || 0} رد
                    </span>
                    <span className="text-[#7A6A87]">•</span>
                    <span className="font-mono text-amber-300/90">
                      {art.char_count.toLocaleString('ar-EG')} حرف
                    </span>
                    <span className="text-[#7A6A87]">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {art.read_time_minutes || 1} دقيقة
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-end md:self-center shrink-0">
                  {/* 1. Review Decision Button */}
                  <Button
                    size="sm"
                    onClick={() => onOpenReviewModal(art)}
                    className={`text-xs h-9 gap-1.5 cursor-pointer font-bold ${
                      status === 'pending'
                        ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-md'
                        : 'bg-[#22162B] hover:bg-[#342242] border border-[#432C54] text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{status === 'pending' ? 'مراجعة وتحديد القرار' : 'تعديل القرار'}</span>
                  </Button>

                  {/* 2. Preview Article */}
                  <a
                    href={`/articles/${art.slug || art.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-[#1B1424] hover:bg-[#281D33] border-[#30243C] text-white text-xs h-9 gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>معاينة</span>
                    </Button>
                  </a>

                  {/* 3. Delete Article */}
                  <Button
                    size="sm"
                    onClick={() => onDeleteArticle(art)}
                    className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-9 gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
