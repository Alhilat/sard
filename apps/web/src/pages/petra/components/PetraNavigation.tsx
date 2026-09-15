import React from 'react';
import {
  Activity, Users, MessageSquare, BookOpen, Layers, FileText
} from 'lucide-react';

export type PetraTab = 'overview' | 'users' | 'posts' | 'articles' | 'groups' | 'logs';

interface PetraNavigationProps {
  activeTab: PetraTab;
  onSelectTab: (tab: PetraTab) => void;
  counts: {
    users: number;
    posts: number;
    articles: number;
    pendingArticles: number;
    groups: number;
    logs: number;
  };
}

export default function PetraNavigation({
  activeTab,
  onSelectTab,
  counts,
}: PetraNavigationProps) {
  const tabs: Array<{
    id: PetraTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badge?: React.ReactNode;
  }> = [
    {
      id: 'overview',
      label: 'نظرة عامة والقياسات',
      icon: Activity,
    },
    {
      id: 'users',
      label: 'المستخدمون والحظر',
      icon: Users,
      count: counts.users,
    },
    {
      id: 'posts',
      label: 'المنشورات والتعليقات',
      icon: MessageSquare,
      count: counts.posts,
    },
    {
      id: 'articles',
      label: 'المقالات والتحرير',
      icon: BookOpen,
      count: counts.articles,
      badge: counts.pendingArticles > 0 ? (
        <span className="bg-amber-400 text-black font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
          {counts.pendingArticles} جديد
        </span>
      ) : null,
    },
    {
      id: 'groups',
      label: 'المجموعات',
      icon: Layers,
      count: counts.groups,
    },
    {
      id: 'logs',
      label: 'سجل العمليات الإدارية',
      icon: FileText,
      count: counts.logs,
    },
  ];

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#231A2D] pt-2">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#22172D] text-white font-bold border border-[#482E60] shadow-sm'
                : 'text-[#9A89A8] hover:text-white hover:bg-[#16111E]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'opacity-70'}`} />
            <span>{tab.label}</span>

            {tab.badge ? (
              tab.badge
            ) : typeof tab.count === 'number' ? (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected ? 'bg-black/40 text-white font-bold' : 'bg-[#1D1726] text-[#867595]'
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
