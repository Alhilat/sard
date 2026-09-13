import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { formatRelativeTime } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router({ mergeParams: true });

// Get chat settings
router.get('/settings', authenticateToken, (req, res) => {
  try {
    const activityId = req.params.id;
    const stmts = getStatements();
    const row = stmts.stmtGetActivityChatSettings.get(activityId);
    if (!row) {
      return res.json({
        activityId,
        permissionMode: 'all',
        pinnedAnnouncement: '',
        slowModeSeconds: 0,
      });
    }
    res.json({
      activityId: row.activity_id,
      permissionMode: row.permission_mode || 'all',
      pinnedAnnouncement: row.pinned_announcement || '',
      slowModeSeconds: row.slow_mode_seconds || 0,
    });
  } catch (err) {
    console.error('Error getting activity chat settings:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب إعدادات محادثة الفعالية' });
  }
});

// Update chat settings
const updateActivityChatSettingsHandler = (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const activityId = req.params.id;
    const { permissionMode, pinnedAnnouncement, slowModeSeconds } = req.body;
    const stmts = getStatements();

    const activity = stmts.stmtGetActivityById.get(activityId);
    const isOwner = activity && activity.org_id === req.user.id;
    const isPrivileged = Boolean(req.user.verified || req.user.role === 'admin' || req.user.role === 'org' || isOwner);
    if (!isPrivileged) {
      return res.status(403).json({ success: false, message: 'فقط منظم الفعالية والمشرفون يمكنهم تعديل إعدادات المحادثة' });
    }

    const current = stmts.stmtGetActivityChatSettings.get(activityId) || {};
    const newMode = permissionMode || current.permission_mode || 'all';
    const newPin = pinnedAnnouncement !== undefined ? pinnedAnnouncement : (current.pinned_announcement || '');
    const newSlow = slowModeSeconds !== undefined ? slowModeSeconds : (current.slow_mode_seconds || 0);

    stmts.stmtUpsertActivityChatSettings.run(activityId, newMode, newPin, newSlow, Date.now());
    scheduleCloudSync();

    res.json({
      activityId,
      permissionMode: newMode,
      pinnedAnnouncement: newPin,
      slowModeSeconds: newSlow,
    });
  } catch (err) {
    console.error('Error updating activity chat settings:', err);
    res.status(500).json({ success: false, message: 'تعذر تحديث إعدادات المحادثة' });
  }
};

router.patch('/settings', authenticateToken, updateActivityChatSettingsHandler);
router.post('/settings', authenticateToken, updateActivityChatSettingsHandler);

// Get chat messages
router.get('/messages', authenticateToken, (req, res) => {
  try {
    const activityId = req.params.id;
    const stmts = getStatements();
    const rows = stmts.stmtGetActivityChatMessages.all(activityId);
    const messages = rows.map((r) => ({
      id: r.id,
      activityId: r.activity_id,
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
    console.error('Error getting activity chat messages:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب رسائل غرفة الفعالية' });
  }
});

// Post chat message
router.post('/messages', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const activityId = req.params.id;
    const { content, senderName, senderRole, isAnnouncement } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'محتوى الرسالة فارغ' });
    }

    const stmts = getStatements();
    const settings = stmts.stmtGetActivityChatSettings.get(activityId);
    const mode = settings ? settings.permission_mode : 'all';
    const activity = stmts.stmtGetActivityById.get(activityId);
    const isActivityStaff = Boolean(req.user.verified || req.user.role === 'admin' || req.user.role === 'org' || (activity && activity.org_id === req.user.id));

    if (mode === 'muted' && !isActivityStaff) {
      return res.status(403).json({ success: false, message: 'المحادثة متوقفة مؤقتاً بواسطة منظم الفعالية' });
    }

    if (mode === 'organizer_only' && !isActivityStaff) {
      return res.status(403).json({ success: false, message: 'إرسال الرسائل مقتصر على منظم الفعالية حالياً' });
    }

    const msgId = `amsg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const effectiveSenderName = req.user.name || senderName || 'مشارك';
    const effectiveRole = (isActivityStaff && (senderRole === 'organizer' || senderRole === 'instructor')) ? 'organizer' : 'attendee';
    const effectiveAnnouncement = (isAnnouncement && effectiveRole === 'organizer') ? 1 : 0;
    const now = Date.now();

    stmts.stmtInsertActivityChatMessage.run(
      msgId,
      activityId,
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
      activityId,
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
    console.error('Error sending activity chat message:', err);
    res.status(500).json({ success: false, message: 'تعذر إرسال الرسالة' });
  }
});

export default router;
