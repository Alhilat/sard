import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { formatUserResponse } from '../services/user-service.mjs';
import { createNotification, formatRelativeTime } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  }
  res.json(formatUserResponse(req.user));
});

// Update Current User Profile
router.patch('/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  }
  const stmts = getStatements();
  const { name, username, bio, phone, location, country, avatar } = req.body;
  const updatedName = name !== undefined ? name.trim() : req.user.name;

  let updatedUsername = req.user.username;
  if (username !== undefined && username.trim() && username.trim() !== req.user.username) {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_.]/g, '');
    const existing = stmts.stmtFindUserByUsername.get(cleanUsername);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ success: false, message: 'اسم المستخدم محجوز مسبقاً' });
    }
    updatedUsername = cleanUsername;
  }

  const updatedBio = bio !== undefined ? bio.trim() : req.user.bio;
  const updatedPhone = phone !== undefined ? phone.trim() : req.user.phone;
  const updatedCountry = country !== undefined ? country.trim() : req.user.country;
  const updatedLocation = location !== undefined ? location.trim() : (country !== undefined ? country.trim() : req.user.location);
  const updatedAvatar = avatar !== undefined ? avatar.trim() : req.user.avatar;

  const db = req.app.locals.db;
  db.prepare(`
    UPDATE users
    SET name = ?, username = ?, bio = ?, phone = ?, location = ?, country = ?, avatar = ?
    WHERE id = ?
  `).run(updatedName, updatedUsername, updatedBio, updatedPhone, updatedLocation, updatedCountry, updatedAvatar, req.user.id);

  const updatedUser = stmts.stmtFindUserById.get(req.user.id);
  res.json(formatUserResponse(updatedUser));
});

// User Suggestions
router.get('/suggestions', authenticateToken, (req, res) => {
  const stmts = getStatements();
  const currentUserId = req.user ? req.user.id : '';
  const rows = stmts.stmtGetSuggestions.all(currentUserId);

  let followingSet = new Set();
  if (currentUserId && rows.length > 0) {
    const userIds = rows.map((u) => u.id);
    const placeholders = userIds.map(() => '?').join(',');
    const db = req.app.locals.db;
    if (db) {
      const followRows = db.prepare(
        `SELECT following_id FROM user_follows WHERE follower_id = ? AND following_id IN (${placeholders})`
      ).all(currentUserId, ...userIds);
      followingSet = new Set(followRows.map((f) => f.following_id));
    }
  }

  const suggestions = rows.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    avatar: u.avatar || '',
    verified: Boolean(u.verified),
    role: u.role === 'org' ? 'منظمة معتمدة' : (u.bio || 'عضو في مجتمع سرد'),
    isFollowing: followingSet.has(u.id),
  }));

  res.json(suggestions);
});

// Search & List Users
router.get('/', (req, res) => {
  try {
    const stmts = getStatements();
    const q = req.query.q ? req.query.q.trim() : '';
    let users;
    if (q) {
      const searchParam = `%${q}%`;
      users = stmts.stmtSearchUsers.all(searchParam, searchParam);
    } else {
      users = stmts.stmtGetAllUsers.all();
    }
    res.json(users.map(formatUserResponse));
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب المستخدمين' });
  }
});

// Follow / Unfollow User
router.post('/:id/follow', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ success: false, message: 'لا يمكنك متابعة نفسك' });
  }
  const stmts = getStatements();
  const isFollowing = stmts.stmtIsFollowing.get(req.user.id, targetId);
  if (isFollowing) {
    stmts.stmtUnfollowUser.run(req.user.id, targetId);
    scheduleCloudSync();
    return res.json({ success: true, following: false });
  } else {
    stmts.stmtFollowUser.run(req.user.id, targetId, Date.now());
    createNotification({
      userId: targetId,
      actorId: req.user.id,
      type: 'follow',
      title: 'متابع جديد',
      content: `بدأ ${req.user.name} بمتابعة حسابك في سرد رقمي`,
      link: '/app/profile',
    });
    scheduleCloudSync();
    return res.json({ success: true, following: true });
  }
});

// Single User Profile
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const stmts = getStatements();
    const identifier = req.params.id;
    let targetUser = stmts.stmtFindUserById.get(identifier);
    if (!targetUser) {
      targetUser = stmts.stmtFindUserByUsername.get(identifier);
    }
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const formatted = formatUserResponse(targetUser);
    let isFollowing = false;
    if (req.user && req.user.id !== targetUser.id) {
      const followCheck = stmts.stmtIsFollowing.get(req.user.id, targetUser.id);
      isFollowing = Boolean(followCheck);
    }

    const result = {
      ...formatted,
      isFollowing,
      isSelf: req.user ? req.user.id === targetUser.id : false,
    };

    res.json({
      success: true,
      user: result,
      data: result,
    });
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب الملف الشخصي' });
  }
});

// User Posts
router.get('/:id/posts', authenticateToken, (req, res) => {
  try {
    const stmts = getStatements();
    const identifier = req.params.id;
    let targetUser = stmts.stmtFindUserById.get(identifier);
    if (!targetUser) {
      targetUser = stmts.stmtFindUserByUsername.get(identifier);
    }
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const db = req.app.locals.db;
    const rows = db.prepare(`
      SELECT p.*, u.name as author_name, u.username as author_username, u.avatar as author_avatar, u.role as author_role, u.verified as author_verified
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.author_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(targetUser.id);

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

    res.json(posts);
  } catch (err) {
    console.error('Error getting user posts:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب منشورات المستخدم' });
  }
});

// Change Password
router.post('/change-password', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }
    const { stmtFindUserById, stmtUpdateUserPassword } = getStatements();
    const userRow = stmtFindUserById.get(req.user.id);
    if (!userRow) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    if (!bcrypt.compareSync(currentPassword, userRow.password_hash)) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    stmtUpdateUserPassword.run(newHash, req.user.id);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر تغيير كلمة المرور' });
  }
});

// Delete My Account
router.delete('/me', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const userId = req.user.id;
    const { stmtDeleteUser } = getStatements();
    stmtDeleteUser.run(userId);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حذف الحساب' });
  }
});

export default router;
