import { TrendingUp, Users, BookOpen, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { activities, posts, courses, users } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function OrgAnalytics() {
  const activityData = activities.map(a => ({
    name: a.title.slice(0, 15) + '...',
    seats: a.seats,
  }));

  const metrics = [
    { label: 'الأنشطة والفعاليات', value: `${activities.length}`, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { label: 'الدورات التدريبية', value: `${courses.length}`, icon: BookOpen, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'المنشورات في المنصة', value: `${posts.length}`, icon: FileText, color: 'bg-purple-100 text-purple-600' },
    { label: 'الأعضاء المعتمدون', value: `${users.length}`, icon: Users, color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-black">التحليلات والمؤشرات</h1>
        <p className="text-muted-foreground text-sm">مؤشرات الأنشطة والمبادرات المعتمدة للمنظمة</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(card => (
          <Card key={card.label} className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <Badge variant="secondary" className="text-xs text-emerald-700 bg-emerald-100">فعّال</Badge>
              </div>
              <p className="text-2xl font-black mb-0.5">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Seats Distribution */}
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">طاقة استيعاب الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activityData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontFamily: 'Cairo' }} width={100} />
                <Tooltip formatter={(v: any) => [`${v} مقعد`, 'المقاعد']} />
                <Bar dataKey="seats" fill="hsl(0,61%,26%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Courses Overview */}
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">نظرة عامة على البرامج التدريبية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <p className="text-xs font-bold">{c.title}</p>
                  <p className="text-[11px] text-muted-foreground">{c.category} • {c.level}</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {c.duration}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
