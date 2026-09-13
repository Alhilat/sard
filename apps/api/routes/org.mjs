import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// GET /api/org/members
router.get('/members', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const { stmtGetOrgMembers, stmtInsertOrgMember } = getStatements();
    const orgId = req.user.role === 'org' ? req.user.id : (req.user.organization_id || req.user.id);
    let rows = stmtGetOrgMembers.all(orgId);
    if (rows.length === 0) {
      const initialId = `mem_${Date.now()}`;
      stmtInsertOrgMember.run(initialId, orgId, req.user.id, req.user.name || 'مسؤول المنظمة', req.user.email, 'مدير', 'active', Date.now());
      rows = stmtGetOrgMembers.all(orgId);
    }
    res.json({ success: true, members: rows, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, members: [] });
  }
});

// POST /api/org/members/invite
router.post('/members/invite', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const orgId = req.user.role === 'org' ? req.user.id : (req.user.organization_id || req.user.id);
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال اسم العضو والبريد الإلكتروني' });
    }
    const memberId = `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const { stmtInsertOrgMember } = getStatements();
    stmtInsertOrgMember.run(memberId, orgId, null, name.trim(), email.trim().toLowerCase(), role || 'عضو', 'active', Date.now());
    scheduleCloudSync();
    res.status(201).json({ success: true, id: memberId, message: 'تم إرسال دعوة الانضمام بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر إرسال الدعوة' });
  }
});

// DELETE /api/org/members/:id
router.delete('/members/:id', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const memberId = req.params.id;
    const { stmtDeleteOrgMember } = getStatements();
    stmtDeleteOrgMember.run(memberId);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم إزالة العضو بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر إزالة العضو' });
  }
});

// PATCH /api/org/members/:id/role
router.patch('/members/:id/role', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const memberId = req.params.id;
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'الدور مطلوب' });
    const { stmtUpdateOrgMemberRole } = getStatements();
    stmtUpdateOrgMemberRole.run(role, memberId);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم تحديث الدور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر تحديث الدور' });
  }
});

export default router;
