import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { tokenStorage } from '@/lib/api';

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(() => {
    const saved = tokenStorage.getUser<any>();
    return saved?.email || '';
  });
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      toast({
        title: 'مرحباً بعودتك! 👋',
        description: 'تم تسجيل الدخول بنجاح.',
      });
      if (res.user?.role === 'org') {
        navigate('/org');
      } else {
        navigate('/app/feed');
      }
    } else {
      setErrorMessage(res.error || 'فشل تسجيل الدخول، يرجى التأكد من البيانات والمحاولة مجدداً.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* اللوحة الجانبية — هوية سرد رقمي */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, hsl(0,65%,8%), hsl(0,61%,18%), hsl(15,55%,22%))' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* حلقة منقطة — إيماءة لشعار سرد رقمي */}
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ border: '3px dashed hsl(33,60%,72%)' }} />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur border border-white/20">
              <span className="text-white font-bold text-xl font-display">س</span>
            </div>
            <span className="font-bold text-2xl text-white font-display">سرد رقمي</span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-4 leading-tight font-display">
            مرحباً بعودتك إلى
            <br />منصتك المجتمعية
          </h2>
          <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            ملتقى المبتكرين والمنظمات لبناء المحتوى والمجتمع الرقمي العربي معاً
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {['تواصل مع مجتمعك', 'اكتشف الأنشطة والدورات', 'تفاعل وشارك مع المنظمات'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2025 سرد رقمي</div>
      </div>

      {/* نموذج الدخول */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold font-display">س</span>
              </div>
              <span className="font-bold text-lg font-display">سرد رقمي</span>
            </Link>
            <h1 className="text-2xl font-black mb-2">تسجيل الدخول</h1>
            <p className="text-muted-foreground">أدخل بياناتك للوصول إلى حسابك</p>
          </div>



          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-center">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="اسم@مثال.com"
                  className="pe-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <a href="#" className="text-xs text-primary hover:underline">نسيت كلمة المرور؟</a>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pe-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">تذكّرني</Label>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11 font-semibold">
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              <ArrowLeft className="w-4 h-4 ms-2 rtl:rotate-180" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground px-2">أو</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full h-11 font-medium">
            <svg className="w-5 h-5 ms-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            متابعة مع Google
          </Button>

          {/* Quick Demo Accounts for Easy Testing */}
          <div className="mt-5 p-3.5 rounded-2xl bg-muted/50 border border-border/70 text-xs">
            <p className="font-bold text-foreground mb-2 flex items-center justify-between">
              <span>حسابات تجريبية جاهزة للاختبار:</span>
              <span className="text-[10px] text-muted-foreground font-normal">كلمة المرور: sard123456</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setEmail('sara@sard.sa'); setPassword('sard123456'); }}
                className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-foreground hover:border-primary/60 font-semibold cursor-pointer transition-colors"
              >
                👤 حساب فرد (سارة)
              </button>
              <button
                type="button"
                onClick={() => { setEmail('contact@rwad.org'); setPassword('sard123456'); }}
                className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-amber-600 dark:text-amber-400 hover:border-amber-500 font-semibold cursor-pointer transition-colors"
              >
                🏛️ حساب منظمة (رواد التطوع)
              </button>
              <Link
                href="/petra"
                className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-primary hover:border-primary font-semibold cursor-pointer transition-colors"
              >
                🛡️ بوابة بترا المركزية
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" className="text-primary font-semibold hover:underline">
              أنشئ حساباً مجانياً
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
