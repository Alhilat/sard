import React from 'react';
import { Hash, X } from 'lucide-react';

interface FeedTabsProps {
  activeTab: 'forYou' | 'following' | 'trending';
  onTabChange: (tab: 'forYou' | 'following' | 'trending') => void;
  selectedTagFilter: string | null;
  onClearTagFilter: () => void;
}

export default function FeedTabs({
  activeTab,
  onTabChange,
  selectedTagFilter,
  onClearTagFilter,
}: FeedTabsProps) {
  return (
    <div className="space-y-3 w-full min-w-0">
      {/* Active Tag Filter Indicator */}
      {selectedTagFilter && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs w-full min-w-0">
          <span className="flex items-center gap-1.5 font-bold text-primary truncate">
            <Hash className="w-4 h-4 shrink-0" />
            تصفية حسب الوسم: #{selectedTagFilter}
          </span>
          <button
            type="button"
            onClick={onClearTagFilter}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            عرض جميع السردات
          </button>
        </div>
      )}

      {/* Twitter Style Sticky Navigation Tabs */}
      <div className="grid grid-cols-3 border-b border-border/80 bg-card/60 backdrop-blur-xs rounded-xl overflow-hidden p-1 gap-1 w-full min-w-0">
        <button
          type="button"
          onClick={() => {
            onTabChange('forYou');
            if (selectedTagFilter) onClearTagFilter();
          }}
          className={`py-2 px-1 text-xs sm:text-sm font-bold transition-all rounded-lg cursor-pointer text-center truncate ${
            activeTab === 'forYou' && !selectedTagFilter
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span>لك<span className="hidden sm:inline"> (المقترحة)</span></span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTabChange('following');
            if (selectedTagFilter) onClearTagFilter();
          }}
          className={`py-2 px-1 text-xs sm:text-sm font-bold transition-all rounded-lg cursor-pointer text-center truncate ${
            activeTab === 'following' && !selectedTagFilter
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span>المتابعون</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTabChange('trending');
            if (selectedTagFilter) onClearTagFilter();
          }}
          className={`py-2 px-1 text-xs sm:text-sm font-bold transition-all rounded-lg cursor-pointer text-center truncate ${
            activeTab === 'trending' && !selectedTagFilter
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span>الرائجة<span className="hidden sm:inline"> والأكثر تفاعلاً</span></span>
        </button>
      </div>
    </div>
  );
}
