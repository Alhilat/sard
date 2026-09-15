import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmText = 'تأكيد العملية',
  cancelText = 'إلغاء',
  isDestructive = false,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
    >
      <div className="bg-[#14101A] border border-[#362744] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-start">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-900/30 border border-red-700/50 text-red-400'
                : 'bg-amber-900/30 border border-amber-700/50 text-amber-400'
            }`}
          >
            {isDestructive ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display leading-tight">{title}</h3>
            <p className="text-[11px] text-[#A898B5] mt-0.5">عملية إدارية في بوابة بترا</p>
          </div>
        </div>

        <p className="text-xs text-[#DDD2E5] leading-relaxed bg-[#1B1524] p-3.5 rounded-xl border border-[#2F213C]">
          {description}
        </p>

        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 text-xs font-bold h-9 rounded-xl cursor-pointer ${
              isDestructive
                ? 'bg-red-700 hover:bg-red-600 text-white shadow-md'
                : 'bg-primary hover:bg-primary/90 text-white shadow-md'
            }`}
          >
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#1C1623] border-[#382B42] text-[#DDD2E5] hover:bg-[#2A1F33] text-xs h-9 rounded-xl cursor-pointer"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
}
