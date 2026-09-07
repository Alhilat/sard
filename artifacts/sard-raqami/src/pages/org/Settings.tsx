import { useState } from 'react';
import { Bell, Shield, Globe, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';

export default function OrgSettings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [saved, setSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast({
      title: 'تم حفظ الإعدادات بنجاح! ✅',
      description: 'تم تحديث خيارات الإشعارات والخصوصية لمنظمتك.',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteOrg = async () => {
    if (!confirm('تحذير: هل أنت متأكد من رغبتك في حذف حساب المنظمة نهائياً؟ سيتم إلغاء كافة الصلاحيات وحذف بيانات الحساب.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete('/users/me');
      toast({
        title: 'تم حذف حساب المنظمة',
        description: 'نأمل أن نراك مجدداً في منصة سرد رقمي.',
      });
      logout();
      navigate('/landing');
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف الحساب',
        description: 'حدث خطأ أثناء محاولة إزالة حساب المنظمة.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-black mb-6">إعدادات المنظمة</h1>

      {/* Notifications */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-bold">إعدادات الإشعارات والتنبيهات</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'تسجيل عضو جديد', desc: 'تلقّ إشعاراً عند انضمام عضو جديد للمنظمة', checked: true },
            { label: 'تسجيل في النشاط', desc: 'تلقّ إشعاراً عند حجز مقعد في فعاليات المنظمة', checked: true },
            { label: 'تعليقات ومشاركات جديدة', desc: 'إشعارات عند التعليق على منشورات المؤسسة', checked: false },
            { label: 'تقرير التحليلات الدوري', desc: 'تلقّ ملخصاً دورياً بمعدلات التفاعل والنمو', checked: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.checked} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-bold">الخصوصية وشروط الوصول</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>من يمكنه رؤية ملف المنظمة</Label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الجميع (عام)</SelectItem>
                <SelectItem value="followers">المتابِعون فقط</SelectItem>
                <SelectItem value="members">الأعضاء فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">السماح بطلبات الانضمام</p>
              <p className="text-xs text-muted-foreground">يمكن للأفراد تقديم طلبات انضمام للمنظمة</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-bold">اللغة والمنطقة الزمنية</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>لغة الواجهة</Label>
            <Select defaultValue="ar">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية (الافتراضية)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>المنطقة الزمنية</Label>
            <Select defaultValue="riyadh">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="riyadh">توقيت مكة والرياض (GMT+3)</SelectItem>
                <SelectItem value="cairo">توقيت القاهرة (GMT+2)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button
          onClick={handleSave}
          className="gap-2 bg-primary text-primary-foreground font-bold rounded-xl cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
        </Button>
        <Button
          variant="outline"
          disabled={isDeleting}
          onClick={handleDeleteOrg}
          className="border-destructive text-destructive hover:bg-destructive hover:text-white gap-2 cursor-pointer rounded-xl"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'جارٍ الحذف...' : 'حذف المنظمة'}
        </Button>
      </div>
    </div>
  );
}
