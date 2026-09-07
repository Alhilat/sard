import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Users, Calendar, MapPin, Edit, Trash2, Eye } from 'lucide-react';
import { activitiesService, Activity } from '@/services/activitiesService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import CreateActivityModal from '@/components/activities/CreateActivityModal';

const statusColors: Record<string, string> = {
  'مكتملة': 'text-emerald-700 bg-emerald-100 border-emerald-200',
  'قريبة': 'text-amber-700 bg-amber-100 border-amber-200',
  'متاحة': 'text-blue-700 bg-blue-100 border-blue-200',
};

function getStatus(activity: Activity) {
  const seats = activity.capacity || activity.seats || 100;
  const reg = activity.attendeesCount || activity.registered || 0;
  const pct = (reg / seats) * 100;
  if (pct >= 100) return 'مكتملة';
  if (pct >= 80) return 'قريبة';
  return 'متاحة';
}

export default function OrgActivities() {
  const { toast } = useToast();
  const [items, setItems] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const data = await activitiesService.getActivities();
      setItems(data);
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر تحميل الفعاليات والأنشطة',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleRemove = async (activityId: string, activityTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف فعالية "${activityTitle}" نهائياً؟`)) {
      return;
    }

    const res = await activitiesService.deleteActivity(activityId);
    if (res.success) {
      setItems((prev) => prev.filter((a) => a.id !== activityId));
      toast({
        title: 'تم حذف الفعالية بنجاح 🗑️',
        description: `تم إزالة فعالية "${activityTitle}" من جدول الأنشطة.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف الفعالية',
        description: res.message || 'حدث خطأ أثناء الحذف.',
      });
    }
  };

  const handleActivityCreated = (newAct: Activity) => {
    setItems((prev) => [newAct, ...prev]);
  };

  const totalRegistered = items.reduce((s, a) => s + (a.attendeesCount || a.registered || 0), 0);
  const totalSeats = items.reduce((s, a) => s + (a.capacity || a.seats || 100), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الأنشطة والفعاليات</h1>
          <p className="text-muted-foreground text-sm">تنظيم ومتابعة فعاليات ومبادرات المنظمة</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          نشاط جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي الأنشطة', value: items.length },
          { label: 'المشاركون المسجلون', value: totalRegistered.toLocaleString('ar') },
          { label: 'المقاعد المتبقية', value: Math.max(0, totalSeats - totalRegistered).toLocaleString('ar') },
        ].map((stat) => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activities Table Card */}
      <Card className="border-card-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-bold">قائمة الأنشطة المنظمة</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">جارٍ تحميل الأنشطة...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground p-6">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-base font-bold text-foreground">لا توجد أنشطة مسجلة حالياً</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                ابدأ بإنشاء فعالية جديدة لمجتمعك لدعوة الأعضاء للتسجيل والمشاركة.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                إنشاء أول نشاط
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-start">
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">النشاط</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">التاريخ والوقت</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">المكان</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">المشاركون</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">الحالة</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((activity) => {
                    const status = getStatus(activity);
                    const seats = activity.capacity || activity.seats || 100;
                    const reg = activity.attendeesCount || activity.registered || 0;
                    const pct = Math.min(100, Math.round((reg / seats) * 100));

                    return (
                      <tr key={activity.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{activity.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs h-4 px-1.5">{activity.category || 'عام'}</Badge>
                              <span className="text-xs text-muted-foreground">{activity.price || 'مجاني'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{activity.date}</p>
                          <p className="text-xs text-muted-foreground">{activity.time || 'صباحاً'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground max-w-[150px] truncate">{activity.location || 'حضوري'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-[100px]">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{reg}</span>
                              <span className="text-muted-foreground">/ {seats}</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${statusColors[status] || statusColors['متاحة']}`}>{status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => setViewingActivity(activity)}
                              >
                                <Eye className="w-4 h-4" />عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => toast({ title: 'تعديل النشاط', description: 'يمكنك تعديل بيانات الفعالية من هنا.' })}
                              >
                                <Edit className="w-4 h-4" />تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive cursor-pointer"
                                onClick={() => handleRemove(activity.id, activity.title)}
                              >
                                <Trash2 className="w-4 h-4" />حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onActivityCreated={handleActivityCreated}
      />

      {/* View Activity Dialog */}
      <Dialog open={Boolean(viewingActivity)} onOpenChange={(open) => !open && setViewingActivity(null)}>
        <DialogContent className="max-w-md p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {viewingActivity?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {viewingActivity?.category} · {viewingActivity?.date} {viewingActivity?.time ? `· ${viewingActivity.time}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {viewingActivity?.description || 'لا يوجد وصف تفصيلي إضافي لهذا النشاط.'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl">
              <div>
                <span className="text-muted-foreground">المكان: </span>
                <span className="font-bold">{viewingActivity?.location || 'حضوري'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">المقاعد: </span>
                <span className="font-bold">{viewingActivity?.capacity || viewingActivity?.seats || 100}</span>
              </div>
              <div>
                <span className="text-muted-foreground">المسجلون: </span>
                <span className="font-bold">{viewingActivity?.attendeesCount || viewingActivity?.registered || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">التكلفة: </span>
                <span className="font-bold text-primary">{viewingActivity?.price || 'مجاني'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setViewingActivity(null)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
