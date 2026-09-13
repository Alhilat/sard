export function createNotificationsStatements(db) {
  return {
    stmtGetNotifications: db.prepare(`
      SELECT n.*, u.name as actor_name, u.avatar as actor_avatar, u.username as actor_username
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `),
    stmtGetUnreadNotificationsCount: db.prepare('SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0'),
    stmtInsertNotification: db.prepare('INSERT INTO notifications (id, user_id, actor_id, type, title, content, link, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'),
    stmtMarkNotificationRead: db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'),
    stmtMarkAllNotificationsRead: db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?'),

    // Device Tokens
    stmtGetDeviceTokensByUser: db.prepare('SELECT * FROM device_tokens WHERE user_id = ? ORDER BY updated_at DESC'),
    stmtUpsertDeviceToken: db.prepare(`
      INSERT INTO device_tokens (id, user_id, device_type, token, endpoint, auth_key, p256dh_key, user_agent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        endpoint = excluded.endpoint,
        auth_key = excluded.auth_key,
        p256dh_key = excluded.p256dh_key,
        user_agent = excluded.user_agent,
        updated_at = excluded.updated_at
    `),
    stmtDeleteDeviceToken: db.prepare('DELETE FROM device_tokens WHERE id = ? AND user_id = ?')
  };
}
