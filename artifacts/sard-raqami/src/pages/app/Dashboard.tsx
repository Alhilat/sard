import { Link } from 'wouter';
import { Calendar, BookOpen, Users, TrendingUp, ArrowLeft, Bell, MapPin, Clock, Award, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { activities, courses, organizations, notifications } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/layouts/AppLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const enrolledCourses = courses.filter((c) => c.enrolled && c.progress < 100);
  const completedCourses = courses.filter((c) => c.enrolled && c.progress === 100);
  const upcomingActivities = activities.slice(0, 3);
  const unreadNotifs = notifications.filter((n) => !n.read);

  const displayName = user?.name || 'مستخدم سرد';
  const firstName = displayName.split(' ')[0];

  const stats = [
    { label: 'الأنشطة المتاحة', value: `${activities.length} نشاط`, icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: 'الدورات قيد التعلم', value: `${enrolledCourses.length} دورات`, icon: BookOpen, color: 'bg-amber-100 text-amber-700' },
    { label: 'الدورات المكتملة', value: `${completedCourses.length} مكتملة`, icon: Award, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'مجتمعات سرد', value: 'نشط', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Welcome banner */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 p-6 sm:p-8 text-white shadow-xs"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <Button variant="ghost" size="sm" className="text-primary h-8 gap-1">
                  عرض الكل <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrolledCourses.map(course => (
                <div key={course.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate mb-1">{course.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{course.org.name}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={course.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground flex-shrink-0">{course.progress}%</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="flex-shrink-0 h-8 text-xs">
                    متابعة
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming activities */}
          <Card className="border-card-border">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">الأنشطة المقبلة</CardTitle>
              <Link href="/app/activities">
                <Button variant="ghost" size="sm" className="text-primary h-8 gap-1">
                  عرض الكل <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-white">
                    <div className="text-center">
                      <p className="text-xs font-bold leading-none">{activity.date.split('-')[2]}</p>
                      <p className="text-xs opacity-80">يوليو</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1">{activity.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.location.split('،')[0]}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.time}</span>
                    </div>
                  </div>
                  <Badge variant={activity.price === 'مجاني' ? 'secondary' : 'outline'} className="text-xs flex-shrink-0">
                    {activity.price}
                  </Badge>
                </div>
              ))}
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
              <Badge variant="destructive" className="text-xs h-5">{unreadNotifs.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {unreadNotifs.slice(0, 3).map(notif => (
                <div key={notif.id} className="flex items-start gap-2.5">
                  <UserAvatar name={notif.user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{notif.user.name}</p>
                    <p className="text-xs text-muted-foreground">{notif.content}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{notif.time}</p>
                  </div>
                </div>
              ))}
              <Link href="/app/notifications">
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-primary">عرض كل الإشعارات</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Suggested orgs */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">منظمات مقترحة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {organizations.slice(0, 3).map(org => (
                <div key={org.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-xs">{org.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold truncate">{org.name}</p>
                      {org.verified && <span className="text-primary text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{org.followers.toLocaleString('ar')} متابع</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 flex-shrink-0">متابعة</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
