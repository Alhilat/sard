export function createActivitiesStatements(db) {
  return {
    stmtGetActivities: db.prepare(`
      SELECT a.*, u.name as org_name, u.avatar as org_avatar
      FROM activities a
      JOIN users u ON a.org_id = u.id
      ORDER BY a.created_at DESC
    `),
    stmtGetActivityById: db.prepare(`
      SELECT a.*, u.name as org_name, u.avatar as org_avatar
      FROM activities a
      JOIN users u ON a.org_id = u.id
      WHERE a.id = ?
    `),
    stmtInsertActivity: db.prepare(`
      INSERT INTO activities (id, org_id, title, description, category, date, time, location, location_type, capacity, attendees_count, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    stmtRegisterActivity: db.prepare('INSERT OR IGNORE INTO activity_registrations (activity_id, user_id, created_at) VALUES (?, ?, ?)'),
    stmtIncrementActivityAttendees: db.prepare('UPDATE activities SET attendees_count = attendees_count + 1 WHERE id = ?'),
    stmtDecrementActivityAttendees: db.prepare('UPDATE activities SET attendees_count = MAX(0, attendees_count - 1) WHERE id = ?'),
    stmtCheckActivityRegistration: db.prepare('SELECT 1 FROM activity_registrations WHERE activity_id = ? AND user_id = ?'),
    stmtDeleteActivity: db.prepare('DELETE FROM activities WHERE id = ?'),
    stmtDeleteActivityRegistrations: db.prepare('DELETE FROM activity_registrations WHERE activity_id = ?'),
    stmtGetActivityAttendees: db.prepare(`
      SELECT u.id, u.name, u.username, u.avatar, u.role, ar.created_at as registered_at
      FROM activity_registrations ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.activity_id = ?
      ORDER BY ar.created_at DESC
    `)
  };
}
