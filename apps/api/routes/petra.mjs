import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PETRA_USER, PETRA_PASS, getPetraEnvCredentials } from '../config/env.mjs';
import { getStatements } from '../db/statements/index.mjs';
import { authenticatePetra } from '../middleware/petra-auth.mjs';
import { authRateLimiter } from '../middleware/rate-limiter.mjs';
import { createPetraSession, revokePetraSession } from '../services/petra-sessions.mjs';
import { metrics, bannedUserIds } from '../services/cache.mjs';
import { createNotification } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// GET /api/petra/config-status (Public info for UI status badge)
router.get('/config-status', (req, res) => {
  const creds = getPetraEnvCredentials();
  res.json({
    success: true,
    envConfigured: creds.isFromEnv,
    envUser: creds.username,
    hasEnvPass: Boolean(creds.password),
    renderDetected: Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.NODE_ENV === 'production'),
  });
});

// POST /api/petra/login (with brute-force protection)
router.post('/login', authRateLimiter, async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = (username || '').trim();
  const cleanPassword = (password || '').trim();

  // Dynamically retrieve user and pass from environment variables (e.g. Render env vars)
  const envCreds = getPetraEnvCredentials();

  // 1. Direct Master Petra Administrative Credentials from Env Var
  if (cleanUsername === envCreds.username && cleanPassword === envCreds.password) {
    const sessionToken = createPetraSession(envCreds.username);
    const { stmtInsertAuditLog } = getStatements();
    stmtInsertAuditLog.run(
      `log_${Date.now()}`,
      envCreds.username,
      'تسجيل الدخول',
      'auth',
      'gate',
      'تسجيل دخول إداري ناجح إلى لوحة التحكم',
      Date.now()
    );
    return res.json({
      success: true,
      token: sessionToken,
      admin: 'إدارة النظام',
      authSource: 'env_var',
      timestamp: Date.now(),
    });
  }

  // 2. Also allow Platform Admin Accounts (e.g. email or username with admin role or owner aaa@g.com)
  try {
    const stmts = getStatements();
    const user = stmts.stmtFindUserByEmail.get(cleanUsername.toLowerCase()) || stmts.stmtFindUserByUsername.get(cleanUsername);
    if (user && (user.role === 'admin' || user.email === 'aaa@g.com')) {
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (isValid) {
        const sessionToken = createPetraSession(user.name);
        const { stmtInsertAuditLog } = getStatements();
        stmtInsertAuditLog.run(
          `log_${Date.now()}`,
          user.name,
          'تسجيل دخول مشرف',
          'auth',
          'gate',
          `تسجيل دخول المشرف (${user.name}) لبوابة بترا للتحكم المركزي`,
          Date.now()
        );
        return res.json({
          success: true,
          token: sessionToken,
          admin: user.name,
          timestamp: Date.now(),
        });
      }
    }
  } catch (err) {}

  res.status(401).json({
    success: false,
    message: 'اسم المستخدم أو كلمة المرور غير صحيحة لبوابة بترا',
  });
});

// POST /api/petra/logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    revokePetraSession(token);
  }
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح من بوابة بترا' });
});

// GET /api/petra/stats
router.get('/stats', authenticatePetra, (req, res) => {
  try {
    const {
      stmtCountAllUsers,
      stmtCountActiveUsers,
      stmtCountBannedUsers,
      stmtCountAllPosts,
      stmtCountAllComments,
      stmtCountAllGroups,
    } = getStatements();

    const db = req.app.locals.db;
    const totalUsers = stmtCountAllUsers.get().c;
    const activeUsers = stmtCountActiveUsers.get().c;
    const bannedUsers = stmtCountBannedUsers.get().c;
    const totalPosts = stmtCountAllPosts.get().c;
    const totalComments = stmtCountAllComments.get().c;
    const totalGroups = stmtCountAllGroups.get().c;
    const totalArticles = db.prepare('SELECT COUNT(*) as c FROM articles').get()?.c || 0;
    const totalArticleComments = db.prepare('SELECT COUNT(*) as c FROM article_comments').get()?.c || 0;

    const mem = process.memoryUsage();

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalPosts,
        totalComments,
        totalGroups,
        totalArticles,
        totalArticleComments,
        totalRequests: metrics.totalRequests,
        uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
        nodeVersion: process.version,
        platform: process.platform,
        memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        memoryHeapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        memoryRssMb: Math.round(mem.rss / 1024 / 1024),
        dbEngine: 'SQLite 3 (WAL)',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب إحصائيات بترا' });
  }
});

