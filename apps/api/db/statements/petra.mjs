export function createPetraStatements(db) {
  return {
    stmtInsertAuditLog: db.prepare(`
      INSERT INTO petra_audit_logs (id, admin_user, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    stmtGetAuditLogs: db.prepare('SELECT * FROM petra_audit_logs ORDER BY created_at DESC LIMIT 100'),
    stmtGetLatestBackupAudit: db.prepare('SELECT * FROM backup_audit_logs ORDER BY created_at DESC LIMIT 10'),

    // Platform Counts
    stmtCountAllUsers: db.prepare('SELECT COUNT(*) as c FROM users'),
    stmtCountActiveUsers: db.prepare('SELECT COUNT(*) as c FROM users WHERE is_banned = 0'),
    stmtCountBannedUsers: db.prepare('SELECT COUNT(*) as c FROM users WHERE is_banned = 1'),
    stmtCountAllPosts: db.prepare('SELECT COUNT(*) as c FROM posts'),
    stmtCountAllComments: db.prepare('SELECT COUNT(*) as c FROM comments'),
    stmtCountAllGroups: db.prepare('SELECT COUNT(*) as c FROM groups'),

    // Management Lists
    stmtGetPetraUsers: db.prepare(`
      SELECT id, name, email, username, role, phone, location, country, verified, is_banned, ban_reason, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `),
    stmtGetPetraPosts: db.prepare(`
      SELECT p.*, u.name as author_name, u.username as author_username, u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `),
    stmtGetPetraComments: db.prepare(`
      SELECT c.*, u.name as author_name, u.username as author_username, p.content as post_content
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN posts p ON c.post_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 100
    `),
    stmtGetPetraGroups: db.prepare(`
      SELECT g.*, u.name as creator_name, u.username as creator_username
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      ORDER BY g.created_at DESC
      LIMIT 100
    `)
  };
}
