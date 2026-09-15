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

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      summary TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      author_id TEXT NOT NULL,
      category TEXT DEFAULT 'عام',
      tags TEXT DEFAULT '[]',
      read_time_minutes INTEGER DEFAULT 3,
      likes_count INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'approved',
      admin_notes TEXT DEFAULT '',
      reviewed_at INTEGER DEFAULT NULL,
      reviewed_by TEXT DEFAULT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_comments (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      parent_id TEXT DEFAULT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_likes (
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (article_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS article_bookmarks (
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (article_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_direct_messages_conv ON direct_messages(conversation_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_course_chat_messages_course ON course_chat_messages(course_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_backup_audit_created_at ON backup_audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_article_comments_parent ON article_comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
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

  try {
    db.exec("ALTER TABLE articles ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';");
  } catch {}

  try {
    db.exec("ALTER TABLE articles ADD COLUMN admin_notes TEXT DEFAULT '';");
  } catch {}

  try {
    db.exec("ALTER TABLE articles ADD COLUMN reviewed_at INTEGER DEFAULT NULL;");
  } catch {}

  try {
    db.exec("ALTER TABLE articles ADD COLUMN reviewed_by TEXT DEFAULT NULL;");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);");
  } catch {}

  // Seed sample articles if none exist
  try {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    if (countRow && countRow.count === 0) {
      // Find or establish an author
      let author = db.prepare("SELECT id FROM users WHERE role = 'org' OR username = 'demo' LIMIT 1").get();
      if (!author) {
        author = db.prepare("SELECT id FROM users LIMIT 1").get();
      }
      const authorId = author ? author.id : 'sard_editorial';

      const now = Date.now();
      const insertArticleStmt = db.prepare(`
        INSERT INTO articles (
          id, title, slug, content, summary, cover_image, author_id, category, tags,
          read_time_minutes, likes_count, views_count, comments_count, created_at, updated_at
        ) VALUES (
          @id, @title, @slug, @content, @summary, @cover_image, @author_id, @category, @tags,
          @read_time_minutes, @likes_count, @views_count, @comments_count, @created_at, @updated_at
        )
      `);

      const seedArticles = [
        {
          id: 'art_seed_vite_perf',
          title: 'تجربتنا في تسريع بناء تطبيقات الويب بنسبة 60% باستخدام Vite',
          slug: 'optimizing-web-builds-with-vite',
          category: 'برمجة وتطوير',
          summary: 'مقارنة عملية بين أدوات التجميع التقليدية وVite، وكيف ساعدنا تقسيم الحزم (Code Splitting) وإدارة التبعيات في خفض زمن التحميل للمستخدمين.',
          cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
          read_time_minutes: 4,
          likes_count: 28,
          views_count: 340,
          comments_count: 2,
          created_at: now - 86400000 * 2,
          updated_at: now - 86400000 * 2,
          tags: JSON.stringify(['تطوير_الويب', 'أداء', 'Vite', 'JavaScript']),
          content: `مع نمو حجم تطبيق الويب وزيادة عدد المكونات والحزم الخارجية، بدأنا نلاحظ بطئاً ملحوظاً في وقت تشغيل الخادم المحلي (Dev Server) وزمن إعادة التحميل عند كل تعديل. في الأدوات القديمة المعتمدة على تجميع كامل المشروع في الذاكرة مسبقاً، كان المطور ينتظر عدة ثوانٍ لرؤية نتيجة أي تعديل بسيط في ملف CSS أو مكون واجهة.

قررنا نقل بيئة التطوير إلى Vite للاستفادة من محرك ES Modules الأصيل في المتصفحات. الميزة الجوهرية هنا أن Vite لا يقوم بتجميع كامل الكود عند الإقلاع، بل يقوم بتحويل ومعالجة الملف المطلوب فقط عند طلبه من المتصفح عبر نظام On-demand compilation مدعوماً بمحرك esbuild المكتوب بلغة Go لمعالجة الحزم الخارجية بسرعة تفوق الأدوات المبنية بـ JavaScript بعشرات المرات.

أما في مرحلة الإنتاج (Production Build)، فقد اعتمدنا استراتيجية Rollup manualChunks لتقسيم الكود إلى حزم منفصلة. بدلاً من إرسال ملف جافاسكريبت ضخم يحتوي على مكتبات الرسوم البيانية وأدوات التحليل، قمنا بفصل المكتبات الكبيرة مثل Recharts وLucide في حزم مستقلة يتم تحميلها فقط في الصفحات التي تحتاجها بالفعل عبر React.lazy وdynamic imports.

النتيجة العملية كانت انخفاضاً بنسبة 60% في حجم الحزمة الأولية التي يحملها المستخدم عند أول زيارة للمنصة، وتراجع زمن التحديث اللحظي (HMR) من 1.8 ثانية إلى أقل من 80 ميلي ثانية، مما انعكس مباشرة على إنتاجية فريق التطوير وسرعة استجابة التطبيق.`
        },
        {
          id: 'art_seed_rtl_design',
          title: 'دليل عملي لتصميم وبرمجة الواجهات العربية (RTL)',
          slug: 'practical-rtl-ui-design-guide',
          category: 'تصميم وتجربة المستخدم',
          summary: 'أهم القواعد والتفاصيل الدقيقة التي يغفل عنها المصممون عند تعريب الواجهات، من اتجاه الأيقونات ومحاذاة النصوص إلى تناسق تباعد الأسطر.',
          cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
          read_time_minutes: 5,
          likes_count: 42,
          views_count: 510,
          comments_count: 0,
          created_at: now - 86400000 * 4,
          updated_at: now - 86400000 * 4,
          tags: JSON.stringify(['تصميم_الواجهات', 'تجربة_المستخدم', 'RTL', 'تايبوغرافي']),
          content: `تحويل واجهة المستخدم من اليسار إلى اليمين (RTL) لا يقتصر على كتابة dir="rtl" في عنصر html الرئيسي؛ فهناك تفاصيل هندسية وتصميمية تصنع الفارق بين تطبيق يبدو وكأنه مترجم آلياً، وتطبيق مصمم أصلاً ليناسب المستخدم العربي.

أول هذه التفاصيل هو التمييز بين الأيقونات التي تعبر عن اتجاه والأيقونات ذات الطبيعة الثابتة. على سبيل المثال، أيقونات الأسهم والتنقل مثل العودة للأمام والخلف يجب عكس اتجاهها لأنها ترتبط بتسلسل القراءة والزمن، بينما أيقونات مثل علامة الصح، الساعة، الكاميرا، أو أزرار التحكم في الصوت وتشغيل الوسائط لا يجوز عكسها لأنها تمثل كائنات فيزيائية موحدة عالمياً.

التحدي الثاني يكمن في التايبوغرافي ومحاذاة النصوص. تتطلب الحروف العربية عادة مسافة رأسية (Line Height) أكبر قليلاً مقارنة بالحروف اللاتينية بسبب وجود علامات التشكيل والنقاط التي تعلو الحروف وتنزل تحت السطر. استخدام خطوط حديثة مثل Inter للنصوص الإنجليزية مع خط عربي متناسق مثل Cairo أو IBM Plex Sans Arabic يضمن الحفاظ على وزن موحد وتجربة قراءة سلسة ومريحة للعين.

كذلك في الواجهات الحديثة التي تدعم لغات متعددة، يُنصح بشدة بالاعتماد على خصائص CSS المنطقية (CSS Logical Properties) مثل margin-inline-start وpadding-inline-end بدلاً من margin-left وmargin-right الثابتة. هذا الأسلوب يختصر مئات الأسطر في ملفات التنسيق ويتيح للتطبيق التكيف تلقائياً وبكفاءة عالية مع أي لغة دون الحاجة لكتابة استثناءات مخصصة.`
        },
        {
          id: 'art_seed_sqlite_wal',
          title: 'إدارة قواعد البيانات المحلية في بيئات الإنتاج: دروس من استخدام SQLite مع WAL',
          slug: 'sqlite-wal-mode-production-lessons',
          category: 'قواعد بيانات',
          summary: 'لماذا اخترنا SQLite مع نمط WAL في خوادمنا، وكيف نتعامل مع التزامن، النسخ الاحتياطي التلقائي، وتفادي قفل الجداول.',
          cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
          read_time_minutes: 4,
          likes_count: 31,
          views_count: 290,
          comments_count: 0,
          created_at: now - 86400000 * 6,
          updated_at: now - 86400000 * 6,
          tags: JSON.stringify(['قواعد_بيانات', 'SQLite', 'هندسة_البرمجيات', 'أداء']),
          content: `هناك اعتقاد شائع بأن SQLite مناسب فقط للتطبيقات البسيطة أو أثناء مرحلة التطوير، لكن الواقع المعماري يثبت عكس ذلك عند ضبط إعدادات المحرك بالشكل الصحيح. في بيئات التشغيل الحقيقية، يوفر SQLite سرعة استعلام استثنائية نظراً لأنه يعمل داخل نفس مساحة الذاكرة الخاصة بالتطبيق دون تكلفة اتصالات الشبكة (Zero-network latency).

لتحقيق أداء عالي في بيئة متعددة المستخدمين، الخطوة الأولى والأساسية هي تفعيل نمط WAL (Write-Ahead Logging). في النمط التقليدي (Rollback Journal)، كانت عمليات القراءة تُقفل عند وجود كتابة جارية. أما مع نمط WAL، فإن القراء لا يمنعون الكتاب، والكتاب لا يمنعون القراء، مما يسمح بتنفيذ مئات الاستعلامات المتزامنة بسلاسة تامة.

بالإضافة إلى ذلك، قمنا بضبط pragma synchronous = NORMAL لتقليل عدد عمليات الكتابة المباشرة على القرص الصلب مع الحفاظ على سلامة البيانات ضد انهيار التطبيق، مع رفع حجم ذاكرة التخزين المؤقت (cache_size) واختيار PRAGMA temp_store = MEMORY للاحتفاظ بالجداول المؤقتة وعمليات الفرز داخل الرام مباشرة.

أما فيما يخص النسخ الاحتياطي، فإن التحدي مع ملفات SQLite هو تجنب أخذ لقطات أثناء كتابة غير مكتملة. الحل كان الاعتماد على نقطة تفتيش غير مانعة (PRAGMA wal_checkpoint(PASSIVE)) قبل التقاط النسخة، ثم رفع اللقطة المشفرة إلى قاعدة بيانات سحابية متزامنة، مما يضمن أمان البيانات واستعادتها الفورية في حال حدوث أي طارئ.`
        }
      ];

      for (const art of seedArticles) {
        insertArticleStmt.run({
          ...art,
          author_id: authorId,
        });
      }

      // Add a couple of realistic comments to the first article
      const insertCommentStmt = db.prepare(`
        INSERT INTO article_comments (id, article_id, parent_id, author_id, content, likes_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertCommentStmt.run('art_comm_1', 'art_seed_vite_perf', null, authorId, 'مقال ممتاز وواقعي جداً. هل واجهتم أي مشاكل توافق مع بعض حزم CommonJS القديمة عند الانتقال إلى Vite؟', 3, now - 86400000);
      insertCommentStmt.run('art_comm_2', 'art_seed_vite_perf', 'art_comm_1', authorId, 'أغلب الحزم الحديثة تدعم ESM بشكل أصيل الآن، وبالنسبة للحزم النادرة القديمة اعتمدنا على vite plugin للتحويل التلقائي.', 2, now - 43200000);
    }
  } catch (seedErr) {
    console.error('Error seeding articles:', seedErr.message);
  }
}
