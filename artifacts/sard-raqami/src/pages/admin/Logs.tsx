import { useState } from 'react';
import { Search, Download, AlertTriangle, AlertOctagon, Info, CheckCircle2, Filter } from 'lucide-react';
import { systemLogs } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const adminCardStyle = { background: 'hsl(0,62%,10%)', border: '1px solid hsl(0,50%,15%)' };

const logConfig: Record<string, { color: string; bg: string; icon: any }> = {
  info: { color: 'text-amber-300', bg: 'bg-amber-500/20', icon: Info },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle },
  error: { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertOctagon },
  success: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle2 },
};

const extraLogs = [
  { id: 'l9', type: 'success', message: 'تم الانتهاء من ترحيل قاعدة البيانات بنجاح', time: '2025-07-12 18:30:00', ip: '-' },
  { id: 'l10', type: 'info', message: 'مستخدمة جديدة: sara.ahmad@email.com', time: '2025-07-12 15:22:10', ip: '10.0.1.5' },
  { id: 'l11', type: 'warning', message: 'حجم قاعدة البيانات وصل 80% من الحد المسموح', time: '2025-07-12 12:00:00', ip: '-' },
  { id: 'l12', type: 'error', message: 'فشل إرسال 3 رسائل بريد إلكتروني في قائمة الانتظار', time: '2025-07-11 09:45:22', ip: '-' },
];

const allLogs = [...systemLogs, ...extraLogs];

export default function AdminLogs() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');

  const filtered = allLogs.filter(log => {
    const matchSearch = log.message.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'الكل' || (typeFilter === 'أخطاء' && log.type === 'error') || (typeFilter === 'تحذيرات' && log.type === 'warning') || (typeFilter === 'معلومات' && log.type === 'info') || (typeFilter === 'ناجح' && log.type === 'success');
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ color: 'hsl(33,40%,90%)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">سجلات النظام</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(33,12%,50%)' }}>مراقبة أحداث وسجلات النظام</p>
        </div>
        <Button size="sm" variant="outline" className="gap-2 border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,20%,68%)' }}>
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي السجلات', value: allLogs.length, color: '' },
          { label: 'أخطاء', value: allLogs.filter(l => l.type === 'error').length, color: 'text-red-400' },
          { label: 'تحذيرات', value: allLogs.filter(l => l.type === 'warning').length, color: 'text-amber-400' },
          { label: 'ناجح', value: allLogs.filter(l => l.type === 'success').length, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 text-center" style={adminCardStyle}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(33,12%,50%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4" style={{ color: 'hsl(33,10%,42%)' }} />
          <Input placeholder="ابحث في السجلات..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,30%,80%)' }} />
        </div>
        <div className="flex gap-2">
          {['الكل', 'أخطاء', 'تحذيرات', 'معلومات', 'ناجح'].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${typeFilter === f ? 'bg-primary text-white' : ''}`}
              style={typeFilter !== f ? { background: 'hsl(0,50%,15%)', color: 'hsl(33,12%,55%)' } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="rounded-2xl overflow-hidden" style={adminCardStyle}>
        <div className="font-mono text-xs divide-y" style={{ borderColor: 'hsl(0,50%,13%)' }}>
          {filtered.map(log => {
            const { color, bg, icon: Icon } = logConfig[log.type] || logConfig.info;
            return (
              <div key={log.id} className={`flex items-start gap-3 p-4 hover:opacity-80 transition-opacity`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-normal" style={{ color: 'hsl(33,30%,80%)', fontFamily: 'Cairo, monospace' }}>
                    {log.message}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span style={{ color: 'hsl(33,10%,42%)' }}>{log.time}</span>
                    {log.ip !== '-' && <span style={{ color: 'hsl(33,10%,42%)' }}>IP: {log.ip}</span>}
                  </div>
                </div>
                <Badge className={`text-xs flex-shrink-0 border ${color} ${bg}`}>
                  {log.type === 'error' ? 'خطأ' : log.type === 'warning' ? 'تحذير' : log.type === 'success' ? 'ناجح' : 'معلومة'}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
