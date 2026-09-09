import { useState, useEffect } from 'react';
import { Camera, MapPin, Globe, Mail, Phone, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const categories = ['تطوع ومجتمع', 'تعليم', 'تقنية', 'بيئة', 'ريادة أعمال', 'صحة', 'ثقافة وفنون', 'رياضة'];

export default function OrgProfile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [orgName, setOrgName] = useState(user?.name || 'منظمة رواد التطوع');
  const [username, setUsername] = useState(user?.username || 'rwad');
  const [bio, setBio] = useState(user?.bio || 'منظمة غير ربحية تهدف إلى تعزيز العمل التطوعي وتنمية المجتمع.');
  const [category, setCategory] = useState('تطوع ومجتمع');
  const [location, setLocation] = useState(user?.location || 'الرياض، المملكة العربية السعودية');
  const [email, setEmail] = useState(user?.email || 'info@rwad.org');
  const [phone, setPhone] = useState(user?.phone || '+966 11 234 5678');
  const [website, setWebsite] = useState('https://rwad.org');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setOrgName(user.name);
      if (user.username) setUsername(user.username);
      if (user.bio) setBio(user.bio);
      if (user.location) setLocation(user.location);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: orgName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        location: location.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setSaved(true);
      toast({
        title: 'تم حفظ ملف المنظمة بنجاح! ✅',
        description: 'تم تحديث كافة بيانات المنظمة في المنصة وقاعدة البيانات.',
      });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر حفظ تعديلات ملف المنظمة.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-black mb-6">ملف المنظمة</h1>

      {/* Cover & Logo */}
      <Card className="border-card-border mb-6 overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 relative">
          <button
            onClick={() => toast({ title: 'تغيير الغلاف', description: 'تم تحديد أمر تحديث صورة غلاف المنظمة.' })}
            className="absolute bottom-3 end-3 bg-black/60 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-black/80 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            تغيير الغلاف
          </button>
        </div>
        <CardContent className="p-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-amber-600 flex items-center justify-center text-white text-3xl font-black border-4 border-card shadow-md">
              {orgName[0] || 'م'}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 mb-1 cursor-pointer"
              onClick={() => toast({ title: 'تغيير الشعار', description: 'يمكنك اختيار الشعار الرسمي الجديد من جهازك.' })}
            >
              <Camera className="w-3.5 h-3.5" />
              تغيير الشعار
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">{orgName}</h2>
            <Badge className="text-amber-700 bg-amber-100 border-amber-200">✓ موثّقة</Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">@{username}</p>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <CardTitle className="text-base font-bold">المعلومات الأساسية</CardTitle>
          <CardDescription>البيانات التعريفية الرسمية للمنظمة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>اسم المنظمة</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>اسم المستخدم</Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-muted rounded-lg text-muted-foreground text-sm border border-input">@</span>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="flex-1 font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>نبذة عن المنظمة</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="resize-none" rows={4} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>التصنيف الرئيسي</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>المقر والموقع</Label>
              <div className="relative">
                <MapPin className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="pe-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-card-border mb-5">
        <CardHeader>
          <CardTitle className="text-base font-bold">معلومات التواصل الرسمي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>البريد الإلكتروني الرسمي</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pe-9" dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>رقم الهاتف</Label>
            <div className="relative">
              <Phone className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pe-9" dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>الموقع الإلكتروني</Label>
            <div className="relative">
              <Globe className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="pe-9" dir="ltr" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="gap-2 bg-primary text-primary-foreground font-bold rounded-xl cursor-pointer"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'جارٍ الحفظ...' : saved ? '✓ تم الحفظ بنجاح' : 'حفظ التغييرات'}
      </Button>
    </div>
  );
}
