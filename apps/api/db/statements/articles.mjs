export function createArticlesStatements(db) {
  return {
    stmtGetArticlesAll: db.prepare(`
      SELECT a.*,
             u.name as author_name,
             u.username as author_username,
             u.avatar as author_avatar,
             u.role as author_role,
             u.verified as author_verified
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `),

    stmtGetArticlesByCategory: db.prepare(`
      SELECT a.*,
             u.name as author_name,
             u.username as author_username,
             u.avatar as author_avatar,
             u.role as author_role,
             u.verified as author_verified
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.category = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `),

    stmtCountArticlesAll: db.prepare('SELECT COUNT(*) as count FROM articles'),
    stmtCountArticlesByCategory: db.prepare('SELECT COUNT(*) as count FROM articles WHERE category = ?'),

    stmtGetArticleById: db.prepare(`
      SELECT a.*,
             u.name as author_name,
             u.username as author_username,
             u.avatar as author_avatar,
             u.role as author_role,
             u.verified as author_verified,
             u.bio as author_bio
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `),

    stmtGetArticleBySlug: db.prepare(`
      SELECT a.*,
             u.name as author_name,
             u.username as author_username,
             u.avatar as author_avatar,
             u.role as author_role,
             u.verified as author_verified,
             u.bio as author_bio
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.slug = ?
    `),

    stmtInsertArticle: db.prepare(`
      INSERT INTO articles (
        id, title, slug, content, summary, cover_image, author_id,
        category, tags, read_time_minutes, likes_count, views_count,
        comments_count, status, admin_notes, reviewed_at, reviewed_by,
        created_at, updated_at
      )
      VALUES (
        @id, @title, @slug, @content, @summary, @cover_image, @author_id,
        @category, @tags, @read_time_minutes, @likes_count, @views_count,
        @comments_count, @status, @admin_notes, @reviewed_at, @reviewed_by,
        @created_at, @updated_at
      )
    `),

    stmtUpdateArticle: db.prepare(`
      UPDATE articles
      SET title = @title,
          content = @content,
          summary = @summary,
          cover_image = @cover_image,
          category = @category,
          tags = @tags,
          read_time_minutes = @read_time_minutes,
          status = @status,
          updated_at = @updated_at
      WHERE id = @id
    `),

    stmtUpdateArticleStatus: db.prepare(`
      UPDATE articles
      SET status = @status,
          admin_notes = @admin_notes,
          reviewed_at = @reviewed_at,
          reviewed_by = @reviewed_by,
          updated_at = @updated_at
      WHERE id = @id
    `),

    stmtDeleteArticle: db.prepare('DELETE FROM articles WHERE id = ?'),
    stmtIncrementArticleViews: db.prepare('UPDATE articles SET views_count = views_count + 1 WHERE id = ?'),
    stmtIncrementArticleComments: db.prepare('UPDATE articles SET comments_count = comments_count + 1 WHERE id = ?'),
    stmtDecrementArticleComments: db.prepare('UPDATE articles SET comments_count = MAX(0, comments_count - 1) WHERE id = ?'),
    stmtIncrementArticleLikes: db.prepare('UPDATE articles SET likes_count = likes_count + 1 WHERE id = ?'),
    stmtDecrementArticleLikes: db.prepare('UPDATE articles SET likes_count = MAX(0, likes_count - 1) WHERE id = ?'),
    stmtGetArticleLikesCount: db.prepare('SELECT likes_count FROM articles WHERE id = ?'),

    // Likes
    stmtGetArticleLike: db.prepare('SELECT 1 FROM article_likes WHERE article_id = ? AND user_id = ?'),
    stmtInsertArticleLike: db.prepare('INSERT INTO article_likes (article_id, user_id, created_at) VALUES (?, ?, ?)'),
    stmtDeleteArticleLike: db.prepare('DELETE FROM article_likes WHERE article_id = ? AND user_id = ?'),
    stmtDeleteArticleLikes: db.prepare('DELETE FROM article_likes WHERE article_id = ?'),

    // Bookmarks
    stmtGetArticleBookmark: db.prepare('SELECT 1 FROM article_bookmarks WHERE article_id = ? AND user_id = ?'),
    stmtInsertArticleBookmark: db.prepare('INSERT INTO article_bookmarks (article_id, user_id, created_at) VALUES (?, ?, ?)'),
    stmtDeleteArticleBookmark: db.prepare('DELETE FROM article_bookmarks WHERE article_id = ? AND user_id = ?'),
    stmtDeleteArticleBookmarks: db.prepare('DELETE FROM article_bookmarks WHERE article_id = ?'),

    // Comments
    stmtGetArticleComments: db.prepare(`
      SELECT c.*,
             u.name as author_name,
             u.username as author_username,
             u.avatar as author_avatar,
             u.verified as author_verified
      FROM article_comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.article_id = ?
      ORDER BY c.created_at ASC
    `),

    stmtInsertArticleComment: db.prepare(`
      INSERT INTO article_comments (id, article_id, parent_id, author_id, content, likes_count, created_at)
      VALUES (@id, @article_id, @parent_id, @author_id, @content, @likes_count, @created_at)
    `),

    stmtDeleteArticleComment: db.prepare('DELETE FROM article_comments WHERE id = ?'),
    stmtGetArticleCommentById: db.prepare('SELECT * FROM article_comments WHERE id = ?'),
    stmtDeleteArticleComments: db.prepare('DELETE FROM article_comments WHERE article_id = ?')
  };
}
