import React, { useState } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import { PetraPost, PetraComment } from '@/services/petraService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PostsTabProps {
  posts: PetraPost[];
  comments: PetraComment[];
  onDeletePost: (postId: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export default function PostsTab({
  posts,
  comments,
  onDeletePost,
  onDeleteComment,
}: PostsTabProps) {
  const [contentSubTab, setContentSubTab] = useState<'posts' | 'comments'>('posts');
  const [postSearch, setPostSearch] = useState('');

  const filteredPosts = posts.filter((p) => {
    const q = postSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.content?.toLowerCase().includes(q) ||
      p.author_name?.toLowerCase().includes(q) ||
      p.author_username?.toLowerCase().includes(q)
    );
  });

  const filteredComments = comments.filter((c) => {
    const q = postSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.content?.toLowerCase().includes(q) ||
      c.author_name?.toLowerCase().includes(q) ||
      c.author_username?.toLowerCase().includes(q) ||
      c.post_content?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200" dir="rtl">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#140F1B] p-4 rounded-2xl border border-[#291F34]">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={contentSubTab === 'posts' ? 'default' : 'outline'}
            onClick={() => setContentSubTab('posts')}
            className={contentSubTab === 'posts' ? 'bg-[#9E2A2B] text-white text-xs cursor-pointer font-bold' : 'bg-[#1B1424] border-[#30243C] text-[#9F8EAE] hover:text-white text-xs cursor-pointer'}
          >
            المنشورات ({posts.length})
          </Button>
          <Button
            size="sm"
            variant={contentSubTab === 'comments' ? 'default' : 'outline'}
            onClick={() => setContentSubTab('comments')}
            className={contentSubTab === 'comments' ? 'bg-[#9E2A2B] text-white text-xs cursor-pointer font-bold' : 'bg-[#1B1424] border-[#30243C] text-[#9F8EAE] hover:text-white text-xs cursor-pointer'}
          >
            الردود والتعليقات ({comments.length})
          </Button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7999]" />
          <Input
            type="text"
            placeholder="بحث في محتوى المنشورات أو اسم الكاتب..."
            value={postSearch}
            onChange={(e) => setPostSearch(e.target.value)}
            className="bg-[#1B1424] border-[#30243C] text-white pr-10 pl-9 text-xs h-10 rounded-xl"
          />
          {postSearch && (
            <button
              onClick={() => setPostSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7999] hover:text-white p-1"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Posts Sub-Tab */}
      {contentSubTab === 'posts' && (
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-[#140F1B] rounded-2xl border border-[#291F34] text-[#9A8AA7] text-xs">
              لا توجد منشورات مطابقة للبحث
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-[#140F1B] border border-[#291F34] hover:border-[#47365C] rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6B1B1B] to-[#9E2A2B] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(post.author_name || 'م')[0]}
                    </div>
                    <span className="font-bold text-white text-sm">{post.author_name}</span>
                    <span className="text-xs text-[#9A8AA7] font-mono">@{post.author_username}</span>
                    <span className="text-xs text-[#7A6A87]">• {post.timestamp_text}</span>
                  </div>
                  <p className="text-xs text-[#DDD2E5] leading-relaxed whitespace-pre-line bg-[#1A1322] p-3 rounded-xl border border-[#2B2035]">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-[#A898B5] pt-1">
                    <span>❤️ {post.likes_count} إعجاب</span>
                    <span>💬 {post.comments_count} رد</span>
                    <span>🔁 {post.shares_count} مشاركة</span>
                    {post.group_id && (
                      <Badge className="bg-[#241A2D] text-[#D8B4FE] text-[10px]">
                        مجموعة: {post.group_id}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col justify-end items-end gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onDeletePost(post.id)}
                    className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-8 px-3 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                    حذف المنشور والردود
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Comments Sub-Tab */}
      {contentSubTab === 'comments' && (
        <div className="space-y-3">
          {filteredComments.length === 0 ? (
            <div className="text-center py-16 bg-[#140F1B] rounded-2xl border border-[#291F34] text-[#9A8AA7] text-xs">
              لا توجد ردود مطابقة للبحث
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-[#140F1B] border border-[#291F34] hover:border-[#47365C] rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#255447] to-[#347A67] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(comment.author_name || 'م')[0]}
                    </div>
                    <span className="font-bold text-white text-sm">{comment.author_name}</span>
                    <span className="text-xs text-[#9A8AA7] font-mono">@{comment.author_username}</span>
                    <span className="text-xs text-[#7A6A87]">• {comment.timestamp_text}</span>
                  </div>
                  <p className="text-xs text-[#DDD2E5] leading-relaxed bg-[#1A1322] p-3 rounded-xl border border-[#2B2035]">
                    {comment.content}
                  </p>
                  {comment.post_content && (
                    <div className="p-2.5 rounded-xl bg-[#1C1625] border border-[#32263D] text-[11px] text-[#A898B5]">
                      <span className="font-semibold text-[#C5B4D4]">رداً على المنشور: </span>
                      <span>"{comment.post_content.slice(0, 70)}..."</span>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col justify-end items-end gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onDeleteComment(comment.id)}
                    className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs h-8 px-3 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                    حذف الرد
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
