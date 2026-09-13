import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { formatRelativeTime } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  if (!req.user) return res.json({ success: true, notifications: [], data: [] });
  try {
    const { stmtGetNotifications } = getStatements();
    const rows = stmtGetNotifications.all(req.user.id);
    const notifications = rows.map((r) => ({
      id: r.id,
      type: r.type || 'system',
      title: r.title || 'إشعار جديد',
      content: r.content,
      link: r.link || '',
      read: Boolean(r.is_read),
      is_read: Boolean(r.is_read),
      time: formatRelativeTime(r.created_at),
      created_at: r.created_at,
      user: {
        id: r.actor_id || '',
        name: r.actor_name || 'مستخدم سرد',
        avatar: r.actor_avatar || '',
        username: r.actor_username || 'user',
      },
    }));

    res.json({ success: true, notifications, data: notifications });
  } catch (err) {
    console.error('Error getting notifications:', err);
    res.json({ success: true, notifications: [], data: [] });
  }
});

router.get('/unread-count', authenticateToken, (req, res) => {
  if (!req.user) return res.json({ count: 0, unreadCount: 0 });
  try {
    const { stmtGetUnreadNotificationsCount } = getStatements();
    const row = stmtGetUnreadNotificationsCount.get(req.user.id);
    const count = row ? Number(row.unread_count) : 0;
    res.json({ count, unreadCount: count });
  } catch {
    res.json({ count: 0, unreadCount: 0 });
  }
});

router.patch('/mark-all-read', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false });
  try {
    const { stmtMarkAllNotificationsRead } = getStatements();
    stmtMarkAllNotificationsRead.run(req.user.id);
    scheduleCloudSync();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر تحديث الإشعارات' });
  }
});

router.patch('/mark-type-read', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false });
  try {
    const { type, actorId } = req.body;
    const { stmtMarkNotificationsReadByType, stmtMarkNotificationsReadByActorAndType } = getStatements();
    if (actorId && type) {
      stmtMarkNotificationsReadByActorAndType.run(req.user.id, type, actorId);
    } else if (type) {
      stmtMarkNotificationsReadByType.run(req.user.id, type);
    }
    scheduleCloudSync();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر تحديث الإشعارات' });
  }
});

router.patch('/:id/read', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false });
  try {
    const { stmtMarkNotificationRead } = getStatements();
    stmtMarkNotificationRead.run(req.params.id, req.user.id);
    scheduleCloudSync();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Device notifications
router.get('/devices', authenticateToken, (req, res) => {
  if (!req.user) return res.json({ success: true, devices: [], data: [] });
  try {
    const { stmtGetDeviceTokensByUser } = getStatements();
    const rows = stmtGetDeviceTokensByUser.all(req.user.id);
    const devices = rows.map((d) => ({
      id: d.id,
      userId: d.user_id,
      deviceType: d.device_type,
      userAgent: d.user_agent,
      endpoint: d.endpoint,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      formattedTime: formatRelativeTime(d.updated_at),
    }));
    res.json({ success: true, devices, data: devices });
  } catch (err) {
    console.error('Error fetching device tokens:', err);
    res.status(500).json({ success: false, message: 'تعذر جلب الأجهزة المسجلة' });
  }
});

router.post('/devices/register', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const { stmtGetDeviceTokensByUser, stmtUpsertDeviceToken } = getStatements();
    const { deviceType, token, endpoint, authKey, p256dhKey, userAgent } = req.body;
    const existing = stmtGetDeviceTokensByUser.all(req.user.id);
    const existingDevice = existing.find(d => (endpoint && d.endpoint === endpoint) || (token && d.token === token));
    const deviceId = existingDevice ? existingDevice.id : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    stmtUpsertDeviceToken.run(
      deviceId,
      req.user.id,
      deviceType || 'web',
      token || '',
      endpoint || '',
      authKey || '',
      p256dhKey || '',
      userAgent || req.headers['user-agent'] || '',
      existingDevice ? existingDevice.created_at : now,
      now
    );
    scheduleCloudSync();

    res.json({
      success: true,
      deviceId,
      message: 'تم تسجيل جهازك لاستقبال الإشعارات الفورية بنجاح',
    });
  } catch (err) {
    console.error('Error registering device token:', err);
    res.status(500).json({ success: false, message: 'تعذر تسجيل الجهاز' });
  }
});

router.delete('/devices/:id', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const { stmtDeleteDeviceToken } = getStatements();
    stmtDeleteDeviceToken.run(req.params.id, req.user.id);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم إلغاء تفعيل الإشعارات على هذا الجهاز بنجاح' });
  } catch (err) {
    console.error('Error deleting device token:', err);
    res.status(500).json({ success: false, message: 'تعذر إلغاء تسجيل الجهاز' });
  }
});

router.post('/test', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const { stmtInsertNotification } = getStatements();
    const notifId = `notif_${Date.now()}_test`;
    const title = 'اختبار إشعارات المنصة 🔔';
    const content = 'نظام الإشعارات الفورية للأجهزة يعمل بنجاح على جهازك الآن! ستصلك التنبيهات المباشرة أولاً بأول.';
    const link = '/app/notifications';
    const now = Date.now();

    stmtInsertNotification.run(notifId, req.user.id, null, 'system', title, content, link, now);
    scheduleCloudSync();

    res.json({
      success: true,
      message: 'تم إرسال إشعار تجريبي إلى جهازك وحسابك بنجاح!',
      notification: {
        id: notifId,
        type: 'system',
        title,
        content,
        link,
        isRead: false,
        time: 'الآن',
        createdAt: now,
      },
    });
  } catch (err) {
    console.error('Error sending test notification:', err);
    res.status(500).json({ success: false, message: 'تعذر إرسال الإشعار التجريبي' });
  }
});

export default router;
