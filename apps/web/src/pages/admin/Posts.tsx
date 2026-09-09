import { useState } from 'react';
import { Search, Flag, Trash2, Eye, CheckCircle, MoreHorizontal } from 'lucide-react';
import { posts } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const adminCardStyle = { background: 'hsl(0,62%,10%)', border: '1px solid hsl(0,50%,15%)' };

export default function AdminPosts() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(posts.map(p => ({ ...p, flagged: false, approved: false })));

  const filtered = items.filter(p => p.content.includes(search) || p.author.name.includes(search));

  const remove = (id: string) => setItems(prev => prev.filter(p => p.id !== id));
  const flag = (id: string) => setItems(prev => prev.map(p => p.id === id ? { ...p, flagged: !p.flagged } : p));
  const approve = (id: string) => setItems(prev => prev.map(p => p.id === id ? { ...p, approved: true, flagged: false } : p));

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ color: 'hsl(33,40%,90%)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black">إدارة المنشورات</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(33,12%,50%)' }}>مراجعة وإدارة المنشورات على المنصة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'إجمالي المنشورات', value: items.length },
          { label: 'مُبلّغ عنها', value: items.filter(p => p.flagged).length, color: 'text-red-400' },
          { label: 'مراجَعة', value: items.filter(p => p.approved).length, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 text-center" style={adminCardStyle}>
            <p className={`text-2xl font-black ${stat.color || ''}`}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(33,12%,50%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={adminCardStyle}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(0,50%,15%)' }}>
          <h2 className="font-bold">المنشورات</h2>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4" style={{ color: 'hsl(33,10%,42%)' }} />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 h-8 text-sm w-52 border-0" style={{ background: 'hsl(0,50%,15%)', color: 'hsl(33,30%,80%)' }} />
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'hsl(0,50%,13%)' }}>
          {filtered.map(post => (
            <div key={post.id} className="p-5 hover:opacity-90 transition-opacity">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-sm">{post.author.name}</p>
                    <span className="text-xs" style={{ color: 'hsl(33,10%,42%)' }}>@{post.author.username}</span>
                    <span className="text-xs" style={{ color: 'hsl(33,10%,42%)' }}>·</span>
                    <span className="text-xs" style={{ color: 'hsl(33,10%,42%)' }}>{post.time}</span>
                    {post.flagged && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs gap-1"><Flag className="w-2.5 h-2.5" />مُبلّغ</Badge>}
                    {post.approved && <Badge className="bg-primary/20 text-amber-300 border-primary/30 text-xs">مراجَع</Badge>}
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'hsl(33,25%,72%)' }}>{post.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'hsl(33,12%,50%)' }}>
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                    <span>↗️ {post.shares}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0"><MoreHorizontal className="w-4 h-4" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Eye className="w-4 h-4" />عرض</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => approve(post.id)}><CheckCircle className="w-4 h-4 text-amber-300" />موافقة</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => flag(post.id)}><Flag className="w-4 h-4 text-amber-500" />{post.flagged ? 'إلغاء البلاغ' : 'تعليم كبلاغ'}</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-red-500" onClick={() => remove(post.id)}><Trash2 className="w-4 h-4" />حذف</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
