import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Users, Calendar, BookOpen, TrendingUp, ArrowLeft, Plus, Eye, BarChart3, FileText, CheckCircle2 } from 'lucide-react';
import { activitiesService, Activity } from '@/services/activitiesService';
import { coursesService, Course } from '@/services/coursesService';
import { postsService, Post } from '@/services/postsService';
import { orgMembersService, OrgMember } from '@/services/orgMembersService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const quickActions = [
  { label: 'نشاط جديد', icon: Calendar, href: '/org/activities', color: 'bg-primary text-primary-foreground' },
  { label: 'دورة جديدة', icon: BookOpen, href: '/org/courses', color: 'bg-amber-700 text-white' },
  { label: 'منشور جديد', icon: FileText, href: '/org/posts', color: 'bg-primary/80 text-white' },
  { label: 'عرض التحليلات', icon: BarChart3, href: '/org/analytics', color: 'bg-orange-600 text-white' },
];

export default function OrgDashboard() {
  const { user } = useAuth();
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [membersList, setMembersList] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coursesService.getCourses(),
      activitiesService.getActivities(),
      postsService.getPosts(),
      orgMembersService.getMembers(),
    ])
      .then(([courses, activities, posts, members]) => {
        setCoursesList(courses);
        setActivitiesList(activities);
        setPostsList(posts);
        setMembersList(members);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const orgName = (user?.role === 'org' && user?.name) ? user.name : 'منظمة رواد التطوع';

  const kpis = [
    { label: 'الأنشطة والفعاليات', value: `${activitiesList.length} نشاط`, icon: Calendar, color: 'bg-orange-100 text-orange-600' },
    { label: 'الدورات التدريبية', value: `${coursesList.length} دورات`, icon: BookOpen, color: 'bg-stone-100 text-stone-600' },
    { label: 'المنشورات الرسمية', value: `${postsList.length} منشور`, icon: FileText, color: 'bg-primary/10 text-primary' },
    { label: 'طاقم العمل المعتمد', value: `${membersList.length} عضو`, icon: Users, color: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Welcome banner */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">لوحة تحكم المنظمة</h1>
          <p className="text-muted-foreground text-sm mt-1">{orgName} · مرحباً بك في لوحة الإشراف المؤسسي</p>
        </div>
        <Badge className="text-amber-700 bg-amber-50 border-amber-300 gap-1 px-3 py-1.5 font-bold">
          ✓ منظمة موثّقة
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="text-xs text-emerald-700 bg-emerald-50">نشط</Badge>
              </div>
              <p className="text-2xl font-black mb-0.5">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <div className={`${action.color} rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity`}>
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-semibold">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Courses Summary */}
        <Card className="border-card-border lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">الدورات التدريبية المعتمدة</CardTitle>
            <Link href="/org/courses">
              <Button variant="ghost" size="sm" className="h-8 text-primary gap-1 text-xs cursor-pointer">
                عرض الكل <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {coursesList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">لا توجد دورات مسجلة حالياً</p>
            ) : (
              coursesList.slice(0, 4).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate">{course.title}</p>
                      <p className="text-[11px] text-muted-foreground">{course.level} • {course.duration}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {course.price}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activities Summary */}
        <Card className="border-card-border">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">الأنشطة القادمة</CardTitle>
            <Link href="/org/activities">
              <Button variant="ghost" size="sm" className="h-8 text-primary gap-1 text-xs cursor-pointer">
                الكل <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activitiesList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">لا توجد فعاليات قادمة</p>
            ) : (
              activitiesList.slice(0, 4).map((activity) => (
                <div key={activity.id} className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                  <p className="text-xs font-bold truncate">{activity.title}</p>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{activity.date}</span>
                    <span className="text-primary font-bold">{activity.category || 'عام'}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
