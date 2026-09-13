import React, { useState } from 'react';
import { Send, Smile, BarChart2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MAX_CHARS = 280;

const SUGGESTED_TAGS = ['#سرد_رقمي', '#الذكاء_الاصطناعي', '#ريادة_الأعمال', '#تطوير_البرمجيات'];

interface FeedComposerProps {
  currentAuthorName: string;
  onPublishPost: (content: string) => Promise<boolean>;
}

export default function FeedComposer({ currentAuthorName, onPublishPost }: FeedComposerProps) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');

  const charsLeft = MAX_CHARS - content.length;
  const charPercent = Math.min(100, (content.length / MAX_CHARS) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isPosting) return;

    setIsPosting(true);
    const success = await onPublishPost(trimmed);
    if (success) {
      setContent('');
      setShowPoll(false);
      setPollOption1('');
      setPollOption2('');
    }
    setIsPosting(false);
  };

  return (
    <Card className="border-card-border shadow-xs bg-card w-full min-w-0 overflow-hidden">
      <CardContent className="p-3.5 sm:p-5 w-full min-w-0">
        <form onSubmit={handleSubmit} className="space-y-3 w-full min-w-0">
          <div className="flex items-start gap-2.5 sm:gap-3 w-full min-w-0">
            {/* Current user monogram avatar */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
              {currentAuthorName.slice(0, 1) || 'س'}
            </div>

            <div className="flex-1 min-w-0">
              <Textarea
                placeholder="ماذا يدور في ذهنك؟ اسرد فكرتك للعالم..."
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setContent(e.target.value);
                  }
                }}
                className="resize-none border-0 bg-transparent text-sm sm:text-base focus-visible:ring-0 min-h-[90px] p-0 placeholder:text-muted-foreground/70 leading-relaxed w-full"
              />

              {/* Quick hashtag suggestions */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none w-full max-w-full">
                <span className="text-muted-foreground shrink-0 font-medium">وسوم مقترحة:</span>
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => setContent((prev) => (prev ? `${prev} ${tag}` : tag))}
                    className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Poll Simulator */}
              {showPoll && (
                <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 animate-in fade-in-50 duration-150 w-full min-w-0">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-primary" />
                      استطلاع رأي
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPoll(false)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input
                    placeholder="الخيار الأول (مثال: نعم)"
                    value={pollOption1}
                    onChange={(e) => setPollOption1(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                  <Input
                    placeholder="الخيار الثاني (مثال: لا)"
                    value={pollOption2}
                    onChange={(e) => setPollOption2(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Composer Toolbar & Action Row */}
          <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-border/60 w-full min-w-0">
            <div className="flex items-center gap-1 text-primary shrink-0">
              <button
                type="button"
                onClick={() => setShowPoll(!showPoll)}
                title="إضافة استطلاع رأي"
                className="p-1.5 sm:p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setContent((prev) => `${prev} ✨`)}
                title="إضافة رموز تعبيرية"
                className="p-1.5 sm:p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Character Countdown Progress Ring */}
              {content.length > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[11px] sm:text-xs font-bold ${
                      charsLeft < 20 ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {charsLeft}
                  </span>
                  <div className="w-4 h-4 rounded-full border-2 border-border relative flex items-center justify-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        charPercent > 90
                          ? 'bg-destructive'
                          : charPercent > 70
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      }`}
                      style={{ opacity: charPercent / 100 }}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPosting || !content.trim()}
                title={isPosting ? 'جاري السرد...' : 'اسرد الآن'}
                aria-label="اسرد الآن"
                className="w-9 h-9 p-0 rounded-xl font-bold shrink-0 shadow-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Send className={`w-4 h-4 rtl:rotate-180 shrink-0 ${isPosting ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
