import { useState } from 'react';
import { Search, MoreHorizontal, Calendar, CheckCircle, Trash2 } from 'lucide-react';
import { activities } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const adminCardStyle = { background: 'hsl(0,62%,10%)', border: '1px solid hsl(0,50%,15%)' };

export default function AdminActivities() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(activities);
  const filtered = items.filter(a => a.title.includes(search) || a.org.name.includes(search));
  const remove = (id: string) => setItems(prev => prev.filter(a => a.id !== id));

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ color: 'hsl(33,40%,90%)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black">إدارة الأنشطة</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(33,12%,50%)' }}>مراجعة جميع أنشطة المنصة</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي الأنشطة', value: items.length },
          { label: 'إجمالي المشاركين', value: items.reduce((s, a) => s + a.registered, 0) },
          { label: 'الأنشطة المجانية', value: items.filter(a => a.price === 'مجاني').length },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 text-center" style={adminCardStyle}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(33,12%,50%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={adminCardStyle}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(0,50%,15%)' }}>
          <h2 className="font-bold">قائمة الأنشطة</h2>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4" style={{ color: 'hsl(33,10%,42%)' }} />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 h-8 text-sm w-52 border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,30%,80%)' }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(0,50%,15%)' }}>
                {['النشاط', 'المنظمة', 'التاريخ', 'المشاركون', 'السعر', ''].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(33,10%,42%)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b" style={{ borderColor: 'hsl(0,50%,13%)' }}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm">{a.title}</p>
                    <Badge className="text-xs mt-1 bg-stone-500/20 text-stone-300 border-stone-500/30">{a.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(33,12%,55%)' }}>{a.org.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(33,12%,55%)' }}>{a.date}</td>
                  <td className="px-4 py-3">
                    <div className="min-w-[100px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'hsl(33,12%,60%)' }}>{a.registered}/{a.seats}</span>
                        <span style={{ color: 'hsl(33,12%,50%)' }}>{Math.round((a.registered / a.seats) * 100)}%</span>
                      </div>
                      <Progress value={(a.registered / a.seats) * 100} className="h-1" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${a.price === 'مجاني' ? 'bg-primary/20 text-amber-300 border-primary/30' : 'bg-stone-500/20 text-stone-300 border-stone-500/30'}`}>{a.price}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:opacity-70"><MoreHorizontal className="w-4 h-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><CheckCircle className="w-4 h-4" />تمييز</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-500" onClick={() => remove(a.id)}><Trash2 className="w-4 h-4" />حذف</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
