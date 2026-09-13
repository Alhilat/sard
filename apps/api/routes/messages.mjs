import { Router } from 'express';
import { getStatements } from '../db/statements/index.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { formatRelativeTime, createNotification } from '../services/notification.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';
import { isUserOnline, getUserLastSeen, formatPresenceStatus } from '../services/presence.mjs';
import { broadcastMessage } from '../services/websocket.mjs';

const router = Router();

// GET /api/conversations
router.get('/', authenticateToken, (req, res) => {
  if (!req.user) return res.json({ success: true, conversations: [] });
  try {
    const { stmtGetConversations } = getStatements();
    const rows = stmtGetConversations.all(req.user.id, req.user.id, req.user.id, req.user.id);

    const conversations = rows.map((r) => {
      const isOnline = isUserOnline(r.other_user_id);
      const statusText = formatPresenceStatus(r.other_user_id);
      const lastSeen = getUserLastSeen(r.other_user_id);

      return {
        id: r.id,
        lastMessage: r.last_message || '',
        time: formatRelativeTime(r.updated_at),
        updated_at: r.updated_at,
        user: {
          id: r.other_user_id,
          name: r.other_name || 'مستخدم سرد',
          username: r.other_username || 'user',
          avatar: r.other_avatar || '',
          role: r.other_role || 'عضو',
          verified: Boolean(r.other_verified),
          online: isOnline,
          lastSeen,
          statusText,
        },
      };
    });

    res.json({ success: true, conversations, data: conversations });
  } catch (err) {
    console.error('Error getting conversations:', err);
    res.json({ success: true, conversations: [] });
  }
});

// POST /api/conversations
router.post('/', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const recipientId = req.body.recipientId || req.body.userId;
    if (!recipientId) return res.status(400).json({ success: false, message: 'معرف المستخدم غير محدد' });
    if (recipientId === req.user.id) return res.status(400).json({ success: false, message: 'لا يمكنك مراسلة نفسك' });

    const { stmtFindUserById, stmtFindConversationBetween, stmtInsertConversation } = getStatements();
    const recipient = stmtFindUserById.get(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    let conv = stmtFindConversationBetween.get(req.user.id, recipientId, recipientId, req.user.id);

    if (!conv) {
      const convId = `conv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const now = Date.now();
      stmtInsertConversation.run(convId, req.user.id, recipientId, now);
      scheduleCloudSync();

      conv = {
        id: convId,
        user1_id: req.user.id,
        user2_id: recipientId,
        last_message: '',
        updated_at: now,
      };
    }

    const isOnline = isUserOnline(recipient.id);
    const statusText = formatPresenceStatus(recipient.id);
    const lastSeen = getUserLastSeen(recipient.id);

    const conversationObj = {
      id: conv.id,
      lastMessage: conv.last_message || '',
      time: formatRelativeTime(conv.updated_at),
      updated_at: conv.updated_at,
      user: {
        id: recipient.id,
        name: recipient.name,
        username: recipient.username,
        avatar: recipient.avatar || '',
        role: recipient.role || 'عضو',
        verified: Boolean(recipient.verified),
        online: isOnline,
        lastSeen,
        statusText,
      },
    };

    res.json({ success: true, conversation: conversationObj, data: conversationObj });
  } catch (err) {
    console.error('Error starting conversation:', err);
    res.status(500).json({ success: false, message: 'تعذر إنشاء أو فتح المحادثة' });
  }
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const convId = req.params.id;
    const { stmtGetConversationById, stmtGetDirectMessages } = getStatements();
    const conv = stmtGetConversationById.get(convId);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });
    }

    // Verify user is a legitimate participant of this conversation
    if (conv.user1_id !== req.user.id && conv.user2_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بالوصول إلى هذه المحادثة' });
    }

    const rows = stmtGetDirectMessages.all(convId);

    const messages = rows.map((r) => ({
      id: r.id,
      conversation_id: r.conversation_id,
      sender: r.sender_id === req.user.id ? 'me' : 'other',
      sender_id: r.sender_id,
      senderName: r.sender_name,
      content: r.content,
      time: formatRelativeTime(r.created_at),
      created_at: r.created_at,
      status: 'read',
    }));

    res.json({ success: true, messages, data: messages });
  } catch (err) {
    console.error('Error getting direct messages:', err);
    res.json({ success: true, messages: [] });
  }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  try {
    const convId = req.params.id;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'نص الرسالة فارغ' });
    }

    const { stmtGetConversationById, stmtInsertDirectMessage, stmtUpdateConversationLastMessage } = getStatements();
    const conv = stmtGetConversationById.get(convId);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });
    }

    // Verify user is a legitimate participant of this conversation
    if (conv.user1_id !== req.user.id && conv.user2_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بإرسال رسائل في هذه المحادثة' });
    }

    const otherUserId = conv.user1_id === req.user.id ? conv.user2_id : conv.user1_id;

    const msgId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const now = Date.now();
    stmtInsertDirectMessage.run(msgId, convId, req.user.id, content.trim(), now);
    stmtUpdateConversationLastMessage.run(content.trim(), now, convId);

    // Notify recipient in their notifications tray
    createNotification({
      userId: otherUserId,
      actorId: req.user.id,
      type: 'message',
      title: `رسالة جديدة من ${req.user.name}`,
      content: content.trim().length > 60 ? content.trim().slice(0, 60) + '...' : content.trim(),
      link: '/app/messages',
    });

    scheduleCloudSync();

    const deliveredMessage = {
      id: msgId,
      conversation_id: convId,
      sender_id: req.user.id,
      senderName: req.user.name,
      content: content.trim(),
      created_at: now,
      time: 'الآن',
      status: 'read',
    };

    // Instant WebSocket push (0ms latency, eliminates client polling)
    broadcastMessage(otherUserId, convId, deliveredMessage);
    res.status(201).json({
      success: true,
      message: {
        id: msgId,
        conversation_id: convId,
        sender: 'me',
        sender_id: req.user.id,
        content: content.trim(),
        created_at: now,
        time: 'الآن',
        status: 'read',
      },
    });
  } catch (err) {
    console.error('Error sending direct message:', err);
    res.status(500).json({ success: false, message: 'تعذر إرسال الرسالة' });
  }
});

export default router;
