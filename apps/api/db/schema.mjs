/**
 * Database Schema DDL for SQLite
 * Initializes all 19 relational tables and indexes
 */
export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'individual',
      phone TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      location TEXT DEFAULT 'الأردن',
      country TEXT DEFAULT 'الأردن',
      join_date TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      is_banned INTEGER DEFAULT 0,
      ban_reason TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      group_id TEXT,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      shares_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      timestamp_text TEXT NOT NULL,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      parent_id TEXT DEFAULT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      timestamp_text TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'عام',
      privacy TEXT DEFAULT 'عام',
      members_count INTEGER DEFAULT 1,
      posts_count INTEGER DEFAULT 0,
      cover_gradient TEXT DEFAULT '',
      accent_color TEXT DEFAULT '',
      rules TEXT DEFAULT '[]',
      creator_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'عضو',
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS petra_audit_logs (
      id TEXT PRIMARY KEY,
      admin_user TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'عام',
      date TEXT NOT NULL,
      time TEXT DEFAULT '',
      location TEXT DEFAULT '',
      location_type TEXT DEFAULT 'in_person',
      capacity INTEGER DEFAULT 100,
      attendees_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'متاح للتسجيل',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_registrations (
      activity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (activity_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'تقنية',
      level TEXT DEFAULT 'مبتدئ',
      duration TEXT DEFAULT '',
      total_hours INTEGER DEFAULT 0,
      lectures INTEGER DEFAULT 0,
      students INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      price TEXT DEFAULT 'مجاني',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_enrollments (
      course_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (course_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      actor_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      link TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS org_members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'عضو',
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      last_message TEXT DEFAULT '',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS direct_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_chat_settings (
      course_id TEXT PRIMARY KEY,
      permission_mode TEXT DEFAULT 'all',
      pinned_announcement TEXT DEFAULT '',
      slow_mode_seconds INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_chat_messages (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL DEFAULT 'student',
      content TEXT NOT NULL,
      is_announcement INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_chat_settings (
      activity_id TEXT PRIMARY KEY,
      permission_mode TEXT DEFAULT 'all',
      pinned_announcement TEXT DEFAULT '',
      slow_mode_seconds INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_chat_messages (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL DEFAULT 'participant',
      content TEXT NOT NULL,
      is_announcement INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS device_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_type TEXT DEFAULT 'web',
      token TEXT NOT NULL,
      endpoint TEXT,
      auth_key TEXT,
      p256dh_key TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
    CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
    CREATE TABLE IF NOT EXISTS backup_audit_logs (
      id TEXT PRIMARY KEY,
      trigger_type TEXT NOT NULL,
      status TEXT NOT NULL,
      tables_synced INTEGER DEFAULT 0,
      total_records INTEGER DEFAULT 0,
      discrepancies TEXT DEFAULT '[]',
      duration_ms INTEGER DEFAULT 0,
      details TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_direct_messages_conv ON direct_messages(conversation_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_course_chat_messages_course ON course_chat_messages(course_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_backup_audit_created_at ON backup_audit_logs(created_at DESC);
  `);

  try {
    db.exec("ALTER TABLE comments ADD COLUMN parent_id TEXT DEFAULT NULL;");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);");
  } catch {}

  try {
    db.exec("ALTER TABLE users ADD COLUMN last_seen_at INTEGER DEFAULT 0;");
  } catch {}
}
