import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken, requireAuth } from '../middleware/auth.mjs';
import { bannedUserIds } from '../services/cache.mjs';
import { createNotification, formatRelativeTime } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

function slugify(title) {
  const clean = (title || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Date.now().toString(36);
  return clean ? `${clean.slice(0, 60)}-${suffix}` : `article-${suffix}`;
}

// 1. List Articles (Publicly accessible without login)
router.get('/', authenticateToken, (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const category = req.query.category && req.query.category !== 'all' ? req.query.category.trim() : null;
    const search = req.query.search ? req.query.search.trim() : null;
    const currentUserId = req.user ? req.user.id : null;
    const isMyOnly = req.query.my === 'true' && currentUserId;

    const db = req.app.locals.db;
    let query = `
      SELECT a.*,
             u.name as author_name,
             u.username as author_username,
             u.avatar as author_avatar,
             u.role as author_role,
             u.verified as author_verified
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Count total query
    let countQuery = `SELECT COUNT(*) as count FROM articles a WHERE 1=1`;
    const countParams = [];

    // Editorial status filtering:
    if (isMyOnly) {
      query += ' AND a.author_id = ?';
      params.push(currentUserId);
      countQuery += ' AND a.author_id = ?';
      countParams.push(currentUserId);
    } else {
      if (currentUserId) {
        query += " AND (a.status = 'approved' OR a.author_id = ?)";
        params.push(currentUserId);
        countQuery += " AND (a.status = 'approved' OR a.author_id = ?)";
        countParams.push(currentUserId);
      } else {
        query += " AND a.status = 'approved'";
        countQuery += " AND a.status = 'approved'";
      }
    }

    if (category) {
      query += ' AND a.category = ?';
      params.push(category);
      countQuery += ' AND a.category = ?';
      countParams.push(category);
    }

    if (search) {
      query += ' AND (LOWER(a.title) LIKE ? OR LOWER(a.content) LIKE ? OR LOWER(a.summary) LIKE ?)';
      const searchParam = `%${search.toLowerCase()}%`;
      params.push(searchParam, searchParam, searchParam);
      countQuery += ' AND (LOWER(a.title) LIKE ? OR LOWER(a.content) LIKE ? OR LOWER(a.summary) LIKE ?)';
      countParams.push(searchParam, searchParam, searchParam);
    }

    const totalRow = db.prepare(countQuery).get(...countParams);
    const total = totalRow ? totalRow.count : 0;

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params);

    let likedArticleIds = new Set();
    let bookmarkedArticleIds = new Set();

    if (currentUserId && rows.length > 0) {
      const articleIds = rows.map((r) => r.id);
      const placeholders = articleIds.map(() => '?').join(',');

      const likedRows = db.prepare(
        `SELECT article_id FROM article_likes WHERE user_id = ? AND article_id IN (${placeholders})`
      ).all(currentUserId, ...articleIds);
      likedArticleIds = new Set(likedRows.map((l) => l.article_id));

      const bookmarkedRows = db.prepare(
        `SELECT article_id FROM article_bookmarks WHERE user_id = ? AND article_id IN (${placeholders})`
      ).all(currentUserId, ...articleIds);
      bookmarkedArticleIds = new Set(bookmarkedRows.map((b) => b.article_id));
    }

    const articles = rows.map((r) => {
      let tags = [];
      try {
        tags = JSON.parse(r.tags || '[]');
      } catch {
        tags = [];
      }

      const contentLength = (r.content || '').length;
      const wordCount = (r.content || '').trim().split(/\s+/).filter(Boolean).length;

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        summary: r.summary || (r.content ? r.content.slice(0, 160) + '...' : ''),
        content: r.content,
        coverImage: r.cover_image || '',
        category: r.category || 'عام',
        tags,
        readTimeMinutes: r.read_time_minutes || Math.max(1, Math.ceil(wordCount / 160)),
        charCount: contentLength,
        wordCount,
        likesCount: r.likes_count || 0,
        viewsCount: r.views_count || 0,
        commentsCount: r.comments_count || 0,
        status: r.status || 'approved',
        adminNotes: r.admin_notes || '',
        reviewedAt: r.reviewed_at || null,
        isLiked: likedArticleIds.has(r.id),
        isBookmarked: bookmarkedArticleIds.has(r.id),
        author: {
          id: r.author_id,
          name: r.author_name || 'كاتب في سرد',
          username: r.author_username || 'writer',
          avatar: r.author_avatar || '',
          role: r.author_role === 'org' ? 'منظمة معتمدة' : 'كاتب',
          verified: Boolean(r.author_verified),
        },
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        timestamp: formatRelativeTime(r.created_at) || 'مؤخراً',
      };
    });

    res.json({
      success: true,
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب المقالات' });
  }
});

// 1.1 List All Dynamic Categories (Publicly accessible)
router.get('/categories', (req, res) => {
  try {
    const db = req.app.locals.db;
    const rows = db.prepare(`
      SELECT DISTINCT category 
      FROM articles 
      WHERE category IS NOT NULL 
        AND TRIM(category) != ''
        AND status = 'approved'
      ORDER BY category ASC
    `).all();
    const categories = rows.map((r) => r.category.trim()).filter(Boolean);
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Error fetching article categories:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب التصنيفات' });
  }
});

// 2. Get Single Article by ID or Slug (Publicly viewable without login)
router.get('/:idOrSlug', authenticateToken, (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const stmts = getStatements();

    let article = stmts.stmtGetArticleById.get(idOrSlug);
    if (!article) {
      article = stmts.stmtGetArticleBySlug.get(idOrSlug);
    }

    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال المطلوب غير موجود أو تم حذفه' });
    }

    const currentUserId = req.user ? req.user.id : null;
    const isAuthor = currentUserId && currentUserId === article.author_id;
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'petra');

    if (article.status !== 'approved' && !isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'هذا المقال قيد المراجعة والتدقيق التحريري من قبل الإدارة ولم يُنشر للعامة بعد.',
        status: article.status
      });
    }

    // Increment views count asynchronously if approved
    if (article.status === 'approved') {
      try {
        stmts.stmtIncrementArticleViews.run(article.id);
      } catch {}
    }

    let isLiked = false;
    let isBookmarked = false;

    if (currentUserId) {
      isLiked = Boolean(stmts.stmtGetArticleLike.get(article.id, currentUserId));
      isBookmarked = Boolean(stmts.stmtGetArticleBookmark.get(article.id, currentUserId));
    }

    let tags = [];
    try {
      tags = JSON.parse(article.tags || '[]');
    } catch {
      tags = [];
    }

    const contentLength = (article.content || '').length;
    const wordCount = (article.content || '').trim().split(/\s+/).filter(Boolean).length;

    res.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        coverImage: article.cover_image || '',
        category: article.category || 'عام',
        tags,
        readTimeMinutes: article.read_time_minutes || Math.max(1, Math.ceil(wordCount / 160)),
        charCount: contentLength,
        wordCount,
        likesCount: article.likes_count || 0,
        viewsCount: (article.views_count || 0) + 1,
        commentsCount: article.comments_count || 0,
        status: article.status || 'approved',
        adminNotes: article.admin_notes || '',
        reviewedAt: article.reviewed_at || null,
        isLiked,
        isBookmarked,
        author: {
          id: article.author_id,
          name: article.author_name || 'كاتب في سرد',
          username: article.author_username || 'writer',
          avatar: article.author_avatar || '',
          role: article.author_role === 'org' ? 'منظمة معتمدة' : 'كاتب',
          verified: Boolean(article.author_verified),
          bio: article.author_bio || '',
        },
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        timestamp: formatRelativeTime(article.created_at) || 'مؤخراً',
      }
    });
  } catch (err) {
    console.error('Error fetching article:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب تفاصيل المقال' });
  }
});

// 3. Create Article (Requires Authentication & MIN 500 CHARACTERS)
router.post('/', authenticateToken, requireAuth, (req, res) => {
  try {
    const author = req.user;
    if (bannedUserIds.has(author.id)) {
      return res.status(403).json({ success: false, message: 'الحساب محظور من النشر' });
    }

    const { title, content, summary, coverImage, cover_image, category, tags } = req.body;

    const cleanTitle = (title || '').trim();
    const cleanContent = (content || '').trim();

    if (!cleanTitle || cleanTitle.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'عنوان المقال مطلوب ويجب ألا يقل عن 5 أحرف'
      });
    }

    // STRICT MINIMUM 500 CHARACTERS REQUIREMENT
    if (cleanContent.length < 500) {
      return res.status(400).json({
        success: false,
        message: `يجب ألا يقل نص المقال عن 500 حرف لضمان جودة وعمق الطرح في سرد (العدد الحالي: ${cleanContent.length} حرفاً)`
      });
    }

    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 160));
    const now = Date.now();
    const articleId = `art_${now}_${Math.floor(Math.random() * 1000)}`;
    const articleSlug = slugify(cleanTitle);

    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map(t => String(t).replace(/^#/, '').trim()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      parsedTags = tags.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean);
    }

    const cleanSummary = (summary || '').trim() || cleanContent.slice(0, 180).trim() + '...';
    const finalCover = coverImage || cover_image || '';
    const finalCategory = (category || 'عام').trim();

    const finalStatus = author.role === 'admin' ? 'approved' : 'pending';

    const stmts = getStatements();
    stmts.stmtInsertArticle.run({
      id: articleId,
      title: cleanTitle,
      slug: articleSlug,
      content: cleanContent,
      summary: cleanSummary,
      cover_image: finalCover,
      author_id: author.id,
      category: finalCategory,
      tags: JSON.stringify(parsedTags),
      read_time_minutes: readTimeMinutes,
      likes_count: 0,
      views_count: 0,
      comments_count: 0,
      status: finalStatus,
      admin_notes: '',
      reviewed_at: finalStatus === 'approved' ? now : null,
      reviewed_by: finalStatus === 'approved' ? 'admin' : null,
      created_at: now,
      updated_at: now,
    });

    scheduleCloudSync();

    res.status(201).json({
      success: true,
      message: finalStatus === 'approved'
        ? 'تم نشر مقالك بنجاح وهو متاح للقراء الآن.'
        : 'تم إرسال مقالك بنجاح للمراجعة التحريرية من قبل الإدارة وسوف يظهر للعامة فور اعتماده.',
      article: {
        id: articleId,
        slug: articleSlug,
        title: cleanTitle,
        category: finalCategory,
        status: finalStatus,
        readTimeMinutes,
        charCount: cleanContent.length,
        wordCount,
      }
    });
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ success: false, message: 'تعذر نشر المقال، يرجى المحاولة لاحقاً' });
  }
});

// 3.1 Update Article (Author editing/resubmitting)
router.put('/:id', authenticateToken, requireAuth, (req, res) => {
  try {
    const articleId = req.params.id;
    const author = req.user;
    const stmts = getStatements();

    const article = stmts.stmtGetArticleById.get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    if (article.author_id !== author.id && author.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بتعديل هذا المقال' });
    }

    const { title, content, summary, coverImage, category, tags } = req.body;
    const cleanTitle = (title || article.title).trim();
    const cleanContent = (content || article.content).trim();

    if (cleanContent.length < 500) {
      return res.status(400).json({
        success: false,
        message: `يجب ألا يقل نص المقال عن 500 حرف (العدد الحالي: ${cleanContent.length} حرفاً)`
      });
    }

    let parsedTags = article.tags;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        parsedTags = JSON.stringify(tags.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean));
      } else if (typeof tags === 'string') {
        parsedTags = JSON.stringify(tags.split(/[\s,]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean));
      }
    }

    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 160));
    const now = Date.now();

    // If it was needs_revision or rejected, editing resubmits it as pending for review!
    const newStatus = article.status === 'needs_revision' || article.status === 'rejected' ? 'pending' : article.status;

    stmts.stmtUpdateArticle.run({
      id: articleId,
      title: cleanTitle,
      content: cleanContent,
      summary: (summary || cleanContent.slice(0, 180) + '...').trim(),
      cover_image: coverImage !== undefined ? coverImage : article.cover_image,
      category: (category || article.category || 'عام').trim(),
      tags: parsedTags,
      read_time_minutes: readTimeMinutes,
      status: newStatus,
      updated_at: now,
    });

    scheduleCloudSync();

    res.json({
      success: true,
      message: newStatus === 'pending'
        ? 'تم تحديث المقال وإعادة إرساله للمراجعة التحريرية بنجاح.'
        : 'تم حفظ التعديلات بنجاح',
      status: newStatus
    });
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ success: false, message: 'تعذر تحديث المقال' });
  }
});

// 4. Delete Article (Author or Admin)
router.delete('/:id', authenticateToken, requireAuth, (req, res) => {
  try {
    const articleId = req.params.id;
    const user = req.user;
    const stmts = getStatements();

    const article = stmts.stmtGetArticleById.get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    if (article.author_id !== user.id && user.role !== 'admin' && user.role !== 'petra_super') {
      return res.status(403).json({ success: false, message: 'لا تملك الصلاحية لحذف هذا المقال' });
    }

    stmts.stmtDeleteArticleComments.run(articleId);
    stmts.stmtDeleteArticleLikes.run(articleId);
    stmts.stmtDeleteArticleBookmarks.run(articleId);
    stmts.stmtDeleteArticle.run(articleId);

    scheduleCloudSync();
    res.json({ success: true, message: 'تم حذف المقال بنجاح' });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ success: false, message: 'تعذر حذف المقال' });
  }
});

// 5. Like / Unlike Article (Requires Auth)
router.post('/:id/like', authenticateToken, requireAuth, (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.user.id;
    const stmts = getStatements();

    const article = stmts.stmtGetArticleById.get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    const existing = stmts.stmtGetArticleLike.get(articleId, userId);
    let isLiked = false;

    if (existing) {
      stmts.stmtDeleteArticleLike.run(articleId, userId);
      stmts.stmtDecrementArticleLikes.run(articleId);
      isLiked = false;
    } else {
      stmts.stmtInsertArticleLike.run(articleId, userId, Date.now());
      stmts.stmtIncrementArticleLikes.run(articleId);
      isLiked = true;

      // Notify article author
      if (article.author_id && article.author_id !== userId) {
        createNotification({
          userId: article.author_id,
          actorId: userId,
          type: 'like',
          title: 'إعجاب بمقالك',
          content: `أعجب ${req.user.name} بمقالك: "${article.title}"`,
          link: `/app/articles?article=${article.id}`,
        });
      }
    }

    scheduleCloudSync();
    const updatedCount = stmts.stmtGetArticleLikesCount.get(articleId);
    const likesCount = updatedCount ? updatedCount.likes_count : (isLiked ? 1 : 0);

    res.json({
      success: true,
      isLiked,
      liked: isLiked,
      likesCount,
      likes_count: likesCount,
    });
  } catch (err) {
    console.error('Error liking article:', err);
    res.status(500).json({ success: false, message: 'تعذر تسجيل الإعجاب' });
  }
});

// 6. Bookmark / Unbookmark Article (Requires Auth)
router.post('/:id/bookmark', authenticateToken, requireAuth, (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.user.id;
    const stmts = getStatements();

    const article = stmts.stmtGetArticleById.get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    const existing = stmts.stmtGetArticleBookmark.get(articleId, userId);
    let isBookmarked = false;

    if (existing) {
      stmts.stmtDeleteArticleBookmark.run(articleId, userId);
      isBookmarked = false;
    } else {
      stmts.stmtInsertArticleBookmark.run(articleId, userId, Date.now());
      isBookmarked = true;
    }

    res.json({
      success: true,
      isBookmarked,
      bookmarked: isBookmarked,
      message: isBookmarked ? 'تمت إضافة المقال إلى المحفوظات' : 'تمت إزالة المقال من المحفوظات'
    });
  } catch (err) {
    console.error('Error bookmarking article:', err);
    res.status(500).json({ success: false, message: 'تعذر حفظ المقال' });
  }
});

// 7. Get Comments & Replies on Article (Publicly accessible without login)
router.get('/:id/comments', (_req, res) => {
  try {
    const articleId = _req.params.id;
    const stmts = getStatements();
    const rows = stmts.stmtGetArticleComments.all(articleId);

    const comments = rows.map((c) => ({
      id: c.id,
      articleId: c.article_id,
      parentId: c.parent_id || null,
      content: c.content,
      likesCount: c.likes_count || 0,
      createdAt: c.created_at,
      timestamp: formatRelativeTime(c.created_at) || 'مؤخراً',
      author: {
        id: c.author_id,
        name: c.author_name || 'قارئ سرد',
        username: c.author_username || 'reader',
        avatar: c.author_avatar || '',
        verified: Boolean(c.author_verified),
      },
    }));

    res.json({
      success: true,
      comments,
      total: comments.length,
    });
  } catch (err) {
    console.error('Error fetching article comments:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب ردود المقال' });
  }
});

// 8. Post Comment or Reply on Article (Requires Auth)
router.post('/:id/comments', authenticateToken, requireAuth, (req, res) => {
  try {
    const articleId = req.params.id;
    const author = req.user;

    if (bannedUserIds.has(author.id)) {
      return res.status(403).json({ success: false, message: 'الحساب محظور من التعليق' });
    }

    const { content, parentId, parent_id } = req.body;
    const targetParentId = parentId || parent_id || null;
    const cleanContent = (content || '').trim();

    if (!cleanContent) {
      return res.status(400).json({ success: false, message: 'نص التعليق مطلوب' });
    }

    const stmts = getStatements();
    const article = stmts.stmtGetArticleById.get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    const commentId = `artc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    stmts.stmtInsertArticleComment.run({
      id: commentId,
      article_id: articleId,
      parent_id: targetParentId,
      author_id: author.id,
      content: cleanContent,
      likes_count: 0,
      created_at: now,
    });

    stmts.stmtIncrementArticleComments.run(articleId);

    const snippet = cleanContent.length > 40 ? cleanContent.slice(0, 40) + '...' : cleanContent;

    // Notify parent comment author if reply
    if (targetParentId) {
      const parentComment = stmts.stmtGetArticleCommentById.get(targetParentId);
      if (parentComment && parentComment.author_id && parentComment.author_id !== author.id) {
        createNotification({
          userId: parentComment.author_id,
          actorId: author.id,
          type: 'comment',
          title: 'رد جديد على تعليقك',
          content: `رد ${author.name} على تعليقك في مقال "${article.title}": "${snippet}"`,
          link: `/app/articles?article=${articleId}`,
        });
      }
    }

    // Notify article author if not self
    if (article.author_id && article.author_id !== author.id) {
      createNotification({
        userId: article.author_id,
        actorId: author.id,
        type: 'comment',
        title: targetParentId ? 'نقاش جديد في مقالك' : 'تعليق جديد على مقالك',
        content: `علق ${author.name} على مقالك "${article.title}": "${snippet}"`,
        link: `/app/articles?article=${articleId}`,
      });
    }

    scheduleCloudSync();

    res.status(201).json({
      success: true,
      message: 'تمت إضافة ردك بنجاح',
      comment: {
        id: commentId,
        articleId,
        parentId: targetParentId,
        content: cleanContent,
        likesCount: 0,
        createdAt: now,
        timestamp: 'الآن',
        author: {
          id: author.id,
          name: author.name,
          username: author.username,
          avatar: author.avatar || '',
          verified: Boolean(author.verified),
        }
      }
    });
  } catch (err) {
    console.error('Error adding article comment:', err);
    res.status(500).json({ success: false, message: 'تعذر إضافة التعليق' });
  }
});

export default router;
