import { api } from '@/lib/api';

export interface DeviceTokenItem {
  id: string;
  userId: string;
  deviceType: string;
  userAgent?: string;
  endpoint?: string;
  createdAt: number;
  updatedAt: number;
  formattedTime?: string;
}

class DeviceNotificationService {
  private audioCtx: AudioContext | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Check if Notifications & Service Worker are supported in this browser
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current browser notification permission
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request browser notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.initServiceWorker();
        await this.registerCurrentDevice();
        this.playNotificationSound();
      }
      return permission;
    } catch (err) {
      console.error('[NotificationService] Error requesting permission:', err);
      return 'denied';
    }
  }

  /**
   * Initialize Service Worker for background notifications
   */
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return this.swRegistration;
    } catch (err) {
      console.warn('[NotificationService] ServiceWorker registration skipped or failed:', err);
      return null;
    }
  }

  /**
   * Play an elegant audio chime using Web Audio API (no external file dependency)
   */
  public playNotificationSound(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }

      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // First chime tone (high bright tone)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second chime tone (harmonic chime)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1); // A5
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.65);
    } catch (e) {
      // Audio playback might be restricted if no user interaction yet
    }
  }

  /**
   * Register the current device with the backend database
   */
  public async registerCurrentDevice(): Promise<boolean> {
    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device';
      let deviceType = 'web';
      if (/Android/i.test(userAgent)) deviceType = 'android';
      else if (/iPhone|iPad|iPod/i.test(userAgent)) deviceType = 'ios';
      else if (/Macintosh/i.test(userAgent)) deviceType = 'mac';
      else if (/Windows/i.test(userAgent)) deviceType = 'windows';
      else if (/Linux/i.test(userAgent)) deviceType = 'linux';

      let endpoint = '';
      let p256dh = '';
      let auth = '';

      if (this.swRegistration && 'pushManager' in this.swRegistration) {
        try {
          const sub = await this.swRegistration.pushManager.getSubscription();
          if (sub) {
            endpoint = sub.endpoint;
            const key = sub.getKey('p256dh');
            const authKey = sub.getKey('auth');
            if (key) p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
            if (authKey) auth = btoa(String.fromCharCode(...new Uint8Array(authKey)));
          }
        } catch {
          // Push manager access optional
        }
      }

      await api.post('/notifications/devices/register', {
        deviceType,
        endpoint,
        p256dhKey: p256dh,
        authKey: auth,
        userAgent,
      });
      return true;
    } catch (err) {
      console.error('[NotificationService] Failed to register device with server:', err);
      return false;
    }
  }

  /**
   * Display a local or push notification
   */
  public async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    this.playNotificationSound();

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/logo.png',
      badge: '/favicon.svg',
      dir: 'rtl',
      lang: 'ar',
      ...options,
    };

    try {
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    } catch (err) {
      console.warn('[NotificationService] Direct notification display error:', err);
    }
  }

  /**
   * Fetch all registered devices for the current user
   */
  public async getRegisteredDevices(): Promise<DeviceTokenItem[]> {
    try {
      const res = await api.get<{ devices?: DeviceTokenItem[]; data?: DeviceTokenItem[] }>('/notifications/devices');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).devices)) return (res as any).devices;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
    } catch (err) {
      console.error('[NotificationService] Error getting devices:', err);
    }
    return [];
  }

  /**
   * Unregister / delete a device
   */
  public async unregisterDevice(deviceId: string): Promise<boolean> {
    try {
      await api.delete(`/notifications/devices/${deviceId}`);
      return true;
    } catch (err) {
      console.error('[NotificationService] Error deleting device:', err);
      return false;
    }
  }

  /**
   * Send a test notification to device
   */
  public async sendTestNotification(): Promise<any> {
    try {
      const res = await api.post<any>('/notifications/test', {});
      this.playNotificationSound();
      if (this.getPermission() === 'granted') {
        this.showLocalNotification('اختبار إشعارات المنصة 🔔', {
          body: 'نظام الإشعارات الفورية للأجهزة يعمل بنجاح على جهازك الآن!',
          tag: 'test-notification',
        });
      }
      return res;
    } catch (err) {
      console.error('[NotificationService] Error sending test notification:', err);
      throw err;
    }
  }

  /**
   * Auto init service worker on page load if permission is already granted
   */
  public async init(): Promise<void> {
    if (this.isSupported() && Notification.permission === 'granted') {
      await this.initServiceWorker();
      await this.registerCurrentDevice();
    }
  }
}

export const deviceNotificationService = new DeviceNotificationService();
