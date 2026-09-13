import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { bannedUserIds } from '../services/cache.mjs';
import { createNotification, formatRelativeTime } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// List Posts (Feed)
router.get('/', authenticateToken, (req, res) => {
  try {
    const stmts = getStatements();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const groupId = req.query.group_id || req.query.groupId;

    const rows = groupId ? stmts.stmtGetGroupPosts.all(groupId, limit, offset) : stmts.stmtGetPosts.all(limit, offset);
    const currentUserId = req.user ? req.user.id : null;

    const posts = rows.map((r) => {
      let isLiked = false;
      if (currentUserId) {
        const likeRow = stmts.stmtGetLike.get(r.id, currentUserId);
        isLiked = Boolean(likeRow);
      }

      let tags = [];
      try {
        tags = JSON.parse(r.tags || '[]');
      } catch {
        tags = [];
      }

      return {
        id: r.id,
        author: {
          id: r.author_id,
          name: r.author_name,
          username: r.author_username,
          avatar: r.author_avatar || '',
          verified: Boolean(r.author_verified),
          role: r.author_role === 'org' ? 'منظمة معتمدة' : 'عضو',
        },
        content: r.content,
        likes: r.likes_count,
        comments: r.comments_count,
        shares: r.shares_count,
        timestamp: formatRelativeTime(r.created_at) || r.timestamp_text || 'الآن',
        isLiked,
        tags,
        groupId: r.group_id || undefined,
        createdAt: r.created_at,
      };
    });

    res.json({
      success: true,
      posts,
      data: posts,
      page,
      limit,
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب المنشورات' });
  }
});

// Create Post
router.post('/', authenticateToken, (req, res) => {
  try {
    const author = req.user;
    if (!author) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول لنشر محتوى' });
    }
    if (bannedUserIds.has(author.id)) {
      return res.status(403).json({ success: false, message: 'الحساب محظور من النشر' });
    }

    const { content, group_id, groupId, tags } = req.body;
    const cleanContent = (content || '').trim();
    if (!cleanContent) {
      return res.status(400).json({ success: false, message: 'لا يمكن نشر محتوى فارغ' });
    }

    const postId = `sard_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const targetGroupId = group_id || groupId || null;

    // Extract hashtags if not provided
    const hashtagRegex = /#([^\s#]+)/g;
    const matches = cleanContent.match(hashtagRegex);
    const resolvedTags = matches ? matches.map((m) => m.slice(1)) : (Array.isArray(tags) ? tags : ['سرد_رقمي']);

    const stmts = getStatements();
    stmts.stmtInsertPost.run({
      id: postId,
      author_id: author.id,
      content: cleanContent,
      tags: JSON.stringify(resolvedTags),
      group_id: targetGroupId,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: Date.now(),
      timestamp_text: 'الآن',
    });

    if (targetGroupId) {
      stmts.stmtIncrementGroupPosts.run(targetGroupId);
    }

    scheduleCloudSync();

    const createdPost = {
      id: postId,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        avatar: author.avatar || '',
        verified: Boolean(author.verified),
        role: author.role === 'org' ? 'منظمة معتمدة' : 'عضو',
      },
      content: cleanContent,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'الآن',
      isLiked: false,
      tags: resolvedTags,
      groupId: targetGroupId || undefined,
      createdAt: Date.now(),
    };

    res.status(201).json(createdPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ success: false, message: 'تعذر إنشاء المنشور' });
  }
});

// Delete Post
router.delete('/:id', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const stmts = getStatements();
    const postId = req.params.id;
    const post = stmts.stmtGetPostById.get(postId);
    if (!post) return res.status(404).json({ success: false, message: 'المنشور غير موجود' });
    if (post.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'org') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بحذف هذا المنشور' });
    }

    stmts.stmtDeletePost.run(postId);
    stmts.stmtDeletePostComments.run(postId);
    stmts.stmtDeletePostLikes.run(postId);

    if (post.group_id) {
      stmts.stmtDecrementGroupPosts.run(post.group_id);
    }

    scheduleCloudSync();
    res.json({ success: true, message: 'تم حذف المنشور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حذف المنشور' });
  }
});

// Like / Unlike Post
router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const postId = req.params.id;
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول للإعجاب' });
    }
    const userId = req.user.id;
    const stmts = getStatements();

    const post = stmts.stmtGetPostById.get(postId);
    const existing = stmts.stmtGetLike.get(postId, userId);
    let isLiked = false;

    if (existing) {
      stmts.stmtDeleteLike.run(postId, userId);
      stmts.stmtDecrementPostLikes.run(postId);
      isLiked = false;
    } else {
      stmts.stmtInsertLike.run(postId, userId, Date.now());
      stmts.stmtIncrementPostLikes.run(postId);
      isLiked = true;

      // Send notification to post author if not self
      if (post && post.author_id && post.author_id !== userId) {
        const snippet = post.content ? (post.content.length > 35 ? post.content.slice(0, 35) + '...' : post.content) : 'سردتك';
        createNotification({
          userId: post.author_id,
          actorId: userId,
          type: 'like',
          title: 'إعجاب جديد',
          content: `أعجب ${req.user.name} بسردتك: "${snippet}"`,
          link: '/app/feed',
        });
      }
    }

    scheduleCloudSync();

    const updatedPost = stmts.stmtGetPostLikesCount.get(postId);
    const likesCount = updatedPost ? updatedPost.likes_count : (isLiked ? 1 : 0);

    res.json({
      success: true,
      liked: isLiked,
      likes: likesCount,
      likes_count: likesCount,
      isLiked,
    });
  } catch (err) {
    console.error('Error liking post:', err);
    res.status(500).json({ success: false, message: 'تعذر تسجيل الإعجاب' });
  }
});

// Share Post
router.post('/:id/share', (_req, res) => {
  try {
    const postId = _req.params.id;
    const stmts = getStatements();
    stmts.stmtIncrementPostShares.run(postId);
    scheduleCloudSync();
    const updated = stmts.stmtGetPostSharesCount.get(postId);
    res.json({
      success: true,
      shares_count: updated ? updated.shares_count : 1,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر مشاركة المنشور' });
  }
});

// Get Comments
router.get('/:id/comments', (_req, res) => {
  try {
    const postId = _req.params.id;
    const stmts = getStatements();
    const rows = stmts.stmtGetComments.all(postId);

    const comments = rows.map((c) => ({
      id: c.id,
      author: {
        id: c.author_id,
        name: c.author_name || 'مستخدم سرد',
        username: c.author_username || 'user',
        avatar: c.author_avatar || '',
        verified: Boolean(c.author_verified),
      },
      content: c.content,
      created_at: c.timestamp_text || formatRelativeTime(c.created_at),
      likes_count: c.likes_count || 0,
      isLiked: false,
    }));

    res.json({
      success: true,
      comments,
      data: comments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب التعليقات' });
  }
});

// Add Comment
router.post('/:id/comments', authenticateToken, (req, res) => {
  try {
    const postId = req.params.id;
    const author = req.user;
    if (!author) {
      return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول للتعليق' });
    }
    if (bannedUserIds.has(author.id)) {
      return res.status(403).json({ success: false, message: 'الحساب محظور من التعليق' });
    }

    const { content } = req.body;
    const cleanContent = (content || '').trim();
    if (!cleanContent) {
      return res.status(400).json({ success: false, message: 'يرجى كتابة نص التعليق' });
    }

    const stmts = getStatements();
    const commentId = `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    stmts.stmtInsertComment.run({
      id: commentId,
      post_id: postId,
      author_id: author.id,
      content: cleanContent,
      likes_count: 0,
      created_at: Date.now(),
      timestamp_text: 'الآن',
    });

    stmts.stmtIncrementPostComments.run(postId);

    // Send notification to post author if not self
    const post = stmts.stmtGetPostById.get(postId);
    if (post && post.author_id && post.author_id !== author.id) {
      const snippet = cleanContent.length > 35 ? cleanContent.slice(0, 35) + '...' : cleanContent;
      createNotification({
        userId: post.author_id,
        actorId: author.id,
        type: 'comment',
        title: 'رد جديد على سردتك',
        content: `علق ${author.name}: "${snippet}"`,
        link: '/app/feed',
      });
    }

    scheduleCloudSync();

    const createdComment = {
      id: commentId,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        avatar: author.avatar || '',
        verified: Boolean(author.verified),
      },
      content: cleanContent,
      created_at: 'الآن',
      likes_count: 0,
      isLiked: false,
    };

    res.status(201).json({
      success: true,
      ...createdComment,
      comment: createdComment,
      data: createdComment,
    });
  } catch (err) {
    console.error('Error posting comment:', err);
    res.status(500).json({ success: false, message: 'تعذر إضافة التعليق' });
  }
});

export default router;
