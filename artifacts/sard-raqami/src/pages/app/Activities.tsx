import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Calendar, Search, Filter, Sparkles, CheckCircle2 } from 'lucide-react';
import { activitiesService, Activity } from '@/services/activitiesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const categories = ['الكل', 'تطوع', 'تقنية', 'بيئة', 'ريادة أعمال', 'صحة', 'ثقافة'];

export default function Activities() {
  const { toast } = useToast();
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');
  const [registeredMap, setRegisteredMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    activitiesService.getActivities().then((data) => {
      if (mounted) {
        setActivitiesList(data);
        const map: Record<string, boolean> = {};
        data.forEach((a) => {
          if (a.isRegistered) map[a.id] = true;
        });
        setRegisteredMap(map);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = activitiesList.filter((a) => {
    const orgTitle = a.org?.name || a.orgName || '';
    const loc = a.location || '';
    const matchSearch =
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      orgTitle.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'الكل' || a.category === category;
    return matchSearch && matchCat;
  });

  const handleRegister = async (id: string) => {
    const isCurrentlyRegistered = Boolean(registeredMap[id]);
    const success = await activitiesService.register(id);
    if (success) {
      setRegisteredMap((prev) => ({ ...prev, [id]: !isCurrentlyRegistered }));
      toast({
        title: isCurrentlyRegistered ? 'تم إلغاء التسجيل' : 'تم التسجيل بنجاح',
        description: isCurrentlyRegistered
          ? 'تم إلغاء مشاركتك في النشاط'
          : 'تم تأكيد مقعدك في النشاط بنجاح!',
      });
    } else {
      toast({
        title: 'خطأ',
        description: 'تعذر تحديث حالة التسجيل، يرجى المحاولة لاحقاً',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      <div>
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
          <Calendar className="w-4 h-4" />
          <span>الفعاليات والمبادرات</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1 font-display">الأنشطة المجتمعية والفعاليات</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">اكتشف الأنشطة والفعاليات وسجّل حضورك ومشاركتك</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث عن نشاط أو فعالية أو جهة منظمة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 h-11 text-xs sm:text-sm bg-card border-border shadow-2xs"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
              cat === category
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} نشاط متاح</span>
      </div>

      {/* Activity Cards or Empty State */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p>جاري تحميل الأنشطة المتاحة...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3 bg-card rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto opacity-30 text-primary" />
          <p className="font-bold text-foreground text-base">لا توجد أنشطة معلنة حالياً</p>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            لم تقم المنظمات بإدراج أنشطة جديدة في هذا القسم بعد. يمكنك متابعة الساحة العامة للاطلاع على المستجدات أولاً بأول.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((activity) => {
            const registered = Boolean(registeredMap[activity.id]);
            const capacity = activity.capacity || 100;
            const attendees = (activity.attendeesCount || 0) + (registered ? 1 : 0);
            const full = attendees >= capacity && !registered;
            const percent = Math.min(Math.round((attendees / capacity) * 100), 100);
            const orgName = activity.org?.name || activity.orgName || 'جهة منظمة';

            return (
              <Card
                key={activity.id}
                className="border-card-border hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-3 bg-gradient-to-r from-primary to-amber-700" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="text-xs font-bold">
                        {activity.category || 'عام'}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-primary bg-primary/10 border-primary/20">
                        {activity.status || 'متاح للتسجيل'}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-base mb-1 text-foreground line-clamp-1">{activity.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 truncate">{orgName}</p>

                    {activity.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {activity.description}
                      </p>
                    )}

                    <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                        <span>{activity.date} {activity.time ? `· ${activity.time}` : ''}</span>
                      </div>
                      {activity.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Seats progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {attendees} مسجّل
                        </span>
                        <span className="text-muted-foreground">{capacity} مقعد</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent >= 90 ? 'bg-red-500' : 'bg-primary'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-5 pt-0">
                  {full ? (
                    <Button variant="outline" className="w-full text-xs font-bold" disabled>
                      اكتمل العدد
                    </Button>
                  ) : (
                    <Button
                      className={`w-full text-xs font-bold gap-1.5 shadow-2xs ${
                        registered ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                      }`}
                      onClick={() => handleRegister(activity.id)}
                    >
                      {registered ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>أنت مسجل في هذا النشاط</span>
                        </>
                      ) : (
                        'سجّل حضورك الآن'
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
