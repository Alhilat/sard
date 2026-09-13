export function createPostsStatements(db) {
  return {
    stmtGetPosts: db.prepare(`
      SELECT p.*, u.name as author_name, u.username as author_username, u.avatar as author_avatar, u.role as author_role, u.verified as author_verified
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `),
    stmtGetGroupPosts: db.prepare(`
      SELECT p.*, u.name as author_name, u.username as author_username, u.avatar as author_avatar, u.role as author_role, u.verified as author_verified
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.group_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `),
    stmtGetPostById: db.prepare('SELECT * FROM posts WHERE id = ?'),
    stmtInsertPost: db.prepare(`
      INSERT INTO posts (id, author_id, content, tags, group_id, likes_count, comments_count, shares_count, created_at, timestamp_text)
      VALUES (@id, @author_id, @content, @tags, @group_id, @likes_count, @comments_count, @shares_count, @created_at, @timestamp_text)
    `),
    stmtDeletePost: db.prepare('DELETE FROM posts WHERE id = ?'),
    stmtIncrementPostComments: db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?'),
    stmtDecrementPostComments: db.prepare('UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?'),
    stmtIncrementPostShares: db.prepare('UPDATE posts SET shares_count = shares_count + 1 WHERE id = ?'),

    // Comments
    stmtGetComments: db.prepare(`
      SELECT c.*, u.name as author_name, u.username as author_username, u.avatar as author_avatar, u.verified as author_verified
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `),
    stmtInsertComment: db.prepare(`
      INSERT INTO comments (id, post_id, parent_id, author_id, content, likes_count, created_at, timestamp_text)
      VALUES (@id, @post_id, @parent_id, @author_id, @content, @likes_count, @created_at, @timestamp_text)
    `),
    stmtDeleteComment: db.prepare('DELETE FROM comments WHERE id = ?'),
    stmtGetCommentById: db.prepare('SELECT * FROM comments WHERE id = ?'),
    stmtDeletePostComments: db.prepare('DELETE FROM comments WHERE post_id = ?'),

    // Likes
    stmtGetLike: db.prepare('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?'),
    stmtInsertLike: db.prepare('INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)'),
    stmtDeleteLike: db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?'),
    stmtDeletePostLikes: db.prepare('DELETE FROM post_likes WHERE post_id = ?'),
    stmtIncrementPostLikes: db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?'),
    stmtDecrementPostLikes: db.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?'),
    stmtGetPostLikesCount: db.prepare('SELECT likes_count FROM posts WHERE id = ?'),
    stmtGetPostSharesCount: db.prepare('SELECT shares_count FROM posts WHERE id = ?')
  };
}