// GET /api/petra/users
router.get('/users', authenticatePetra, (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.username, u.role, u.verified, u.is_banned, u.ban_reason, u.join_date, u.created_at,
             (SELECT COUNT(*) FROM posts WHERE author_id = u.id) as posts_count,
             (SELECT COUNT(*) FROM comments WHERE author_id = u.id) as comments_count,
             (SELECT COUNT(*) FROM articles WHERE author_id = u.id) as articles_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    res.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        verified: Boolean(u.verified),
        is_banned: Boolean(u.is_banned),
        articles_count: u.articles_count || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب قائمة المستخدمين' });
  }
});

// POST /api/petra/users/:id/verify
router.post('/users/:id/verify', authenticatePetra, (req, res) => {
  try {
    const userId = req.params.id;
    const { stmtUpdateUserVerified, stmtFindUserById } = getStatements();
    stmtUpdateUserVerified.run(1, userId);
    const user = stmtFindUserById.get(userId);
    createNotification({
      userId,
      actorId: null,
      type: 'system',
      title: 'تهانينا! تم توثيق حسابك 🎉',
      content: 'تم توثيق حسابك رسمياً من قبل الإدارة. يمكنك الآن إنشاء وإدارة المجموعات، الدورات، والأنشطة بحرية كاملة.',
      link: '/app/profile',
    });
    scheduleCloudSync();
    res.json({ success: true, message: `تم توثيق حساب (${user ? user.name : userId}) بنجاح` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر توثيق الحساب' });
  }
});

// POST /api/petra/users/:id/unverify
router.post('/users/:id/unverify', authenticatePetra, (req, res) => {
  try {
    const userId = req.params.id;
    const { stmtUpdateUserVerified, stmtFindUserById } = getStatements();
    stmtUpdateUserVerified.run(0, userId);
    const user = stmtFindUserById.get(userId);
    scheduleCloudSync();
    res.json({ success: true, message: `تم إلغاء توثيق حساب (${user ? user.name : userId})` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر إلغاء التوثيق' });
  }
});

// POST /api/petra/users/:id/ban
router.post('/users/:id/ban', authenticatePetra, (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    const banReason = reason || 'مخالفة معايير المجتمع وشروط النشر';

    const { stmtUpdateUserBan, stmtFindUserById, stmtInsertAuditLog } = getStatements();
    stmtUpdateUserBan.run(1, banReason, userId);
    bannedUserIds.add(userId);

    const user = stmtFindUserById.get(userId);
    const adminActor = req.petraAdmin || PETRA_USER || 'admin';
    stmtInsertAuditLog.run(
      `log_${Date.now()}`,
      adminActor,
      'حظر مستخدم',
      'user',
      userId,
      `تم حظر المستخدم (${user ? user.name : userId}) بسبب: ${banReason}`,
      Date.now()
    );

    scheduleCloudSync();
    res.json({
      success: true,
      message: 'تم حظر الحساب بنجاح وتم إيقاف صلاحيات النشر والمشاركة فوراً',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حظر المستخدم' });
  }
});

// POST /api/petra/users/:id/unban
router.post('/users/:id/unban', authenticatePetra, (req, res) => {
  try {
    const userId = req.params.id;
    const { stmtUpdateUserBan, stmtFindUserById, stmtInsertAuditLog } = getStatements();
    stmtUpdateUserBan.run(0, '', userId);
    bannedUserIds.delete(userId);

    const user = stmtFindUserById.get(userId);
    const adminActor = req.petraAdmin || PETRA_USER || 'admin';
    stmtInsertAuditLog.run(
      `log_${Date.now()}`,
      adminActor,
      'إلغاء حظر مستخدم',
      'user',
      userId,
      `تم إلغاء حظر المستخدم (${user ? user.name : userId}) واستعادة حسابه`,
      Date.now()
    );

    scheduleCloudSync();
    res.json({
      success: true,
      message: 'تم إلغاء الحظر وتفعيل الحساب بنجاح',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر إلغاء حظر المستخدم' });
  }
});

// GET /api/petra/posts
router.get('/posts', authenticatePetra, (req, res) => {
  try {
    const db = req.app.locals.db;
    const posts = db.prepare(`
      SELECT p.*,
             COALESCE(u.name, 'مستخدم غير معروف') as author_name,
             COALESCE(u.username, 'unknown') as author_username,
             COALESCE(u.email, '') as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 200
    `).all();

    res.json({
      success: true,
      posts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب المنشورات' });
  }
});

// DELETE /api/petra/posts/:id
router.delete('/posts/:id', authenticatePetra, (req, res) => {
  try {
    const postId = req.params.id;
    const db = req.app.locals.db;
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'المنشور غير موجود أو تم حذفه مسبقاً' });
    }

    const { stmtDeletePost, stmtInsertAuditLog } = getStatements();
    stmtDeletePost.run(postId);
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM post_likes WHERE post_id = ?').run(postId);

    if (post.group_id) {
      db.prepare('UPDATE groups SET posts_count = MAX(0, posts_count - 1) WHERE id = ?').run(post.group_id);
    }

    const adminActor = req.petraAdmin || PETRA_USER || 'admin';
    stmtInsertAuditLog.run(
      `log_${Date.now()}`,
      adminActor,
      'حذف منشور',
      'post',
      postId,
      `تم حذف المنشور ومحتواه: "${post.content.slice(0, 40)}..." لكاتبه: ${post.author_id}`,
      Date.now()
    );

    scheduleCloudSync();
    res.json({
      success: true,
      message: 'تم حذف المنشور وجميع الردود التابعة له بنجاح',
    });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ success: false, message: 'تعذر حذف المنشور' });
  }
});

// GET /api/petra/comments
router.get('/comments', authenticatePetra, (req, res) => {
  try {
    const db = req.app.locals.db;
    const comments = db.prepare(`
      SELECT c.*,
             COALESCE(u.name, 'مستخدم غير معروف') as author_name,
             COALESCE(u.username, 'unknown') as author_username,
             COALESCE(p.content, '') as post_content
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN posts p ON c.post_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 200
    `).all();

    res.json({
      success: true,
      comments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب الردود' });
  }
});

// DELETE /api/petra/comments/:id
router.delete('/comments/:id', authenticatePetra, (req, res) => {
  try {
    const commentId = req.params.id;
    const { stmtGetCommentById, stmtDeleteComment, stmtDecrementPostComments, stmtInsertAuditLog } = getStatements();
    const comment = stmtGetCommentById.get(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'الرد غير موجود أو تم حذفه مسبقاً' });
    }

    stmtDeleteComment.run(commentId);
    stmtDecrementPostComments.run(comment.post_id);

    const adminActor = req.petraAdmin || PETRA_USER || 'admin';
    stmtInsertAuditLog.run(
      `log_${Date.now()}`,
      adminActor,
      'حذف رد',
      'comment',
      commentId,
      `تم حذف الرد: "${comment.content.slice(0, 40)}..."`,
      Date.now()
    );

    scheduleCloudSync();
    res.json({
      success: true,
      message: 'تم حذف الرد بنجاح',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حذف الرد' });
  }
});

// GET /api/petra/groups
router.get('/groups', authenticatePetra, (req, res) => {
  try {
    const db = req.app.locals.db;
    const groups = db.prepare(`
      SELECT g.*, u.name as creator_name
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      ORDER BY g.created_at DESC
    `).all();

    res.json({
      success: true,
      groups,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب المجموعات' });
  }
});

// DELETE /api/petra/groups/:id
router.delete('/groups/:id', authenticatePetra, (req, res) => {
  try {
    const groupId = req.params.id;
    const { stmtGetGroupById, stmtDeleteGroup, stmtDeleteGroupPosts, stmtDeleteGroupMembers, stmtInsertAuditLog } = getStatements();
    const group = stmtGetGroupById.get(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    }

    stmtDeleteGroup.run(groupId);
    stmtDeleteGroupPosts.run(groupId);
    stmtDeleteGroupMembers.run(groupId);

    const adminActor = req.petraAdmin || PETRA_USER || 'admin';
    stmtInsertAuditLog.run(
      `log_${Date.now()}`,
      adminActor,
      'حذف مجموعة',
      'group',
      groupId,
      `تم حذف المجموعة "${group.name}" وكافة عضوياتها ومنشوراتها`,
      Date.now()
    );

    scheduleCloudSync();
    res.json({
      success: true,
      message: `تم حذف مجموعة "${group.name}" بنجاح`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حذف المجموعة' });
  }
});

// GET /api/petra/articles
router.get('/articles', authenticatePetra, (req, res) => {
  try {
    const db = req.app.locals.db;
    const articles = db.prepare(`
      SELECT a.*,
             COALESCE(u.name, 'مستخدم غير معروف') as author_name,
             COALESCE(u.username, 'unknown') as author_username,
             COALESCE(u.email, '') as author_email
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 200
    `).all();

    res.json({
      success: true,
      articles: articles.map((art) => ({
        ...art,
        status: art.status || 'approved',
        admin_notes: art.admin_notes || '',
        reviewed_at: art.reviewed_at || null,
        reviewed_by: art.reviewed_by || null,
        char_count: art.char_count || (art.content ? art.content.length : 0),
        word_count: art.word_count || 0,
        read_time_minutes: art.read_time_minutes || 1,
        views_count: art.views_count || 0,
        likes_count: art.likes_count || 0,
        comments_count: art.comments_count || 0,
        timestamp_text: new Date(art.created_at).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      })),
    });
  } catch (err) {
    console.error('Error in petra get articles:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب المقالات' });
  }
});

// PATCH /api/petra/articles/:id/review (Accept, Edit this points, Refuse to post)
router.patch('/articles/:id/review', authenticatePetra, (req, res) => {
  try {
    const articleId = req.params.id;
    const { status, notes } = req.body;
    const db = req.app.locals.db;

    if (!['approved', 'needs_revision', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'الحالة غير صالحة. الحالات المقبولة: approved (قبول), needs_revision (تعديل نقاط), rejected (رفض النشر)'
      });
    }

    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود أو تم حذفه مسبقاً' });
    }

    const adminActor = req.petraAdmin || 'admin';
    const now = Date.now();
    const cleanNotes = (notes || '').trim();

    if ((status === 'needs_revision' || status === 'rejected') && !cleanNotes) {
      return res.status(400).json({
        success: false,
        message: status === 'needs_revision'
          ? 'يرجى كتابة النقاط المطلوب من الكاتب تعديلها.'
          : 'يرجى كتابة سبب رفض نشر المقال.'
      });
    }

    const { stmtUpdateArticleStatus, stmtInsertAuditLog } = getStatements();

    stmtUpdateArticleStatus.run({
      id: articleId,
      status,
      admin_notes: cleanNotes,
      reviewed_at: now,
      reviewed_by: adminActor,
      updated_at: now,
    });

    // In-app notification to author
    let notifTitle = '';
    let notifBody = '';
    let actionLabel = '';

    if (status === 'approved') {
      notifTitle = 'تهانينا! تم قبول ونشر مقالك 🎉';
      notifBody = `تمت مراجعة مقالك "${article.title}" والموافقة عليه وهو متاح للجميع الآن.`;
      actionLabel = 'قبول ونشر مقال';
    } else if (status === 'needs_revision') {
      notifTitle = 'ملاحظات تحريرية: مطلوب تعديل نقاط في المقال ✍️';
      notifBody = `مقالك "${article.title}" يحتاج إلى مراجعة بعض النقاط قبل النشر: "${cleanNotes}"`;
      actionLabel = 'طلب تعديل نقاط المقال';
    } else if (status === 'rejected') {
      notifTitle = 'إشعار حول مقالك ⚠️';
      notifBody = `نعتذر، تعذر نشر مقالك "${article.title}". السبب: "${cleanNotes}"`;
      actionLabel = 'رفض نشر مقال';
    }

    try {
      createNotification(db, {
        userId: article.author_id,
        type: 'article_review',
        title: notifTitle,
        content: notifBody,
        referenceId: article.slug || article.id,
        referenceType: 'article'
      });
    } catch (notifErr) {
      console.error('Failed to create author notification:', notifErr);
    }

    // Record in Petra audit logs
    stmtInsertAuditLog.run(
      `log_${now}`,
      adminActor,
      actionLabel,
      'article',
      articleId,
      `تم تغيير حالة المقال "${article.title}" إلى (${status}). ملاحظات: ${cleanNotes || 'لا توجد'}`,
      now
    );

    scheduleCloudSync();

    res.json({
      success: true,
      message: status === 'approved'
        ? 'تمت الموافقة على المقال ونشره بنجاح'
        : status === 'needs_revision'
        ? 'تم إرسال ملاحظات التعديل إلى الكاتب بنجاح'
        : 'تم رفض المقال وإشعار الكاتب بالسبب',
      status,
      adminNotes: cleanNotes,
      reviewedAt: now,
    });
  } catch (err) {
    console.error('Review article error:', err);
    res.status(500).json({ success: false, message: 'تعذر مراجعة وتحديث حالة المقال' });
  }
});

// DELETE /api/petra/articles/:id
router.delete('/articles/:id', authenticatePetra, (req, res) => {
  try {
    const articleId = req.params.id;
    const db = req.app.locals.db;
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);

    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود أو تم حذفه مسبقاً' });
    }

    const { stmtInsertAuditLog } = getStatements();
    db.prepare('DELETE FROM article_comments WHERE article_id = ?').run(articleId);
    db.prepare('DELETE FROM article_likes WHERE article_id = ?').run(articleId);
    db.prepare('DELETE FROM article_bookmarks WHERE article_id = ?').run(articleId);
    db.prepare('DELETE FROM articles WHERE id = ?').run(articleId);

    const adminActor = req.petraAdmin || PETRA_USER || 'admin';
    stmtInsertAuditLog.run(
      `log_${Date.now()}`,
      adminActor,
      'حذف مقال',
      'article',
      articleId,
      `تم حذف المقال: "${article.title}" لكاتبه: ${article.author_id}`,
      Date.now()
    );

    scheduleCloudSync();
    res.json({
      success: true,
      message: `تم حذف مقال "${article.title}" وجميع ملحقاته بنجاح`,
    });
  } catch (err) {
    console.error('Delete article error:', err);
    res.status(500).json({ success: false, message: 'تعذر حذف المقال' });
  }
});

// GET /api/petra/logs
router.get('/logs', authenticatePetra, (req, res) => {
  try {
    const { stmtGetAuditLogs } = getStatements();
    const logs = stmtGetAuditLogs.all();
    res.json({
      success: true,
      logs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب سجل العمليات' });
  }
});

export default router;
