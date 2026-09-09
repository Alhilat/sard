import { useState, useEffect } from 'react';
import { User, Lock, Bell, Eye, Palette, Camera, Check, Smartphone, Volume2, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/layouts/AppLayout';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import { deviceNotificationService, DeviceTokenItem } from '@/services/deviceNotificationService';

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

  // Device notifications state
  const [devicePermission, setDevicePermission] = useState<NotificationPermission>('default');
  const [registeredDevices, setRegisteredDevices] = useState<DeviceTokenItem[]>([]);
  const [isSendingDeviceTest, setIsSendingDeviceTest] = useState(false);

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

  useEffect(() => {
    if (deviceNotificationService.isSupported()) {
      setDevicePermission(deviceNotificationService.getPermission());
    }
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await deviceNotificationService.getRegisteredDevices();
      setRegisteredDevices(devices);
    } catch {
      // ignore
    }
  };

  const handleEnableDeviceInSettings = async () => {
    const perm = await deviceNotificationService.requestPermission();
    setDevicePermission(perm);
    if (perm === 'granted') {
      toast({
        title: 'تم تفعيل إشعارات الجهاز بنجاح! 🔔',
        description: 'ستصلك الآن التنبيهات المباشرة ورسائل الأنشطة على هذا الجهاز.',
      });
      loadDevices();
    } else {
      toast({
        variant: 'destructive',
        title: 'الإشعارات غير مفعلة',
        description: 'يرجى السماح بالإشعارات في إعدادات متصفحك.',
      });
    }
  };

  const handleSendTestInSettings = async () => {
    setIsSendingDeviceTest(true);
    try {
      await deviceNotificationService.sendTestNotification();
      toast({
        title: 'تم إرسال إشعار تجريبي 🔔⚡',
        description: 'تم إطلاق التنبيه والصوت بنجاح على جهازك.',
      });
      loadDevices();
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر إرسال الإشعار التجريبي.',
      });
    } finally {
      setIsSendingDeviceTest(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    const ok = await deviceNotificationService.unregisterDevice(deviceId);
    if (ok) {
      setRegisteredDevices(prev => prev.filter(d => d.id !== deviceId));
      toast({
        title: 'تم إلغاء تسجيل الجهاز',
        description: 'لن يستقبل هذا الجهاز إشعارات المنصة بعد الآن.',
      });
    }
  };

  const handleSaveProfile = () => {
    updateProfile({
      name: fullName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      location: location.trim(),
      country: location.trim(),
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
                  placeholder="مثال: الأردن، عمّان"
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
        <TabsContent value="notifications" className="space-y-6">
          {/* Device Push Notifications Card */}
          <Card className="border-card-border overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/70 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">إشعارات الأجهزة والمنبه المباشر</CardTitle>
                    <CardDescription className="text-xs">
                      استقبال التنبيهات الفورية على المتصفح والهواتف (PWA / Web Push)
                    </CardDescription>
                  </div>
                </div>

                {devicePermission === 'granted' ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    مفعلة على جهازك
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 bg-amber-500/10">
                    غير مفعلة
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">إذن التنبيهات الفورية للمتصفح والجهاز</p>
                  <p className="text-xs text-muted-foreground">
                    يتيح للمنصة إرسال أصوات المنبه والتنبيهات المباشرة عند وصول رسائل أو إعلانات للأنشطة.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {devicePermission !== 'granted' ? (
                    <Button
                      size="sm"
                      onClick={handleEnableDeviceInSettings}
                      className="text-xs font-bold gap-1.5 h-9"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>تفعيل الإشعارات الآن</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSendTestInSettings}
                      disabled={isSendingDeviceTest}
                      className="text-xs font-bold gap-1.5 h-9 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSendingDeviceTest ? 'جاري الإرسال...' : 'اختبار نغمة وإشعار الجهاز'}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Registered Devices List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                    <span>الأجهزة المتصلة بحسابك ({registeredDevices.length})</span>
                  </p>
                  <span className="text-[11px] text-muted-foreground">الأجهزة المسجلة لاستقبال التنبيهات</span>
                </div>

                {registeredDevices.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    لا توجد أجهزة مسجلة حالياً. اضغط على زر تفعيل الإشعارات أعلاه لتسجيل هذا الجهاز.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {registeredDevices.map((dev) => (
                      <div
                        key={dev.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/60 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-primary font-bold">
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {dev.deviceType.toUpperCase()} - متصفح الويب
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-xs sm:max-w-md">
                              {dev.userAgent || 'جهاز نشط'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            {dev.formattedTime || 'نشط'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteDevice(dev.id)}
                            title="إلغاء تسجيل هذا الجهاز"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader><CardTitle className="text-base">تفضيلات الإشعارات</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm font-semibold text-muted-foreground">داخل التطبيق</p>
              {[
                { label: 'الإعجابات والتعليقات', checked: true },
                { label: 'المتابِعون الجدد', checked: true },
                { label: 'منشورات المجموعات', checked: false },
                { label: 'الأنشطة الجديدة وغرف النقاش', checked: true },
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
