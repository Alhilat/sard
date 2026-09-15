import React from 'react';
import { Shield, RefreshCw, LogOut, Activity, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PetraHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  envStatus: {
    envConfigured: boolean;
    envUser: string;
    hasEnvPass: boolean;
    renderDetected: boolean;
  } | null;
}

export default function PetraHeader({
  isRefreshing,
  onRefresh,
  onLogout,
  envStatus,
}: PetraHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#0F0C14]/95 backdrop-blur-md border-b border-[#261E30]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6B1B1B] via-[#8C2424] to-[#9E2A2B] flex items-center justify-center shadow-md border border-[#B33939]/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide font-display">بوابة بترا</h1>
              <Badge className="bg-[#2A1820] text-[#E57373] border-[#59262E] text-[10px] px-2 py-0">
                لوحة الإدارة المركزية
              </Badge>
              {envStatus?.renderDetected && (
                <Badge className="bg-emerald-950/70 text-emerald-300 border-emerald-800/40 text-[9px] px-1.5 py-0 hidden sm:inline-flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>سحابي نشط</span>
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[#8C7B9B] hidden sm:block">
              نظام الرقابة والتحكم الأمني والتحريري المباشر لمنصة سرد رقمي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="bg-[#181320] border-[#30233D] text-[#C2B2D1] hover:text-white text-xs h-8 px-3 rounded-lg gap-1.5 cursor-pointer"
            title="تحديث البيانات الفوري"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>

          <Button
            size="sm"
            onClick={onLogout}
            className="bg-red-950/70 hover:bg-red-900 border border-red-800/50 text-red-200 text-xs h-8 px-3 rounded-lg gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
