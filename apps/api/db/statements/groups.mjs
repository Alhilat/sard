export function createGroupsStatements(db) {
  return {
    stmtGetGroups: db.prepare('SELECT * FROM groups ORDER BY members_count DESC'),
    stmtGetGroupById: db.prepare('SELECT * FROM groups WHERE id = ?'),
    stmtInsertGroup: db.prepare(`
      INSERT INTO groups (id, name, tagline, description, category, privacy, members_count, posts_count, cover_gradient, accent_color, rules, creator_id, created_at)
      VALUES (@id, @name, @tagline, @description, @category, @privacy, @members_count, @posts_count, @cover_gradient, @accent_color, @rules, @creator_id, @created_at)
    `),
    stmtDeleteGroup: db.prepare('DELETE FROM groups WHERE id = ?'),
    stmtDeleteGroupPosts: db.prepare('DELETE FROM posts WHERE group_id = ?'),
    stmtDeleteGroupMembers: db.prepare('DELETE FROM group_members WHERE group_id = ?'),
    stmtGetGroupMembers: db.prepare(`
      SELECT gm.role, gm.joined_at, u.id, u.name, u.username, u.avatar, u.role as user_role
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
    `),
    stmtInsertGroupMember: db.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'),
    stmtRemoveGroupMember: db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?'),
    stmtIncrementGroupMembers: db.prepare('UPDATE groups SET members_count = members_count + 1 WHERE id = ?'),
    stmtDecrementGroupMembers: db.prepare('UPDATE groups SET members_count = MAX(1, members_count - 1) WHERE id = ?'),
    stmtIncrementGroupPosts: db.prepare('UPDATE groups SET posts_count = posts_count + 1 WHERE id = ?'),
    stmtDecrementGroupPosts: db.prepare('UPDATE groups SET posts_count = MAX(0, posts_count - 1) WHERE id = ?'),
    stmtCheckGroupMember: db.prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?')
  };
}
