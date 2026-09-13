import { Link } from 'wouter';
import {
  Users, Calendar, BookOpen, MessageSquare, Building2,
  ArrowLeft, CheckCircle2, Globe, Shield, Sparkles, Award,
  ChevronLeft, Compass, HeartHandshake, Laptop, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const platformPillars = [
  {
    icon: Sparkles,
    title: 'ساحة سرد التفاعلية',
    desc: 'فضاء حي لطرح الأفكار، تبادل التجارب، ومتابعة القضايا المجتمعية والمعرفية المتداولة لحظة بلحظة.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Calendar,
    title: 'الأنشطة والفعاليات الميدانية',
    desc: 'اكتشف المبادرات والفعاليات القريبة منك، سجّل حضورك فوراً، وشارك في غرف النقاش المباشرة مع المنظمين.',
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  {
    icon: BookOpen,
    title: 'الدورات والبرامج المعتمدة',
    desc: 'مسارات تعليمية وتدريبية متخصصة يشرف عليها مدربون معتمدون، مع شهادات إتمام موثقة ومجتمعات طلابية تفاعلية.',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  {
    icon: Building2,
    title: 'توثيق المنظمات والمؤسسات',
    desc: 'بيئة موثوقة تمنح المؤسسات والجمعيات الفاعلة هوية رقمية لإدارة الفعاليات وبناء جمهورها الحقيقي.',
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  },
  {
    icon: Users,
    title: 'المجتمعات التخصصية',
    desc: 'انضم إلى مجموعات معرفية متخصصة في التقنية، التطوع، ريادة الأعمال، والثقافة، وتحاور مع رواد مجالك.',
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  },
  {
    icon: Shield,
    title: 'أصالة وموثوقية رقمية',
    desc: 'تصميم يراعي الخصوصية التامة، الهوية العربية الأصيلة، والتأكد من موثوقية الهيئات والشهادات الصادرة.',
    color: 'bg-stone-500/10 text-stone-700 dark:text-stone-300',
  },
];

const ecosystemRoles = [
  {
    title: 'للأفراد والمبدعين',
    icon: UserCheck,
    desc: 'منصة واحدة تفتح لك آفاق التعلم المستمر، بناء شبكة علاقات مهنية، وحضور أبرز الفعاليات المجتمعية.',
    perks: ['متابعة الساحة العامة والتفاعل بحرية', 'التسجيل في الدورات والأنشطة وحجز المقاعد', 'غرف محادثة تفاعلية للمشاركين والطلاب', 'الحصول على شهادات إتمام معتمدة'],
  },
  {
    title: 'للمنظمات والمؤسسات',
    icon: Building2,
    desc: 'أدوات متطورة لإدارة الفعاليات والدورات التدريبية، وبناء مجتمع مخلص ومتفاعل حول أهداف المنظمة.',
    perks: ['شارة التوثيق الرسمي للمنظمة', 'إدارة تسجيلات الحضور والمشاركين بسهولة', 'قنوات إعلانية وغرف نقاش مخصصة لكل نشاط', 'تحليلات تفاعلية وإدارة طاقم العمل والصلاحيات'],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-lg font-display">س</span>
            </div>
            <span className="font-bold text-lg sm:text-xl font-display">سرد رقمي</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-muted-foreground">
            <a href="#about" className="hover:text-foreground transition-colors">عن المنصة</a>
            <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
            <a href="#ecosystem" className="hover:text-foreground transition-colors">منظومة سرد</a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-bold px-3 sm:px-4">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="text-xs sm:text-sm font-bold px-3 sm:px-4 shadow-xs">
                انضم إلينا
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(0, 65%, 8%) 0%, hsl(0, 61%, 18%) 50%, hsl(15, 55%, 22%) 100%)',
          }}
        />
        {/* Decorative Arabesque Orbs & Patterns */}
        <div
          className="absolute top-20 start-20 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(33,60%,72%), transparent)' }}
        />
        <div
          className="absolute bottom-10 end-32 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(20,72%,52%), transparent)' }}
        />
        <div
          className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full opacity-5 pointer-events-none"
          style={{ border: '2px dashed hsl(33,60%,72%)' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <Badge className="mb-6 bg-white/10 text-white border-white/20 text-xs sm:text-sm px-4 py-1.5 backdrop-blur-xs gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>منصة المجتمعات والتعليم المستمر</span>
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 font-display">
            البيئة الرقمية الموحدة
            <span className="block mt-2" style={{ color: 'hsl(33, 60%, 72%)' }}>
              للمعرفة والعمل المجتمعي
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            تجمع منصة «سرد رقمي» بين التفاعل المجتمعي الحي، تنظيم الأنشطة والفعاليات،
            والبرامج التدريبية المعتمدة في بيئة عربية رصينة وموثوقة.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-bold px-8 h-12 shadow-md">
                <span>إنشاء حساب كفرد</span>
                <ArrowLeft className="w-5 h-5 ms-2 rtl:rotate-180" />
              </Button>
            </Link>
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 h-12 px-8 font-bold">
                <Building2 className="w-4 h-4 ms-2" />
                <span>تسجيل منظمة أو جهة</span>
              </Button>
            </Link>
          </div>

          {/* Genuine Core Values */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {[
              { title: 'أصالة وهوية', desc: 'لغة وثقافة عربية رصينة' },
              { title: 'أنشطة حية', desc: 'حضور وتفاعل مجتمعي' },
              { title: 'برامج معتمدة', desc: 'دورات وشهادات تدريبية' },
              { title: 'منظمات موثقة', desc: 'بيئة رسمية آمنة' },
            ].map((pillar) => (
              <div key={pillar.title} className="text-center p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <p className="text-sm sm:text-base font-black text-white font-display">{pillar.title}</p>
                <p className="text-[11px] sm:text-xs text-white/70 mt-1">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Platform */}
      <section id="about" className="py-16 sm:py-20 bg-background border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <Badge variant="secondary" className="mb-2">عن سرد رقمي</Badge>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground">
            فضاء عربي متكامل لصناعة الأثر وبناء المعرفة
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            انطلقت «سرد رقمي» لتسد الفجوة بين المنصات الاجتماعية التقليدية والبيئات التعليمية والتطوعية.
            نهدف لتمكين الأفراد والمؤسسات من التعاون والمشاركة في فعاليات حقيقية، حضور ورش تدريبية،
            والانخراط في نقاشات فكرية متخصصة تثري المجتمع الرقمي العربي.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="secondary" className="mb-3">ركائز المنصة</Badge>
            <h2 className="text-2xl sm:text-4xl font-black font-display mb-3">
              كل ما تحتاجه للمشاركة والتطور في مكان واحد
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              أدوات تفاعلية صممت بدقة لتخدم رحلتك في التعلم، بناء المجتمعات، وتنظيم الفعاليات.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {platformPillars.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-card-border rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 shadow-2xs`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 font-display text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem: Individuals & Organizations */}
      <section id="ecosystem" className="py-16 sm:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">منظومة العمل</Badge>
            <h2 className="text-2xl sm:text-4xl font-black font-display mb-3">
              تكامل فعال بين الأفراد والمؤسسات
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              سواء كنت تبحث عن تنمية مهاراتك أو تسعى كمنظمة لتوسيع أثر برامجك، توفر المنصة الأدوات المثالية للطرفين.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {ecosystemRoles.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 space-y-5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <role.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-foreground">{role.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {role.desc}
                  </p>
                  <div className="space-y-2.5 pt-2">
                    {role.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <Link href="/auth/register">
                    <Button variant="outline" className="w-full font-bold text-xs sm:text-sm">
                      ابدأ الآن كـ {role.title.replace('لـ', '').replace('للـ', '')}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 sm:py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(0,65%,8%), hsl(0,61%,18%), hsl(15,55%,22%))',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white font-display leading-tight">
            انضم إلى مجتمع سرد رقمي
          </h2>
          <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            بيئة تفاعلية صممت لتلبي تطلعات الشباب والمؤسسات في الأردن والعالم العربي. أنشئ حسابك واكتشف الفرص المجتمعية والتعليمية المتاحة.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-bold px-8 h-12 shadow-md">
                إنشاء حساب مجاني
                <ArrowLeft className="w-4 h-4 ms-2 rtl:rotate-180" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 h-12 px-8 font-bold">
                تسجيل الدخول للمنصة
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-12 border-t border-sidebar-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-xs">
                  <span className="text-white font-bold font-display">س</span>
                </div>
                <span className="font-bold text-lg text-white font-display">سرد رقمي</span>
              </div>
              <p className="text-sidebar-foreground/60 text-xs sm:text-sm leading-relaxed">
                منصة المجتمعات والأنشطة والتعليم المستمر في العالم العربي.
              </p>
            </div>

            <div>
              <p className="font-bold text-white mb-3 text-xs sm:text-sm">أقسام المنصة</p>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/app/feed" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    ساحة سرد
                  </Link>
                </li>
                <li>
                  <Link href="/app/activities" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    الأنشطة والفعاليات
                  </Link>
                </li>
                <li>
                  <Link href="/app/courses" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    الدورات التدريبية
                  </Link>
                </li>
                <li>
                  <Link href="/app/groups" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    المجتمعات والمجموعات
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white mb-3 text-xs sm:text-sm">الحسابات والوصول</p>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/auth/login" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    تسجيل الدخول
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    إنشاء حساب جديد
                  </Link>
                </li>
                <li>
                  <Link href="/org" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    بوابة المنظمات الموثقة
                  </Link>
                </li>
                <li>
                  <Link href="/app/search" className="text-sidebar-foreground/60 hover:text-white transition-colors">
                    البحث الشامل
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white mb-3 text-xs sm:text-sm">الهوية والأمان</p>
              <p className="text-xs text-sidebar-foreground/60 leading-relaxed mb-3">
                جميع الحقوق محفوظة للمحتوى المعرفي والمؤسسي المنشور على منصة سرد رقمي.
              </p>
              <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
                <Globe className="w-3.5 h-3.5" />
                <span>اللغة العربية · الأردن والعالم العربي</span>
              </div>
            </div>
          </div>

          <div className="border-t border-sidebar-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-sidebar-foreground/50">
            <p>© 2026 سرد رقمي. جميع الحقوق محفوظة.</p>
            <p>منصة مجتمعية عربية متكاملة</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
