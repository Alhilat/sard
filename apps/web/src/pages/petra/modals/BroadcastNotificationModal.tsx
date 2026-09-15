import React, { useState } from 'react';
import {
  Megaphone, Send, Bell, ExternalLink, X, Users, ShieldCheck, Building2, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  totalUsersCount: number;
  verifiedUsersCount: number;
  orgUsersCount: number;
  onClose: () => void;
  onSendBroadcast: (data: {
    title: string;
    content: string;
    link?: string;
    target?: 'all' | 'verified' | 'org' | 'individual';
  }) => Promise<boolean>;
}

export default function BroadcastNotificationModal({
  isOpen,
  totalUsersCount,
  verifiedUsersCount,
  orgUsersCount,
  onClose,
  onSendBroadcast,
}: BroadcastNotificationModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('/app/feed');
  const [target, setTarget] = useState<'all' | 'verified' | 'org' | 'individual'>('all');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const targetCount =
    target === 'all'
      ? totalUsersCount
      : target === 'verified'
      ? verifiedUsersCount
      : target === 'org'
      ? orgUsersCount
      : Math.max(0, totalUsersCount - orgUsersCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle) {
      toast({
        title: 'العنوان مطلوب',
        description: 'يرجى كتابة عنوان واضح للإشعار العام.',
        variant: 'destructive',
      });
      return;
    }

    if (!cleanContent) {
      toast({
        title: 'نص الرسالة مطلوب',
        description: 'يرجى كتابة محتوى الرسالة أو الإعلان.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    const success = await onSendBroadcast({
      title: cleanTitle,
      content: cleanContent,
      link: link.trim() || '/app/feed',
      target,
    });
    setIsSending(false);

    if (success) {
      setTitle('');
      setContent('');
      setLink('/app/feed');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
    >
      <div className="bg-[#140F1B] border border-[#30243C] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-start overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] border border-[#B33939]/40 flex items-center justify-center text-white shrink-0 shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                بث إشعار عام للمستخدمين
              </h3>
              <p className="text-xs text-[#9F8EAE] mt-0.5">
                سيصل هذا الإشعار مباشرة إلى جرس إشعارات المستخدمين وصندوق الوارد
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#9F8EAE] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Audience Pill Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#D1C7D9] block">
              الفئة المستهدفة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTarget('all')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer flex flex-col items-center gap-1 ${
                  target === 'all'
                    ? 'bg-[#9E2A2B] text-white border-[#B33939] shadow-sm'
                    : 'bg-[#1B1424] border-[#30243C] text-[#9F8EAE] hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>الكل ({totalUsersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setTarget('verified')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer flex flex-col items-center gap-1 ${
                  target === 'verified'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-[#1B1424] border-[#30243C] text-[#9F8EAE] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>الموثقين ({verifiedUsersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setTarget('org')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer flex flex-col items-center gap-1 ${
                  target === 'org'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                    : 'bg-[#1B1424] border-[#30243C] text-[#9F8EAE] hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>المنظمات ({orgUsersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setTarget('individual')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer flex flex-col items-center gap-1 ${
                  target === 'individual'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-[#1B1424] border-[#30243C] text-[#9F8EAE] hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>الأفراد ({Math.max(0, totalUsersCount - orgUsersCount)})</span>
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#D1C7D9] block">
              عنوان الإشعار:
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إعلان هام من إدارة منصة سرد رقمي 📢"
              required
              className="bg-[#1B1424] border-[#30243C] text-white text-xs h-10 rounded-xl"
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#D1C7D9] block">
              نص الرسالة / الإعلان:
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب نص الإشعار هنا، سيظهر في مركز إشعارات المستخدمين فوراً..."
              rows={3}
              required
              className="bg-[#1B1424] border-[#30243C] text-white text-xs rounded-xl resize-none leading-relaxed"
            />
          </div>

          {/* Action Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#D1C7D9] flex items-center justify-between">
              <span>رابط التوجيه عند الضغط (اختياري):</span>
              <span className="text-[10px] text-[#9F8EAE] font-mono">الافتراضي: /app/feed</span>
            </label>
            <div className="relative">
              <ExternalLink className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7999] pointer-events-none" />
              <Input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/articles أو /app/courses أو رابط خارجي"
                className="bg-[#1B1424] border-[#30243C] text-white pr-9 text-xs h-9 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#1B1424] border border-[#30243C] space-y-1.5">
            <span className="text-[10px] font-bold text-[#9F8EAE] block">
              معاينة حية لشكل الإشعار عند وصوله للمستخدم:
            </span>
            <div className="p-3 rounded-lg bg-[#140F1B] border border-[#261B2F] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-white block truncate">
                  {title || 'عنوان الإشعار العام'}
                </span>
                <p className="text-[11px] text-[#C5B7CF] line-clamp-2 leading-relaxed">
                  {content || 'هنا سيظهر نص الإشعار المرسل من قِبل إدارة المنصة...'}
                </p>
                <span className="text-[10px] text-[#8E7E9E] font-mono block pt-0.5">الآن</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <Button
              type="submit"
              disabled={isSending || !title.trim() || !content.trim()}
              className="flex-1 bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold h-10 rounded-xl gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSending
                  ? 'جارٍ بث الإشعار لجميع المستخدمين...'
                  : `إرسال الإشعار فوراً (${targetCount} مستخدم)`}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[#1B1424] border-[#30243C] text-[#DDD2E5] hover:bg-[#281D33] text-xs h-10 px-4 rounded-xl cursor-pointer"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
