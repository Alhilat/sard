import { Link } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center px-6">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-6xl font-black text-primary mb-3">٤٠٤</h1>
        <h2 className="text-2xl font-bold mb-3">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
        </p>
        <Link href="/">
          <Button className="px-8">العودة إلى الرئيسية</Button>
        </Link>
      </div>
    </div>
  );
}
