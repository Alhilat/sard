import { useState } from 'react';
import { Plus, MoreHorizontal, Users, Calendar, MapPin, Edit, Trash2, Eye } from 'lucide-react';
import { activities } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusColors: Record<string, string> = {
  'مكتملة': 'text-emerald-700 bg-emerald-100 border-emerald-200',
  'قريبة': 'text-amber-700 bg-amber-100 border-amber-200',
  'متاحة': 'text-blue-700 bg-blue-100 border-blue-200',
};

function getStatus(activity: typeof activities[0]) {
  const pct = (activity.registered / activity.seats) * 100;
  if (pct >= 100) return 'مكتملة';
  if (pct >= 80) return 'قريبة';
  return 'متاحة';
}

export default function OrgActivities() {
  const [items, setItems] = useState(activities);

  const remove = (id: string) => setItems(prev => prev.filter(a => a.id !== id));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الأنشطة</h1>
          <p className="text-muted-foreground text-sm">إدارة أنشطة وفعاليات المنظمة</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />نشاط جديد</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي الأنشطة', value: items.length },
          { label: 'المشاركون', value: items.reduce((s, a) => s + a.registered, 0) },
          { label: 'المقاعد المتاحة', value: items.reduce((s, a) => s + (a.seats - a.registered), 0) },
        ].map(stat => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activities table */}
      <Card className="border-card-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">قائمة الأنشطة</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-start">
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">النشاط</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">التاريخ</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">المكان</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">المشاركون</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map(activity => {
                  const status = getStatus(activity);
                  const pct = Math.round((activity.registered / activity.seats) * 100);
                  return (
                    <tr key={activity.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-xs h-4 px-1.5">{activity.category}</Badge>
                            <span className="text-xs text-muted-foreground">{activity.price}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{activity.date}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted-foreground max-w-[150px] truncate">{activity.location}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[100px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{activity.registered}</span>
                            <span className="text-muted-foreground">/ {activity.seats}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${statusColors[status]}`}>{status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-muted"><MoreHorizontal className="w-4 h-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2"><Eye className="w-4 h-4" />عرض</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Edit className="w-4 h-4" />تعديل</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => remove(activity.id)}>
                              <Trash2 className="w-4 h-4" />حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
