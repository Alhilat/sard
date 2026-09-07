import { useState } from 'react';
import { Camera, MapPin, Globe, Mail, Phone, Save } from 'lucide-react';
import { currentOrg } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const categories = ['تطوع ومجتمع', 'تعليم', 'تقنية', 'بيئة', 'ريادة أعمال', 'صحة', 'ثقافة وفنون', 'رياضة'];

export default function OrgProfile() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black mb-6">ملف المنظمة</h1>

      {/* Cover & Logo */}
      <Card className="border-card-border mb-6 overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
          <button className="absolute bottom-3 end-3 bg-black/50 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            تغيير الغلاف
          </button>
        </div>
        <CardContent className="p-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-3xl font-black border-4 border-card">
              {currentOrg.name[0]}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 mb-1">
              <Camera className="w-3.5 h-3.5" />
              تغيير الشعار
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">{currentOrg.name}</h2>
            <Badge className="text-emerald-700 bg-emerald-100 border-emerald-200">✓ موثّقة</Badge>
          </div>
          <p className="text-sm text-muted-foreground">@{currentOrg.username}</p>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <CardTitle className="text-base">المعلومات الأساسية</CardTitle>
          <CardDescription>البيانات الرئيسية للمنظمة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>اسم المنظمة</Label>
            <Input defaultValue={currentOrg.name} />
          </div>
          <div className="space-y-1.5">
            <Label>اسم المستخدم</Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-muted rounded-lg text-muted-foreground text-sm border border-input">@</span>
              <Input defaultValue={currentOrg.username} className="flex-1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>نبذة عن المنظمة</Label>
            <Textarea defaultValue={currentOrg.bio} className="resize-none" rows={4} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>التصنيف</Label>
              <Select defaultValue={currentOrg.category}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الموقع</Label>
              <div className="relative">
                <MapPin className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
                <Input defaultValue={currentOrg.location} className="pe-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <CardTitle className="text-base">معلومات التواصل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>البريد الإلكتروني الرسمي</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="org@example.com" className="pe-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>رقم الهاتف</Label>
            <div className="relative">
              <Phone className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
              <Input type="tel" placeholder="+966 x xxx xxxx" className="pe-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>الموقع الإلكتروني</Label>
            <div className="relative">
              <Globe className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="https://example.org" className="pe-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} className="gap-2">
        <Save className="w-4 h-4" />
        {saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
      </Button>
    </div>
  );
}
