import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { groupsService, Group, GroupMember } from '@/services/groupsService';
import { Post } from '@/services/postsService';
import { useAuth } from '@/contexts/AuthContext';
import GroupPostCard from './GroupPostCard';
import {
  Users, ArrowRight, Lock, Globe, MessageSquare, Plus,
  CheckCircle2, ShieldCheck, Calendar, Send, Sparkles,
  Award, HeartHandshake, Share2, Trash2
} from 'lucide-react';

interface GroupDetailViewProps {
  group: Group;
  onBack: () => void;
  onMembershipChanged?: (groupId: string, joined: boolean) => void;
  onGroupDeleted?: (groupId: string) => void;
}

export default function GroupDetailView({ group, onBack, onMembershipChanged, onGroupDeleted }: GroupDetailViewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentGroup, setCurrentGroup] = useState<Group>(group);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = Boolean(
    (currentGroup.creator_id && user?.id && currentGroup.creator_id === user.id) ||
    user?.role === 'admin'
  );

  const handleDeleteGroup = async () => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف مجتمع "${currentGroup.name}" نهائياً؟`)) {
      return;
    }
    setIsDeleting(true);
    const res = await groupsService.deleteGroup(currentGroup.id);
    setIsDeleting(false);
    if (res.success) {
      toast({
        title: 'تم حذف المجتمع بنجاح',
        description: `تم إزالة مجتمع "${currentGroup.name}" من المنصة.`,
      });
      onGroupDeleted?.(currentGroup.id);
      onBack();
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف المجتمع',
        description: res.message || 'حدث خطأ أثناء محاولة الحذف.',
      });
    }
  };

  // New post state
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Load group posts and members
  useEffect(() => {
    setIsLoadingPosts(true);
    Promise.all([
      groupsService.getGroupPosts(group.id),
      groupsService.getGroupMembers(group.id),
    ]).then(([fetchedPosts, fetchedMembers]) => {
      setPosts(fetchedPosts);
      setMembers(fetchedMembers);
      setIsLoadingPosts(false);
    });
  }, [group.id]);

  // Join / Leave membership toggle
  const handleToggleMembership = async () => {
    const nextState = !currentGroup.joined;
    setCurrentGroup((prev) => ({
      ...prev,
      joined: nextState,
      members: nextState ? prev.members + 1 : Math.max(1, prev.members - 1),
    }));

    onMembershipChanged?.(group.id, nextState);

    await groupsService.toggleMembership(group.id, !nextState);
    toast({
      title: nextState ? 'مرحباً بك في المجتمع!' : 'تمت مغادرة المجتمع',
      description: nextState
        ? `أنت الآن عضو معتمد في "${currentGroup.name}". يمكنك المشاركة والتفاعل بحرية.`
        : `تم إلغاء عضويتك في "${currentGroup.name}".`,
    });
  };

  // Submit in-group discussion post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newPostContent.trim();
    if (!content) return;

    if (!currentGroup.joined) {
      toast({
        variant: 'destructive',
        title: 'الانضمام مطلوب',
        description: 'يجب الانضمام إلى هذا المجتمع أولاً لتتمكن من طرح مواضيع ونقاشات جديدة.',
      });
      return;
    }

    setIsPosting(true);
    try {
      const created = await groupsService.createGroupPost(currentGroup.id, content);
      setPosts((prev) => [created, ...prev]);
      setNewPostContent('');
      setCurrentGroup((prev) => ({ ...prev, posts: prev.posts + 1 }));
      toast({
        title: 'تم نشر الموضوع بنجاح',
        description: 'موضوعك منشور الآن ويتاح لجميع أعضاء المجتمع التفاعل معه.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'تعذر النشر',
        description: 'حدث خطأ أثناء إرسال المنشور. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* Arabic Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span>العودة إلى دليل المجتمعات</span>
        </button>

        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5 font-medium">
          <span>المجتمعات</span>
          <span>/</span>
          <span className="text-foreground font-semibold">{currentGroup.name}</span>
        </div>
      </div>

      {/* Hero Header Card with Authentic Arabic Gradient & Pattern */}
      <Card className="border-card-border overflow-hidden shadow-sm bg-card">
        {/* Cover Background */}
        <div
          className={`h-36 sm:h-48 w-full relative bg-gradient-to-r ${
            currentGroup.coverGradient || 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]'
          }`}
        >
          {/* Subtle Arabesque lattice geometric motif */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1.5px, transparent 1.5px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Group Info & Actions */}
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-12 sm:-mt-16 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Group Monogram */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-card border-4 border-background shadow-md flex items-center justify-center text-primary font-black text-3xl sm:text-4xl font-display shrink-0">
                {currentGroup.name[0]}
              </div>

              {/* Title & Badges */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground font-display">
                    {currentGroup.name}
                  </h1>
                  {currentGroup.privacy === 'خاص' ? (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-600/30 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                      <Lock className="w-3 h-3" /> مجتمع خاص
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary bg-primary/10">
                      <Globe className="w-3 h-3" /> مجتمع عام
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs font-bold">
                    {currentGroup.category}
                  </Badge>
                </div>

                {currentGroup.tagline && (
                  <p className="text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed">
                    {currentGroup.tagline}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <strong className="text-foreground font-bold">
                      {members.length}
                    </strong>{' '}
                    أعضاء مسجلون
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <strong className="text-foreground font-bold">
                      {posts.length}
                    </strong>{' '}
                    موضوعات
                  </span>
                  {currentGroup.created_at && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        تأسس {currentGroup.created_at}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Membership & Admin Delete */}
            <div className="flex items-center gap-2 self-start md:self-end shrink-0 flex-wrap">
              {canManage && (
                <Button
                  onClick={handleDeleteGroup}
                  variant="outline"
                  disabled={isDeleting}
                  className="gap-1.5 font-bold px-3.5 h-10 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive shadow-2xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'جاري الحذف...' : 'حذف وإدارة المجتمع'}</span>
                </Button>
              )}

              <Button
                onClick={handleToggleMembership}
                variant={currentGroup.joined ? 'outline' : 'default'}
                className={`gap-2 font-bold px-5 h-10 shadow-xs ${
                  currentGroup.joined ? 'border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30' : ''
                }`}
              >
                {currentGroup.joined ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>أنت عضو بالمجتمع (مغادرة)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>انضم إلى المجتمع</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-4xl pt-2 border-t border-border/60">
            {currentGroup.description}
          </p>
        </CardContent>
      </Card>

      {/* Main Tabs (Arabic Styled) */}
      <Tabs defaultValue="discussions" className="space-y-5">
        <TabsList className="bg-muted/80 p-1 rounded-xl h-auto flex flex-wrap sm:inline-flex">
          <TabsTrigger value="discussions" className="gap-2 font-bold text-xs sm:text-sm py-2 px-4 rounded-lg data-[state=active]:shadow-xs">
            <MessageSquare className="w-4 h-4" />
            <span>الموضوعات والنقاشات ({posts.length.toLocaleString('ar-SA')})</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 font-bold text-xs sm:text-sm py-2 px-4 rounded-lg data-[state=active]:shadow-xs">
            <Users className="w-4 h-4" />
            <span>دليل الأعضاء ({members.length.toLocaleString('ar-SA')})</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2 font-bold text-xs sm:text-sm py-2 px-4 rounded-lg data-[state=active]:shadow-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>ميثاق وقواعد المجتمع</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Discussions & Topics */}
        <TabsContent value="discussions" className="space-y-4">
          {/* In-Group Discussion Creator Form */}
          <Card className="border-card-border/90 shadow-xs bg-card">
            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handleCreatePost} className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    {currentGroup.joined ? 'طرح موضوع أو فكرة جديدة' : 'الانضمام للمجتمع يتيح لك المشاركة'}
                  </span>
                </div>
                <Textarea
                  placeholder={
                    currentGroup.joined
                      ? `ما الذي ترغب في مشاركته أو مناقشته مع أعضاء "${currentGroup.name}" اليوم؟`
                      : 'انضم إلى المجتمع لتتمكن من كتابة ونشر مواضيع جديدة والتفاعل مع الأعضاء...'
                  }
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  disabled={!currentGroup.joined || isPosting}
                  className="text-xs sm:text-sm min-h-[90px] resize-none bg-background/60 border-border focus-visible:ring-primary leading-relaxed"
                />
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {currentGroup.joined
                      ? 'سيظهر موضوعك لجميع أعضاء المجتمع في خلاصة النقاشات'
                      : 'العضوية مطلوبة للمشاركة والتفاعل'}
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!currentGroup.joined || isPosting || !newPostContent.trim()}
                    className="gap-2 font-bold px-5 h-9 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                    <span>{isPosting ? 'جاري النشر...' : 'نشر الموضوع'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {isLoadingPosts ? (
            <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>جاري تحميل نقاشات وموضوعات المجتمع...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3">
              <MessageSquare className="w-12 h-12 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-foreground text-base">لا توجد مواضيع مطروحة بعد في هذا المجتمع</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                كن أول من يبادر بطرح فكرة ملهمة أو سؤال يفتح باب الحوار المثمر مع الأعضاء!
              </p>
            </Card>
          ) : (
            posts.map((post) => (
              <GroupPostCard key={post.id} post={post} groupName={currentGroup.name} />
            ))
          )}
        </TabsContent>

        {/* Tab 2: Members Directory */}
        <TabsContent value="members">
          <Card className="border-card-border p-5 sm:p-6 space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  أعضاء وقادة المجتمع ({members.length.toLocaleString('ar-SA')})
                </h3>
                <p className="text-xs text-muted-foreground">
                  قائمة بالمشرفين والأعضاء المساهمين في إثراء هذا المجتمع
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/70 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                      {m.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">@{m.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        m.role === 'مؤسس' || m.role === 'مشرف'
                          ? 'default'
                          : m.role === 'عضو متميز'
                          ? 'outline'
                          : 'secondary'
                      }
                      className={`text-[10px] h-5 px-2 ${
                        m.role === 'عضو متميز' ? 'border-primary/40 text-primary bg-primary/5' : ''
                      }`}
                    >
                      {m.role}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{m.joined_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: About & Community Rules */}
        <TabsContent value="about">
          <div className="grid md:grid-cols-3 gap-5">
            {/* Rules and Guidelines */}
            <div className="md:col-span-2 space-y-4">
              <Card className="border-card-border p-6 space-y-4 bg-card">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">
                    ميثاق وقواعد الحوار في المجتمع
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  يهدف هذا الميثاق إلى توفير بيئة حوارية معرفية آمنة ومحفزة للجميع، يُرجى الالتزام بالبنود التالية لضمان تجربة مميزة:
                </p>

                <ul className="space-y-3 pt-2">
                  {(currentGroup.rules || [
                    'الاحترام المتبادل بين جميع الأعضاء ومراعاة آداب الحوار والنقد البنّاء.',
                    'مشاركة المحتوى المرتبط بمجال واهتمامات المجتمع وتجنب الخروج عن السياق.',
                    'منع الإعلانات التجارية غير المرخصة والروابط العشوائية منعاً باتاً.',
                    'الحفاظ على الخصوصية وعدم نشر أي بيانات شخصية أو معلومات سرية.',
                  ]).map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm text-foreground/90"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {(idx + 1).toLocaleString('ar-SA')}
                      </span>
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Sidebar Community Summary */}
            <div className="space-y-4">
              <Card className="border-card-border p-5 space-y-4 bg-card">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  بطاقة تعريفية
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">التصنيف الرئيسي</span>
                    <span className="font-bold text-foreground">{currentGroup.category}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">الخصوصية</span>
                    <span className="font-bold text-foreground">
                      {currentGroup.privacy === 'خاص' ? 'خاصة (بدعوة)' : 'عامة (مفتوحة للجميع)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">الأعضاء المسجلون</span>
                    <span className="font-bold text-foreground">
                      {members.length} عضو
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">الموضوعات المطروحة</span>
                    <span className="font-bold text-foreground">
                      {posts.length} موضوع
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/80 space-y-1.5">
                  <p className="font-bold text-primary flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" />
                    <span>مجتمع متضامن</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    المجتمعات في سرد رقمي قائمة على التعلم المستمر والشراكة المعرفية المثمرة بين جميع الأعضاء.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
