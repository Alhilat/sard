import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { orgMembersService, OrgMember } from '@/services/orgMembersService';
import { UserPlus, Mail, Shield, CheckCircle2 } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberInvited: (member: OrgMember) => void;
}

export default function InviteMemberModal({ isOpen, onClose, onMemberInvited }: InviteMemberModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('عضو');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({
        variant: 'destructive',
        title: 'بيانات ناقصة',
        description: 'يرجى إدخال اسم العضو والبريد الإلكتروني.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await orgMembersService.inviteMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });

      if (res.success) {
        toast({
          title: 'تم إرسال الدعوة بنجاح! ✉️',
          description: `تمت دعوة ${name.trim()} للانضمام إلى فريق المنظمة كـ (${role}).`,
        });

        onMemberInvited({
          id: res.id || `mem_${Date.now()}`,
          org_id: 'current',
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          status: 'active',
          created_at: Date.now(),
        });

        setName('');
        setEmail('');
        setRole('عضو');
        onClose();
      } else {
        toast({
          variant: 'destructive',
          title: 'تعذر إرسال الدعوة',
          description: res.message || 'حدث خطأ أثناء إرسال الدعوة.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال الدعوة',
        description: err?.message || 'حدث خطأ غير متوقع.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 sm:p-7" dir="rtl">
        <DialogHeader className="text-right space-y-1.5">
          <DialogTitle className="text-xl font-black text-foreground font-display flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            دعوة عضو جديد للمنظمة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            أرسل دعوة رسمية للانضمام إلى طاقم العمل وتعيين الصلاحية المناسبة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <Label htmlFor="mem-name" className="text-xs font-bold text-foreground">
              الاسم الكامل *
            </Label>
            <Input
              id="mem-name"
              placeholder="مثال: م. سارة العلي"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm h-10 border-border"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mem-email" className="text-xs font-bold text-foreground">
              البريد الإلكتروني *
            </Label>
            <Input
              id="mem-email"
              type="email"
              placeholder="name@organization.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm h-10 border-border"
              dir="ltr"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">الدور والصلاحية</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="مدير">مدير (إدارة كاملة للأنشطة والدورات والفريق)</SelectItem>
                <SelectItem value="مشرف">مشرف (إدارة الأنشطة والرد على الاستفسارات)</SelectItem>
                <SelectItem value="عضو">عضو (مشارك في الفعاليات والتنظيم الداخلي)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-bold h-9 rounded-lg"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim()}
              className="text-xs font-bold h-9 rounded-lg gap-1.5 bg-primary text-primary-foreground"
            >
              {isSubmitting ? (
                <span>جارٍ الإرسال...</span>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>إرسال الدعوة</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
