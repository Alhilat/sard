import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Heart, MessageCircle, Share2, Edit, Trash2, Eye, FileText, Send } from 'lucide-react';
import { postsService, Post } from '@/services/postsService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/layouts/AppLayout';

export default function OrgPosts() {
  const { toast } = useToast();
  const [items, setItems] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const allPosts = await postsService.getPosts();
      setItems(allPosts);
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر تحميل المنشورات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleRemove = async (postId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      return;
    }
    const res = await postsService.deletePost(postId);
    if (res.success) {
      setItems((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: 'تم حذف المنشور بنجاح 🗑️',
        description: 'تم إزالة المنشور من التغذية العامة.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف المنشور',
        description: res.message || 'حدث خطأ أثناء الحذف.',
      });
    }
  };

  const publish = async () => {
    if (!draft.trim()) return;
    setIsPublishing(true);
    try {
      const created = await postsService.createPost({
        content: draft.trim(),
      });
      setItems((prev) => [created, ...prev]);
      setDraft('');
      setCreating(false);
      toast({
        title: 'تم نشر التدوينة بنجاح! ✨',
        description: 'أصبح منشورك متاحاً لجميع أعضاء ومتابعي سرد.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ في النشر',
        description: 'تعذر نشر التدوينة حالياً، يرجى إعادة المحاولة.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const totalLikes = items.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = items.reduce((s, p) => s + (p.comments || 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">المنشورات</h1>
          <p className="text-muted-foreground text-sm">إدارة المحتوى والتدوينات الرسمية للمنظمة</p>
        </div>
        <Button
          className="gap-2 bg-primary text-primary-foreground font-bold rounded-xl"
          onClick={() => setCreating(!creating)}
        >
          <Plus className="w-4 h-4" />
          منشور جديد
        </Button>
      </div>

      {/* Create post form */}
      {creating && (
        <Card className="border-card-border mb-6">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-3">كتابة منشور أو إعلان رسمي جديد</h3>
            <Textarea
              placeholder="اكتب محتوى منشور المنظمة هنا مع الوسوم المناسبة مثل #سرد_رقمي..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="resize-none mb-3 min-h-[100px] border-border"
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setCreating(false)} disabled={isPublishing}>
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={publish}
                disabled={!draft.trim() || isPublishing}
                className="gap-1.5 bg-primary text-primary-foreground font-bold"
              >
                {isPublishing ? (
                  <span>جارٍ النشر...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>نشر الآن</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي المنشورات', value: items.length },
          { label: 'إجمالي التفاعلات', value: totalLikes.toLocaleString('ar') },
          { label: 'إجمالي التعليقات', value: totalComments.toLocaleString('ar') },
        ].map((stat) => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">جارٍ تحميل المنشورات...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="border-card-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-base font-bold text-foreground">لا توجد منشورات للمنظمة بعد</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            شارك أول تدوينة أو إعلان للتعريف بأنشطة ورؤية منظمتك.
          </p>
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            إنشاء أول منشور
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((post) => (
            <Card key={post.id} className="border-card-border hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={post.author?.name || 'منظمة'} size="sm" />
                    <div>
                      <p className="font-bold text-sm">{post.author?.name || 'منظمة سرد'}</p>
                      <span className="text-xs text-muted-foreground">{post.timestamp || 'الآن'}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer"
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.origin + '/app/feed');
                          toast({ title: 'تم نسخ الرابط! 📋', description: 'تم نسخ رابط المنشور إلى الحافظة.' });
                        }}
                      >
                        <Share2 className="w-4 h-4" />مشاركة الرابط
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive cursor-pointer"
                        onClick={() => handleRemove(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm sm:text-base leading-relaxed mb-3.5 whitespace-pre-wrap">
                  {post.content}
                </p>
                <div className="flex items-center gap-6 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500" />
                    {post.likes || 0} إعجاب
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    {post.comments || 0} تعليق
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
