import React, { useState } from 'react';
import { Shield, Lock, Users, Eye, EyeOff, AlertTriangle, ShieldCheck, KeyRound } from 'lucide-react';
import { petraService } from '@/services/petraService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PetraLoginProps {
  onLoginSuccess: () => void;
  envStatus: {
    envConfigured: boolean;
    envUser: string;
    hasEnvPass: boolean;
    renderDetected: boolean;
  } | null;
  currentUser: any;
  platformToken: string | null;
}

export default function PetraLogin({
  onLoginSuccess,
  envStatus,
  currentUser,
  platformToken,
}: PetraLoginProps) {
  const [loginUser, setLoginUser] = useState(envStatus?.envUser || 'petra');
  const [loginPass, setLoginPass] = useState('petra2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const isPlatformAdmin =
    Boolean(currentUser && platformToken) &&
    (currentUser.role === 'admin' ||
      currentUser.role === 'petra' ||
      currentUser.username === 'admin' ||
      currentUser.username === 'petra');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await petraService.login(loginUser.trim(), loginPass.trim());
      if (res.success) {
        onLoginSuccess();
      } else {
        setLoginError(res.message || 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setLoginError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePlatformAdminEntry = () => {
    if (platformToken) {
      sessionStorage.setItem('petra_auth_session_token', platformToken);
      localStorage.setItem('petra_auth_session_token', platformToken);
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A080E] text-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-[#130F17] border border-[#2B2034] rounded-2xl shadow-2xl p-7 space-y-6 text-start">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6B1B1B] via-[#8C2424] to-[#9E2A2B] flex items-center justify-center mx-auto shadow-md border border-[#B33939]/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display">بوابة الإدارة المركزية</h1>
            <p className="text-xs text-[#9E8FA9] mt-0.5">
              لوحة التحكم والرقابة التحريرية لمنصة سرد رقمي
            </p>
          </div>

          {envStatus?.renderDetected && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1625] border border-[#3E2E4E] text-[10px] text-[#D8B4FE]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>متغيرات البيئة السحابية نشطة</span>
            </div>
          )}
        </div>

        {/* Instant Entry for Logged In Admin */}
        {isPlatformAdmin && (
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                المشرف العام: {currentUser?.name}
              </span>
              <Badge className="bg-emerald-950 text-emerald-400 text-[10px] border-emerald-700/50">
                مالك المنصة
              </Badge>
            </div>
            <Button
              type="button"
              onClick={handlePlatformAdminEntry}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs h-8 font-bold rounded-lg cursor-pointer"
            >
              الدخول المباشر بحسابك الحالي
            </Button>
          </div>
        )}

        {loginError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#D1C7D9]">
              اسم مستخدم بترا
            </label>
            <div className="relative">
              <Users className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#7E6E8D] pointer-events-none" />
              <Input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="petra"
                required
                className="bg-[#18131E] border-[#2F223A] text-white pr-9 text-xs h-10 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#D1C7D9]">
              كلمة المرور الأمنية
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#7E6E8D] pointer-events-none" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-[#18131E] border-[#2F223A] text-white pr-9 pl-9 text-xs h-10 rounded-xl font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7E6E8D] hover:text-white cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold h-10 rounded-xl cursor-pointer shadow-md"
          >
            {isLoggingIn ? 'جارٍ التحقق...' : 'تسجيل الدخول إلى بترا'}
          </Button>
        </form>

        <div className="pt-2 border-t border-[#231A2B] text-center text-[11px] text-[#7E6E8D]">
          <span>بيانات الإشراف الافتراضية: </span>
          <span className="font-mono text-[#D8B4FE]">petra</span> / <span className="font-mono text-[#D8B4FE]">petra2026</span>
        </div>
      </div>
    </div>
  );
}
