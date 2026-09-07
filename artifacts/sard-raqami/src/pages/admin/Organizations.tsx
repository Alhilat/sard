import { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, MoreHorizontal, Building2 } from 'lucide-react';
import { organizations } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const adminCardStyle = { background: 'hsl(0,62%,10%)', border: '1px solid hsl(0,50%,15%)' };

export default function AdminOrganizations() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [orgs, setOrgs] = useState(organizations);

  const filtered = orgs.filter(o => {
    const matchSearch = o.name.includes(search);
    const matchFilter = filter === 'الكل' || (filter === 'موثّقة' && o.verified) || (filter === 'قيد المراجعة' && !o.verified);
    return matchSearch && matchFilter;
  });

  const approve = (id: string) => setOrgs(prev => prev.map(o => o.id === id ? { ...o, verified: true, status: 'active' } : o));
  const reject = (id: string) => setOrgs(prev => prev.filter(o => o.id !== id));

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ color: 'hsl(33,40%,90%)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black">المنظمات</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(33,12%,50%)' }}>إدارة وتوثيق المنظمات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي المنظمات', value: orgs.length, color: 'text-amber-300' },
          { label: 'موثّقة', value: orgs.filter(o => o.verified).length, color: 'text-emerald-400' },
          { label: 'قيد المراجعة', value: orgs.filter(o => !o.verified).length, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 text-center" style={adminCardStyle}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(33,12%,50%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      {orgs.filter(o => !o.verified).length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>طلبات التوثيق المعلّقة</span>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">{orgs.filter(o => !o.verified).length}</Badge>
          </h2>
          <div className="space-y-3">
            {orgs.filter(o => !o.verified).map(org => (
              <div key={org.id} className="flex items-center gap-4 p-4 rounded-xl" style={adminCardStyle}>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-300 font-black text-lg">{org.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-xs" style={{ color: 'hsl(33,12%,50%)' }}>{org.category} · {org.location} · طُلب في: {org.joinDate}</p>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(33,12%,55%)' }}>
                  <span>{org.followers.toLocaleString('ar')} متابع</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1 h-8" onClick={() => approve(org.id)}>
                    <CheckCircle className="w-3.5 h-3.5" />قبول
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1 h-8" onClick={() => reject(org.id)}>
                    <XCircle className="w-3.5 h-3.5" />رفض
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All orgs table */}
      <div className="rounded-2xl overflow-hidden" style={adminCardStyle}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(0,50%,15%)' }}>
          <h2 className="font-bold">جميع المنظمات</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4" style={{ color: 'hsl(33,10%,42%)' }} />
              <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 h-8 text-sm w-48 border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,30%,80%)' }} />
            </div>
            {['الكل', 'موثّقة', 'قيد المراجعة'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:opacity-70'}`} style={filter !== f ? { background: 'hsl(0,50%,15%)', color: 'hsl(33,12%,55%)' } : {}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(0,50%,15%)' }}>
                {['المنظمة', 'التصنيف', 'المتابِعون', 'الأنشطة', 'الحالة', ''].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(33,10%,42%)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => (
                <tr key={org.id} className="border-b" style={{ borderColor: 'hsl(0,50%,13%)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-300 font-bold text-xs">{org.name[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm">{org.name}</p>
                          {org.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-xs" style={{ color: 'hsl(33,12%,50%)' }}>@{org.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(33,12%,55%)' }}>{org.category}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(33,12%,55%)' }}>{org.followers.toLocaleString('ar')}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(33,12%,55%)' }}>{org.activities}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${org.verified ? 'bg-emerald-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {org.verified ? 'موثّقة' : 'قيد المراجعة'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:opacity-70"><MoreHorizontal className="w-4 h-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => !org.verified && approve(org.id)}>
                          {org.verified ? 'سحب التوثيق' : 'توثيق المنظمة'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => reject(org.id)}>حذف المنظمة</DropdownMenuItem>
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
