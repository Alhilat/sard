import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { User, Building2, Eye, EyeOff, Mail, Lock, Phone, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const COUNTRIES = [
  { code: 'JO', name: 'الأردن', flag: '🇯🇴', dialCode: '+962', placeholder: '+962 7x xxx xxxx' },
  { code: 'PS', name: 'فلسطين', flag: '🇵🇸', dialCode: '+970', placeholder: '+970 5x xxx xxxx' },
  { code: 'SA', name: 'المملكة العربية السعودية', flag: '🇸🇦', dialCode: '+966', placeholder: '+966 5x xxx xxxx' },
  { code: 'AE', name: 'الإمارات العربية المتحدة', flag: '🇦🇪', dialCode: '+971', placeholder: '+971 5x xxx xxxx' },
  { code: 'EG', name: 'مصر', flag: '🇪🇬', dialCode: '+20', placeholder: '+20 1x xxx xxxx' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼', dialCode: '+965', placeholder: '+965 xx xxx xxx' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦', dialCode: '+974', placeholder: '+974 xx xxx xxx' },
  { code: 'BH', name: 'البحرين', flag: '🇧🇭', dialCode: '+973', placeholder: '+973 xx xxx xxx' },
  { code: 'OM', name: 'سلطنة عمان', flag: '🇴🇲', dialCode: '+968', placeholder: '+968 xx xxx xxx' },
  { code: 'IQ', name: 'العراق', flag: '🇮🇶', dialCode: '+964', placeholder: '+964 7x xxx xxxx' },
  { code: 'LB', name: 'لبنان', flag: '🇱🇧', dialCode: '+961', placeholder: '+961 7x xxx xxxx' },
  { code: 'SY', name: 'سوريا', flag: '🇸🇾', dialCode: '+963', placeholder: '+963 9x xxx xxxx' },
  { code: 'MA', name: 'المغرب', flag: '🇲🇦', dialCode: '+212', placeholder: '+212 6x xxx xxxx' },
  { code: 'DZ', name: 'الجزائر', flag: '🇩🇿', dialCode: '+213', placeholder: '+213 5x xxx xxxx' },
  { code: 'TN', name: 'تونس', flag: '🇹🇳', dialCode: '+216', placeholder: '+216 xx xxx xxx' },
  { code: 'OTHER', name: 'دولة أخرى', flag: '🌍', dialCode: '+', placeholder: '+xxx xxxxxxxx' },
];

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<'individual' | 'org'>('individual');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('الأردن');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCountryObj = COUNTRIES.find((c) => c.name === country) || COUNTRIES[0];

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const fullName = role === 'individual'
      ? `${firstName.trim()} ${lastName.trim()}`.trim()
      : orgName.trim();

    if (!fullName) {
      setErrorMsg(role === 'individual' ? 'يرجى كتابة الاسم الأول والأخير' : 'يرجى كتابة اسم المنظمة');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن ٦ أحرف');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register({
        name: fullName,
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
        country: country.trim() || 'الأردن',
      });

      if (res.success) {
        toast({
          title: `مرحباً بك يا ${fullName}! 🌟`,
          description: 'تم إنشاء حسابك وتفعيله بنجاح في منصة سرد رقمي.',
        });
        navigate(role === 'individual' ? '/app/feed' : '/org');
      } else {
        setErrorMsg(res.error || 'تعذر إنشاء الحساب، يرجى المحاولة ثانية.');
      }
    } catch {
      setErrorMsg('حدث خطأ غير متوقع، يرجى المحاولة ثانية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* اللوحة الجانبية — هوية سرد رقمي */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, hsl(0,65%,8%), hsl(0,61%,18%), hsl(15,55%,22%))' }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div
          className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ border: '3px dashed hsl(33,60%,72%)' }}
        />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-xl font-display">س</span>
            </div>
            <span className="font-bold text-2xl text-white font-display">سرد رقمي</span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-4 font-display">
            انضم إلى<br />مجتمعنا الرقمي
          </h2>
          <p className="leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            سجّل مجاناً واكتشف عالماً من الفرص المجتمعية والتعليمية الحقيقية
          </p>
          <div className="space-y-4">
            {[
              { step: '١', text: 'اختر نوع حسابك (فردي أو منظمة)' },
              { step: '٢', text: 'أدخل بياناتك الشخصية الموثقة' },
              { step: '٣', text: 'ابدأ النشر والتفاعل والتعلم فوراً' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {s.step}
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © 2026 سرد رقمي — منصة المجتمع الرقمي
        </div>
      </div>

      {/* نموذج التسجيل */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold font-display">س</span>
              </div>
              <span className="font-bold text-lg font-display">سرد رقمي</span>
            </Link>

            {/* شريط التقدم */}
            <div className="flex items-center gap-3 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s <= step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  {s < 2 && (
                    <div className={`h-0.5 w-12 transition-all ${step > s ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
              <span className="text-sm text-muted-foreground">الخطوة {step} من ٢</span>
            </div>

            <h1 className="text-2xl font-black mb-1">
              {step === 1 ? 'أنشئ حسابك' : 'أدخل بياناتك الحقيقية'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === 1
                ? 'اختر نوع الحساب الذي تريد تسجيله'
                : 'أدخل معلوماتك ليتم تسجيل دخولك بها مباشرة في كامل المنصة'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5 text-destructive text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'individual', icon: User, title: 'مستخدم فردي', desc: 'للأفراد الراغبين في النشر، التطوع، والتعلم' },
                  { key: 'org', icon: Building2, title: 'منظمة', desc: 'للجمعيات والجهات التي تقدم أنشطة ومبادرات' },
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key as any)}
                    className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                      role === r.key
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        role === r.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <r.icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm mb-1">{r.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                  </button>
                ))}
              </div>

              <Button type="submit" className="w-full h-11 font-bold gap-2 cursor-pointer shadow-xs">
                المتابعة إلى البيانات الشخصية
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'individual' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-first-name">الاسم الأول</Label>
                    <Input
                      id="reg-first-name"
                      placeholder="مثال: عبدالرحمن"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-last-name">الاسم الأخير</Label>
                    <Input
                      id="reg-last-name"
                      placeholder="مثال: الراشد"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="reg-org-name">اسم المنظمة</Label>
                  <Input
                    id="reg-org-name"
                    placeholder="مثال: جمعية روافد الرقمية"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    className="pe-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-country" className="flex items-center gap-1.5 font-bold">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>الدولة / الإقامة</span>
                </Label>
                <div className="relative">
                  <select
                    id="reg-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer text-foreground font-medium shadow-2xs"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name} className="bg-background text-foreground py-1">
                        {c.flag} {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                  <div className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none text-xs text-muted-foreground">
                    ▼
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">رقم الجوال (اختياري)</Label>
                <div className="relative">
                  <Phone className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder={activeCountryObj.placeholder}
                    className="pe-9 font-mono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">كلمة المرور</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="٦ أحرف على الأقل"
                    className="pe-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs font-normal cursor-pointer leading-relaxed text-muted-foreground">
                  أوافق على{' '}
                  <span className="text-primary font-medium hover:underline">الشروط والأحكام</span>
                  {' '}و{' '}
                  <span className="text-primary font-medium hover:underline">سياسة الخصوصية</span>
                </Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  رجوع
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 font-bold gap-2 shadow-xs"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التسجيل...</span>
                    </>
                  ) : (
                    <span>إنشاء الحساب</span>
                  )}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            لديك حساب بالفعل؟{' '}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              سجّل دخولك الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

