import { useState, useEffect } from 'react';
import { User, Lock, Bell, Eye, Palette, Camera, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/layouts/AppLayout';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [fullName, setFullName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = () => {
    updateProfile({
      name: fullName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      location: location.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });

    setSaved(true);
    toast({
      title: 'تم حفظ التعديلات بنجاح! ✅',
      description: 'تم تحديث بيانات ملفك الشخصي في المنصة.',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast({
        variant: 'destructive',
        title: 'بيانات غير مكتملة',
        description: 'يرجى إدخال كلمة المرور الحالية والجديدة.',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'كلمة مرور قصيرة',
        description: 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'عدم تطابق',
        description: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/users/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.success) {
        toast({
          title: 'تم تغيير كلمة المرور بنجاح! 🔒',
          description: 'تم تحديث بيانات الأمان لحسابك.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({
          variant: 'destructive',
          title: 'تعذر تغيير كلمة المرور',
          description: res.message || 'كلمة المرور الحالية غير صحيحة.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: err?.message || 'تعذر تغيير كلمة المرور.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('تحذير نهائي: هل أنت متأكد تماماً من رغبتك في حذف حسابك؟ سيتم حذف جميع منشوراتك وتفاعلاتك نهائياً ولن تتمكن من استعادتها.')) {
      return;
    }
    setIsDeletingAccount(true);
    try {
      await api.delete('/users/me');
      toast({
        title: 'تم حذف الحساب بنجاح',
        description: 'نأمل أن نراك مجدداً في منصة سرد رقمي.',
      });
      logout();
      navigate('/landing');
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف الحساب',
        description: 'حدث خطأ أثناء محاولة إزالة الحساب.',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-black mb-6">الإعدادات</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />الملف الشخصي</TabsTrigger>
          <TabsTrigger value="account" className="gap-2"><Lock className="w-4 h-4" />الحساب والأمان</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><Eye className="w-4 h-4" />الخصوصية</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" />الإشعارات</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" />المظهر</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="text-base">المعلومات الشخصية</CardTitle>
              <CardDescription>تحديث بياناتك الموثقة في منصة سرد رقمي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <UserAvatar name={fullName || 'م'} size="lg" />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={() => toast({ title: 'تغيير الصورة', description: 'يمكنك اختيار صورة شخصية جديدة من جهازك.' })}
                >
                  <Camera className="w-4 h-4" />
                  تغيير الصورة
                </Button>
              </div>
              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="set-name">الاسم الكامل</Label>
                <Input
                  id="set-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="set-username">اسم المستخدم (المعرّف)</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-muted rounded-lg text-muted-foreground text-sm border border-input">@</span>
                  <Input
                    id="set-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="set-bio">النبذة التعريفية</Label>
                <Textarea
                  id="set-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="resize-none"
                  rows={3}
                  placeholder="اكتب نبذة عن اهتماماتك ومجالك..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="set-location">المدينة / الدولة</Label>
                <Input
                  id="set-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="المملكة العربية السعودية"
                />
              </div>

              <Button onClick={handleSaveProfile} className="gap-2 font-bold rounded-xl cursor-pointer">
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    تم الحفظ بنجاح
                  </>
                ) : (
                  'حفظ التغييرات'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <Card className="border-card-border">
            <CardHeader><CardTitle className="text-base">الحساب والأمان</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="set-email">البريد الإلكتروني</Label>
                <Input
                  id="set-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set-phone">رقم الجوال</Label>
                <Input
                  id="set-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 5x xxx xxxx"
                />
              </div>
              <Separator />
              <p className="font-semibold text-sm">تغيير كلمة المرور</p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>كلمة المرور الحالية</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>تأكيد كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword}
                  className="font-bold rounded-xl cursor-pointer"
                >
                  {isChangingPassword ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </form>
              <Separator />
              <div className="space-y-3">
                <p className="font-semibold text-sm text-destructive">منطقة الخطر</p>
                <Button
                  variant="outline"
                  disabled={isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
                >
                  {isDeletingAccount ? 'جارٍ الحذف...' : 'حذف الحساب نهائياً'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <Card className="border-card-border">
            <CardHeader><CardTitle className="text-base">إعدادات الخصوصية</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'حساب خاص', desc: 'فقط المتابعون المعتمدون يمكنهم رؤية منشوراتك' },
                { label: 'إخفاء قائمة المتابِعين', desc: 'لا يمكن للآخرين رؤية قائمة متابعيك' },
                { label: 'إخفاء قائمة المتابَعين', desc: 'لا يمكن للآخرين رؤية من تتابع' },
                { label: 'السماح بالرسائل من الجميع', desc: 'يمكن لأي شخص إرسال رسائل لك', checked: true },
                { label: 'إخفاء الحضور الإلكتروني', desc: 'لا يرى أحد حالة اتصالك' },
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
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="border-card-border">
            <CardHeader><CardTitle className="text-base">إعدادات الإشعارات</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm font-semibold text-muted-foreground">داخل التطبيق</p>
              {[
                { label: 'الإعجابات والتعليقات', checked: true },
                { label: 'المتابِعون الجدد', checked: true },
                { label: 'منشورات المجموعات', checked: false },
                { label: 'الأنشطة الجديدة', checked: true },
                { label: 'الدورات والتحديثات', checked: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <p className="text-sm">{item.label}</p>
                  <Switch defaultChecked={item.checked} />
                </div>
              ))}
              <Separator />
              <p className="text-sm font-semibold text-muted-foreground">البريد الإلكتروني</p>
              {[
                { label: 'ملخص أسبوعي', checked: true },
                { label: 'الأنشطة الجديدة المقترحة', checked: false },
                { label: 'رسائل المنصة', checked: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <p className="text-sm">{item.label}</p>
                  <Switch defaultChecked={item.checked} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card className="border-card-border">
            <CardHeader><CardTitle className="text-base">إعدادات المظهر</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>اللغة</Label>
                <Select defaultValue="ar">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>حجم الخط</Label>
                <Select defaultValue="md">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">صغير</SelectItem>
                    <SelectItem value="md">متوسط</SelectItem>
                    <SelectItem value="lg">كبير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">الوضع الداكن</p>
                  <p className="text-xs text-muted-foreground">قيد التطوير</p>
                </div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
