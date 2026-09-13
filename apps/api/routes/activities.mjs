import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// List Activities
router.get('/', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const stmts = getStatements();
    const rows = stmts.stmtGetActivities.all();
    const activities = rows.map((a) => {
      const isRegistered = currentUserId ? Boolean(stmts.stmtCheckActivityRegistration.get(a.id, currentUserId)) : false;
      return {
        id: a.id,
        org_id: a.org_id,
        title: a.title,
        description: a.description,
        category: a.category,
        date: a.date,
        time: a.time,
        location: a.location,
        locationType: a.location_type,
        capacity: a.capacity,
        attendeesCount: a.attendees_count,
        status: a.status,
        org: { id: a.org_id, name: a.org_name, avatar: a.org_avatar },
        orgName: a.org_name,
        isRegistered,
      };
    });
    res.json({ success: true, activities });
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ success: false, activities: [] });
  }
});

// Create Activity
router.post('/', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  if (!req.user.verified && req.user.role !== 'admin' && req.user.role !== 'org') {
    return res.status(403).json({
      success: false,
      message: 'تنظيم وإضافة الفعاليات متاح حصرياً للحسابات الموثقة والمنظمات. يمكنك كعضو التسجيل والمشاركة في كافة الفعاليات.',
    });
  }
  try {
    const { title, description, category, date, time, location, locationType, capacity } = req.body;
    if (!title || !date) return res.status(400).json({ success: false, message: 'يرجى إدخال عنوان وتاريخ الفعالية' });
    const id = `act_${Date.now()}`;
    const stmts = getStatements();
    stmts.stmtInsertActivity.run(
      id,
      req.user.id,
      title.trim(),
      (description || '').trim(),
      category || 'عام',
      date,
      time || '',
      location || '',
      locationType || 'in_person',
      Number(capacity) || 100,
      0,
      'متاح للتسجيل',
      Date.now()
    );
    scheduleCloudSync();
    res.status(201).json({ success: true, id, message: 'تم إنشاء الفعالية بنجاح' });
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ success: false, message: 'تعذر إنشاء الفعالية' });
  }
});

// Delete Activity
router.delete('/:id', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const actId = req.params.id;
    const stmts = getStatements();
    const act = stmts.stmtGetActivityById.get(actId);
    if (!act) return res.status(404).json({ success: false, message: 'الفعالية غير موجودة' });
    if (act.org_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بإدارة أو حذف هذه الفعالية' });
    }

    stmts.stmtDeleteActivity.run(actId);
    stmts.stmtDeleteActivityRegistrations.run(actId);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم حذف الفعالية بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حذف الفعالية' });
  }
});

// Register for Activity
router.post('/:id/register', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const activityId = req.params.id;
    const stmts = getStatements();
    stmts.stmtRegisterActivity.run(activityId, req.user.id, Date.now());
    stmts.stmtIncrementActivityAttendees.run(activityId);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم تأكيد تسجيلك في النشاط بنجاح' });
  } catch (err) {
    console.error('Error registering for activity:', err);
    res.status(500).json({ success: false, message: 'تعذر التسجيل في النشاط' });
  }
});

export default router;
