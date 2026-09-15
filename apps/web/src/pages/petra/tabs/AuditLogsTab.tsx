import React from 'react';
import { PetraAuditLog } from '@/services/petraService';
import { Badge } from '@/components/ui/badge';

interface AuditLogsTabProps {
  logs: PetraAuditLog[];
}

export default function AuditLogsTab({ logs }: AuditLogsTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-[#140F1B] p-4 rounded-2xl border border-[#291F34] flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white font-display">سجل تدقيق العمليات الإدارية</h3>
          <p className="text-xs text-[#9F8EAE]">توثيق دقيق لكل عملية إدارية تمت عبر لوحة التحكم</p>
        </div>
        <Badge className="bg-[#241A2D] text-[#D8B4FE] text-xs">
          {logs.length} عملية مسجلة
        </Badge>
      </div>

      <div className="bg-[#140F1B] border border-[#291F34] rounded-2xl divide-y divide-[#241B2E] overflow-hidden shadow-xl">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-[#9A8AA7] text-xs">
            لا توجد عمليات مسجلة بعد
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-[#1A1322] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#2D161F] text-[#F87171] border-[#552028] text-[10px]">
                    {log.action}
                  </Badge>
                  <span className="font-semibold text-white">المسؤول: {log.admin_user}</span>
                  <span className="text-[#887895]">• الهدف: {log.target_type} ({log.target_id})</span>
                </div>
                <p className="text-[#DDD2E5] text-[11px] leading-relaxed">{log.details}</p>
              </div>
              <span className="text-[#887895] text-[10px] font-mono whitespace-nowrap bg-[#1B1424] px-2 py-1 rounded-md border border-[#30243C]">
                {new Date(log.created_at).toLocaleTimeString('ar-SA')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
