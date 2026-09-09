import { useState } from 'react';
import { Search, MoreHorizontal, Shield, Ban, CheckCircle, UserX, Filter } from 'lucide-react';
import { users } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/layouts/AppLayout';

const adminCardStyle = { background: 'hsl(222,47%,12%)', border: '1px solid hsl(222,47%,18%)', color: 'hsl(213,31%,91%)' };

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, string>>(
    Object.fromEntries(users.map(u => [u.id, u.status]))
  );

  const filtered = users.filter(u => u.name.includes(search) || u.username.includes(search) || u.location.includes(search));
  const toggle = (id: string) => setStatusMap(prev => ({ ...prev, [id]: prev[id] === 'active' ? 'suspended' : 'active' }));

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ color: 'hsl(213,31%,91%)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">المستخدمون</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215,16%,47%)' }}>إدارة حسابات المستخدمين</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'إجمالي المستخدمين', value: users.length },
          { label: 'نشطون', value: users.filter(u => u.status === 'active').length },
          { label: 'موقوفون', value: users.filter(u => u.status === 'suspended').length },
          { label: 'موثّقون', value: users.filter(u => u.verified).length },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 text-center" style={adminCardStyle}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(215,16%,47%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={adminCardStyle}>
        {/* Table header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(222,47%,18%)' }}>
          <h2 className="font-bold">قائمة المستخدمين</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4" style={{ color: 'hsl(215,16%,40%)' }} />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pe-9 h-8 text-sm w-56 border-0"
                style={{ background: 'hsl(222,47%,18%)', color: 'hsl(213,31%,80%)' }}
              />
            </div>
            <Button size="sm" variant="outline" className="h-8 gap-1 border-0" style={{ background: 'hsl(222,47%,18%)', color: 'hsl(213,31%,70%)' }}>
              <Filter className="w-3.5 h-3.5" />تصفية
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(222,47%,18%)' }}>
                {['المستخدم', 'الموقع', 'المتابِعون', 'تاريخ الانضمام', 'الحالة', ''].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(215,16%,40%)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b transition-colors hover:opacity-80" style={{ borderColor: 'hsl(222,47%,16%)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} size="sm" />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm">{user.name}</p>
                          {user.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="text-xs" style={{ color: 'hsl(215,16%,47%)' }}>@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215,16%,55%)' }}>{user.location}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215,16%,55%)' }}>{user.followers.toLocaleString('ar')}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215,16%,55%)' }}>{user.joinDate}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${statusMap[user.id] === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                      {statusMap[user.id] === 'active' ? 'نشط' : 'موقوف'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:opacity-70"><MoreHorizontal className="w-4 h-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><Shield className="w-4 h-4" />منح صلاحية مشرف</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={() => toggle(user.id)}>
                          {statusMap[user.id] === 'active' ? <><Ban className="w-4 h-4 text-red-500" /><span className="text-red-500">إيقاف الحساب</span></> : <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">تفعيل الحساب</span></>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-500"><UserX className="w-4 h-4" />حذف الحساب</DropdownMenuItem>
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
