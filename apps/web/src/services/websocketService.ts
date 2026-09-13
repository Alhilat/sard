/**
 * Production-Grade Resilient WebSocket Client Service (خدمة الويب سوكيت اللحظية)
 * Handles persistent bi-directional connection, auto-reconnect with exponential backoff,
 * typing indicators, real-time message sync, and presence updates.
 */

type WebSocketEventHandler = (payload: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private isDeliberateClose = false;
  private listeners: Map<string, Set<WebSocketEventHandler>> = new Map();
  private pingInterval: any = null;

  constructor() {
    // Automatically reconnect when the device regains internet access
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isConnected() && this.token) {
          this.reconnectAttempts = 0;
          this.connect(this.token);
        }
      });

      // Immediate reconnect when returning to active tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected() && this.token) {
          this.connect(this.token);
        }
      });
    }
  }

  /**
   * Connect to WebSocket server with JWT authentication
   */
  public connect(token?: string) {
    if (typeof window === 'undefined') return;

    const authToken = token || localStorage.getItem('sard_auth_token') || localStorage.getItem('sard_token');
    if (!authToken) {
      return;
    }

    this.token = authToken;
    this.isDeliberateClose = false;

    // Avoid duplicate connection if already open or connecting
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(authToken)}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connection:open', { connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            this.emit(data.type, data);
          }
        } catch (parseErr) {
          // Ignore invalid frames
        }
      };

      this.socket.onclose = (event) => {
        this.stopHeartbeat();
        this.emit('connection:close', { code: event.code, reason: event.reason });

        // Don't auto-reconnect if unauthorized (1008) or deliberately closed
        if (event.code === 1008 || this.isDeliberateClose) {
          return;
        }

        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        this.emit('connection:error', err);
      };

    } catch (err) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule exponential backoff reconnect
   */
  private scheduleReconnect() {
    if (this.reconnectTimer || this.isDeliberateClose || !this.token) return;

    // Exponential backoff: 1.5s, 3s, 6s, 12s, max 25s + random jitter
    const delay = Math.min(25000, 1500 * Math.pow(1.6, this.reconnectAttempts)) + Math.random() * 500;
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnected() && !this.isDeliberateClose && this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * Client-side heartbeat ping to keep connection responsive
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send JSON payload through WebSocket
   */
  public send(data: any): boolean {
    if (!this.isConnected()) return false;
    try {
      this.socket!.send(JSON.stringify(data));
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Send typing indicator to conversation partner
   */
  public sendTyping(conversationId: string, recipientId: string, isTyping: boolean) {
    return this.send({
      type: 'typing',
      conversationId,
      recipientId,
      isTyping,
    });
  }

  /**
   * Query presence for a specific user
   */
  public queryPresence(targetUserId: string) {
    return this.send({
      type: 'query:presence',
      targetUserId,
    });
  }

  /**
   * Subscribe to a typed WebSocket event
   * Returns an unsubscribe function for React useEffect cleanup
   */
  public on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Trigger local subscribers
   */
  private emit(eventType: string, payload: any) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[WebSocketService] Error in listener for ${eventType}:`, err);
        }
      });
    }
  }

  /**
   * Check connection status
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Graceful deliberate disconnect (e.g. on logout)
   */
  public disconnect() {
    this.isDeliberateClose = true;
    this.token = null;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        this.socket.close(1000, 'Deliberate logout');
      } catch (err) {}
      this.socket = null;
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
