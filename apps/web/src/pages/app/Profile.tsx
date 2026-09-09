import { useState, useEffect } from 'react';
import {
  MapPin, Calendar, BookOpen, Settings, Edit, CheckCircle2,
  Sparkles, Users, Award, MessageSquare, UserPlus, UserCheck, Loader2
} from 'lucide-react';
import { useRoute, useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { coursesService, Course } from '@/services/coursesService';
import { activitiesService, Activity } from '@/services/activitiesService';
import { messagesService } from '@/services/messagesService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const tabs = ['المنشورات', 'الأنشطة', 'الدورات'];

interface UserProfileDetails {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio?: string;
  location?: string;
  country?: string;
  joinDate?: string;
  role?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

interface PostItem {
  id: string;
  content: string;
  timestamp?: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

export default function Profile({ targetUserId }: { targetUserId?: string }) {
  const [matchRoute, routeParams] = useRoute('/app/profile/:id');
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const resolvedId = targetUserId || (matchRoute ? routeParams?.id : null);
  const isOtherUser = Boolean(resolvedId && resolvedId !== currentUser?.id);

  const [activeTab, setActiveTab] = useState('المنشورات');
  const [otherUser, setOtherUser] = useState<UserProfileDetails | null>(null);
  const [otherUserPosts, setOtherUserPosts] = useState<PostItem[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [userActivities, setUserActivities] = useState<Activity[]>([]);

  // Load activities & courses for current user
  useEffect(() => {
    if (!isOtherUser) {
      coursesService.getCourses().then((data) => {
        setUserCourses(data.filter((c) => c.enrolled));
      });
      activitiesService.getActivities().then((data) => {
        setUserActivities(data.filter((a) => a.isRegistered));
      });
    }
  }, [isOtherUser]);

  // Load other user's profile and posts if viewing someone else
  useEffect(() => {
    if (!isOtherUser || !resolvedId) {
      setOtherUser(null);
      setOtherUserPosts([]);
      return;
    }

    let isMounted = true;
    setIsLoadingProfile(true);

    api.get<{ success?: boolean; user?: UserProfileDetails; data?: UserProfileDetails }>(`/users/${resolvedId}`)
      .then((res) => {
        if (!isMounted) return;
        const u = res?.user || res?.data || (res as any);
        if (u && u.id) {
          setOtherUser(u);
        }
      })
      .catch((err) => {
        console.error('Failed to load profile for user:', resolvedId, err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    // Fetch user's posts
    api.get<PostItem[]>(`/users/${resolvedId}/posts`)
      .then((posts) => {
        if (!isMounted) return;
        if (Array.isArray(posts)) {
          setOtherUserPosts(posts);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOtherUser, resolvedId]);

  // Determine user data to display
  const activeUser = isOtherUser ? otherUser : currentUser;
  const name = activeUser?.name || 'مستخدم سرد';
  const username = activeUser?.username || (activeUser?.email ? activeUser.email.split('@')[0] : 'user');
  const bio = activeUser?.bio || (isOtherUser ? 'عضو في مجتمع سرد رقمي' : 'عضو في مجتمع سرد رقمي للتقنية والمبادرات المجتمعية');
  const location = activeUser?.country || activeUser?.location || 'الأردن';
  const joinDate = activeUser?.joinDate || '٢٠٢٦';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('') || 'س';
  const isOrg = activeUser?.role === 'org' || activeUser?.role === 'organization' || activeUser?.role === 'منظمة معتمدة';
  const verified = Boolean(activeUser?.verified);
  const isFollowing = Boolean(otherUser?.isFollowing);

  const followersCount = isOtherUser ? (otherUser?.followers || 0) : (currentUser?.followers || 0);
  const followingCount = isOtherUser ? (otherUser?.following || 0) : (currentUser?.following || 0);
  const postsCount = isOtherUser ? otherUserPosts.length : (currentUser?.postsCount || 0);

  // Start chat with user
  const handleStartChat = async () => {
    if (!otherUser?.id) return;
    setIsStartingChat(true);

    try {
      await messagesService.startConversation(otherUser.id);
      navigate(`/app/messages?user=${otherUser.id}`);
      toast({
        title: `محادثة فورية مع ${name}`,
        description: 'تم فتح نافذة المراسلة المباشرة.',
      });
    } catch (err) {
      console.error('Error starting conversation:', err);
      navigate(`/app/messages?user=${otherUser.id}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  // Follow / Unfollow user
  const handleToggleFollow = async () => {
    if (!otherUser?.id) return;
    setIsTogglingFollow(true);

    try {
      const res = await api.post<{ success: boolean; following: boolean }>(`/users/${otherUser.id}/follow`, {});
      const nowFollowing = res?.following ?? !isFollowing;

      setOtherUser((prev) => {
        if (!prev) return prev;
        const currentFollowers = prev.followers || 0;
        return {
          ...prev,
          isFollowing: nowFollowing,
          followers: nowFollowing ? currentFollowers + 1 : Math.max(0, currentFollowers - 1),
        };
      });

      toast({
        title: nowFollowing ? `تمت متابعة ${name}` : `ألغيت متابعة ${name}`,
        description: nowFollowing
          ? 'ستظهر سردات هذا الحساب في قائمة المتابعين لديك.'
          : 'تم إلغاء المتابعة بنجاح.',
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

  if (isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-bold text-muted-foreground">جاري تحميل الملف الشخصي...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" dir="rtl">
      {/* Profile Card Header */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs mb-6">
        {/* Cover */}
        <div
          className="h-36 sm:h-48 relative"
          style={{ background: 'linear-gradient(135deg, hsl(0,62%,16%), hsl(0,61%,28%), hsl(15,55%,32%))' }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-4 gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-black border-4 border-card shadow-md">
              {initials}
            </div>

            <div className="flex gap-2">
              {!isOtherUser ? (
                <Link href="/app/settings">
                  <Button variant="outline" size="sm" className="gap-2 font-bold rounded-xl cursor-pointer">
                    <Edit className="w-4 h-4" />
                    تعديل الملف الشخصي
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={handleToggleFollow}
                    disabled={isTogglingFollow}
                    className="gap-1.5 font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-primary" />
                        <span>تتابع</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>متابعة</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="gap-2 font-bold rounded-xl cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                  >
                    {isStartingChat ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    <span>بدء محادثة</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">{name}</h1>
              {verified && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
              <Badge variant="outline" className="text-[11px] h-5 px-2">
                {isOrg ? 'منظمة معتمدة' : 'حساب شخصي'}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-2.5 font-mono">@{username}</p>
            <p className="text-sm leading-relaxed mb-3 max-w-2xl text-foreground/90">{bio}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                عضو منذ {joinDate}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Clean Real Metrics */}
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="p-3 rounded-2xl bg-muted/40 text-center border border-border/50">
              <p className="font-bold text-xs text-muted-foreground mb-1">المنشورات</p>
              <p className="font-black text-xs sm:text-sm text-foreground">{postsCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 text-center border border-border/50">
              <p className="font-bold text-xs text-muted-foreground mb-1">المتابعون</p>
              <p className="font-black text-xs sm:text-sm text-foreground">{followersCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 text-center border border-border/50">
              <p className="font-bold text-xs text-muted-foreground mb-1">يتابع</p>
              <p className="font-black text-xs sm:text-sm text-foreground">{followingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'المنشورات' && (
          isOtherUser ? (
            otherUserPosts.length === 0 ? (
              <Card className="border-border text-center py-12 p-6 space-y-3 bg-card">
                <Sparkles className="w-10 h-10 mx-auto opacity-30 text-primary" />
                <p className="font-bold text-sm text-foreground">لا توجد منشورات لهذا المستخدم بعد</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  عندما يقوم {name} بنشر سردات ومشاركات جديدة ستظهر هنا مباشرة.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {otherUserPosts.map((post) => (
                  <Card key={post.id} className="border-border p-4 bg-card">
                    <p className="text-sm text-foreground leading-relaxed mb-2">{post.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <span>{post.timestamp || 'مؤخراً'}</span>
                      <div className="flex items-center gap-3">
                        <span>❤️ {post.likes || 0}</span>
                        <span>💬 {post.comments || 0}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <Card className="border-border">
              <CardContent className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-foreground">شارك أفكارك وتجاربك في مجتمع سرد</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  يمكنك كتابة سردات جديدة ونقاش المواضيع مع الآخرين عبر صفحة «سرد».
                </p>
                <Link href="/app/feed">
                  <Button size="sm" className="mt-2 font-bold gap-2 rounded-xl cursor-pointer">
                    الانتقال إلى ساحة سرد
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        )}

        {activeTab === 'الأنشطة' && (
          userActivities.length === 0 ? (
            <Card className="border-border text-center py-12 p-6 space-y-3 bg-card">
              <Calendar className="w-10 h-10 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-sm text-foreground">لم يتم تسجيل أي نشاط بعد</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                استكشف الأنشطة والفعاليات المتاحة في المنصة وسجّل مشاركتك.
              </p>
              {!isOtherUser && (
                <Link href="/app/activities">
                  <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl mt-2 cursor-pointer">
                    استكشاف الأنشطة
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {userActivities.map((activity) => (
                <Card key={activity.id} className="border-border">
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {activity.category || 'عام'}
                    </Badge>
                    <p className="font-bold text-sm mb-1">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.org?.name || activity.orgName || 'جهة منظمة'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.date} {activity.time ? `· ${activity.time}` : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {activeTab === 'الدورات' && (
          userCourses.length === 0 ? (
            <Card className="border-border text-center py-12 p-6 space-y-3 bg-card">
              <BookOpen className="w-10 h-10 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-sm text-foreground">لم يتم الانضمام إلى أي دورة تدريبية بعد</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                تصفح قائمة الدورات التخصصية المتاحة في أكاديمية سرد الرقمية وابدأ رحلتك.
              </p>
              {!isOtherUser && (
                <Link href="/app/courses">
                  <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl mt-2 cursor-pointer">
                    تصفح الدورات
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {userCourses.map((course) => (
                <Card key={course.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.category}
                      </Badge>
                      {course.progress === 100 && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                          مكتملة
                        </Badge>
                      )}
                    </div>
                    <p className="font-bold text-sm mb-1">{course.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{course.org?.name || 'أكاديمية سرد'}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{course.progress || 0}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
