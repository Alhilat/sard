import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Lock, LogIn, UserPlus } from 'lucide-react';

interface GuestAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionText?: string;
}

export default function GuestAuthModal({
  open,
  onOpenChange,
  actionText = 'للتفاعل مع المقال وإضافة تعليق',
}: GuestAuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border/80 shadow-2xl p-6 text-center rtl">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner">
          <LogIn className="w-7 h-7" />
        </div>

        <DialogHeader className="space-y-2 text-center">
          <DialogTitle className="text-xl font-black text-foreground tracking-tight">
            تسجيل الدخول للمتابعة
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {actionText}، يرجى تسجيل الدخول أو إنشاء حساب جديد مجاناً.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 border border-border/60 rounded-xl p-3 my-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-primary/70 shrink-0" />
          <span>تصفح وقراءة المقالات متاح مجاناً للجميع بدون حساب</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Link href="/auth/login">
            <Button variant="outline" className="w-full font-bold gap-2 cursor-pointer">
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-sm cursor-pointer">
              <UserPlus className="w-4 h-4" />
              حساب جديد
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
        >
          متابعة القراءة كزائر
        </button>
      </DialogContent>
    </Dialog>
  );
}
