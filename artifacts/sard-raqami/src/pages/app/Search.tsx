import { useState } from 'react';
import { Search, Users, Building2, Calendar, BookOpen, Globe } from 'lucide-react';
import { users, organizations, activities, courses } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/layouts/AppLayout';

const tabs = [
  { key: 'all', label: 'الكل', icon: Globe },
  { key: 'people', label: 'أشخاص', icon: Users },
  { key: 'orgs', label: 'منظمات', icon: Building2 },
  { key: 'activities', label: 'أنشطة', icon: Calendar },
  { key: 'courses', label: 'دورات', icon: BookOpen },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');

  const q = query.toLowerCase();
  const filteredUsers = users.filter(u => u.name.includes(query) || u.bio.includes(query));
  const filteredOrgs = organizations.filter(o => o.name.includes(query) || o.category.includes(query));
  const filteredActivities = activities.filter(a => a.title.includes(query) || a.org.name.includes(query));
  const filteredCourses = courses.filter(c => c.title.includes(query) || c.category.includes(query));

  const hasResults = query && (filteredUsers.length + filteredOrgs.length + filteredActivities.length + filteredCourses.length) > 0;

  const showUsers = tab === 'all' || tab === 'people';
  const showOrgs = tab === 'all' || tab === 'orgs';
  const showActivities = tab === 'all' || tab === 'activities';
  const showCourses = tab === 'all' || tab === 'courses';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Big search */}
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-4">البحث</h1>
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 end-4 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="ابحث عن أشخاص، منظمات، أنشطة، دورات..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pe-12 h-12 text-base rounded-2xl"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {!query ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg mb-2">ابحث عن أي شيء</p>
          <p className="text-sm">أشخاص، منظمات، أنشطة، دورات تدريبية...</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg mb-2">لا نتائج لـ "{query}"</p>
          <p className="text-sm">جرّب كلمات مختلفة أو تحقق من التهجئة</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* People */}
          {showUsers && filteredUsers.length > 0 && (
            <section>
              <h2 className="font-bold text-sm text-muted-foreground mb-3">أشخاص ({filteredUsers.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredUsers.map(user => (
                  <Card key={user.id} className="border-card-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <UserAvatar name={user.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm truncate">{user.name}</p>
                          {user.verified && <span className="text-primary text-xs">✓</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                        <p className="text-xs text-muted-foreground">{user.followers.toLocaleString('ar')} متابع</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0">متابعة</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Orgs */}
          {showOrgs && filteredOrgs.length > 0 && (
            <section>
              <h2 className="font-bold text-sm text-muted-foreground mb-3">منظمات ({filteredOrgs.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredOrgs.map(org => (
                  <Card key={org.id} className="border-card-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold">{org.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm truncate">{org.name}</p>
                          {org.verified && <span className="text-primary text-xs">✓</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{org.category} · {org.followers.toLocaleString('ar')} متابع</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0">متابعة</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Activities */}
          {showActivities && filteredActivities.length > 0 && (
            <section>
              <h2 className="font-bold text-sm text-muted-foreground mb-3">أنشطة ({filteredActivities.length})</h2>
              <div className="space-y-2">
                {filteredActivities.map(a => (
                  <Card key={a.id} className="border-card-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.org.name} · {a.date}</p>
                      </div>
                      <Badge variant={a.price === 'مجاني' ? 'secondary' : 'outline'} className="text-xs flex-shrink-0">{a.price}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Courses */}
          {showCourses && filteredCourses.length > 0 && (
            <section>
              <h2 className="font-bold text-sm text-muted-foreground mb-3">دورات ({filteredCourses.length})</h2>
              <div className="space-y-2">
                {filteredCourses.map(c => (
                  <Card key={c.id} className="border-card-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.org.name} · {c.duration} · {c.level}</p>
                      </div>
                      <Badge variant={c.price === 'مجاني' ? 'secondary' : 'outline'} className="text-xs flex-shrink-0">{c.price}</Badge>
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
