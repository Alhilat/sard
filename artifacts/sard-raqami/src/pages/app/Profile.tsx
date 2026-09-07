import { useState, useEffect } from 'react';
import { MapPin, Calendar, BookOpen, Settings, Edit, CheckCircle2, Sparkles, Users, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { coursesService, Course } from '@/services/coursesService';
import { activitiesService, Activity } from '@/services/activitiesService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

const tabs = ['المنشورات', 'الأنشطة', 'الدورات'];

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('المنشورات');
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [userActivities, setUserActivities] = useState<Activity[]>([]);

  useEffect(() => {
    coursesService.getCourses().then((data) => {
      setUserCourses(data.filter((c) => c.enrolled));
    });
    activitiesService.getActivities().then((data) => {
      setUserActivities(data.filter((a) => a.isRegistered));
    });
  }, []);

  const name = user?.name || 'مستخدم سرد';
  const username = user?.username || (user?.email ? user.email.split('@')[0] : 'user');
  const bio = user?.bio || 'عضو في مجتمع سرد رقمي للتقنية والمبادرات المجتمعية';
  const location = user?.location || 'المملكة العربية السعودية';
  const joinDate = user?.joinDate || 'سبتمبر ٢٠٢٦';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('') || 'س';
  const isOrg = user?.role === 'org';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" dir="rtl">
      {/* Profile Card Header */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs mb-6">
        {/* Cover */}
        <div
          className="h-36 sm:h-48 relative"
          style={{ background: 'linear-gradient(135deg, hsl(0,62%,16%), hsl(0,61%,28%), hsl(15,55%,32%))' }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-4 gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-black border-4 border-card shadow-md">
              {initials}
            </div>
            <div className="flex gap-2">
              <Link href="/app/settings">
                <Button variant="outline" size="sm" className="gap-2 font-bold rounded-xl cursor-pointer">
                  <Edit className="w-4 h-4" />
                  تعديل الملف الشخصي
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">{name}</h1>
              {user?.verified && <CheckCircle2 className="w-4 h-4 text-primary" />}
              <Badge variant="outline" className="text-[11px] h-5 px-2">
                {isOrg ? 'منظمة معتمدة' : 'حساب شخصي'}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-2.5 font-mono">@{username}</p>
            <p className="text-sm leading-relaxed mb-3 max-w-2xl text-foreground/90">{bio}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                عضو منذ {joinDate}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Clean Real Metrics (Zero Fake Numbers) */}
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="p-3 rounded-2xl bg-muted/40 text-center border border-border/50">
              <p className="font-bold text-xs text-muted-foreground mb-1">حالة الحساب</p>
              <p className="font-bold text-xs text-emerald-600">نشط وموثق</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 text-center border border-border/50">
              <p className="font-bold text-xs text-muted-foreground mb-1">الدورات المسجلة</p>
              <p className="font-bold text-xs text-foreground">{userCourses.length} دورات</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 text-center border border-border/50">
              <p className="font-bold text-xs text-muted-foreground mb-1">الأنشطة المسجلة</p>
              <p className="font-bold text-xs text-foreground">{userActivities.length} نشاط</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'المنشورات' && (
          <Card className="border-border">
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-foreground">شارك أفكارك وتجاربك في مجتمع سرد</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                يمكنك كتابة سردات جديدة ونقاش المواضيع مع الآخرين عبر صفحة «سرد».
              </p>
              <Link href="/app/feed">
                <Button size="sm" className="mt-2 font-bold gap-2 rounded-xl">
                  الانتقال إلى ساحة سرد
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {activeTab === 'الأنشطة' && (
          userActivities.length === 0 ? (
            <Card className="border-border text-center py-12 p-6 space-y-3 bg-card">
              <Calendar className="w-10 h-10 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-sm text-foreground">لم تقم بالتسجيل في أي نشاط بعد</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                استكشف الأنشطة والفعاليات المتاحة في المنصة وسجّل مشاركتك.
              </p>
              <Link href="/app/activities">
                <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl mt-2">
                  استكشاف الأنشطة
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {userActivities.map((activity) => (
                <Card key={activity.id} className="border-border">
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {activity.category || 'عام'}
                    </Badge>
                    <p className="font-bold text-sm mb-1">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.org?.name || activity.orgName || 'جهة منظمة'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.date} {activity.time ? `· ${activity.time}` : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {activeTab === 'الدورات' && (
          userCourses.length === 0 ? (
            <Card className="border-border text-center py-12 p-6 space-y-3 bg-card">
              <BookOpen className="w-10 h-10 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-sm text-foreground">لم تنضم إلى أي دورة تدريبية بعد</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                تصفح قائمة الدورات التخصصية المتاحة في أكاديمية سرد الرقمية وابدأ رحلتك.
              </p>
              <Link href="/app/courses">
                <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl mt-2">
                  تصفح الدورات
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {userCourses.map((course) => (
                <Card key={course.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.category}
                      </Badge>
                      {course.progress === 100 && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                          مكتملة
                        </Badge>
                      )}
                    </div>
                    <p className="font-bold text-sm mb-1">{course.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{course.org?.name || 'أكاديمية سرد'}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{course.progress || 0}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
