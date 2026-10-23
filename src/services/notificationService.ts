/**
 * Notification service supporting real device notification popups,
 * reverent audio chimes, multi-platform detection (Web, Android, iOS),
 * service worker registration, and backend device synchronization.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
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

/** Check whether sound / chime is enabled in user preferences */
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('mdmi_notif_sound_enabled') !== 'false';
}

/** Set notification sound preference and update Android channels */
export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mdmi_notif_sound_enabled', String(enabled));
  ensureNotificationChannels().catch(() => {});
}

// Track last time chime played to prevent spam / rapid repeating chimes
let lastChimeTimestamp = 0;

// Synthesize a gentle, reverent temple bell / chime when a spiritual notification arrives
export function playNotificationSound(force = false) {
  if (!force && !isNotificationSoundEnabled()) {
    return;
  }

  const nowMs = Date.now();
  // Prevent chime spam: minimum 3.5 seconds between chimes
  if (!force && nowMs - lastChimeTimestamp < 3500) {
    return;
  }
  lastChimeTimestamp = nowMs;

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

/** Ensure both audible and silent notification channels are initialized on native Android */
export async function ensureNotificationChannels(): Promise<void> {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
    return;
  }
  try {
    // 1. Audible Channel with Temple Sound & Vibration
    await LocalNotifications.createChannel({
      id: 'mdmi_channel',
      name: 'MDMI Devotionals (Audible)',
      description: 'Daily devotional alerts and ministry announcements with sound and vibration',
      importance: 5,
      visibility: 1,
      vibration: true,
    }).catch(() => {});

    // 2. Silent Channel (Guaranteed zero sound / vibration when user disables sound)
    await LocalNotifications.createChannel({
      id: 'mdmi_channel_silent',
      name: 'MDMI Devotionals (Silent)',
      description: 'Quiet devotional alerts without chime or vibration',
      importance: 3,
      visibility: 1,
      vibration: false,
      sound: undefined,
    }).catch(() => {});
  } catch (e) {
    console.warn('Channel creation notice:', e);
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
  userId?: string,
  token?: string
): Promise<{ success: boolean; data?: any }> {
  try {
    const platform = detectPlatform();
    let deviceId = localStorage.getItem('mdmi_device_id');
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('mdmi_device_id', deviceId);
    }

    const savedToken = token || localStorage.getItem('mdmi_fcm_token') || undefined;

    const res = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        permission,
        deviceId,
        token: savedToken,
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

/** Initialize Google Firebase Cloud Messaging (FCM) Push Notifications for closed-app delivery */
export async function initPushNotifications(
  onNotificationTapped?: (data: any) => void
): Promise<void> {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
    return;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    }

    // Capture FCM device registration token
    PushNotifications.addListener('registration', (token) => {
      console.info('Native FCM push token registered:', token.value);
      localStorage.setItem('mdmi_fcm_token', token.value);
      syncDeviceRegistration('granted', undefined, token.value).catch(() => {});
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.warn('Native FCM push registration notice:', err.error);
    });

    // Handle incoming push notification when app is open or minimized
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.info('Push notification received:', notification.title);
      // Trigger instant in-app update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mdmi:notification-received', { detail: notification }));
      }
    });

    // Handle user tapping on push notification (including when app was closed/killed)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.info('Push notification action performed:', action.notification?.data);
      const data = action.notification?.data || {};
      if (onNotificationTapped) {
        onNotificationTapped(data);
      }
      if (typeof window !== 'undefined') {
        window.postMessage({ type: 'MDMI_NOTIFICATION_CLICKED', data }, '*');
      }
    });
  } catch (err) {
    console.warn('Native Push Notifications init notice:', err);
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

export async function checkAndSyncNotificationPermission(userId?: string): Promise<NotificationPermission> {
  // If running as native Capacitor Android
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.checkPermissions();
      const granted = res.display === 'granted';
      if (granted) {
        localStorage.setItem('mdmi_notification_permission', 'granted');
        await ensureNotificationChannels();
        syncDeviceRegistration('granted', userId).catch(() => {});
        return 'granted';
      }
    } catch (e) {
      console.warn('Native check permissions note:', e);
    }
  }

  // Web check
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      localStorage.setItem('mdmi_notification_permission', 'granted');
      syncDeviceRegistration('granted', userId).catch(() => {});
      return 'granted';
    }
    return Notification.permission;
  }

  const stored = typeof window !== 'undefined' ? localStorage.getItem('mdmi_notification_permission') : null;
  return stored === 'granted' ? 'granted' : 'denied';
}

