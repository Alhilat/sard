export function createUsersStatements(db) {
  return {
    stmtFindUserByEmail: db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)'),
    stmtFindUserByUsername: db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)'),
    stmtFindUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
    stmtInsertUser: db.prepare(`
      INSERT INTO users (id, name, email, username, password_hash, role, phone, avatar, bio, location, country, join_date, verified, is_banned, ban_reason, created_at)
      VALUES (@id, @name, @email, @username, @password_hash, @role, @phone, @avatar, @bio, @location, @country, @join_date, @verified, @is_banned, @ban_reason, @created_at)
    `),
    stmtUpdateUserBan: db.prepare('UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?'),
    stmtUpdateUserPassword: db.prepare('UPDATE users SET password_hash = ? WHERE id = ?'),
    stmtUpdateUserVerified: db.prepare('UPDATE users SET verified = ? WHERE id = ?'),
    stmtUpdateUserLastSeen: db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?'),
    stmtDeleteUser: db.prepare('DELETE FROM users WHERE id = ?'),

    // Follows
    stmtFollowUser: db.prepare('INSERT OR IGNORE INTO user_follows (follower_id, following_id, created_at) VALUES (?, ?, ?)'),
    stmtUnfollowUser: db.prepare('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?'),
    stmtIsFollowing: db.prepare('SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?'),
    stmtCountFollowers: db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?'),
    stmtCountFollowing: db.prepare('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?'),
    stmtGetSuggestions: db.prepare('SELECT id, name, username, avatar, verified, role, bio FROM users WHERE id != ? AND is_banned = 0 ORDER BY created_at DESC LIMIT 10'),

    // Search and listings
    stmtSearchUsers: db.prepare(`
      SELECT id, name, username, avatar, verified, role, bio, location, join_date, created_at
      FROM users
      WHERE is_banned = 0 AND (LOWER(name) LIKE ? OR LOWER(username) LIKE ?)
      ORDER BY verified DESC, created_at DESC
      LIMIT 50
    `),
    stmtGetAllUsers: db.prepare('SELECT * FROM users WHERE is_banned = 0 ORDER BY created_at DESC LIMIT 50'),
    stmtGetFollowersList: db.prepare(`
      SELECT u.id, u.name, u.username, u.avatar, u.verified, u.role, u.bio
      FROM user_follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ? AND u.is_banned = 0
      ORDER BY f.created_at DESC
      LIMIT 50
    `),
    stmtGetFollowingList: db.prepare(`
      SELECT u.id, u.name, u.username, u.avatar, u.verified, u.role, u.bio
      FROM user_follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ? AND u.is_banned = 0
      ORDER BY f.created_at DESC
      LIMIT 50
    `),
    stmtCountUserPosts: db.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?')
  };
}
