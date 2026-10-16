/**
 * Notification service supporting real device notification popups,
 * reverent audio chimes, multi-platform detection (Web, Android, iOS),
 * service worker registration, and backend device synchronization.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export type PlatformType = 'web' | 'android' | 'ios';

/** Detect user device / OS platform */
export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'web';
  }

  const userAgent = navigator.userAgent || (navigator as any).vendor || (window as any).opera || '';

  // iOS detection (iPhone, iPad, iPod, or iPad on iOS 13+ with desktop UA)
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) return 'ios';

  // Android detection
  if (/android/i.test(userAgent)) return 'android';

  return 'web';
}

/** Check if running as installed standalone PWA */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Synthesize a gentle, reverent temple bell / chime when a spiritual notification arrives
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonious dual bell tones (F#5 & C#6)
    const freqs = [739.99, 1108.73];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02 + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + 1.4 + idx * 0.08);
    });
  } catch {
    // AudioContext blocked or not supported
  }
}

/** Register service worker for Web & Android/iOS background push */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.info('Service Worker registration note:', err);
    return null;
  }
}

/** Sync device notification state and registration with backend server */
export async function syncDeviceRegistration(
  permission: NotificationPermission,
  userId?: string
): Promise<{ success: boolean; data?: any }> {
  try {
    const platform = detectPlatform();
    let deviceId = localStorage.getItem('mdmi_device_id');
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('mdmi_device_id', deviceId);
    }

    const res = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        permission,
        deviceId,
        userId: userId || undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    });

    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    console.warn('Backend notification sync notice:', err?.message || err);
    return { success: false };
  }
}

/** Trigger backend test push notification */
export async function triggerBackendTestPush(
  title?: string,
  body?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const platform = detectPlatform();
    const res = await fetch('/api/notifications/test-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        title: title || 'Daily Devotional Ready',
        body: body || 'Today’s meditation from The Master’s Discipleship Ministries is published.',
      }),
    });

    if (!res.ok) throw new Error('Test push failed');
    const data = await res.json();
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error triggering test' };
  }
}

/** Sync a schedule / timer / auto rule to the backend server */
export async function syncScheduleToBackend(schedule: any): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Delete a schedule from backend server */
export async function deleteScheduleFromBackend(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/schedules/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Clear test notifications on backend server */
export async function clearBackendTestNotifications(): Promise<{ success: boolean; removedCount?: number }> {
  try {
    const res = await fetch('/api/notifications/clear-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, removedCount: data.removedCount };
  } catch {
    return { success: false };
  }
}

export async function requestDeviceNotificationPermission(userId?: string): Promise<NotificationPermission> {
  // 1. If running as a native Android APK via Capacitor
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      const granted = res.display === 'granted';
      return granted ? 'granted' : 'denied';
    } catch (nativeErr) {
      console.warn('Native notification permission notice:', nativeErr);
    }
  }

  // 2. Browser Web Push Notification fallback
  if (typeof window === 'undefined' || !('Notification' in window)) {
    const platform = detectPlatform();
    if (platform === 'ios') {
      console.info('iOS requires Add to Home Screen for background Web Push');
    }
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    // Register SW
    await registerServiceWorker();
    // Sync to backend
    await syncDeviceRegistration(permission, userId);
    return permission;
  } catch (err) {
    console.warn('Notification permission request notice:', err);
    return 'denied';
  }
}

export function getDeviceNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function showDeviceNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    onClick?: () => void;
  }
) {
  playNotificationSound();

  // 1. Native Android notification banner via Capacitor
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000) + 1,
            title,
            body: options.body,
            smallIcon: 'ic_launcher_round',
          },
        ],
      }).catch((e) => console.warn('Native notification schedule notice:', e));
      return;
    } catch {
      // fallback
    }
  }

  if (Notification.permission === 'granted') {
    try {
      // If service worker is ready, prefer showNotification for lock screen / background persistence
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: options.body,
            icon: options.icon || '/logo.svg',
            badge: '/logo.svg',
            tag: options.tag || 'mdmi-daily',
            data: options.data,
          });
        }).catch(() => {
          // Fallback to standard window Notification
          createWindowNotification(title, options);
        });
      } else {
        createWindowNotification(title, options);
      }
    } catch (err) {
      console.warn('System notification launch notice:', err);
    }
  }
}

function createWindowNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  try {
    const notif = new Notification(title, {
      body: options.body,
      icon: options.icon || '/logo.svg',
      tag: options.tag || 'mdmi-daily',
      silent: true,
    });

    notif.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
      notif.close();
    };
  } catch (err) {
    console.warn('Window notification fallback notice:', err);
  }
}

/**
 * Schedules a daily recurring notification directly with Android's native AlarmManager / LocalNotifications.
 * This guarantees the morning devotional alert fires even when the app is completely closed or device is in sleep/Doze mode.
 */
export async function scheduleNativeDailyReminder(
  timeStr: string = '07:00',
  title: string = "Daily Devotional Ready 📖",
  body: string = "Start your morning with spiritual reflection from The Master's Discipleship Ministries."
): Promise<boolean> {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const parts = (timeStr || '07:00').split(':');
    const hour = parseInt(parts[0], 10) || 7;
    const minute = parseInt(parts[1], 10) || 0;

    // Check / request permission first if needed
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return false;
    }

    // Cancel existing reminder alarm ID 1001
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }] }).catch(() => {});

    // Schedule persistent native daily alarm
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title,
          body,
          schedule: {
            on: {
              hour,
              minute,
            },
            repeats: true,
            allowWhileIdle: true,
          },
          smallIcon: 'ic_launcher_round',
          sound: undefined,
        },
      ],
    });

    console.info(`Native daily reminder successfully registered for ${hour}:${String(minute).padStart(2, '0')}`);
    return true;
  } catch (err) {
    console.warn('Native daily reminder scheduling notice:', err);
    return false;
  }
}
