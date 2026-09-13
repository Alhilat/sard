import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.mjs';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// List Groups
router.get('/', (req, res) => {
  try {
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        currentUserId = decoded?.id;
      } catch {}
    }

    const stmts = getStatements();
    const rows = stmts.stmtGetGroups.all();
    const groups = rows.map((g) => {
      let rules = [];
      try {
        rules = JSON.parse(g.rules || '[]');
      } catch {
        rules = [];
      }
      const isJoined = currentUserId ? !!stmts.stmtCheckGroupMember.get(g.id, currentUserId) : false;
      return {
        id: g.id,
        name: g.name,
        tagline: g.tagline || '',
        description: g.description || '',
        category: g.category || 'عام',
        privacy: g.privacy || 'عام',
        members: g.members_count || 1,
        posts: g.posts_count || 0,
        coverGradient: g.cover_gradient || 'from-[#1B4D3E] via-[#236854] to-[#123329]',
        accentColor: g.accent_color || '#236854',
        rules,
        joined: isJoined,
      };
    });

    res.json({
      success: true,
      groups,
      data: groups,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب المجموعات' });
  }
});

// Single Group Details
router.get('/:id', (req, res) => {
  try {
    const groupId = req.params.id;
    const stmts = getStatements();
    const g = stmts.stmtGetGroupById.get(groupId);
    if (!g) {
      return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    }
    let rules = [];
    try { rules = JSON.parse(g.rules || '[]'); } catch { rules = []; }

    let isJoined = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded?.id) {
          isJoined = !!stmts.stmtCheckGroupMember.get(groupId, decoded.id);
        }
      } catch {}
    }

    const group = {
      id: g.id,
      name: g.name,
      tagline: g.tagline || '',
      description: g.description || '',
      category: g.category || 'عام',
      privacy: g.privacy || 'عام',
      members: g.members_count || 1,
      posts: g.posts_count || 0,
      coverGradient: g.cover_gradient || 'from-[#1B4D3E] via-[#236854] to-[#123329]',
      accentColor: g.accent_color || '#236854',
      rules,
      joined: isJoined,
    };

    res.json({ success: true, data: group, group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب بيانات المجموعة' });
  }
});

// Group Members
router.get('/:id/members', (req, res) => {
  try {
    const groupId = req.params.id;
    const stmts = getStatements();
    const rows = stmts.stmtGetGroupMembers.all(groupId);
    const members = rows.map((m) => ({
      id: m.id,
      name: m.name,
      username: m.username,
      avatar: m.avatar || '',
      role: m.role || 'عضو',
      joined_at: new Date(m.joined_at).toLocaleDateString('ar-SA'),
    }));
    res.json({ success: true, members, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب أعضاء المجموعة' });
  }
});

// Create Group
router.post('/', authenticateToken, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول لإنشاء مجموعة' });
    }
    if (!req.user.verified && req.user.role !== 'admin' && req.user.role !== 'org') {
      return res.status(403).json({
        success: false,
        message: 'إنشاء المجموعات متاح حصرياً للحسابات والمنظمات الموثقة. يمكنك كعضو الانضمام لجميع المجموعات والتفاعل معها.',
      });
    }
    const creatorId = req.user.id;
    const { name, tagline, description, category, privacy, coverGradient, accentColor, rules, visibility } = req.body;
    const cleanName = (name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المجموعة' });
    }

    const groupId = `g_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const resolvedPrivacy = privacy || (visibility === 'private' ? 'خاص' : 'عام');
    const resolvedCover = coverGradient || 'from-[#1B4D3E] via-[#236854] to-[#123329]';
    const resolvedAccent = accentColor || '#236854';
    const resolvedRules = Array.isArray(rules) && rules.length > 0 ? rules : ['الاحترام المتبادل بين جميع الأعضاء'];

    const stmts = getStatements();
    stmts.stmtInsertGroup.run({
      id: groupId,
      name: cleanName,
      tagline: (tagline || 'مجتمع جديد انضم إلى فضاء منصة سرد رقمي').trim(),
      description: (description || '').trim(),
      category: (category || 'عام').trim(),
      privacy: resolvedPrivacy,
      members_count: 1,
      posts_count: 0,
      cover_gradient: resolvedCover,
      accent_color: resolvedAccent,
      rules: JSON.stringify(resolvedRules),
      creator_id: creatorId,
      created_at: Date.now(),
    });

    stmts.stmtInsertGroupMember.run(groupId, creatorId, 'مؤسس', Date.now());
    scheduleCloudSync();

    const createdGroup = {
      id: groupId,
      groupId,
      name: cleanName,
      tagline: (tagline || 'مجتمع جديد انضم إلى فضاء منصة سرد رقمي').trim(),
      description: (description || '').trim(),
      category: (category || 'عام').trim(),
      privacy: resolvedPrivacy,
      members: 1,
      posts: 0,
      coverGradient: resolvedCover,
      accentColor: resolvedAccent,
      rules: resolvedRules,
      joined: true,
      created_at: 'الآن',
    };

    res.status(201).json({
      success: true,
      ...createdGroup,
      group: createdGroup,
      data: createdGroup,
      message: 'تم إنشاء المجموعة بنجاح',
    });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ success: false, message: 'تعذر إنشاء المجموعة' });
  }
});

// Join Group
router.post('/:id/join', authenticateToken, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول للانضمام' });
    }
    const groupId = req.params.id;
    const stmts = getStatements();
    const group = stmts.stmtGetGroupById.get(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    }

    const existing = stmts.stmtCheckGroupMember.get(groupId, req.user.id);
    if (!existing) {
      stmts.stmtInsertGroupMember.run(groupId, req.user.id, 'عضو', Date.now());
      stmts.stmtIncrementGroupMembers.run(groupId);
      scheduleCloudSync();
    }

    const updated = stmts.stmtGetGroupById.get(groupId);
    res.json({
      success: true,
      joined: true,
      members: updated ? updated.members_count : group.members_count + 1,
      message: 'تم الانضمام إلى المجموعة بنجاح',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر الانضمام إلى المجموعة' });
  }
});

// Leave Group
router.delete('/:id/leave', authenticateToken, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول لمغادرة المجموعة' });
    }
    const groupId = req.params.id;
    const stmts = getStatements();
    const group = stmts.stmtGetGroupById.get(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    }

    stmts.stmtRemoveGroupMember.run(groupId, req.user.id);
    stmts.stmtDecrementGroupMembers.run(groupId);
    scheduleCloudSync();

    const updated = stmts.stmtGetGroupById.get(groupId);
    res.json({
      success: true,
      joined: false,
      members: updated ? updated.members_count : Math.max(1, group.members_count - 1),
      message: 'تمت مغادرة المجموعة بنجاح',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر مغادرة المجموعة' });
  }
});

// Delete Group
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
    const groupId = req.params.id;
    const stmts = getStatements();
    const group = stmts.stmtGetGroupById.get(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    if (group.creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بإدارة أو حذف هذه المجموعة' });
    }

    stmts.stmtDeleteGroup.run(groupId);
    stmts.stmtDeleteGroupPosts.run(groupId);
    stmts.stmtDeleteGroupMembers.run(groupId);
    scheduleCloudSync();

    res.json({ success: true, message: 'تم حذف المجموعة بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حذف المجموعة' });
  }
});

export default router;
