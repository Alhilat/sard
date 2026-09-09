import { useState, useEffect } from 'react';
import { Search, Users, Building2, Calendar, BookOpen, Globe } from 'lucide-react';
import { activitiesService, Activity } from '@/services/activitiesService';
import { coursesService, Course } from '@/services/coursesService';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/layouts/AppLayout';

const tabs = [
  { key: 'all', label: 'الكل', icon: Globe },
  { key: 'people', label: 'أشخاص', icon: Users },
  { key: 'activities', label: 'أنشطة', icon: Calendar },
  { key: 'courses', label: 'دورات', icon: BookOpen },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);

  useEffect(() => {
    activitiesService.getActivities().then(setActivitiesList);
    coursesService.getCourses().then(setCoursesList);
    api.get<{ users?: any[] }>('/users/suggestions')
      .then((res) => {
        if (res?.users && Array.isArray(res.users)) {
          setUsersList(res.users);
        }
      })
      .catch(() => {});
  }, []);

  const q = query.trim().toLowerCase();
  const filteredUsers = usersList.filter(
    (u) => (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)
  );
  const filteredActivities = activitiesList.filter(
    (a) => (a.title || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q)
  );
  const filteredCourses = coursesList.filter(
    (c) => (c.title || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)
  );

  const hasResults =
    q && (filteredUsers.length + filteredActivities.length + filteredCourses.length) > 0;

  const showUsers = tab === 'all' || tab === 'people';
  const showActivities = tab === 'all' || tab === 'activities';
  const showCourses = tab === 'all' || tab === 'courses';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-4 font-display">البحث الشامل</h1>
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث عن أعضاء، فعاليات، دورات تخصصية..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-12 h-12 text-sm sm:text-base rounded-2xl bg-card border-border shadow-2xs"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
              tab === t.key
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {!q ? (
        <div className="text-center py-16 text-muted-foreground space-y-2 bg-card rounded-2xl border border-border">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-20 text-primary" />
          <p className="font-bold text-foreground text-base">ابحث في منصة سرد رقمي</p>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            اكتب في خانة البحث أعلاه للعثور على الأعضاء، الفعاليات، أو الدورات التدريبية المعتمدة.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-16 text-muted-foreground space-y-2 bg-card rounded-2xl border border-border">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-20 text-primary" />
          <p className="font-bold text-foreground text-base">لا توجد نتائج مطابقة لـ «{query}»</p>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            جرّب استخدام كلمات بحث أخرى أو التأكد من صحة الحروف المدخلة.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* People */}
          {showUsers && filteredUsers.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-sm text-muted-foreground">أعضاء سرد ({filteredUsers.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="border-card-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <UserAvatar name={user.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      </div>
                      <Badge variant="outline" className="text-xs text-primary">عضو</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Activities */}
          {showActivities && filteredActivities.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-sm text-muted-foreground">الفعاليات والأنشطة ({filteredActivities.length})</h2>
              <div className="space-y-2">
                {filteredActivities.map((a) => (
                  <Card key={a.id} className="border-card-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.org?.name || a.orgName || 'منظمة معتمدة'} · {a.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {a.category || 'عام'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Courses */}
          {showCourses && filteredCourses.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-sm text-muted-foreground">الدورات التدريبية ({filteredCourses.length})</h2>
              <div className="space-y-2">
                {filteredCourses.map((c) => (
                  <Card key={c.id} className="border-card-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-600">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.org?.name || 'أكاديمية سرد'} · {c.duration || 'مكثف'} · {c.level || 'معتمد'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0 text-primary">
                        {c.price || 'مجاني'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
