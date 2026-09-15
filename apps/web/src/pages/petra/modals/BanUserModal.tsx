import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { PetraUser } from '@/services/petraService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BanUserModalProps {
  user: PetraUser | null;
  isOpen: boolean;
  isBanning: boolean;
  onClose: () => void;
  onConfirmBan: (userId: string, reason: string) => Promise<void>;
}

export default function BanUserModal({
  user,
  isOpen,
  isBanning,
  onClose,
  onConfirmBan,
}: BanUserModalProps) {
  const [reason, setReason] = useState('مخالفة معايير المجتمع وشروط النشر');

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    await onConfirmBan(user.id, reason.trim() || 'مخالفة معايير المجتمع وشروط النشر');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
    >
      <div className="bg-[#14101A] border border-[#3E2C4B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-start">
        <div className="flex items-center gap-3 text-red-400">
          <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-700/50 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">تأكيد حظر المستخدم</h3>
            <p className="text-xs text-[#A898B5]">سيتم منعه فوراً من النشر والتعليق وتسجيل الدخول</p>
          </div>
        </div>

        <div className="p-3 bg-[#1C1623] rounded-xl border border-[#362744] text-xs space-y-1.5">
          <p className="text-white">
            <span className="text-[#A898B5]">الاسم:</span>{' '}
            <span className="font-bold">{user.name}</span>
          </p>
          <p className="text-white">
            <span className="text-[#A898B5]">المعرف:</span>{' '}
            <span className="font-mono text-emerald-400">@{user.username}</span>
          </p>
          <p className="text-white font-mono text-[11px]">
            <span className="text-[#A898B5]">البريد:</span> {user.email}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#D0C2DD]">
            سبب الحظر (سيظهر للمستخدم عند محاولة الدخول):
          </label>
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-[#1C1623] border-[#362744] text-white text-xs h-9 rounded-xl focus-visible:ring-red-500/40"
            placeholder="اكتب سبب الحظر..."
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleConfirm}
            disabled={isBanning}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs font-bold h-9 rounded-xl cursor-pointer shadow-md"
          >
            {isBanning ? 'جارٍ الحظر...' : 'تأكيد الحظر الفوري'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isBanning}
            className="bg-[#1C1623] border-[#382B42] text-[#DDD2E5] hover:bg-[#2A1F33] text-xs h-9 rounded-xl cursor-pointer"
          >
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}
