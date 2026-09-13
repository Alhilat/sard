/**
 * Automated Verification Script for Backend Security & Performance Fixes
 */

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Running Backend Security & Scalability Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ──────────────────────────────────────────────────────────
  // TEST 1: usr_ Backdoor Rejection
  // ──────────────────────────────────────────────────────────
  console.log('[Test 1] Testing rejection of forged usr_ token...');
  const forgedRes = await fetch(`${BASE_URL}/api/users/me`, {
    headers: { Authorization: 'Bearer usr_1788746394160_77' }
  });
  assert(forgedRes.status === 401, `Forged usr_ token must be rejected with 401 (got ${forgedRes.status})`);

  // ──────────────────────────────────────────────────────────
  // TEST 2: Valid JWT Authentication & Async Bcrypt Registration
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 2] Testing User Registration & Async Bcrypt Hashing...');
  const testEmailA = `test_user_a_${Date.now()}@sard.test`;
  const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmailA,
      password: 'StrongPassword123!',
      full_name: 'المستخدم التجريبي أ',
    })
  });
  const regDataA = await regResA.json();
  assert(regResA.status === 201 && regDataA.token, `Registration succeeds with JWT token`);
  const tokenA = regDataA.token;
  const userA = regDataA.user;

  console.log('Testing User Login & Async Bcrypt Compare...');
  const loginResA = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmailA,
      password: 'StrongPassword123!',
    })
  });
  const loginDataA = await loginResA.json();
  assert(loginResA.status === 200 && loginDataA.token, `Login succeeds with valid JWT`);

  // Verify /me with genuine JWT
  const meRes = await fetch(`${BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.id === userA.id, `Valid JWT authenticates correctly to /me`);

  // ──────────────────────────────────────────────────────────
  // TEST 3: Petra Admin Backdoor Rejection & Session Verification
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 3] Testing Petra Fake Session Rejection...');
  const fakePetraRes = await fetch(`${BASE_URL}/api/petra/stats`, {
    headers: { Authorization: 'Bearer petra_session_fake_attacker_token_999' }
  });
  assert(fakePetraRes.status === 401, `Forged petra_session_ must be rejected with 401 (got ${fakePetraRes.status})`);

  console.log('Testing Valid Petra Login & Session Verification...');
  const petraLoginRes = await fetch(`${BASE_URL}/api/petra/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'petra', password: 'petra2026' })
  });
  const petraLoginData = await petraLoginRes.json();
  assert(petraLoginRes.status === 200 && petraLoginData.token, `Petra login succeeds`);
  const petraToken = petraLoginData.token;

  // Access stats with real petra session
  const petraStatsRes = await fetch(`${BASE_URL}/api/petra/stats`, {
    headers: { Authorization: `Bearer ${petraToken}` }
  });
  const petraStatsData = await petraStatsRes.json();
  assert(petraStatsRes.status === 200 && petraStatsData.stats, `Petra stats accessible with real session`);
  assert(
    typeof petraStatsData.stats.totalArticles === 'number' && typeof petraStatsData.stats.totalArticleComments === 'number',
    `Petra stats include totalArticles and totalArticleComments metrics`
  );

  // Access articles with petra session
  const petraArticlesRes = await fetch(`${BASE_URL}/api/petra/articles`, {
    headers: { Authorization: `Bearer ${petraToken}` }
  });
  const petraArticlesData = await petraArticlesRes.json();
  assert(
    petraArticlesRes.status === 200 && Array.isArray(petraArticlesData.articles),
    `Petra articles endpoint accessible with real session (${petraArticlesData.articles?.length} articles)`
  );

  // Logout from Petra
  const petraLogoutRes = await fetch(`${BASE_URL}/api/petra/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${petraToken}` }
  });
  assert(petraLogoutRes.status === 200, `Petra logout succeeds`);

  // Session must now be revoked
  const revokedStatsRes = await fetch(`${BASE_URL}/api/petra/stats`, {
    headers: { Authorization: `Bearer ${petraToken}` }
  });
  assert(revokedStatsRes.status === 401, `Revoked Petra session is rejected with 401 (got ${revokedStatsRes.status})`);

  // ──────────────────────────────────────────────────────────
  // TEST 4: IDOR Protection in Direct Messages
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 4] Testing IDOR & Broken Access Control on Messages...');
  // Create User B
  const testEmailB = `test_user_b_${Date.now()}@sard.test`;
  const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmailB,
      password: 'StrongPassword123!',
      full_name: 'المستخدم التجريبي ب',
    })
  });
  const regDataB = await regResB.json();
  const tokenB = regDataB.token;
  const userB = regDataB.user;

  // Create User C (Attacker / Intruder)
  const testEmailC = `test_user_c_${Date.now()}@sard.test`;
  const regResC = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmailC,
      password: 'StrongPassword123!',
      full_name: 'المستخدم الدخيل ج',
    })
  });
  const regDataC = await regResC.json();
  const tokenC = regDataC.token;

  // User A starts conversation with User B
  const startConvRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({ recipientId: userB.id })
  });
  const startConvData = await startConvRes.json();
  const convId = startConvData.conversation?.id;
  assert(Boolean(convId), `Conversation between User A and User B created (${convId})`);

  // User A sends message
  const sendMsgRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({ content: 'رسالة خاصة وسرية بين أ وب' })
  });
  assert(sendMsgRes.status === 201, `Participant User A can post message to conversation`);

  // Intruder User C attempts to READ conversation messages (IDOR Attack)
  const idorReadRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenC}` }
  });
  assert(idorReadRes.status === 403, `Intruder User C cannot read conversation (blocked with 403, got ${idorReadRes.status})`);

  // Intruder User C attempts to SEND message into conversation (IDOR Attack)
  const idorSendRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenC}`
    },
    body: JSON.stringify({ content: 'رسالة متطفلة غير مصرح بها' })
  });
  assert(idorSendRes.status === 403, `Intruder User C cannot send message into conversation (blocked with 403, got ${idorSendRes.status})`);

  // Legitimate Participant User B reads conversation
  const userBReadRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const userBReadData = await userBReadRes.json();
  assert(userBReadRes.status === 200 && userBReadData.messages?.length > 0, `Participant User B can read messages`);

  // ──────────────────────────────────────────────────────────
  // TEST 5: Rate Limiting Headers
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 5] Testing Rate Limiting Headers...');
  const rateLimitCheckRes = await fetch(`${BASE_URL}/api/posts`);
  const limitHeader = rateLimitCheckRes.headers.get('x-ratelimit-limit');
  const remainingHeader = rateLimitCheckRes.headers.get('x-ratelimit-remaining');
  assert(Boolean(limitHeader && remainingHeader), `Rate limit headers present (Limit: ${limitHeader}, Remaining: ${remainingHeader})`);

  // ──────────────────────────────────────────────────────────
  // TEST 6: Feed Like Lookups (N+1 Query Elimination)
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 6] Testing Feed Batched Like Lookups...');
  const feedRes = await fetch(`${BASE_URL}/api/posts`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const feedData = await feedRes.json();
  assert(feedRes.status === 200 && Array.isArray(feedData.posts), `Feed loads successfully with batched like queries (${feedData.posts.length} posts)`);

  // ──────────────────────────────────────────────────────────
  // TEST 7: Threaded Nested Comments (Reply-on-Reply)
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 7] Testing Threaded Comment Reply...');
  if (feedData.posts.length > 0) {
    const postId = feedData.posts[0].id;
    // 1. Post parent comment
    const pCommentRes = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ content: 'تعليق رئيسي جديد' })
    });
    const pCommentData = await pCommentRes.json();
    const parentCommentId = pCommentData.comment?.id;

    // 2. Post child reply with parentId
    const replyRes = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        content: 'رد فرعي متداخل على التعليق الرئيسي',
        parentId: parentCommentId
      })
    });
    const replyData = await replyRes.json();
    assert(replyData.success && replyData.comment?.parentId === parentCommentId, `Nested reply linked to parentId correctly`);
  }

  // ──────────────────────────────────────────────────────────
  // TEST 8: Real-Time Presence & "نشط الآن" Engine
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 8] Testing Real-Time Presence & نشط الآن Engine...');
  // Send heartbeat for User A
  const hbRes = await fetch(`${BASE_URL}/api/users/heartbeat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const hbData = await hbRes.json();
  assert(hbRes.status === 200 && hbData.online === true && hbData.statusText === 'نشط الآن', `Heartbeat sets status to نشط الآن`);

  // Verify User A presence endpoint
  const presRes = await fetch(`${BASE_URL}/api/users/${userA.id}/presence`);
  const presData = await presRes.json();
  assert(presData.online === true && presData.statusText === 'نشط الآن', `User A presence query confirms نشط الآن`);

  // Verify Conversation object includes real presence
  const convListRes = await fetch(`${BASE_URL}/api/conversations`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const convListData = await convListRes.json();
  const convWithA = convListData.conversations?.find((c) => c.user.id === userA.id);
  assert(convWithA && convWithA.user.online === true && convWithA.user.statusText === 'نشط الآن', `User B sees User A as نشط الآن in real time`);

  // Mark User A offline (simulating tab close / logout)
  const offRes = await fetch(`${BASE_URL}/api/users/offline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(offRes.status === 200, `User A offline beacon recorded`);

  // Re-verify presence
  const presOffRes = await fetch(`${BASE_URL}/api/users/${userA.id}/presence`);
  const presOffData = await presOffRes.json();
  assert(presOffData.online === false, `User A presence query reflects offline after disconnect`);

  // ──────────────────────────────────────────────────────────
  // TEST 9: Direct Notification Links & Auto-Clearing on Read
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 9] Testing Notification Direct Links & Auto-Clearing...');
  // 1. Send message from User A to User B and check notification deep link
  const notifMsgRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: 'مرحبا، هذا اختبار الرابط المباشر للإشعار' })
  });
  assert(notifMsgRes.status === 200 || notifMsgRes.status === 201, `Message sent successfully (status: ${notifMsgRes.status})`);

  const notifsListRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const notifsListData = await notifsListRes.json();
  const msgNotif = notifsListData.notifications?.find(
    (n) => n.type === 'message' && n.user?.id === userA.id
  );
  assert(
    msgNotif && msgNotif.link === `/app/messages?user=${userA.id}`,
    `Message notification contains direct link to sender chat: ${msgNotif?.link}`
  );

  // 2. User B opens/reads the conversation messages -> should auto-clear message notification
  const readConvRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  assert(readConvRes.status === 200, `User B opened conversation messages`);

  // Check that message notification is now marked read
  const updatedNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const updatedNotifsData = await updatedNotifsRes.json();
  const updatedMsgNotif = updatedNotifsData.notifications?.find((n) => n.id === msgNotif?.id);
  assert(
    updatedMsgNotif && updatedMsgNotif.read === true,
    `Message notification automatically marked read when conversation was opened`
  );

  // 3. Test mark-type-read endpoint
  const markTypeRes = await fetch(`${BASE_URL}/api/notifications/mark-type-read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'message' })
  });
  const markTypeData = await markTypeRes.json();
  assert(markTypeRes.status === 200 && markTypeData.success === true, `mark-type-read endpoint works correctly`);

  // ──────────────────────────────────────────────────────────
  // TEST 10: Articles System (Public Access, 500-Char Min, Replies & Likes)
  // ──────────────────────────────────────────────────────────
  console.log('\n[Test 10] Testing Articles System (Public Access, 500-Char Min, Replies & Likes)...');

  // 1. Unauthenticated public access to list of articles (SEO & Guests)
  const publicArticlesRes = await fetch(`${BASE_URL}/api/articles`);
  const publicArticlesData = await publicArticlesRes.json();
  assert(
    publicArticlesRes.status === 200 && Array.isArray(publicArticlesData.articles) && publicArticlesData.articles.length > 0,
    `Unauthenticated guest can fetch articles list without login (${publicArticlesData.articles?.length || 0} articles found)`
  );

  const sampleArticle = publicArticlesData.articles[0];

  // 2. Unauthenticated public access to single article by slug or ID
  const publicSingleRes = await fetch(`${BASE_URL}/api/articles/${sampleArticle.slug || sampleArticle.id}`);
  const publicSingleData = await publicSingleRes.json();
  assert(
    publicSingleRes.status === 200 && publicSingleData.article?.id === sampleArticle.id,
    `Unauthenticated guest can read complete article content without login`
  );

  // 3. Unauthenticated public access to article comments
  const publicCommentsRes = await fetch(`${BASE_URL}/api/articles/${sampleArticle.id}/comments`);
  const publicCommentsData = await publicCommentsRes.json();
  assert(
    publicCommentsRes.status === 200 && Array.isArray(publicCommentsData.comments),
    `Unauthenticated guest can view discussion thread and comments on article`
  );

  // 4. Unauthenticated attempt to like must fail with 401
  const guestLikeRes = await fetch(`${BASE_URL}/api/articles/${sampleArticle.id}/like`, { method: 'POST' });
  assert(guestLikeRes.status === 401, `Unauthenticated guest cannot like article (blocked with 401, got ${guestLikeRes.status})`);

  // 5. Unauthenticated attempt to comment must fail with 401
  const guestCommentRes = await fetch(`${BASE_URL}/api/articles/${sampleArticle.id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'تعليق زائر غير مسجل' })
  });
  assert(guestCommentRes.status === 401, `Unauthenticated guest cannot comment on article (blocked with 401, got ${guestCommentRes.status})`);

  // 6. Strict validation: Publishing article with < 500 characters must fail with 400
  const shortArticleText = 'هذا نص تجريبي قصير جداً ولا يبلغ الحد الأدنى المطلوب للمقال في المنصة.';
  const shortArticleRes = await fetch(`${BASE_URL}/api/articles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'مقال قصير مرفوض لا يتجاوز الحد الأدنى',
      content: shortArticleText,
      category: 'تقنية'
    })
  });
  const shortArticleData = await shortArticleRes.json();
  assert(
    shortArticleRes.status === 400 && shortArticleData.message.includes('500'),
    `Article creation rejected when content is under 500 characters (${shortArticleText.length} chars, got 400)`
  );

  // 7. Publishing article with >= 500 characters succeeds with 201
  const validArticleText = `
    عند بناء واجهات برمجة التطبيقات (APIs) لتطبيقات الويب الحديثة، نواجه تحديات حقيقية تتعلق بزمن الاستجابة وإدارة اتصالات قواعد البيانات المتزامنة. في هذا الدليل العملي، نستعرض الاستراتيجيات المعمارية التي اعتمدناها لتقليل زمن معالجة الطلبات إلى أقل من 20 ميلي ثانية.

    أولاً، تفعيل نمط WAL (Write-Ahead Logging) في SQLite سمح لنا بإجراء عمليات القراءة بالتوازي دون إغلاق قاعدة البيانات، مما رفع قدرة الخادم على استقبال الطلبات المتزامنة بنسبة 300%. ثانياً، استخدام الاستعلامات المجهزة مسبقاً (Prepared Statements) خفض استهلاك المعالج وتكلفة تفسير استعلامات SQL في كل طلب. هذه التحسينات أحدثت فرقاً ملموساً في تجربة المستخدم وسرعة استجابة المنصة واستقرارها تحت الضغط العالي.
  `.trim();

  const validArticleRes = await fetch(`${BASE_URL}/api/articles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'تجربة عملية في بناء واجهات برمجة التطبيقات عالية الأداء',
      content: validArticleText,
      category: 'برمجة وتطوير',
      tags: ['برمجة', 'أداء', 'واجهات-برمجية', 'قواعد-بيانات']
    })
  });
  const validArticleData = await validArticleRes.json();
  assert(
    validArticleRes.status === 201 && validArticleData.success === true && validArticleData.article?.id,
    `Article with >= 500 characters created successfully (Length: ${validArticleText.length} chars, status 201)`
  );
  const createdArticleId = validArticleData.article?.id;

  // 8. Authenticated user like & bookmark toggle
  const authLikeRes = await fetch(`${BASE_URL}/api/articles/${createdArticleId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const authLikeData = await authLikeRes.json();
  assert(authLikeRes.status === 200 && authLikeData.isLiked === true, `Authenticated user B can like article`);

  const authBookmarkRes = await fetch(`${BASE_URL}/api/articles/${createdArticleId}/bookmark`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const authBookmarkData = await authBookmarkRes.json();
  assert(authBookmarkRes.status === 200 && authBookmarkData.isBookmarked === true, `Authenticated user B can bookmark article`);

  // 9. Authenticated comments and threaded replies
  const addCommentRes = await fetch(`${BASE_URL}/api/articles/${createdArticleId}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: 'مقال متميز ورؤية عملية واضحة في تحسين الأداء.' })
  });
  const addCommentData = await addCommentRes.json();
  assert(
    addCommentRes.status === 201 && addCommentData.comment?.id,
    `Authenticated user B can comment on article`
  );
  const rootCommentId = addCommentData.comment?.id;

  // Threaded reply to root comment
  const addReplyRes = await fetch(`${BASE_URL}/api/articles/${createdArticleId}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'شكراً لك، سننشر لاحقاً تفاصيل مقاييس الأداء بعد التحديث الأخير.',
      parentId: rootCommentId
    })
  });
  const addReplyData = await addReplyRes.json();
  assert(
    addReplyRes.status === 201 && addReplyData.comment?.parentId === rootCommentId,
    `Threaded reply linked correctly to parent comment ID in article discussion`
  );

  // 10. Clean up test article via DELETE endpoint
  const deleteRes = await fetch(`${BASE_URL}/api/articles/${createdArticleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const deleteData = await deleteRes.json();
  assert(
    deleteRes.status === 200 && deleteData.success === true,
    `Author can delete test article cleanly (status 200)`
  );

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  Suite Finished: ${passed} Passed, ${failed} Failed`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script exception:', err);
  process.exit(1);
});
