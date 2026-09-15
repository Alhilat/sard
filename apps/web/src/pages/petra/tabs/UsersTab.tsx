import React, { useState } from 'react';
import { Search, X, CheckCircle, Ban, ShieldCheck } from 'lucide-react';
import { PetraUser } from '@/services/petraService';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UsersTabProps {
  users: PetraUser[];
  onBanClick: (user: PetraUser) => void;
  onUnbanClick: (userId: string, userName: string) => void;
  onVerifyClick: (userId: string, userName: string) => void;
  onUnverifyClick: (userId: string, userName: string) => void;
}

export default function UsersTab({
  users,
  onBanClick,
  onUnbanClick,
  onVerifyClick,
  onUnverifyClick,
}: UsersTabProps) {
  const [userSearch, setUserSearch] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'active' | 'banned' | 'verified' | 'org'>('all');

  const activeCount = users.filter((u) => !u.is_banned).length;
  const bannedCount = users.filter((u) => u.is_banned).length;
  const verifiedCount = users.filter((u) => u.verified).length;
  const orgCount = users.filter((u) => u.role === 'org').length;

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (userFilterRole === 'active') return !u.is_banned;
    if (userFilterRole === 'banned') return u.is_banned;
    if (userFilterRole === 'verified') return u.verified;
    if (userFilterRole === 'org') return u.role === 'org';
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200" dir="rtl">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3 bg-[#140F1B] p-4 rounded-2xl border border-[#291F34]">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999]" />
            <Input
              type="text"
              placeholder="بحث عن مستخدم بالاسم، المعرف، أو البريد الإلكتروني..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-[#1B1424] border-[#30243C] text-white pr-10 pl-9 text-xs h-10 rounded-xl"
            />
            {userSearch && (
              <button
                onClick={() => setUserSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7999] hover:text-white p-1"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setUserFilterRole('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                userFilterRole === 'all'
                  ? 'bg-primary text-white font-bold'
                  : 'bg-[#1B1424] border border-[#30243C] text-[#9F8EAE] hover:text-white'
              }`}
            >
              الكل ({users.length})
            </button>

            <button
              onClick={() => setUserFilterRole('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                userFilterRole === 'active'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-[#1B1424] border border-[#30243C] text-emerald-300 hover:text-emerald-200'
              }`}
            >
              النشطين ({activeCount})
            </button>

            <button
              onClick={() => setUserFilterRole('banned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                userFilterRole === 'banned'
                  ? 'bg-red-700 text-white font-bold'
                  : 'bg-[#1B1424] border border-[#30243C] text-red-300 hover:text-red-200'
              }`}
            >
              المحظورين ({bannedCount})
            </button>

            <button
              onClick={() => setUserFilterRole('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                userFilterRole === 'verified'
                  ? 'bg-amber-700 text-white font-bold'
                  : 'bg-[#1B1424] border border-[#30243C] text-amber-300 hover:text-amber-200'
              }`}
            >
              الموثقين ({verifiedCount})
            </button>

            <button
              onClick={() => setUserFilterRole('org')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                userFilterRole === 'org'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'bg-[#1B1424] border border-[#30243C] text-purple-300 hover:text-purple-200'
              }`}
            >
              منظمات ({orgCount})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#140F1B] border border-[#291F34] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1B1424] text-[#B5A5C2] border-b border-[#241B2E]">
              <tr>
                <th className="p-3.5">المستخدم</th>
                <th className="p-3.5">البريد الإلكتروني</th>
                <th className="p-3.5">النوع</th>
                <th className="p-3.5">التوثيق والصلاحيات</th>
                <th className="p-3.5">تاريخ الانضمام</th>
                <th className="p-3.5">المنشورات</th>
                <th className="p-3.5">المقالات</th>
                <th className="p-3.5">الردود</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#201729]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-[#9A8AA7] text-xs">
                    لا يوجد مستخدمين مطابقين للفلاتر المحددة
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initial = (u.name || 'م')[0];
                  return (
                    <tr key={u.id} className="hover:bg-[#1A1322] transition-colors">
                      <td className="p-3.5 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <span className="text-white block font-bold">{u.name || 'بدون اسم'}</span>
                            <span className="text-[#9A8AA7] text-[11px] font-mono">@{u.username || 'user'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[#D8B4FE]">{u.email}</td>
                      <td className="p-3.5">
                        <Badge className={u.role === 'org' ? 'bg-amber-900/60 text-amber-300 border-amber-700/50' : 'bg-blue-900/60 text-blue-300 border-blue-700/50'}>
                          {u.role === 'org' ? 'منظمة' : 'فرد'}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        {u.verified ? (
                          <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 gap-1 font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>موثق (كامل الصلاحيات)</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[#9F8EAE] border-[#382B44]">
                            عادي (انضمام فقط)
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 text-[#9F8EAE]">{u.join_date || 'غير محدد'}</td>
                      <td className="p-3.5 font-mono text-white">{u.posts_count || 0}</td>
                      <td className="p-3.5 font-mono text-amber-300 font-bold">{u.articles_count || 0}</td>
                      <td className="p-3.5 font-mono text-white">{u.comments_count || 0}</td>
                      <td className="p-3.5">
                        {u.is_banned ? (
                          <div>
                            <Badge className="bg-red-900/80 text-red-200 border-red-700">
                              محظور
                            </Badge>
                            {u.ban_reason && (
                              <span className="block text-[10px] text-red-300 mt-0.5 truncate max-w-[120px]" title={u.ban_reason}>
                                {u.ban_reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-700">
                            نشط
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {u.verified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUnverifyClick(u.id, u.name)}
                              className="bg-amber-950/40 hover:bg-amber-900/60 border-amber-700 text-amber-300 text-[11px] h-7 px-2 cursor-pointer"
                              title="تحويل الحساب إلى عادي (انضمام فقط)"
                            >
                              إلغاء التوثيق
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onVerifyClick(u.id, u.name)}
                              className="bg-emerald-950/50 hover:bg-emerald-900/70 border-emerald-600 text-emerald-300 text-[11px] h-7 px-2 cursor-pointer"
                              title="منح صلاحية إنشاء المجموعات والدورات والأنشطة"
                            >
                              <ShieldCheck className="w-3 h-3 ml-1 text-emerald-400" />
                              توثيق الحساب
                            </Button>
                          )}

                          {u.is_banned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUnbanClick(u.id, u.name)}
                              className="bg-emerald-900/40 hover:bg-emerald-900/70 border-emerald-600 text-emerald-300 text-xs h-7 px-3 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5 ml-1" />
                              إلغاء الحظر
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onBanClick(u)}
                              className="bg-red-900/40 hover:bg-red-900/70 border-red-700 text-red-300 text-xs h-7 px-3 cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5 ml-1" />
                              حظر الحساب
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
