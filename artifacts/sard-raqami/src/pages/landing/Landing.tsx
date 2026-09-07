import { Link } from 'wouter';
import {
  Users, Calendar, BookOpen, MessageSquare, Building2,
  ArrowLeft, CheckCircle2, Star, Globe, Shield, Zap, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


const features = [
  {
    icon: Users,
    title: 'الشبكة الاجتماعية',
    desc: 'تواصل مع أفراد ومنظمات من مجتمعك، شارك أفكارك وتجاربك في تغذية اجتماعية غنية بالمحتوى.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Calendar,
    title: 'الأنشطة والفعاليات',
    desc: 'اكتشف مئات الأنشطة والفعاليات القريبة منك، سجّل واحجز مكانك بخطوات بسيطة.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: BookOpen,
    title: 'الدورات التدريبية',
    desc: 'طوّر مهاراتك من خلال دورات معتمدة يقدّمها خبراء ومنظمات رائدة في مختلف التخصصات.',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    icon: Building2,
    title: 'المنظمات الموثّقة',
    desc: 'منصة خاصة للمنظمات لإدارة أنشطتها، نشر محتواها، وبناء مجتمع متفاعل حول أهدافها.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: MessageSquare,
    title: 'المجتمعات والمجموعات',
    desc: 'انضم إلى مجموعات تتشارك اهتماماتك، ناقش وتعاون مع أعضاء من خلفيات متنوعة.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Shield,
    title: 'الأمان والموثوقية',
    desc: 'بيئة آمنة تضمن خصوصية بياناتك مع توثيق رسمي للمنظمات والشهادات المعتمدة.',
    color: 'bg-stone-100 text-stone-600',
  },
];

const steps = [
  { num: '١', title: 'أنشئ حسابك', desc: 'سجّل كفرد أو منظمة في دقائق معدودة' },
  { num: '٢', title: 'اكتشف وتواصل', desc: 'ابحث عن أنشطة ودورات ومنظمات تناسب اهتماماتك' },
  { num: '٣', title: 'شارك وأسهم', desc: 'شارك في الفعاليات، التعليم، والمجتمع' },
];

const testimonials = [
  {
    name: 'سارة الأحمد',
    role: 'معلمة ومدربة',
    text: 'سرد رقمي غيّر طريقة تواصلي مع المجتمع. وجدت فرصاً تطوعية وتدريبية لم أكن أعلم بوجودها!',
    rating: 5,
  },
  {
    name: 'محمد الفيصل',
    role: 'رائد أعمال',
    text: 'المنصة تجمع ما كنت أبحث عنه في عشر تطبيقات مختلفة. التصميم رائع والتجربة سلسة جداً.',
    rating: 5,
  },
  {
    name: 'منظمة رواد التطوع',
    role: 'منظمة مجتمعية',
    text: 'ضاعفت تفاعل جمهورنا ثلاثة أضعاف منذ انضمامنا للمنصة. أدوات الإدارة احترافية جداً.',
    rating: 5,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">س</span>
            </div>
            <span className="font-bold text-xl">سرد رقمي</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
            <a href="#how" className="hover:text-foreground transition-colors">كيف يعمل</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">آراء المستخدمين</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">تسجيل الدخول</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">ابدأ مجاناً</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, hsl(0, 65%, 8%) 0%, hsl(0, 61%, 18%) 50%, hsl(15, 55%, 22%) 100%)'
        }} />
        {/* Decorative orbs */}
        <div className="absolute top-20 start-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(33,60%,72%), transparent)' }} />
        <div className="absolute bottom-10 end-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(20,72%,52%), transparent)' }} />
        {/* Subtle dashed ring — إيماءة لحلقة اللوقو */}
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ border: '3px dashed hsl(33,60%,72%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
          <Badge className="mb-6 bg-white/10 text-white border-white/20 text-sm px-4 py-1.5">
            🚀 منصة المجتمع الرقمي العربية
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            منصة واحدة لكل
            <span className="block" style={{ color: 'hsl(33, 60%, 72%)' }}>
              تجربة مجتمعية
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            سرد رقمي تجمع الشبكة الاجتماعية، الأنشطة المجتمعية، والدورات التدريبية
            في منصة عربية واحدة سلسة ومتكاملة.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-12">
                إنشاء حساب جديد
                <ArrowLeft className="w-5 h-5 ms-2 rtl:rotate-180" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8 font-bold">
                تسجيل الدخول للمنصة
              </Button>
            </Link>
          </div>

          {/* Pillars - No Fake Numbers */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { title: 'أصالة عربية', desc: 'هوية وثقافة متجذرة' },
              { title: 'مجتمعات حية', desc: 'حوارات ونقاشات متخصصة' },
              { title: 'برامج معتمدة', desc: 'دورات وشهادات تدريبية' },
              { title: 'أمان وموثوقية', desc: 'خصوصية وأداء فائق السرعة' },
            ].map(pillar => (
              <div key={pillar.title} className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-lg font-black text-white">{pillar.title}</p>
                <p className="text-xs text-white/70 mt-1">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">المميزات</Badge>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              استمتع بتجربة رقمية متكاملة تجمع أفضل ما في منصات التواصل الاجتماعي، التعليم، والفعاليات
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-card border border-card-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">كيف يعمل</Badge>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">ابدأ في ثلاث خطوات</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.num} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 start-full w-full h-0.5 bg-border -translate-y-0.5 z-0" />
                )}
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">آراء المستخدمين</Badge>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">ماذا يقول مجتمعنا</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-card border border-card-border rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, hsl(0,65%,8%), hsl(0,61%,18%), hsl(15,55%,22%))' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            انضم إلى مجتمعنا اليوم
          </h2>
          <p className="text-white/70 text-lg mb-8">
            أكثر من 48,000 فرد ومنظمة يبنون المجتمع الرقمي العربي معاً
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-12">
                سجّل مجاناً كفرد
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12">
                سجّل منظمتك
              </Button>
            </Link>
          </div>
          <p className="text-white/40 text-sm mt-6">لا يلزم بطاقة ائتمانية • مجاني للأفراد</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-white font-bold">س</span>
                </div>
                <span className="font-bold text-white">سرد رقمي</span>
              </div>
              <p className="text-sidebar-foreground/50 text-sm leading-relaxed">
                منصة المجتمع الرقمي العربية الأولى
              </p>
            </div>
            {[
              { title: 'المنصة', links: ['الأنشطة', 'الدورات', 'المجموعات', 'المنظمات'] },
              { title: 'الشركة', links: ['من نحن', 'الوظائف', 'المدونة', 'الشراكات'] },
              { title: 'الدعم', links: ['مركز المساعدة', 'تواصل معنا', 'الخصوصية', 'الشروط'] },
            ].map(col => (
              <div key={col.title}>
                <p className="font-semibold text-white mb-3 text-sm">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sidebar-foreground/50 hover:text-sidebar-foreground text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-sidebar-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sidebar-foreground/40 text-sm">© 2025 سرد رقمي. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-4">
              <Globe className="w-4 h-4 text-sidebar-foreground/40" />
              <span className="text-sidebar-foreground/40 text-sm">العربية</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
