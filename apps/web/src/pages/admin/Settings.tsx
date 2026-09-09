import { useState } from 'react';
import { Save, Shield, Bell, Globe, Zap, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const adminCardStyle = { background: 'hsl(0,62%,10%)', border: '1px solid hsl(0,50%,15%)', color: 'hsl(33,40%,90%)' };

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 mb-5" style={adminCardStyle}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-amber-300" />
        <h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ color: 'hsl(33,40%,90%)' }}>
      <h1 className="text-2xl font-black mb-6">إعدادات المنصة</h1>

      <Section icon={Globe} title="الإعدادات العامة">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label style={{ color: 'hsl(33,18%,62%)' }}>اسم المنصة</Label>
            <Input defaultValue="سرد رقمي" className="border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,30%,80%)' }} />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: 'hsl(33,18%,62%)' }}>وصف المنصة</Label>
            <Input defaultValue="منصة المجتمع الرقمي العربية" className="border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,30%,80%)' }} />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: 'hsl(33,18%,62%)' }}>اللغة الافتراضية</Label>
            <Select defaultValue="ar">
              <SelectTrigger className="border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,30%,80%)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section icon={Shield} title="الأمان والوصول">
        <div className="space-y-4">
          {[
            { label: 'التحقق بخطوتين للمشرفين', desc: 'إلزامي لجميع المشرفين', checked: true },
            { label: 'تسجيل جلسات المشرفين', desc: 'تسجيل وتتبع جميع إجراءات المشرفين', checked: true },
            { label: 'منع التسجيل العام', desc: 'إيقاف تسجيل حسابات جديدة', checked: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs" style={{ color: 'hsl(33,12%,50%)' }}>{item.desc}</p>
              </div>
              <Switch defaultChecked={item.checked} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="إعدادات الإشعارات">
        <div className="space-y-4">
          {[
            { label: 'إشعارات المستخدمين الجدد', checked: true },
            { label: 'إشعارات طلبات التوثيق', checked: true },
            { label: 'إشعارات البلاغات الحرجة', checked: true },
            { label: 'تقرير يومي بالإحصائيات', checked: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <p className="text-sm">{item.label}</p>
              <Switch defaultChecked={item.checked} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Zap} title="ميزات المنصة">
        <div className="space-y-4">
          {[
            { label: 'تسجيل الأعضاء الجدد', desc: 'تمكين التسجيل المباشر للأفراد', checked: true },
            { label: 'التسجيل للمنظمات', desc: 'السماح بتسجيل منظمات جديدة', checked: true },
            { label: 'وضع الصيانة', desc: 'إيقاف المنصة مؤقتاً للصيانة', checked: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                {item.desc && <p className="text-xs" style={{ color: 'hsl(33,12%,50%)' }}>{item.desc}</p>}
              </div>
              <Switch defaultChecked={item.checked} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Database} title="قاعدة البيانات والبيانات">
        <div className="space-y-3">
          <Button variant="outline" className="w-full border-0 justify-start gap-2" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,20%,68%)' }}>
            <Database className="w-4 h-4" />
            تصدير النسخة الاحتياطية
          </Button>
          <Button variant="outline" className="w-full border-0 justify-start gap-2" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,20%,68%)' }}>
            إعادة تعيين الإحصائيات
          </Button>
        </div>
      </Section>

      <Button onClick={save} className="bg-primary hover:bg-primary/90 gap-2">
        <Save className="w-4 h-4" />
        {saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}
