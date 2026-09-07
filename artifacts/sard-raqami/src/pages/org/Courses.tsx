import { useState } from 'react';
import { Plus, MoreHorizontal, Star, Users, Edit, Trash2, Eye } from 'lucide-react';
import { courses } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function OrgCourses() {
  const [items, setItems] = useState(courses);
  const remove = (id: string) => setItems(prev => prev.filter(c => c.id !== id));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الدورات</h1>
          <p className="text-muted-foreground text-sm">إدارة الدورات التدريبية للمنظمة</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />دورة جديدة</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي الدورات', value: items.length },
          { label: 'إجمالي المسجّلين', value: items.reduce((s, c) => s + c.students, 0).toLocaleString('ar') },
          { label: 'الدورات المتاحة', value: items.length },
        ].map(stat => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(course => (
          <Card key={course.id} className="border-card-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Eye className="w-4 h-4" />عرض</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2"><Edit className="w-4 h-4" />تعديل</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={() => remove(course.id)}>
                      <Trash2 className="w-4 h-4" />حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-bold text-sm mb-1 line-clamp-2">{course.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{course.level} · {course.duration}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {course.rating > 0 ? (
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{course.rating}</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">دورة معتمدة</span>
                )}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students.toLocaleString('ar')} مسجل</span>
                <Badge variant={course.price === 'مجاني' ? 'secondary' : 'outline'} className={`text-xs ${course.price === 'مجاني' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'font-bold text-primary'}`}>
                  {course.price}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
