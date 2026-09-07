import { useState, useEffect } from 'react';
import { Search, UserPlus, MoreHorizontal, Shield, User, Trash2, Mail } from 'lucide-react';
import { orgMembersService, OrgMember } from '@/services/orgMembersService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/layouts/AppLayout';
import { useToast } from '@/hooks/use-toast';
import InviteMemberModal from '@/components/org/InviteMemberModal';

const roles = ['عضو', 'مشرف', 'مدير'];

export default function OrgMembers() {
  const { toast } = useToast();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await orgMembersService.getMembers();
      setMembers(data);
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر جلب قائمة أعضاء المنظمة',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    const res = await orgMembersService.updateRole(memberId, newRole);
    if (res.success) {
      toast({
        title: 'تم تحديث الصلاحية بنجاح ✅',
        description: `تم تعيين العضو كـ (${newRole}).`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر تحديث الصلاحية',
        description: res.message,
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`هل أنت متأكد من إزالة ${memberName} من طاقم المنظمة؟`)) {
      return;
    }
    const res = await orgMembersService.removeMember(memberId);
    if (res.success) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast({
        title: 'تمت إزالة العضو بنجاح 🗑️',
        description: `تم إزالة ${memberName} من فريق العمل.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر إزالة العضو',
        description: res.message,
      });
    }
  };

  const handleMemberInvited = (newMember: OrgMember) => {
    setMembers((prev) => [...prev, newMember]);
  };

  const filtered = members.filter(
    (m) =>
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role: string) => {
    if (role === 'مدير') return 'text-purple-700 bg-purple-100 border-purple-200';
    if (role === 'مشرف') return 'text-blue-700 bg-blue-100 border-blue-200';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">أعضاء المنظمة</h1>
          <p className="text-muted-foreground text-sm">إدارة وتوزيع صلاحيات طاقم العمل والمشرفين</p>
        </div>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          className="gap-2 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          <UserPlus className="w-4 h-4" />
          دعوة عضو
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي الأعضاء', value: members.length },
          { label: 'المشرفون والمدراء', value: members.filter((m) => m.role === 'مشرف' || m.role === 'مدير').length },
          { label: 'الأعضاء النشطون', value: members.filter((m) => m.status === 'active').length },
        ].map((stat) => (
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
          <CardTitle className="text-base font-bold">قائمة الأعضاء والطاقم</CardTitle>
          <div className="relative w-64">
            <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-9 h-8 text-sm border-border"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">جارٍ تحميل الأعضاء...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground p-6">
              <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-base font-bold text-foreground">لا يوجد أعضاء مطابقون للبحث</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                قم بدعوة أعضاء جدد للانضمام إلى فريق المنظمة.
              </p>
              <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                دعوة عضو الآن
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">العضو</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">البريد الإلكتروني</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">الدور والصلاحية</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">الحالة</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((member) => (
                    <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={member.name} size="sm" />
                          <div>
                            <p className="font-semibold text-sm">{member.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono" dir="ltr">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${roleColor(member.role)}`}>
                          {member.role === 'مدير' && <Shield className="w-3 h-3 ms-1" />}
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="text-xs text-emerald-700 bg-emerald-100 border-emerald-200">
                          نشط
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {roles.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => handleRoleChange(member.id, role)}
                                className="cursor-pointer"
                              >
                                تعيين كـ {role}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              className="text-destructive gap-2 cursor-pointer"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                              إزالة العضو
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onMemberInvited={handleMemberInvited}
      />
    </div>
  );
}
