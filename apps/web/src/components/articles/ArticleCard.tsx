import { Article } from '@/services/articlesService';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Heart, MessageSquare, BookOpen, CheckCircle2, Bookmark } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onRead: (article: Article) => void;
  onLike?: (article: Article) => void;
  onBookmark?: (article: Article) => void;
}

export default function ArticleCard({
  article,
  onRead,
  onLike,
  onBookmark,
}: ArticleCardProps) {
  const authorInitial = (article.author?.name || 'س')[0];

  return (
    <article
      onClick={() => onRead(article)}
      className="group relative bg-card hover:bg-card/90 border border-border/80 hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col cursor-pointer"
    >
      {/* Cover Image or Thematic Header */}
      <div className="relative w-full h-48 sm:h-52 bg-muted overflow-hidden shrink-0">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/30 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-primary/40" />
          </div>
        )}

        {/* Category Pill Over Cover */}
        <div className="absolute top-3 end-3 flex items-center gap-1.5 z-10">
          <Badge className="bg-background/90 backdrop-blur-md text-foreground border border-border/70 font-bold text-xs px-2.5 py-0.5 shadow-sm">
            {article.category}
          </Badge>
        </div>

        {/* Reading Time Pill Over Cover */}
        <div className="absolute bottom-3 start-3 flex items-center gap-2 z-10">
          <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Clock className="w-3 h-3 text-amber-300" />
            {article.readTimeMinutes} دقائق قراءة
          </span>
          <span className="bg-black/70 backdrop-blur-md text-white/90 text-[11px] font-mono px-2 py-1 rounded-lg">
            {article.charCount.toLocaleString('ar-EG')} حرف
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Author info */}
          <div className="flex items-center gap-2.5">
            {article.author?.avatar ? (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                {authorInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-foreground truncate">
                  {article.author?.name}
                </span>
                {article.author?.verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {article.timestamp}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Tags and Meta stats */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onLike) onLike(article);
              }}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                article.isLiked ? 'text-red-500 font-bold' : ''
              }`}
              title="إعجاب"
            >
              <Heart className={`w-4 h-4 ${article.isLiked ? 'fill-current' : ''}`} />
              <span>{article.likesCount}</span>
            </button>

            <span className="flex items-center gap-1 hover:text-foreground transition-colors" title="الردود والمناقشات">
              <MessageSquare className="w-4 h-4" />
              <span>{article.commentsCount}</span>
            </span>

            <span className="flex items-center gap-1" title="المشاهدات">
              <Eye className="w-4 h-4" />
              <span>{article.viewsCount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(article);
                }}
                className={`p-1 rounded-md hover:bg-muted transition-colors ${
                  article.isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="حفظ المقال"
              >
                <Bookmark className={`w-4 h-4 ${article.isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}

            <span className="text-primary text-xs font-semibold group-hover:underline">
              اقرأ المقال ←
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
