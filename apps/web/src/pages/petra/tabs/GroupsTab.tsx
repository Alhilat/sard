import React from 'react';
import { Trash2 } from 'lucide-react';
import { PetraGroup } from '@/services/petraService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface GroupsTabProps {
  groups: PetraGroup[];
  onDeleteGroup: (groupId: string, groupName: string) => void;
}

export default function GroupsTab({
  groups,
  onDeleteGroup,
}: GroupsTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-[#140F1B] p-4 rounded-2xl border border-[#291F34] flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white font-display">إدارة المجتمعات والمجموعات</h3>
          <p className="text-xs text-[#9F8EAE]">التحكم الكامل في المجموعات وحذف المجموعات المخالفة</p>
        </div>
        <Badge className="bg-purple-900/60 text-purple-300 border-purple-700">
          {groups.length} مجتمعات مسجلة
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-[#140F1B] rounded-2xl border border-[#291F34] text-[#9A8AA7] text-xs">
            لا توجد مجموعات مسجلة بعد
          </div>
        ) : (
          groups.map((group) => (
            <Card
              key={group.id}
              className="bg-[#140F1B] border-[#291F34] text-white flex flex-col justify-between hover:border-[#47365C] transition-colors rounded-2xl overflow-hidden shadow-sm"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px]">
                    {group.category}
                  </Badge>
                  <Badge className="bg-[#1B1424] text-[#9F8EAE] text-[10px]">
                    {group.privacy}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold text-white mt-2">
                  {group.name}
                </CardTitle>
                {group.tagline && (
                  <CardDescription className="text-xs text-[#9F8EAE] line-clamp-2">
                    {group.tagline}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                <p className="text-xs text-[#C5B7CF] line-clamp-3 leading-relaxed bg-[#1A1322] p-2.5 rounded-xl border border-[#2A2033]">
                  {group.description || 'بدون وصف'}
                </p>
                <div className="flex justify-between text-xs text-[#9A8AA7] pt-2 border-t border-[#261D2F]">
                  <span>👥 {group.members_count || 1} عضو</span>
                  <span>📝 {group.posts_count || 0} منشور</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => onDeleteGroup(group.id, group.name)}
                  className="w-full bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-8 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                  حذف المجموعة بالكامل
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
