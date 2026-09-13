import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { formatRelativeTime } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router({ mergeParams: true });

// Get chat settings
router.get('/settings', authenticateToken, (req, res) => {
  try {
    const courseId = req.params.id;
    const stmts = getStatements();
    const row = stmts.stmtGetCourseChatSettings.get(courseId);
    if (!row) {
      return res.json({
        courseId,
        permissionMode: 'all',
        pinnedAnnouncement: '',
        slowModeSeconds: 0,
      });
    }
    res.json({
      courseId: row.course_id,
      permissionMode: row.permission_mode || 'all',
      pinnedAnnouncement: row.pinned_announcement || '',
      slowModeSeconds: row.slow_mode_seconds || 0,
    });
  } catch (err) {
    console.error('Error getting course chat settings:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب إعدادات المحادثة' });
  }
});

// Update chat settings
const updateCourseChatSettingsHandler = (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const courseId = req.params.id;
    const { permissionMode, pinnedAnnouncement, slowModeSeconds } = req.body;
    const stmts = getStatements();

    const course = stmts.stmtGetCourseById.get(courseId);
    const isOwner = course && course.org_id === req.user.id;
    const isPrivileged = Boolean(req.user.verified || req.user.role === 'admin' || req.user.role === 'org' || isOwner);
    if (!isPrivileged) {
      return res.status(403).json({ success: false, message: 'فقط الحسابات الموثقة والمعلمون يمكنهم فتح أو إيقاف المحادثة' });
    }

    const current = stmts.stmtGetCourseChatSettings.get(courseId) || {};
    const newMode = permissionMode || current.permission_mode || 'all';
    const newPin = pinnedAnnouncement !== undefined ? pinnedAnnouncement : (current.pinned_announcement || '');
    const newSlow = slowModeSeconds !== undefined ? slowModeSeconds : (current.slow_mode_seconds || 0);

    stmts.stmtUpsertCourseChatSettings.run(courseId, newMode, newPin, newSlow, Date.now());
    scheduleCloudSync();

    res.json({
      courseId,
      permissionMode: newMode,
      pinnedAnnouncement: newPin,
      slowModeSeconds: newSlow,
    });
  } catch (err) {
    console.error('Error updating course chat settings:', err);
    res.status(500).json({ success: false, message: 'تعذر تحديث إعدادات المحادثة' });
  }
};

router.patch('/settings', authenticateToken, updateCourseChatSettingsHandler);
router.post('/settings', authenticateToken, updateCourseChatSettingsHandler);

// Get chat messages
router.get('/messages', authenticateToken, (req, res) => {
  try {
    const courseId = req.params.id;
    const stmts = getStatements();
    const rows = stmts.stmtGetCourseChatMessages.all(courseId);
    const messages = rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderRole: r.sender_role,
      content: r.content,
      isAnnouncement: Boolean(r.is_announcement),
      timestamp: formatRelativeTime(r.created_at),
      created_at: r.created_at,
    }));
    res.json({ success: true, messages, data: messages });
  } catch (err) {
    console.error('Error getting course chat messages:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب رسائل الغرفة' });
  }
});

// Post chat message
router.post('/messages', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const courseId = req.params.id;
    const { content, senderName, senderRole, isAnnouncement } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'محتوى الرسالة فارغ' });
    }

    const stmts = getStatements();
    const settings = stmts.stmtGetCourseChatSettings.get(courseId);
    const mode = settings ? settings.permission_mode : 'all';
    const course = stmts.stmtGetCourseById.get(courseId);
    const isCourseStaff = Boolean(req.user.verified || req.user.role === 'admin' || req.user.role === 'org' || (course && course.org_id === req.user.id));

    if (mode === 'muted' && !isCourseStaff) {
      return res.status(403).json({ success: false, message: 'المحادثة متوقفة مؤقتاً بواسطة المعلم' });
    }

    if (mode === 'instructor_only' && !isCourseStaff) {
      return res.status(403).json({ success: false, message: 'إرسال الرسائل مقتصر على المعلم حالياً' });
    }

    const msgId = `cmsg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const effectiveSenderName = req.user.name || senderName || 'طالب مشارك';
    const effectiveRole = (isCourseStaff && senderRole === 'instructor') ? 'instructor' : 'student';
    const effectiveAnnouncement = (isAnnouncement && effectiveRole === 'instructor') ? 1 : 0;
    const now = Date.now();

    stmts.stmtInsertCourseChatMessage.run(
      msgId,
      courseId,
      req.user.id,
      effectiveSenderName,
      effectiveRole,
      content.trim(),
      effectiveAnnouncement,
      now
    );
    scheduleCloudSync();

    const createdMsg = {
      id: msgId,
      courseId,
      senderId: req.user.id,
      senderName: effectiveSenderName,
      senderRole: effectiveRole,
      content: content.trim(),
      isAnnouncement: Boolean(effectiveAnnouncement),
      timestamp: 'الآن',
      created_at: now,
    };

    res.json({ success: true, message: createdMsg, data: createdMsg });
  } catch (err) {
    console.error('Error sending course chat message:', err);
    res.status(500).json({ success: false, message: 'تعذر إرسال الرسالة' });
  }
});

export default router;
