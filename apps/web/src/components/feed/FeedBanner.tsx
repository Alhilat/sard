import React from 'react';
import { Sparkles, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FeedBanner() {
  return (
    <div className="bg-gradient-to-r from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E] text-white p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs font-bold gap-1 px-2.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              المجتمع العام المفتوح
            </Badge>
            <span className="text-xs text-white/80">· شبكة السرد الرقمي الكبرى</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            ساحة «سرد»
          </h1>
          <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
            الفضاء العام لجميع رواد المنصة: اسرد أفكارك، شارك في النقاشات الحية، تابع أبرز المؤثرين والمواضيع الرائجة لحظة بلحظة.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-white/15 text-xs">
          <Flame className="w-5 h-5 text-amber-400" />
          <div>
            <p className="font-bold text-white">النقاشات الحية</p>
            <p className="text-[11px] text-white/70">مفتوحة للجميع دون قيود</p>
          </div>
        </div>
      </div>
    </div>
  );
}
