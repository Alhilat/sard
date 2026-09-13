export function createMessagesStatements(db) {
  return {
    stmtGetConversations: db.prepare(`
      SELECT c.*,
             (CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END) as other_user_id,
             u.name as other_name, u.username as other_username, u.avatar as other_avatar, u.role as other_role, u.verified as other_verified
      FROM conversations c
      JOIN users u ON (CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END) = u.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.updated_at DESC
    `),
    stmtFindConversationBetween: db.prepare(`
      SELECT * FROM conversations
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `),
    stmtGetConversationById: db.prepare('SELECT * FROM conversations WHERE id = ?'),
    stmtInsertConversation: db.prepare(`
      INSERT INTO conversations (id, user1_id, user2_id, last_message, updated_at)
      VALUES (?, ?, ?, '', ?)
    `),
    stmtUpdateConversationLastMessage: db.prepare(`
      UPDATE conversations SET last_message = ?, updated_at = ? WHERE id = ?
    `),
    stmtGetDirectMessages: db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM direct_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `),
    stmtInsertDirectMessage: db.prepare(`
      INSERT INTO direct_messages (id, conversation_id, sender_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `),
    stmtFindRecentDuplicateMessage: db.prepare(`
      SELECT * FROM direct_messages
      WHERE conversation_id = ? AND sender_id = ? AND content = ? AND created_at > ?
      LIMIT 1
    `),
  };
}
