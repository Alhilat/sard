import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// POST /api/reports
router.post('/', authenticateToken, (req, res) => {
  try {
    const { target_type, target_id, reason } = req.body;
    if (!target_id) return res.status(400).json({ success: false, message: 'المحتوى المُبلّغ عنه مطلوب' });
    const id = `rep_${Date.now()}`;
    const { stmtInsertReport } = getStatements();
    stmtInsertReport.run(id, req.user?.id || null, target_type || 'post', target_id, reason || 'مخالفة معايير النشر', Date.now());
    scheduleCloudSync();
    res.status(201).json({ success: true, message: 'تم إرسال البلاغ لإدارة المنصة بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر تسجيل البلاغ' });
  }
});

export default router;
