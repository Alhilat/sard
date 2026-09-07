import { useState } from 'react';
import { Search, UserPlus, MoreHorizontal, Shield, User, Mail } from 'lucide-react';
import { users } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/layouts/AppLayout';

const roles = ['عضو', 'مشرف', 'مدير'];

export default function OrgMembers() {
  const [search, setSearch] = useState('');
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u, i) => [u.id, i === 0 ? 'مدير' : i === 1 ? 'مشرف' : 'عضو']))
  );

  const filtered = users.filter(u => u.name.includes(search) || u.username.includes(search));

  const roleColor = (role: string) => {
    if (role === 'مدير') return 'text-purple-700 bg-purple-100 border-purple-200';
    if (role === 'مشرف') return 'text-blue-700 bg-blue-100 border-blue-200';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الأعضاء</h1>
          <p className="text-muted-foreground text-sm">إدارة أعضاء المنظمة وصلاحياتهم</p>
        </div>
        <Button className="gap-2"><UserPlus className="w-4 h-4" />دعوة عضو</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي الأعضاء', value: users.length },
          { label: 'المشرفون', value: Object.values(memberRoles).filter(r => r === 'مشرف').length },
          { label: 'طلبات الانضمام المعلقة', value: 0 },
        ].map(stat => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-card-border">
        <CardHeader className="flex-row items-center justify-between pb-0">
          <CardTitle className="text-base">قائمة الأعضاء</CardTitle>
          <div className="relative w-64">
            <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 h-8 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">العضو</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">الموقع</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">الدور</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} size="sm" />
                        <div>
                          <p className="font-semibold text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.location}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${roleColor(memberRoles[user.id])}`}>
                        {memberRoles[user.id] === 'مدير' && <Shield className="w-3 h-3 ms-1" />}
                        {memberRoles[user.id]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${user.status === 'active' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-red-700 bg-red-100 border-red-200'}`}>
                        {user.status === 'active' ? 'نشط' : 'محظور'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-muted"><MoreHorizontal className="w-4 h-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {roles.map(role => (
                            <DropdownMenuItem key={role} onClick={() => setMemberRoles(prev => ({ ...prev, [user.id]: role }))}>
                              تعيين كـ {role}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem className="text-destructive gap-2">
                            <Mail className="w-4 h-4" />إزالة العضو
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
