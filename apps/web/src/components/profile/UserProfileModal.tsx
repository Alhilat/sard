import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  MapPin, Calendar, CheckCircle2, MessageSquare, UserPlus, UserCheck,
  ExternalLink, Loader2, Sparkles, X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { messagesService } from '@/services/messagesService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface UserProfileData {
  id: string;
  name: string;
  username: string;
  role?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  country?: string;
  joinDate?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  postsCount?: number;
  isFollowing?: boolean;
  isSelf?: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  username?: string | null;
  initialUser?: Partial<UserProfileData> | null;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  userId,
  username,
  initialUser,
}: UserProfileModalProps) {
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const identifier = userId || username;

  useEffect(() => {
    if (!isOpen || !identifier) {
      setProfile(null);
      return;
    }

    // Set optimistic/initial info if provided
    if (initialUser && initialUser.name) {
      setProfile({
        id: initialUser.id || identifier,
        name: initialUser.name,
        username: initialUser.username || 'user',
        role: initialUser.role || 'عضو',
        avatar: initialUser.avatar || '',
        bio: initialUser.bio || 'عضو في مجتمع سرد رقمي',
        location: initialUser.location || initialUser.country || 'الأردن',
        country: initialUser.country || 'الأردن',
        joinDate: initialUser.joinDate || '٢٠٢٦',
        verified: Boolean(initialUser.verified),
        followers: initialUser.followers || 0,
        following: initialUser.following || 0,
        postsCount: initialUser.postsCount || 0,
        isFollowing: initialUser.isFollowing || false,
        isSelf: currentUser?.id === (initialUser.id || identifier),
      });
    }

    let isMounted = true;
    setIsLoading(true);

    api.get<{ success?: boolean; user?: UserProfileData; data?: UserProfileData }>(`/users/${identifier}`)
      .then((res) => {
        if (!isMounted) return;
        const u = res?.user || res?.data || (res as any);
        if (u && u.id) {
          setProfile({
            ...u,
            location: u.country || u.location || 'الأردن',
            country: u.country || 'الأردن',
            isSelf: currentUser?.id === u.id,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load user profile in modal:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, identifier, initialUser, currentUser?.id]);

  if (!isOpen) return null;

  const displayName = profile?.name || initialUser?.name || 'مستخدم سرد';
  const displayUsername = profile?.username || initialUser?.username || 'user';
  const displayBio = profile?.bio || initialUser?.bio || 'عضو في مجتمع سرد رقمي للمبادرات والمحتوى المعرفي.';
  const displayLocation = profile?.country || profile?.location || initialUser?.country || initialUser?.location || 'الأردن';
  const displayJoinDate = profile?.joinDate || '٢٠٢٦';
  const isSelf = profile?.isSelf ?? (currentUser?.id === (profile?.id || identifier));
  const isOrg = profile?.role === 'org' || profile?.role === 'منظمة' || profile?.role === 'منظمة معتمدة';
  const isFollowing = Boolean(profile?.isFollowing);

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('') || 'س';

  // Handle start chat
  const handleStartChat = async () => {
    if (!profile?.id) return;
    setIsStartingChat(true);

    try {
      await messagesService.startConversation(profile.id);
      onClose();
      navigate(`/app/messages?user=${profile.id}`);
      toast({
        title: `محادثة فورية مع ${displayName}`,
        description: 'تم فتح المحادثة المباشرة بنجاح.',
      });
    } catch (err) {
      console.error('Error starting conversation:', err);
      onClose();
      navigate(`/app/messages?user=${profile.id}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  // Handle toggle follow
  const handleToggleFollow = async () => {
    if (!profile?.id || isSelf) return;
    setIsTogglingFollow(true);

    try {
      const res = await api.post<{ success: boolean; following: boolean }>(`/users/${profile.id}/follow`, {});
      const nowFollowing = res?.following ?? !isFollowing;

      setProfile((prev) => {
        if (!prev) return prev;
        const currentFollowers = prev.followers || 0;
        return {
          ...prev,
          isFollowing: nowFollowing,
          followers: nowFollowing ? currentFollowers + 1 : Math.max(0, currentFollowers - 1),
        };
      });

      toast({
        title: nowFollowing ? `تمت متابعة ${displayName}` : `ألغيت متابعة ${displayName}`,
        description: nowFollowing
          ? 'ستصلك منشورات وسردات هذا العضو في صفحة المتابعين.'
          : 'تم إلغاء متابعة الحساب.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر تعديل حالة المتابعة.',
      });
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleOpenFullProfile = () => {
    onClose();
    if (isSelf) {
      navigate('/app/profile');
    } else if (profile?.id) {
      navigate(`/app/profile/${profile.id}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-border bg-card shadow-2xl rounded-3xl"
        dir="rtl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>الملف الشخصي: {displayName}</DialogTitle>
          <DialogDescription>عرض النبذة ومعلومات المستخدم وبدء محادثة</DialogDescription>
        </DialogHeader>

        {/* Cover Banner */}
        <div
          className="h-28 sm:h-32 relative flex items-start justify-end p-3"
          style={{ background: 'linear-gradient(135deg, hsl(0,62%,16%), hsl(0,61%,28%), hsl(15,55%,32%))' }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer relative z-10"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar & Top Actions */}
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black border-4 border-card shadow-md shrink-0">
              {initials}
            </div>

            <div className="flex items-center gap-2">
              {!isSelf && (
                <Button
                  size="sm"
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={handleToggleFollow}
                  disabled={isTogglingFollow}
                  className="rounded-xl h-9 text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      <span>تتابع</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>متابعة</span>
                    </>
                  )}
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenFullProfile}
                className="rounded-xl h-9 text-xs font-bold gap-1 cursor-pointer"
                title="عرض الصفحة الكاملة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الصفحة الكاملة</span>
              </Button>
            </div>
          </div>

          {/* User Name & Badges */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-foreground">{displayName}</h2>
              {profile?.verified && (
                <span title="حساب موثق">
                  <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                </span>
              )}
              <Badge variant="outline" className="text-[10px] h-5 px-2 font-medium">
                {isOrg ? 'منظمة معتمدة' : 'عضو'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">@{displayUsername}</p>
          </div>

          {/* Bio */}
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-4 bg-muted/30 p-3 rounded-2xl border border-border/50">
            {displayBio}
          </p>

          {/* Meta Info (Location & Date) */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{displayLocation}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>عضو منذ {displayJoinDate}</span>
            </span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/60 text-center mb-4">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">المنشورات</p>
              <p className="text-sm font-black text-foreground">{profile?.postsCount ?? 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">المتابعون</p>
              <p className="text-sm font-black text-foreground">{profile?.followers ?? 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">يتابع</p>
              <p className="text-sm font-black text-foreground">{profile?.following ?? 0}</p>
            </div>
          </div>

          {/* Start Chat Button (Primary Action) */}
          {!isSelf ? (
            <Button
              onClick={handleStartChat}
              disabled={isStartingChat}
              className="w-full h-11 rounded-2xl font-bold gap-2 text-sm shadow-md cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground transition-transform active:scale-[0.98]"
            >
              {isStartingChat ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري فتح المحادثة...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>بدء محادثة مباشرة</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                onClose();
                navigate('/app/settings');
              }}
              variant="outline"
              className="w-full h-11 rounded-2xl font-bold text-sm cursor-pointer"
            >
              تعديل بيانات الملف الشخصي
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
