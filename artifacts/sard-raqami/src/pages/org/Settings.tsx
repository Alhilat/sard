import { useState } from 'react';
import { Bell, Shield, Globe, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function OrgSettings() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-6">الإعدادات</h1>

      {/* Notifications */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /><CardTitle className="text-base">إعدادات الإشعارات</CardTitle></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'تسجيل عضو جديد', desc: 'تلقّ إشعاراً عند انضمام عضو جديد', checked: true },
            { label: 'تسجيل في النشاط', desc: 'تلقّ إشعاراً عند التسجيل في نشاط', checked: true },
            { label: 'تعليقات جديدة', desc: 'إشعارات عند التعليق على منشوراتك', checked: false },
            { label: 'تقرير أسبوعي', desc: 'تلقّ ملخصاً أسبوعياً بالإحصائيات', checked: true },
          ].map(item => (
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
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><CardTitle className="text-base">الخصوصية والوصول</CardTitle></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>من يمكنه رؤية ملف المنظمة</Label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الجميع</SelectItem>
                <SelectItem value="followers">المتابِعون فقط</SelectItem>
                <SelectItem value="members">الأعضاء فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">السماح بطلبات الانضمام</p>
              <p className="text-xs text-muted-foreground">يمكن للأفراد طلب الانضمام للمنظمة</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">قبول العضوية تلقائياً</p>
              <p className="text-xs text-muted-foreground">لا تحتاج طلبات الانضمام لموافقة يدوية</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /><CardTitle className="text-base">اللغة والمنطقة</CardTitle></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>لغة المنصة</Label>
            <Select defaultValue="ar">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>المنطقة الزمنية</Label>
            <Select defaultValue="riyadh">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="riyadh">الرياض (GMT+3)</SelectItem>
                <SelectItem value="jeddah">جدة (GMT+3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button onClick={save} className="gap-2">
          <Save className="w-4 h-4" />
          {saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
        </Button>
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white gap-2">
          <Trash2 className="w-4 h-4" />حذف المنظمة
        </Button>
      </div>
    </div>
  );
}
