import { useState } from 'react';
import { MapPin, Clock, Users, Calendar, Search, Filter, ChevronDown } from 'lucide-react';
import { activities } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const categories = ['الكل', 'تطوع', 'تقنية', 'بيئة', 'ريادة أعمال', 'صحة', 'ثقافة'];

export default function Activities() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');
  const [registeredMap, setRegisteredMap] = useState<Record<string, boolean>>({});

  const filtered = activities.filter(a => {
    const matchSearch = a.title.includes(search) || a.org.name.includes(search) || a.location.includes(search);
    const matchCat = category === 'الكل' || a.category === category;
    return matchSearch && matchCat;
  });

  const register = (id: string) => setRegisteredMap(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">الأنشطة والفعاليات</h1>
        <p className="text-muted-foreground text-sm">اكتشف الأنشطة والفعاليات القريبة منك وسجّل مشاركتك</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن نشاط أو فعالية..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pe-9"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" />
          تصفية
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${cat === category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} نشاط متاح</p>

      {/* Activity cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(activity => {
          const registered = registeredMap[activity.id];
          const full = activity.registered >= activity.seats && !registered;
          const percent = Math.round((activity.registered / activity.seats) * 100);
          return (
            <Card key={activity.id} className="border-card-border hover:shadow-md transition-shadow overflow-hidden">
              {/* Card top */}
              <div className="h-3 bg-gradient-to-r from-primary to-amber-700" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">{activity.category}</Badge>
                  <Badge variant={activity.price === 'مجاني' ? 'secondary' : 'outline'} className={`text-xs ${activity.price === 'مجاني' ? 'text-primary bg-primary/10 border-primary/20' : ''}`}>
                    {activity.price}
                  </Badge>
                </div>

                <h3 className="font-bold mb-1">{activity.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{activity.org.name}</p>

                <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 flex-shrink-0" />{activity.date} · {activity.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{activity.location}</div>
                </div>

                {/* Seats progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{activity.registered} مسجّل</span>
                    <span className="text-muted-foreground">{activity.seats} مقعد</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${percent >= 90 ? 'bg-red-400' : 'bg-primary'}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {full ? (
                    <Button variant="outline" className="flex-1" disabled>القائمة الانتظار</Button>
                  ) : (
                    <Button
                      className={`flex-1 ${registered ? 'bg-primary/80 hover:bg-primary' : ''}`}
                      onClick={() => register(activity.id)}
                    >
                      {registered ? '✓ مسجّل' : 'سجّل الآن'}
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Clock className="w-4 h-4" />
                  </Button>
                </div>

                {activity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {activity.tags.map(tag => (
                      <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
