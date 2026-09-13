export function createCoursesStatements(db) {
  return {
    stmtGetCourses: db.prepare(`
      SELECT c.*, u.name as org_name, u.avatar as org_avatar
      FROM courses c
      JOIN users u ON c.org_id = u.id
      ORDER BY c.created_at DESC
    `),
    stmtGetCourseById: db.prepare(`
      SELECT c.*, u.name as org_name, u.avatar as org_avatar
      FROM courses c
      JOIN users u ON c.org_id = u.id
      WHERE c.id = ?
    `),
    stmtInsertCourse: db.prepare(`
      INSERT INTO courses (id, org_id, title, tagline, description, category, level, duration, total_hours, lectures, students, rating, price, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    stmtEnrollCourse: db.prepare('INSERT OR IGNORE INTO course_enrollments (course_id, user_id, progress, created_at) VALUES (?, ?, 0, ?)'),
    stmtIncrementCourseStudents: db.prepare('UPDATE courses SET students = students + 1 WHERE id = ?'),
    stmtDecrementCourseStudents: db.prepare('UPDATE courses SET students = MAX(0, students - 1) WHERE id = ?'),
    stmtCheckCourseEnrollment: db.prepare('SELECT progress FROM course_enrollments WHERE course_id = ? AND user_id = ?'),
    stmtDeleteCourse: db.prepare('DELETE FROM courses WHERE id = ?'),
    stmtDeleteCourseEnrollments: db.prepare('DELETE FROM course_enrollments WHERE course_id = ?'),
    stmtGetCourseStudents: db.prepare(`
      SELECT u.id, u.name, u.username, u.avatar, ce.progress, ce.created_at as enrolled_at
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.course_id = ?
      ORDER BY ce.created_at DESC
    `)
  };
}
