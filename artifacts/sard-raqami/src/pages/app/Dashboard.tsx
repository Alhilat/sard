import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Calendar, BookOpen, Sparkles, ArrowLeft, Bell, MapPin, Clock, Award, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { coursesService, Course } from '@/services/coursesService';
import { activitiesService, Activity } from '@/services/activitiesService';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/layouts/AppLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  useEffect(() => {
    coursesService.getCourses().then((data) => setCoursesList(data));
    activitiesService.getActivities().then((data) => setActivitiesList(data));
    api.get<{ notifications?: any[] }>('/notifications')
      .then((res) => {
        if (res?.notifications && Array.isArray(res.notifications)) {
          setNotificationsList(res.notifications);
        }
      })
      .catch(() => {});
    api.get<{ users?: any[] }>('/users/suggestions')
      .then((res) => {
        if (res?.users && Array.isArray(res.users)) {
          setSuggestedUsers(res.users.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const enrolledCourses = coursesList.filter((c) => c.enrolled && (c.progress || 0) < 100);
  const completedCourses = coursesList.filter((c) => c.enrolled && c.progress === 100);
  const upcomingActivities = activitiesList.slice(0, 3);
  const unreadNotifs = notificationsList.filter((n) => !n.read);

  const displayName = user?.name || 'مستخدم سرد';
  const firstName = displayName.split(' ')[0];

  const stats = [
    { label: 'الأنشطة المتاحة', value: `${activitiesList.length} نشاط`, icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: 'الدورات قيد التعلم', value: `${enrolledCourses.length} دورات`, icon: BookOpen, color: 'bg-amber-100 text-amber-700' },
    { label: 'الدورات المكتملة', value: `${completedCourses.length} مكتملة`, icon: Award, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'مجتمعات سرد', value: 'نشط', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Welcome banner */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 text-white shadow-xs"
        style={{ background: 'linear-gradient(135deg, hsl(0,62%,16%), hsl(0,61%,26%), hsl(15,55%,30%))' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs sm:text-sm mb-1 font-medium">أهلاً وسهلاً بك،</p>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 font-display">{firstName} 👋</h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-md leading-relaxed">
              مرحباً بك في منصة سرد رقمي، يمكنك استكشاف الساحات العامة، المجموعات، والتسجيل في الدورات.
            </p>
          </div>
          <UserAvatar name={displayName} size="lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black mb-1 text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* In-progress courses */}
          <Card className="border-card-border">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">الدورات الجارية</CardTitle>
              <Link href="/app/courses">
                <Button variant="ghost" size="sm" className="text-primary h-8 gap-1 text-xs">
                  عرض الكل <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto opacity-30 text-primary" />
                  <p className="text-xs">لم تسجل في أي دورة حالياً</p>
                  <Link href="/app/courses">
                    <Button size="sm" variant="outline" className="text-xs rounded-xl mt-1">
                      استكشاف الدورات المتاحة
                    </Button>
                  </Link>
                </div>
              ) : (
                enrolledCourses.map((course) => (
                  <div key={course.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate mb-1">{course.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{course.org?.name || 'أكاديمية سرد'}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={course.progress || 0} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground flex-shrink-0">{course.progress || 0}%</span>
                      </div>
                    </div>
                    <Link href="/app/courses">
                      <Button size="sm" variant="outline" className="flex-shrink-0 h-8 text-xs">
                        متابعة
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming activities */}
          <Card className="border-card-border">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">الأنشطة والفعاليات</CardTitle>
              <Link href="/app/activities">
                <Button variant="ghost" size="sm" className="text-primary h-8 gap-1 text-xs">
                  عرض الكل <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <Calendar className="w-8 h-8 mx-auto opacity-30 text-primary" />
                  <p className="text-xs">لا توجد فعاليات قادمة معلنة حالياً</p>
                  <Link href="/app/activities">
                    <Button size="sm" variant="outline" className="text-xs rounded-xl mt-1">
                      عرض صفحة الأنشطة
                    </Button>
                  </Link>
                </div>
              ) : (
                upcomingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-white">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-1">{activity.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {activity.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.date}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {activity.category || 'عام'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Notifications */}
          <Card className="border-card-border">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell className="w-4 h-4" />
                الإشعارات
              </CardTitle>
              {unreadNotifs.length > 0 && (
                <Badge variant="destructive" className="text-xs h-5">{unreadNotifs.length}</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {notificationsList.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد إشعارات جديدة</p>
              ) : (
                notificationsList.slice(0, 3).map((notif) => (
                  <div key={notif.id} className="flex items-start gap-2.5">
                    <UserAvatar name={notif.user?.name || 'سرد'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{notif.user?.name || 'إشعار'}</p>
                      <p className="text-xs text-muted-foreground">{notif.content || notif.title}</p>
                    </div>
                  </div>
                ))
              )}
              <Link href="/app/notifications">
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-primary">
                  عرض كل الإشعارات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Suggested Creators */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">أعضاء مقترحون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">انضم إلى ساحة سرد للتواصل مع الأعضاء</p>
              ) : (
                suggestedUsers.map((su) => (
                  <div key={su.id} className="flex items-center gap-3">
                    <UserAvatar name={su.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{su.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">@{su.username}</p>
                    </div>
                    <Link href="/app/feed">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 flex-shrink-0">
                        متابعة
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
