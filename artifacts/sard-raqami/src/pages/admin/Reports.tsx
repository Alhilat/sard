import { useState } from 'react';
import { Flag, CheckCircle, XCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const adminCardStyle = { background: 'hsl(0,62%,10%)', border: '1px solid hsl(0,50%,15%)' };

const initialReports = [
  { id: 'r1', type: 'محتوى مسيء', target: 'منشور #2847', reporter: 'أحمد الزهراني', severity: 'عالي', status: 'pending', time: 'منذ ساعة', desc: 'يحتوي المنشور على محتوى مخالف لشروط الاستخدام' },
  { id: 'r2', type: 'تحرش', target: 'مستخدم @bad_user', reporter: 'سارة الأحمد', severity: 'حرج', status: 'pending', time: 'منذ ساعتين', desc: 'المستخدم يرسل رسائل مزعجة ومسيئة' },
  { id: 'r3', type: 'معلومات مضللة', target: 'منشور #2901', reporter: 'محمد الفيصل', severity: 'متوسط', status: 'resolved', time: 'منذ 5 ساعات', desc: 'يحتوي المنشور على معلومات طبية خاطئة' },
  { id: 'r4', type: 'سبام', target: 'منظمة @spam_org', reporter: 'نورة الربيعي', severity: 'منخفض', status: 'pending', time: 'أمس', desc: 'المنظمة تنشر إعلانات مزعجة بشكل متكرر' },
  { id: 'r5', type: 'انتهاك حقوق الملكية', target: 'دورة #156', reporter: 'فهد المطيري', severity: 'عالي', status: 'resolved', time: 'منذ يومين', desc: 'محتوى الدورة منسوخ بالكامل من مصدر آخر' },
  { id: 'r6', type: 'حساب مزيف', target: 'مستخدم @fake_acc', reporter: 'هند القحطاني', severity: 'متوسط', status: 'dismissed', time: 'منذ 3 أيام', desc: 'الحساب ينتحل شخصية منظمة رسمية' },
];

const severityConfig: Record<string, { color: string; icon: any }> = {
  'حرج': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertOctagon },
  'عالي': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
  'متوسط': { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Flag },
  'منخفض': { color: 'bg-stone-500/20 text-stone-300 border-stone-500/30', icon: Info },
};

export default function AdminReports() {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState('الكل');

  const resolve = (id: string) => setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
  const dismiss = (id: string) => setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' } : r));

  const filtered = reports.filter(r => {
    if (filter === 'قيد المراجعة') return r.status === 'pending';
    if (filter === 'محلولة') return r.status === 'resolved';
    if (filter === 'مرفوضة') return r.status === 'dismissed';
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ color: 'hsl(33,40%,90%)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black">التقارير والبلاغات</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(33,12%,50%)' }}>مراجعة ومعالجة بلاغات المستخدمين</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي البلاغات', value: reports.length },
          { label: 'قيد المراجعة', value: reports.filter(r => r.status === 'pending').length, color: 'text-amber-400' },
          { label: 'محلولة', value: reports.filter(r => r.status === 'resolved').length, color: 'text-emerald-400' },
          { label: 'مرفوضة', value: reports.filter(r => r.status === 'dismissed').length, color: 'text-muted-foreground' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 text-center" style={adminCardStyle}>
            <p className={`text-2xl font-black ${stat.color || ''}`}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(33,12%,50%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {['الكل', 'قيد المراجعة', 'محلولة', 'مرفوضة'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:opacity-70'}`} style={filter !== f ? { background: 'hsl(0,50%,15%)', color: 'hsl(33,12%,55%)' } : {}}>
            {f}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {filtered.map(report => {
          const { color, icon: Icon } = severityConfig[report.severity] || severityConfig['منخفض'];
          return (
            <div key={report.id} className="rounded-2xl p-5" style={adminCardStyle}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.replace('border', 'border-2')}`}
                    style={{ background: color.match(/bg-\w+-500\/20/) ? '' : undefined }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{report.type}</p>
                      <Badge className={`text-xs ${color}`}>{report.severity}</Badge>
                      <Badge className={`text-xs ${report.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : report.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                        {report.status === 'pending' ? 'قيد المراجعة' : report.status === 'resolved' ? 'محلولة' : 'مرفوضة'}
                      </Badge>
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'hsl(33,12%,60%)' }}>
                      <span style={{ color: 'hsl(33,25%,72%)' }}>{report.target}</span> · بلاغ من: {report.reporter}
                    </p>
                    <p className="text-xs" style={{ color: 'hsl(33,12%,50%)' }}>{report.desc}</p>
                    <p className="text-xs mt-1" style={{ color: 'hsl(33,10%,42%)' }}>{report.time}</p>
                  </div>
                </div>
                {report.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1 h-8" onClick={() => resolve(report.id)}>
                      <CheckCircle className="w-3.5 h-3.5" />حل
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-muted-foreground" onClick={() => dismiss(report.id)}>
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
