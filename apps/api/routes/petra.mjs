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

    const totalUsers = stmtCountAllUsers.get().c;
    const activeUsers = stmtCountActiveUsers.get().c;
    const bannedUsers = stmtCountBannedUsers.get().c;
    const totalPosts = stmtCountAllPosts.get().c;
    const totalComments = stmtCountAllComments.get().c;
    const totalGroups = stmtCountAllGroups.get().c;

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
             (SELECT COUNT(*) FROM comments WHERE author_id = u.id) as comments_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    res.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        verified: Boolean(u.verified),
        is_banned: Boolean(u.is_banned),
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