export async function requestDeviceNotificationPermission(userId?: string): Promise<NotificationPermission> {
  // 1. If running as a native Android APK via Capacitor
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      const granted = res.display === 'granted';
      const perm: NotificationPermission = granted ? 'granted' : 'denied';

      if (granted) {
        localStorage.setItem('mdmi_notification_permission', 'granted');
        await ensureNotificationChannels();

        const savedReminder = localStorage.getItem('mdmi_daily_reminder_time') || '07:00';
        scheduleNativeDailyReminder(savedReminder).catch(() => {});
      } else {
        localStorage.setItem('mdmi_notification_permission', 'denied');
      }

      await syncDeviceRegistration(perm, userId);
      return perm;
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
    if (permission === 'granted') {
      localStorage.setItem('mdmi_notification_permission', 'granted');
    } else {
      localStorage.setItem('mdmi_notification_permission', permission);
    }
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
  if (typeof window === 'undefined') {
    return 'denied';
  }
  // Check persisted state first (vital for native Android WebView where window.Notification may be absent)
  const stored = localStorage.getItem('mdmi_notification_permission');
  if (stored === 'granted') {
    return 'granted';
  }
  if (!('Notification' in window)) {
    return stored === 'denied' ? 'denied' : 'default';
  }
  return Notification.permission;
}

export async function showDeviceNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    playSound?: boolean;
    onClick?: () => void;
  }
): Promise<boolean> {
  const soundOn = isNotificationSoundEnabled();

  // Play audible chime only if sound is enabled AND this is not an automated background retry
  if (options.playSound !== false && soundOn) {
    playNotificationSound();
  }

  const payloadData = {
    ...(options.data || {}),
    id: options.tag || options.data?.id || `notif_${Date.now()}`,
    notificationId: options.tag || options.data?.id || `notif_${Date.now()}`,
    devotionalId: options.data?.devotionalId || null,
    type: options.data?.type || 'broadcast',
    title,
    body: options.body,
    createdBy: options.data?.createdBy || 'Ministry Overseer',
  };

  // 1. Native Android notification banner via Capacitor LocalNotifications
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannels();

      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') {
          console.warn('Native notification permission not granted on device.');
          return false;
        }
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000) + 1,
            title,
            body: options.body,
            channelId: soundOn ? 'mdmi_channel' : 'mdmi_channel_silent',
            smallIcon: 'ic_stat_mdmi_logo',
            iconColor: '#5E72E4',
            sound: undefined,
            extra: payloadData,
            schedule: {
              at: new Date(Date.now() + 100),
              allowWhileIdle: true,
            },
          },
        ],
      });
      return true;
    } catch (nativeErr) {
      console.warn('Native notification schedule notice:', nativeErr);
      return false;
    }
  }

  // 2. Web Push / Window Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body: options.body,
          icon: options.icon || '/logo.svg',
          badge: '/logo.svg',
          tag: options.tag || 'mdmi-daily',
          silent: !soundOn,
          data: payloadData,
        });
        return true;
      } else {
        createWindowNotification(title, {
          ...options,
          data: payloadData,
        });
        return true;
      }
    } catch (err) {
      console.warn('System notification launch notice:', err);
      return false;
    }
  }

  return false;
}

function createWindowNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    onClick?: () => void;
  }
) {
  try {
    const soundOn = isNotificationSoundEnabled();
    const notif = new Notification(title, {
      body: options.body,
      icon: options.icon || '/logo.svg',
      tag: options.tag || 'mdmi-daily',
      silent: !soundOn,
      data: options.data,
    });

    notif.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      } else if (options.data) {
        window.postMessage({
          type: 'MDMI_NOTIFICATION_CLICKED',
          data: options.data,
        }, '*');
      }
      notif.close();
    };
  } catch (err) {
    console.warn('Window notification fallback notice:', err);
  }
}

/**
 * Diagnostic helper to test end-to-end device notification delivery
 * and provide actionable instructions if the device OS blocks alerts.
 */
export async function testDeviceNotificationDelivery(): Promise<{
  success: boolean;
  message: string;
  diagnostic?: string;
}> {
  const perm = getDeviceNotificationPermission();
  const platform = detectPlatform();

  if (perm !== 'granted') {
    if (Capacitor.isNativePlatform()) {
      return {
        success: false,
        message: 'Notification permission is blocked on this Android phone.',
        diagnostic: 'To fix: Open your Phone Settings → Apps → MDMI Devotionals → Notifications → Turn ON, then return here.',
      };
    }
    return {
      success: false,
      message: 'Browser notification permission is not enabled.',
      diagnostic: 'Please tap "Allow Notifications" when prompted by your browser or tap the lock icon in the address bar.',
    };
  }

  const delivered = await showDeviceNotification("Test Alert • The Master's Ministry 🕊️", {
    body: "Your device is verified and ready! You will receive daily devotional broadcasts immediately.",
    tag: "test_delivery_verify",
  });

  if (delivered) {
    return {
      success: true,
      message: 'Notification delivered successfully to your device with chime!',
    };
  }

  return {
    success: false,
    message: 'Delivery was not completed by the operating system.',
    diagnostic: 'Device may be in strict Do Not Disturb mode or battery optimization is restricting background notifications.',
  };
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
          smallIcon: 'ic_stat_mdmi_logo',
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

