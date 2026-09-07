import { useState } from 'react';
import { Plus, MoreHorizontal, Heart, MessageCircle, Share2, Edit, Trash2, Eye } from 'lucide-react';
import { posts } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

const orgPosts = posts.filter(p => p.org);

export default function OrgPosts() {
  const [items, setItems] = useState(orgPosts);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');

  const remove = (id: string) => setItems(prev => prev.filter(p => p.id !== id));

  const publish = () => {
    if (!draft.trim()) return;
    setItems(prev => [{
      id: `p${Date.now()}`,
      author: { id: 'org1', name: 'منظمة رواد التطوع', avatar: '', username: 'rwad' },
      content: draft,
      image: '',
      likes: 0,
      comments: 0,
      shares: 0,
      time: 'الآن',
      liked: false,
      org: 'org',
    }, ...prev]);
    setDraft('');
    setCreating(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">المنشورات</h1>
          <p className="text-muted-foreground text-sm">إدارة منشورات المنظمة</p>
        </div>
        <Button className="gap-2" onClick={() => setCreating(!creating)}>
          <Plus className="w-4 h-4" />منشور جديد
        </Button>
      </div>

      {/* Create post */}
      {creating && (
        <Card className="border-card-border mb-6">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-3">منشور جديد</h3>
            <Textarea
              placeholder="اكتب محتوى منشورك هنا..."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="resize-none mb-3 min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setCreating(false)}>إلغاء</Button>
              <Button size="sm" onClick={publish} disabled={!draft.trim()}>نشر الآن</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي المنشورات', value: items.length },
          { label: 'إجمالي الإعجابات', value: items.reduce((s, p) => s + p.likes, 0).toLocaleString('ar') },
          { label: 'إجمالي التعليقات', value: items.reduce((s, p) => s + p.comments, 0).toLocaleString('ar') },
        ].map(stat => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Posts list */}
      <div className="space-y-4">
        {items.map(post => (
          <Card key={post.id} className="border-card-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-muted-foreground">{post.time}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-muted"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Eye className="w-4 h-4" />عرض</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2"><Edit className="w-4 h-4" />تعديل</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={() => remove(post.id)}>
                      <Trash2 className="w-4 h-4" />حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm leading-relaxed mb-4 line-clamp-3">{post.content}</p>
              <div className="flex items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes.toLocaleString('ar')}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.comments}</span>
                <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" />{post.shares}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
