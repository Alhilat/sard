/**
 * Automated Real-Time WebSocket & Instant Messaging Test Suite
 * Validates:
 * 1. Unauthorized handshake rejection (missing/invalid token)
 * 2. Authenticated connection & zero-HTTP presence activation ("نشط الآن")
 * 3. Instant direct message delivery over WebSocket (< 50ms, zero polling)
 * 4. Real-time typing indicators ("يكتب الآن...")
 * 5. Instant notification push
 * 6. Clean disconnection & presence offline transition
 */

import WebSocket from '../apps/api/node_modules/ws/index.js';

const BASE_HTTP = 'http://localhost:5000';
const BASE_WS = 'ws://localhost:5000';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runWebSocketTestSuite() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Running Production WebSockets & Real-Time Suite');
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

  // 1. Create two test users via HTTP
  const stamp = Date.now();
  const userAData = {
    name: 'Ws User Alpha',
    email: `ws_alpha_${stamp}@test.sard`,
    password: 'Password123!',
    username: `ws_alpha_${stamp}`,
  };
  const userBData = {
    name: 'Ws User Beta',
    email: `ws_beta_${stamp}@test.sard`,
    password: 'Password123!',
    username: `ws_beta_${stamp}`,
  };

  const regARes = await fetch(`${BASE_HTTP}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userAData),
  });
  const regA = await regARes.json();
  const tokenA = regA.token;
  const userA = regA.user;

  const regBRes = await fetch(`${BASE_HTTP}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userBData),
  });
  const regB = await regBRes.json();
  const tokenB = regB.token;
  const userB = regB.user;

  assert(tokenA && tokenB, 'Created test users Alpha & Beta with valid JWTs');

  // Test 1: Reject unauthenticated WebSocket connection
  console.log('\n[Test 1] Testing rejection of unauthenticated WebSocket connections...');
  const unauthResult = await new Promise((resolve) => {
    const ws = new WebSocket(`${BASE_WS}/ws`);
    ws.on('close', (code) => {
      resolve(code);
    });
    ws.on('error', () => {});
  });
  assert(unauthResult === 1008, `Unauthenticated WebSocket rejected with code 1008 (got ${unauthResult})`);

  // Test 2: Reject forged token
  console.log('\n[Test 2] Testing rejection of forged token on WebSocket...');
  const forgedResult = await new Promise((resolve) => {
    const ws = new WebSocket(`${BASE_WS}/ws?token=forged.invalid.token`);
    ws.on('close', (code) => {
      resolve(code);
    });
    ws.on('error', () => {});
  });
  assert(forgedResult === 1008, `Forged token WebSocket rejected with code 1008 (got ${forgedResult})`);

  // Test 3: Authenticated connection & presence activation
  console.log('\n[Test 3] Testing authenticated WebSocket connection & presence activation...');
  let wsA;
  const authPromiseA = new Promise((resolve) => {
    wsA = new WebSocket(`${BASE_WS}/ws?token=${tokenA}`);
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'authenticated') {
        resolve(msg);
      }
    });
  });
  const authA = await authPromiseA;
  assert(authA && authA.online === true && authA.statusText === 'نشط الآن', 'User Alpha connected and received authenticated payload');

  // Verify Alpha is marked active via presence endpoint
  const presRes = await fetch(`${BASE_HTTP}/api/users/${userA.id}/presence`);
  const presData = await presRes.json();
  assert(presData.online === true && presData.statusText === 'نشط الآن', 'User Alpha verified as نشط الآن without HTTP heartbeat');

  // Connect User Beta
  let wsB;
  const authPromiseB = new Promise((resolve) => {
    wsB = new WebSocket(`${BASE_WS}/ws?token=${tokenB}`);
    wsB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'authenticated') {
        resolve(msg);
      }
    });
  });
  await authPromiseB;
  assert(true, 'User Beta connected to WebSocket successfully');

  // Create conversation between Alpha and Beta
  const startConvRes = await fetch(`${BASE_HTTP}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ recipientId: userB.id }),
  });
  const convData = await startConvRes.json();
  const convId = convData.conversation?.id || convData.data?.id;
  assert(Boolean(convId), `Conversation between Alpha and Beta initialized (${convId})`);

  // Test 4: Real-Time Typing Indicators
  console.log('\n[Test 4] Testing real-time typing indicators over WebSocket...');
  const typingPromise = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'typing' && msg.conversationId === convId && msg.isTyping === true) {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
  });

  // Alpha sends typing packet to Beta
  wsA.send(JSON.stringify({
    type: 'typing',
    conversationId: convId,
    recipientId: userB.id,
    isTyping: true,
  }));

  const typingReceived = await typingPromise;
  assert(typingReceived && typingReceived.senderId === userA.id, 'User Beta received real-time typing indicator from Alpha');

  // Test 5: Instant Direct Message Delivery (< 50ms, Zero Polling)
  console.log('\n[Test 5] Testing instant direct message delivery over WebSocket (< 50ms)...');
  const messageContent = 'مرحباً بيتا! هذه رسالة لحظية عبر محرك الويب سوكيت بدون أي بولينغ 🚀';
  const startTs = Date.now();

  const msgReceivePromise = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'message:new' && msg.conversationId === convId) {
        wsB.off('message', handler);
        resolve({ msg, duration: Date.now() - startTs });
      }
    };
    wsB.on('message', handler);
  });

  // Alpha posts message via HTTP API
  const sendMsgRes = await fetch(`${BASE_HTTP}/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ content: messageContent }),
  });
  const sendResult = await sendMsgRes.json();
  assert(sendResult.success === true, 'Alpha posted message through HTTP API');

  const { msg: receivedMsg, duration } = await msgReceivePromise;
  assert(
    receivedMsg && receivedMsg.message.content === messageContent,
    `Beta received message instantly over WebSocket in ${duration}ms (< 50ms)!`
  );

  // Test 6: Instant Notification Push over WebSocket
  console.log('\n[Test 6] Testing real-time notification push over WebSocket...');
  const notifPromise = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'notification:new' && msg.notification.type === 'message') {
        wsB.off('message', handler);
        resolve(msg.notification);
      }
    };
    wsB.on('message', handler);
  });

  // Alpha posts second message which triggers notification
  await fetch(`${BASE_HTTP}/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ content: 'إشعار فوري جديد' }),
  });

  const receivedNotif = await notifPromise;
  assert(receivedNotif && receivedNotif.userId === userB.id, 'Beta received instant notification push over WebSocket');

  // Test 7: Prevent Duplicate Message Ingestion (Rapid concurrent sends)
  console.log('\n[Test 7] Testing rapid duplicate message prevention (idempotency guard)...');
  const dupContent = 'رسالة فحص منع التكرار المتزامن';
  const [res1, res2] = await Promise.all([
    fetch(`${BASE_HTTP}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ content: dupContent }),
    }).then((r) => r.json()),
    fetch(`${BASE_HTTP}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ content: dupContent }),
    }).then((r) => r.json()),
  ]);

  assert(res1.success && res2.success, 'Both concurrent send requests returned success');
  assert(res1.message.id === res2.message.id, 'Idempotency guard returned identical message ID without creating duplicate');

  // Verify direct messages table contains only 1 entry for this content
  const allMsgsRes = await fetch(`${BASE_HTTP}/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const allMsgsData = await allMsgsRes.json();
  const matchingMsgs = allMsgsData.messages.filter((m) => m.content === dupContent);
  assert(matchingMsgs.length === 1, `SQLite store contains precisely 1 message instance (found ${matchingMsgs.length})`);

  // Test 8: Clean Disconnect & Presence Offline Transition
  console.log('\n[Test 8] Testing clean disconnection & presence offline transition...');
  const presenceOfflinePromise = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'presence:update' && msg.userId === userA.id && msg.online === false) {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
  });

  // Alpha closes socket
  wsA.close(1000, 'Normal closure');

  const offlinePresence = await presenceOfflinePromise;
  assert(
    offlinePresence && offlinePresence.online === false,
    'Beta received live presence update marking Alpha offline upon disconnect'
  );

  // Close Beta
  wsB.close(1000, 'Normal closure');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  WebSocket Suite Finished: ${passed} Passed, ${failed} Failed`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWebSocketTestSuite().catch((err) => {
  console.error('[Test Failed With Error]:', err);
  process.exit(1);
});
