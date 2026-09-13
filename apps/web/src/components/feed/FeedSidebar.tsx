import React from 'react';
import { TrendingUp, Users, CheckCircle2, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendTopic, SuggestedUser } from './types';

interface FeedSidebarProps {
  trends: TrendTopic[];
  suggestedUsers: SuggestedUser[];
  followingMap: Record<string, boolean>;
  onSelectTag: (tag: string) => void;
  onToggleFollow: (userId: string, name: string) => void;
  onOpenUserProfile: (target: {
    id?: string;
    name: string;
    username?: string;
    avatar?: string;
    role?: string;
    verified?: boolean;
  }) => void;
}

export default function FeedSidebar({
  trends,
  suggestedUsers,
  followingMap,
  onSelectTag,
  onToggleFollow,
  onOpenUserProfile,
}: FeedSidebarProps) {
  return (
    <div className="space-y-5">
      {/* Trending in Sard (ترند سرد - ما يحدث الآن) */}
      <Card className="border-card-border p-5 bg-card space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>المتداول في سرد (الترند)</span>
          </h3>
        </div>

        <div className="space-y-2.5">
          {trends.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTag(t.tag)}
              className="group cursor-pointer flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">{t.category}</p>
                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                  #{t.tag}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                متداول
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Who to Follow (اقتراحات المتابعة) */}
      <Card className="border-card-border p-5 bg-card space-y-4 shadow-2xs">
        <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border/60 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span>اقتراحات المتابعة</span>
        </h3>

        <div className="space-y-3">
          {suggestedUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 leading-relaxed">
              لا توجد اقتراحات حالياً. عند انضمام أعضاء جدد ستظهر حساباتهم هنا تلقائياً.
            </p>
          ) : (
            suggestedUsers.map((u) => {
              const isFollowing = !!followingMap[u.id];
              return (
                <div key={u.id} className="flex items-center justify-between gap-3">
                  <div
                    onClick={() => onOpenUserProfile(u)}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                    title={`عرض الملف الشخصي لـ ${u.name}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      {u.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                          {u.name}
                        </p>
                        {u.verified && (
                          <CheckCircle2 className="w-3 h-3 text-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">@{u.username}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={() => onToggleFollow(u.id, u.name)}
                    className={`h-7 px-3 text-xs font-bold shadow-2xs ${
                      isFollowing
                        ? 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/40'
                        : ''
                    }`}
                  >
                    {isFollowing ? 'تتابع' : 'متابعة'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Community Notice */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 text-xs text-muted-foreground space-y-2">
        <p className="font-bold text-foreground flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-primary" />
          <span>فضاء سرد المفتوح</span>
        </p>
        <p className="leading-relaxed text-[11px]">
          ساحة سرد مصممة كشبكة محتوى عامة تجمع جميع رواد المنصة. احرص على نشر المعرفة، ومشاركة الأفكار البنّاءة، واحترام التنوع الفكري.
        </p>
      </div>
    </div>
  );
}
