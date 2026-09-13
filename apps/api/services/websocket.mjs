/**
 * Real-Time WebSocket Engine for Sard Raqami (محرك الويب سوكيت اللحظي لسرد رقمي)
 * Provides bi-directional, persistent, zero-overhead communication for:
 * 1. Instant direct messages (0ms latency, zero polling)
 * 2. Typing indicators ("يكتب الآن...")
 * 3. Real-time user presence tracking ("نشط الآن" / Offline)
 * 4. Live notification pushes
 */

import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.mjs';
import { getStatements } from '../db/statements/index.mjs';
import { bannedUserIds } from './cache.mjs';
import {
  touchUserPresence,
  setUserOffline,
  isUserOnline,
  formatPresenceStatus,
} from './presence.mjs';

// Map of userId -> Set<WebSocket> (supports multiple tabs / mobile + web)
const userSockets = new Map();

let wssInstance = null;
let heartbeatInterval = null;

/**
 * Initialize WebSocket Server attached to existing HTTP server
 */
export function initWebSocketServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
  });

  wssInstance = wss;

  wss.on('connection', (ws, req) => {
    try {
      // 1. Authenticate connection via query parameter or authorization header
      const hostHeader = req.headers.host || 'localhost';
      const url = new URL(req.url, `http://${hostHeader}`);
      const token = url.searchParams.get('token') ||
        (req.headers['sec-websocket-protocol'] && req.headers['sec-websocket-protocol'].split(',')[0].trim());

      if (!token) {
        ws.close(1008, 'Token required for WebSocket connection');
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (jwtErr) {
        ws.close(1008, 'Invalid or expired token');
        return;
      }

      const stmts = getStatements();
      const user = stmts.stmtFindUserById.get(decoded.id);

      if (!user || user.is_banned || bannedUserIds.has(user.id)) {
        ws.close(1008, 'User not found or banned');
        return;
      }

      const userId = user.id;
      ws.userId = userId;
      ws.isAlive = true;

      // 2. Register socket in userSockets map
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(ws);

      // 3. Mark user online & update presence
      touchUserPresence(userId);
      broadcastPresence(userId, true, 'نشط الآن');

      // 4. Send initial welcome & authenticated event
      ws.send(JSON.stringify({
        type: 'authenticated',
        userId,
        online: true,
        statusText: 'نشط الآن',
      }));

      // 5. Handle native ping/pong to keep connection alive
      ws.on('pong', () => {
        ws.isAlive = true;
        touchUserPresence(userId);
      });

      // 6. Handle client-initiated messages
      ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          handleClientMessage(userId, data, ws);
        } catch (parseErr) {
          // Ignore malformed JSON packets
        }
      });

      // 7. Handle connection disconnect
      ws.on('close', () => {
        handleSocketDisconnect(userId, ws);
      });

      ws.on('error', (err) => {
        console.error(`[WebSocket] Error for user ${userId}:`, err.message);
        handleSocketDisconnect(userId, ws);
      });

    } catch (connErr) {
      console.error('[WebSocket] Unexpected connection error:', connErr);
      try {
        ws.close(1011, 'Internal server error');
      } catch (closeErr) {}
    }
  });

  // 8. 30-second ping/pong sweep to detect dead connections without FIN
  heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  if (heartbeatInterval.unref) {
    heartbeatInterval.unref();
  }

  console.log('[WebSocket] High-performance real-time engine initialized on /ws');
  return wss;
}

/**
 * Handle incoming client message payloads
 */
function handleClientMessage(userId, data, ws) {
  touchUserPresence(userId);

  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;

    case 'typing':
      // Broadcast typing indicator to conversation partner
      if (data.recipientId && data.conversationId) {
        sendToUser(data.recipientId, {
          type: 'typing',
          conversationId: data.conversationId,
          senderId: userId,
          isTyping: Boolean(data.isTyping),
        });
      }
      break;

    case 'query:presence':
      // Return presence for a requested user
      if (data.targetUserId) {
        const isOnline = isUserOnline(data.targetUserId);
        const statusText = formatPresenceStatus(data.targetUserId);
        ws.send(JSON.stringify({
          type: 'presence:update',
          userId: data.targetUserId,
          online: isOnline,
          statusText,
        }));
      }
      break;

    default:
      break;
  }
}

/**
 * Clean up socket when client disconnects
 */
function handleSocketDisconnect(userId, ws) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) {
      userSockets.delete(userId);
      // All connections closed for this user: mark offline
      setUserOffline(userId);
      const relativeTime = formatPresenceStatus(userId);
      broadcastPresence(userId, false, relativeTime);
    }
  }
}

/**
 * Send real-time payload to a specific user across all their open sockets
 */
export function sendToUser(userId, data) {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) return false;

  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  let delivered = false;

  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
        delivered = true;
      } catch (err) {
        // Socket pipe broken, will clean on 'close'
      }
    }
  }

  return delivered;
}

/**
 * Broadcast presence changes to all connected users
 */
export function broadcastPresence(userId, online, statusText) {
  if (!wssInstance) return;

  const payload = JSON.stringify({
    type: 'presence:update',
    userId,
    online,
    statusText,
  });

  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
      try {
        client.send(payload);
      } catch (err) {}
    }
  });
}

/**
 * Dispatch new message event to recipient and sender's other tabs
 */
export function broadcastMessage(recipientId, conversationId, message) {
  // Push to recipient
  sendToUser(recipientId, {
    type: 'message:new',
    conversationId,
    message,
  });

  // Echo to sender (if they have other tabs/devices open)
  if (message.sender_id) {
    sendToUser(message.sender_id, {
      type: 'message:sent',
      conversationId,
      message,
    });
  }
}

/**
 * Dispatch real-time notification to user
 */
export function broadcastNotification(userId, notification) {
  sendToUser(userId, {
    type: 'notification:new',
    notification,
  });
}

/**
 * Get count of active online users with open sockets
 */
/**
 * Cleanly close WebSocket server and terminate open sockets
 */
export function closeWebSocketServer() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  if (wssInstance) {
    wssInstance.clients.forEach((client) => {
      try {
        client.terminate();
      } catch (e) {}
    });
    try {
      wssInstance.close();
    } catch (e) {}
  }
}
