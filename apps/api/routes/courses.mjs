import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

const router = Router();

// List Courses
router.get('/', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const stmts = getStatements();
    const rows = stmts.stmtGetCourses.all();
    const courses = rows.map((c) => {
      const enrollment = currentUserId ? stmts.stmtCheckCourseEnrollment.get(c.id, currentUserId) : null;
      return {
        id: c.id,
        title: c.title,
        tagline: c.tagline,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        totalHours: c.total_hours,
        lectures: c.lectures,
        students: c.students,
        rating: c.rating,
        price: c.price,
        enrolled: Boolean(enrollment),
        progress: enrollment ? enrollment.progress : 0,
        org_id: c.org_id,
        org: { id: c.org_id, name: c.org_name, avatar: c.org_avatar },
        instructor: {
          id: c.org_id,
          name: c.org_name || 'مدرب معتمد',
          title: 'مدرب وخبير تقني',
          role: 'instructor',
          avatar: c.org_avatar,
          bio: '',
          experience: 'خبرة تدريبية عملية',
          rating: c.rating || 5.0,
          studentsTaught: c.students || 0,
        },
      };
    });
    res.json({ success: true, courses });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ success: false, courses: [] });
  }
});

// Create Course
router.post('/', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  if (!req.user.verified && req.user.role !== 'admin' && req.user.role !== 'org') {
    return res.status(403).json({
      success: false,
      message: 'إضافة وإدارة الدورات متاح حصرياً للحسابات الموثقة والمدربين المعتمدين. يمكنك كعضو الانضمام والتعلم في كافة الدورات.',
    });
  }
  try {
    const { title, tagline, description, category, level, duration, totalHours, lectures, price } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'يرجى إدخال عنوان الدورة' });
    const id = `crs_${Date.now()}`;
    const stmts = getStatements();
    stmts.stmtInsertCourse.run(
      id,
      req.user.id,
      title.trim(),
      tagline || '',
      description || '',
      category || 'تقنية',
      level || 'مبتدئ',
      duration || '٤ أسابيع',
      Number(totalHours) || 20,
      Number(lectures) || 10,
      0,
      5.0,
      price || 'مجاني',
      Date.now()
    );
    scheduleCloudSync();
    res.status(201).json({ success: true, id, message: 'تم إضافة الدورة بنجاح' });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ success: false, message: 'تعذر إضافة الدورة' });
  }
});

// Delete Course
router.delete('/:id', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const courseId = req.params.id;
    const stmts = getStatements();
    const course = stmts.stmtGetCourseById.get(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'الدورة غير موجودة' });
    if (course.org_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بإدارة أو حذف هذه الدورة' });
    }

    stmts.stmtDeleteCourse.run(courseId);
    stmts.stmtDeleteCourseEnrollments.run(courseId);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم حذف الدورة بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر حذف الدورة' });
  }
});

// Enroll in Course
router.post('/:id/enroll', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const courseId = req.params.id;
    const stmts = getStatements();
    stmts.stmtEnrollCourse.run(courseId, req.user.id, Date.now());
    stmts.stmtIncrementCourseStudents.run(courseId);
    scheduleCloudSync();
    res.json({ success: true, message: 'تم الانضمام إلى الدورة بنجاح' });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({ success: false, message: 'تعذر الانضمام إلى الدورة' });
  }
});

export default router;
