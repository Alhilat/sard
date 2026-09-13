export function createChatsStatements(db) {
  return {
    // Course Chat
    stmtGetCourseChatSettings: db.prepare('SELECT * FROM course_chat_settings WHERE course_id = ?'),
    stmtUpsertCourseChatSettings: db.prepare(`
      INSERT INTO course_chat_settings (course_id, permission_mode, pinned_announcement, slow_mode_seconds, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(course_id) DO UPDATE SET
        permission_mode = excluded.permission_mode,
        pinned_announcement = excluded.pinned_announcement,
        slow_mode_seconds = excluded.slow_mode_seconds,
        updated_at = excluded.updated_at
    `),
    stmtGetCourseChatMessages: db.prepare(`
      SELECT id, course_id, sender_id, sender_name, sender_role, content, is_announcement, created_at
      FROM course_chat_messages
      WHERE course_id = ?
      ORDER BY created_at ASC
      LIMIT 300
    `),
    stmtInsertCourseChatMessage: db.prepare(`
      INSERT INTO course_chat_messages (id, course_id, sender_id, sender_name, sender_role, content, is_announcement, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),

    // Activity Chat
    stmtGetActivityChatSettings: db.prepare('SELECT * FROM activity_chat_settings WHERE activity_id = ?'),
    stmtUpsertActivityChatSettings: db.prepare(`
      INSERT INTO activity_chat_settings (activity_id, permission_mode, pinned_announcement, slow_mode_seconds, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(activity_id) DO UPDATE SET
        permission_mode = excluded.permission_mode,
        pinned_announcement = excluded.pinned_announcement,
        slow_mode_seconds = excluded.slow_mode_seconds,
        updated_at = excluded.updated_at
    `),
    stmtGetActivityChatMessages: db.prepare(`
      SELECT id, activity_id, sender_id, sender_name, sender_role, content, is_announcement, created_at
      FROM activity_chat_messages
      WHERE activity_id = ?
      ORDER BY created_at ASC
      LIMIT 300
    `),
    stmtInsertActivityChatMessage: db.prepare(`
      INSERT INTO activity_chat_messages (id, activity_id, sender_id, sender_name, sender_role, content, is_announcement, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
  };
}
