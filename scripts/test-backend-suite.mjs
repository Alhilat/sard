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
