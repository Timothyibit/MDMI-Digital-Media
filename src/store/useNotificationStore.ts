import { create } from 'zustand';
import {
  AppNotification,
  NotificationSchedule,
  NotificationRecurrenceRule,
  AutoNotificationEventType,
} from '../types';
import {
  db,
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from '../lib/firebase';
import {
  showDeviceNotification,
  requestDeviceNotificationPermission,
  getDeviceNotificationPermission,
  detectPlatform,
  PlatformType,
  syncDeviceRegistration,
  triggerBackendTestPush,
  registerServiceWorker,
  playNotificationSound,
  syncScheduleToBackend,
  deleteScheduleFromBackend,
  clearBackendTestNotifications,
} from '../services/notificationService';
import {
  computeNextRecurrence,
  DEFAULT_AUTOMATIC_RULES,
  interpolateNotificationTemplate,
} from '../services/notificationSchedulerEngine';

export interface NotificationStoreState {
  notifications: AppNotification[];
  schedules: NotificationSchedule[];
  archivedIds: string[];
  resolvedActions: Record<string, string>; // notificationId -> actionLabel/resolvedText
  unreadCount: number;
  isOpen: boolean;
  permission: NotificationPermission;
  platform: PlatformType;
  isLoading: boolean;
  soundEnabled: boolean;
  autoReadOnOpen: boolean;
  dailyReminderTime: string;
  categoryPreferences: {
    devotional: boolean;
    prayer: boolean;
    fellowship: boolean;
    broadcast: boolean;
  };
  selectedNotificationDetail: AppNotification | null;
  initializeNotifications: () => () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleSoundEnabled: (val?: boolean) => void;
  toggleAutoReadOnOpen: (val?: boolean) => void;
  setDailyReminderTime: (time: string) => void;
  toggleCategoryPreference: (
    category: 'devotional' | 'prayer' | 'fellowship' | 'broadcast',
    val?: boolean
  ) => void;
  openNotificationDetail: (notif: AppNotification | string) => void;
  closeNotificationDetail: () => void;
  clearArchivedNotifications: () => void;
  archiveAllRead: () => void;
  restoreAllArchived: () => void;
  requestPermission: () => Promise<NotificationPermission>;
  markAsRead: (id: string, read?: boolean) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string, archived: boolean) => void;
  resolveAction: (id: string, actionId: string, resolvedLabel: string) => void;
  triggerTestNotification: () => Promise<void>;
  clearTestNotifications: () => Promise<{ success: boolean; clearedCount: number }>;
  deleteNotification: (id: string) => Promise<{ success: boolean }>;
  clearAllBroadcastHistory: () => Promise<{ success: boolean; clearedCount: number }>;
  broadcastNotification: (
    data: Omit<AppNotification, 'id' | 'createdAt'>
  ) => Promise<{ success: boolean; error?: string }>;

  // Schedulers, Timers & Automatic Notification Actions
  addTimerTrigger: (data: {
    title: string;
    body: string;
    type?: AppNotification['type'];
    delayMinutes: number;
    scheduledAt?: string;
    devotionalId?: string;
    createdBy?: string;
  }) => Promise<{ success: boolean; id?: string }>;

  addRecurringSchedule: (data: {
    title: string;
    body: string;
    type?: AppNotification['type'];
    recurrence: NotificationRecurrenceRule;
    devotionalId?: string;
    createdBy?: string;
  }) => Promise<{ success: boolean; id?: string }>;

  addAutomaticRule: (data: {
    title: string;
    body: string;
    autoEventType: AutoNotificationEventType | string;
    type?: AppNotification['type'];
    timeOfDay?: string;
    enabled?: boolean;
    createdBy?: string;
  }) => Promise<{ success: boolean; id?: string }>;

  updateSchedule: (id: string, updates: Partial<NotificationSchedule>) => Promise<{ success: boolean }>;
  deleteSchedule: (id: string) => Promise<{ success: boolean }>;
  toggleScheduleEnabled: (id: string, enabled: boolean) => Promise<{ success: boolean }>;
  fireScheduleNow: (id: string) => Promise<{ success: boolean }>;
  triggerAutoNotification: (
    eventType: AutoNotificationEventType,
    context?: { title?: string; scripture?: string; streak?: number; name?: string; devotionalId?: string }
  ) => Promise<{ success: boolean }>;
}

const STORAGE_KEY_READ_IDS = 'mdmi_read_notification_ids';
const STORAGE_KEY_ARCHIVED_IDS = 'mdmi_archived_notification_ids';
const STORAGE_KEY_RESOLVED_ACTIONS = 'mdmi_notification_resolved_actions';
const STORAGE_KEY_SCHEDULES = 'mdmi_notification_schedules_cache';
const STORAGE_KEY_SOUND_ENABLED = 'mdmi_notif_sound_enabled';
const STORAGE_KEY_AUTOREAD = 'mdmi_notif_autoread';
const STORAGE_KEY_REMINDER_TIME = 'mdmi_notif_reminder_time';
const STORAGE_KEY_CATEGORIES = 'mdmi_notif_categories';

function getStoredCategories(): {
  devotional: boolean;
  prayer: boolean;
  fellowship: boolean;
  broadcast: boolean;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    devotional: true,
    prayer: true,
    fellowship: true,
    broadcast: true,
  };
}

function getStoredBoolean(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === 'true';
  } catch {
    return defaultValue;
  }
}

function getStoredString(key: string, defaultValue: string): string {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
}

function getStoredArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredArray(key: string, items: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function getStoredRecord(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredRecord(key: string, data: Record<string, string>) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getStoredSchedules(): NotificationSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredSchedules(schedules: NotificationSchedule[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
  } catch {
    // ignore
  }
}

export function deduplicateNotifications(items: AppNotification[]): AppNotification[] {
  const seen = new Set<string>();
  return items.filter((n) => {
    if (!n || !n.id || seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

export function deduplicateSchedules(items: NotificationSchedule[]): NotificationSchedule[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    if (!s || !s.id || seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export function isTestNotificationItem(n: AppNotification): boolean {
  if (!n || !n.id) return false;
  const idLower = (n.id || '').toLowerCase();
  const titleLower = (n.title || '').toLowerCase();
  const bodyLower = (n.body || '').toLowerCase();
  return (
    idLower.startsWith('test') ||
    idLower.startsWith('mock-') ||
    idLower.startsWith('local-') ||
    idLower.includes('test_') ||
    idLower.includes('test-') ||
    idLower.includes('dev_') ||
    titleLower.startsWith('test ') ||
    titleLower.startsWith('[test]') ||
    titleLower.startsWith('(test)') ||
    titleLower === 'test' ||
    titleLower.includes('test notification') ||
    titleLower.includes('faith alert • mdmi') ||
    titleLower.includes('testing delivery') ||
    bodyLower.includes('testing web notification') ||
    bodyLower.includes('testing android notification') ||
    bodyLower.includes('testing ios notification') ||
    bodyLower.includes('live audio chime')
  );
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  schedules: getStoredSchedules(),
  archivedIds: getStoredArray(STORAGE_KEY_ARCHIVED_IDS),
  resolvedActions: getStoredRecord(STORAGE_KEY_RESOLVED_ACTIONS),
  unreadCount: 0,
  isOpen: false,
  permission: getDeviceNotificationPermission(),
  platform: detectPlatform(),
  isLoading: false,
  soundEnabled: getStoredBoolean(STORAGE_KEY_SOUND_ENABLED, true),
  autoReadOnOpen: getStoredBoolean(STORAGE_KEY_AUTOREAD, false),
  dailyReminderTime: getStoredString(STORAGE_KEY_REMINDER_TIME, '07:00'),
  categoryPreferences: getStoredCategories(),
  selectedNotificationDetail: null,

  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),

  toggleCategoryPreference: (category, val) => {
    const current = get().categoryPreferences;
    const nextVal = val !== undefined ? val : !current[category];
    const updated = { ...current, [category]: nextVal };
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ categoryPreferences: updated });
  },

  openNotificationDetail: (notifOrId) => {
    if (!notifOrId) return;
    if (typeof notifOrId === 'string') {
      const found = get().notifications.find((n) => n.id === notifOrId) || null;
      set({ selectedNotificationDetail: found });
      if (found) {
        get().markAsRead(found.id, true);
      }
    } else {
      set({ selectedNotificationDetail: notifOrId });
      if (notifOrId && notifOrId.id) {
        get().markAsRead(notifOrId.id, true);
      }
    }
  },

  closeNotificationDetail: () => set({ selectedNotificationDetail: null }),

  archiveAllRead: () => {
    const current = get().notifications;
    const readIds = current.filter((n) => n.read).map((n) => n.id);
    const existing = new Set(get().archivedIds);
    readIds.forEach((id) => existing.add(id));
    const nextArchived = Array.from(existing);
    saveStoredArray(STORAGE_KEY_ARCHIVED_IDS, nextArchived);
    set({ archivedIds: nextArchived });
  },

  restoreAllArchived: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_ARCHIVED_IDS);
    } catch {
      // ignore
    }
    set({ archivedIds: [] });
  },

  toggleSoundEnabled: (val) => {
    const next = val !== undefined ? val : !get().soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEY_SOUND_ENABLED, String(next));
    } catch {
      // ignore
    }
    set({ soundEnabled: next });
    if (next) {
      playNotificationSound();
    }
  },

  toggleAutoReadOnOpen: (val) => {
    const next = val !== undefined ? val : !get().autoReadOnOpen;
    try {
      localStorage.setItem(STORAGE_KEY_AUTOREAD, String(next));
    } catch {
      // ignore
    }
    set({ autoReadOnOpen: next });
  },

  setDailyReminderTime: (time) => {
    try {
      localStorage.setItem(STORAGE_KEY_REMINDER_TIME, time);
    } catch {
      // ignore
    }
    set({ dailyReminderTime: time });
  },

  clearArchivedNotifications: () => {
    const archivedSet = new Set(get().archivedIds);
    const updated = get().notifications.filter((n) => !archivedSet.has(n.id));
    try {
      localStorage.removeItem(STORAGE_KEY_ARCHIVED_IDS);
    } catch {
      // ignore
    }
    set({ archivedIds: [], notifications: updated });
  },

  requestPermission: async () => {
    const perm = await requestDeviceNotificationPermission();
    set({ permission: perm });
    if (perm === 'granted') {
      showDeviceNotification("Notifications Enabled", {
        body: "You'll receive daily devotional alerts and ministry announcements.",
      });
      playNotificationSound();
    }
    return perm;
  },

  markAsRead: (id: string, read = true) => {
    const readIds = getStoredArray(STORAGE_KEY_READ_IDS);
    let updatedReadIds: string[];
    if (read) {
      updatedReadIds = Array.from(new Set([...readIds, id]));
    } else {
      updatedReadIds = readIds.filter((item) => item !== id);
    }
    saveStoredArray(STORAGE_KEY_READ_IDS, updatedReadIds);

    const current = get().notifications;
    const updated = current.map((n) => (n.id === id ? { ...n, read } : n));
    const archivedSet = new Set(get().archivedIds);
    const unread = updated.filter((n) => !n.read && !archivedSet.has(n.id)).length;
    set({ notifications: updated, unreadCount: unread });
  },

  markAllAsRead: () => {
    const current = get().notifications;
    const allIds = current.map((n) => n.id);
    saveStoredArray(STORAGE_KEY_READ_IDS, allIds);
    const updated = current.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },

  archiveNotification: (id: string, archived: boolean) => {
    const archivedIds = getStoredArray(STORAGE_KEY_ARCHIVED_IDS);
    let next: string[];
    if (archived) {
      next = Array.from(new Set([...archivedIds, id]));
    } else {
      next = archivedIds.filter((item) => item !== id);
    }
    saveStoredArray(STORAGE_KEY_ARCHIVED_IDS, next);

    const archivedSet = new Set(next);
    const current = get().notifications;
    const unread = current.filter((n) => !n.read && !archivedSet.has(n.id)).length;
    set({ archivedIds: next, unreadCount: unread });
  },

  resolveAction: (id: string, _actionId: string, resolvedLabel: string) => {
    const records = getStoredRecord(STORAGE_KEY_RESOLVED_ACTIONS);
    records[id] = resolvedLabel;
    saveStoredRecord(STORAGE_KEY_RESOLVED_ACTIONS, records);
    set({ resolvedActions: { ...records } });
  },

  triggerTestNotification: async () => {
    const platform = get().platform;
    showDeviceNotification("Faith Alert • MDMI", {
      body: `Testing ${platform.toUpperCase()} notification delivery with live audio chime.`,
    });
    playNotificationSound();
    await triggerBackendTestPush("Devotional Alert", "Fresh manna for your spirit is ready.");
  },

  clearTestNotifications: async () => {
    const current = get().notifications;
    const testIds = new Set<string>();

    current.forEach((n) => {
      if (isTestNotificationItem(n)) {
        testIds.add(n.id);
      }
    });

    // 1. Direct deep sweep on Firestore collection for any test documents
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const testDocRefs = snap.docs.filter((docSnap) => {
        const d = docSnap.data();
        const cand: AppNotification = {
          id: docSnap.id,
          title: d.title || '',
          body: d.body || '',
          type: d.type || 'broadcast',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || '',
        };
        return isTestNotificationItem(cand);
      });

      testDocRefs.forEach((d) => testIds.add(d.id));

      await Promise.all(
        testDocRefs.map((docSnap) => deleteDoc(doc(db, 'notifications', docSnap.id)).catch(() => {}))
      );
    } catch (err) {
      console.warn('Direct Firestore test sweep note:', err);
    }

    // 2. Also delete any identified test IDs from Firestore
    await Promise.all(
      Array.from(testIds).map((id) => deleteDoc(doc(db, 'notifications', id)).catch(() => {}))
    );

    // 3. Clean read & archived IDs
    const nextReadIds = getStoredArray(STORAGE_KEY_READ_IDS).filter((id) => !testIds.has(id));
    saveStoredArray(STORAGE_KEY_READ_IDS, nextReadIds);

    const nextArchived = getStoredArray(STORAGE_KEY_ARCHIVED_IDS).filter((id) => !testIds.has(id));
    saveStoredArray(STORAGE_KEY_ARCHIVED_IDS, nextArchived);

    // 4. Call backend to clear tests from memory too
    await clearBackendTestNotifications().catch(() => {});

    const remaining = current.filter((n) => !testIds.has(n.id));
    const archivedSet = new Set(nextArchived);
    const unread = remaining.filter((n) => !n.read && !archivedSet.has(n.id)).length;

    set({
      notifications: remaining,
      archivedIds: nextArchived,
      unreadCount: unread,
    });

    return { success: true, clearedCount: testIds.size };
  },

  deleteNotification: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id)).catch(() => {});

      const nextRead = getStoredArray(STORAGE_KEY_READ_IDS).filter((item) => item !== id);
      saveStoredArray(STORAGE_KEY_READ_IDS, nextRead);

      const nextArchived = getStoredArray(STORAGE_KEY_ARCHIVED_IDS).filter((item) => item !== id);
      saveStoredArray(STORAGE_KEY_ARCHIVED_IDS, nextArchived);

      const current = get().notifications;
      const remaining = current.filter((n) => n.id !== id);
      const archivedSet = new Set(nextArchived);
      const unread = remaining.filter((n) => !n.read && !archivedSet.has(n.id)).length;

      set({
        notifications: remaining,
        archivedIds: nextArchived,
        unreadCount: unread,
      });

      return { success: true };
    } catch (err) {
      console.warn('Error deleting notification:', err);
      return { success: false };
    }
  },

  clearAllBroadcastHistory: async () => {
    const current = get().notifications;
    const count = current.length;

    try {
      const snap = await getDocs(collection(db, 'notifications'));
      await Promise.all(
        snap.docs.map((docSnap) => deleteDoc(doc(db, 'notifications', docSnap.id)).catch(() => {}))
      );
    } catch (err) {
      console.warn('Firestore purge history note:', err);
    }

    await Promise.all(
      current.map((n) => deleteDoc(doc(db, 'notifications', n.id)).catch(() => {}))
    );

    await clearBackendTestNotifications().catch(() => {});

    saveStoredArray(STORAGE_KEY_READ_IDS, []);
    saveStoredArray(STORAGE_KEY_ARCHIVED_IDS, []);

    set({
      notifications: [],
      archivedIds: [],
      unreadCount: 0,
    });

    return { success: true, clearedCount: Math.max(count, 1) };
  },

  broadcastNotification: async (data) => {
    try {
      const payload = {
        title: data.title,
        body: data.body,
        type: data.type || 'broadcast',
        devotionalId: data.devotionalId || null,
        createdBy: data.createdBy || 'Ministry Overseer',
        createdAt: serverTimestamp(),
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'notifications'), payload);

      // Trigger instant device popup & sacred chime
      showDeviceNotification(data.title, {
        body: data.body,
        tag: docRef.id,
      });
      playNotificationSound();

      // Update local state immediately, ensuring strict ID uniqueness
      const newNotif: AppNotification = {
        ...data,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        read: false,
      };

      set((state) => {
        const updated = deduplicateNotifications([newNotif, ...state.notifications]);
        const archivedSet = new Set(state.archivedIds);
        const unread = updated.filter((n) => !n.read && !archivedSet.has(n.id)).length;
        return {
          notifications: updated,
          unreadCount: unread,
        };
      });

      return { success: true };
    } catch (err: any) {
      console.warn('Broadcast error, falling back locally:', err);
      const fallbackId = 'local-' + Date.now();
      showDeviceNotification(data.title, {
        body: data.body,
        tag: fallbackId,
      });
      playNotificationSound();

      const newNotif: AppNotification = {
        ...data,
        id: fallbackId,
        createdAt: new Date().toISOString(),
        read: false,
      };

      set((state) => {
        const updated = deduplicateNotifications([newNotif, ...state.notifications]);
        const archivedSet = new Set(state.archivedIds);
        const unread = updated.filter((n) => !n.read && !archivedSet.has(n.id)).length;
        return {
          notifications: updated,
          unreadCount: unread,
        };
      });

      return { success: true };
    }
  },

  // -------------------------------------------------------------
  // Notification Schedulers: Timer Triggers & Recurring Schedules
  // -------------------------------------------------------------

  addTimerTrigger: async (data) => {
    try {
      const scheduledMoment = data.scheduledAt
        ? new Date(data.scheduledAt)
        : new Date(Date.now() + Math.max(1, data.delayMinutes) * 60 * 1000);

      const scheduleData: Omit<NotificationSchedule, 'id'> = {
        title: data.title,
        body: data.body,
        type: data.type || 'broadcast',
        triggerType: 'timer',
        status: 'active',
        enabled: true,
        delayMinutes: data.delayMinutes,
        scheduledAt: scheduledMoment.toISOString(),
        devotionalId: data.devotionalId || null,
        triggerCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy || 'Ministry Overseer',
      };

      let assignedId = 'timer_' + Date.now();
      try {
        const docRef = await addDoc(collection(db, 'notificationSchedules'), {
          ...scheduleData,
          createdAt: serverTimestamp(),
        });
        assignedId = docRef.id;
      } catch (err) {
        console.info('Local fallback for timer schedule:', err);
      }

      const fullSchedule: NotificationSchedule = {
        ...scheduleData,
        id: assignedId,
      };

      // Sync to backend server runner too
      syncScheduleToBackend(fullSchedule).catch(() => {});

      set((state) => {
        const updated = deduplicateSchedules([fullSchedule, ...state.schedules]);
        saveStoredSchedules(updated);
        return { schedules: updated };
      });

      return { success: true, id: assignedId };
    } catch (err: any) {
      console.warn('Error adding timer trigger:', err);
      return { success: false };
    }
  },

  addRecurringSchedule: async (data) => {
    try {
      const nextTrigger = computeNextRecurrence(data.recurrence, new Date());

      const scheduleData: Omit<NotificationSchedule, 'id'> = {
        title: data.title,
        body: data.body,
        type: data.type || 'daily',
        triggerType: 'recurring',
        status: 'active',
        enabled: true,
        recurrence: data.recurrence,
        nextTriggerAt: nextTrigger.toISOString(),
        devotionalId: data.devotionalId || null,
        triggerCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy || 'Ministry Overseer',
      };

      let assignedId = 'recurring_' + Date.now();
      try {
        const docRef = await addDoc(collection(db, 'notificationSchedules'), {
          ...scheduleData,
          createdAt: serverTimestamp(),
        });
        assignedId = docRef.id;
      } catch (err) {
        console.info('Local fallback for recurring schedule:', err);
      }

      const fullSchedule: NotificationSchedule = {
        ...scheduleData,
        id: assignedId,
      };

      // Sync to backend server runner too
      syncScheduleToBackend(fullSchedule).catch(() => {});

      set((state) => {
        const updated = deduplicateSchedules([fullSchedule, ...state.schedules]);
        saveStoredSchedules(updated);
        return { schedules: updated };
      });

      return { success: true, id: assignedId };
    } catch (err: any) {
      console.warn('Error adding recurring schedule:', err);
      return { success: false };
    }
  },

  addAutomaticRule: async (data) => {
    try {
      const scheduleData: Omit<NotificationSchedule, 'id'> = {
        title: data.title,
        body: data.body,
        type: data.type || 'devotional',
        triggerType: 'auto_event',
        status: 'active',
        enabled: data.enabled !== false,
        autoEventType: data.autoEventType as AutoNotificationEventType,
        recurrence: data.timeOfDay
          ? { frequency: 'daily', timeOfDay: data.timeOfDay }
          : undefined,
        devotionalId: null,
        triggerCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy || 'Ministry Overseer',
      };

      let assignedId = 'custom_auto_' + Date.now();
      try {
        const docRef = await addDoc(collection(db, 'notificationSchedules'), {
          ...scheduleData,
          createdAt: serverTimestamp(),
        });
        assignedId = docRef.id;
      } catch (err) {
        console.info('Local fallback for automatic rule:', err);
      }

      const fullSchedule: NotificationSchedule = {
        ...scheduleData,
        id: assignedId,
      };

      // Sync to backend runner
      syncScheduleToBackend(fullSchedule).catch(() => {});

      set((state) => {
        const updated = deduplicateSchedules([fullSchedule, ...state.schedules]);
        saveStoredSchedules(updated);
        return { schedules: updated };
      });

      return { success: true, id: assignedId };
    } catch (err: any) {
      console.warn('Error adding automatic notification rule:', err);
      return { success: false };
    }
  },

  updateSchedule: async (id, updates) => {
    try {
      try {
        await updateDoc(doc(db, 'notificationSchedules', id), updates);
      } catch (err) {
        console.info('Local fallback for schedule update:', err);
      }

      set((state) => {
        const updated = state.schedules.map((s) => (s.id === id ? { ...s, ...updates } : s));
        saveStoredSchedules(updated);
        return { schedules: updated };
      });

      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },

  deleteSchedule: async (id) => {
    try {
      try {
        await deleteDoc(doc(db, 'notificationSchedules', id));
      } catch (err) {
        console.info('Local fallback for delete schedule:', err);
      }

      // Sync deletion to backend
      deleteScheduleFromBackend(id).catch(() => {});

      set((state) => {
        const updated = state.schedules.filter((s) => s.id !== id);
        saveStoredSchedules(updated);
        return { schedules: updated };
      });

      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },

  toggleScheduleEnabled: async (id, enabled) => {
    const current = get().schedules.find((s) => s.id === id);
    if (!current) return { success: false };

    const updates: Partial<NotificationSchedule> = {
      enabled,
      status: enabled ? 'active' : 'paused',
    };

    if (enabled && current.recurrence) {
      updates.nextTriggerAt = computeNextRecurrence(current.recurrence, new Date()).toISOString();
    }

    return get().updateSchedule(id, updates);
  },

  fireScheduleNow: async (id) => {
    const item = get().schedules.find((s) => s.id === id);
    if (!item) return { success: false };

    // Broadcast the notification right now
    await get().broadcastNotification({
      title: item.title,
      body: item.body,
      type: item.type,
      devotionalId: item.devotionalId || undefined,
      createdBy: `${item.createdBy} (Manual Trigger)`,
    });

    const nowIso = new Date().toISOString();
    const updates: Partial<NotificationSchedule> = {
      lastTriggeredAt: nowIso,
      triggerCount: (item.triggerCount || 0) + 1,
    };

    if (item.triggerType === 'timer') {
      updates.status = 'completed';
    } else if (item.recurrence) {
      updates.nextTriggerAt = computeNextRecurrence(item.recurrence, new Date()).toISOString();
    }

    await get().updateSchedule(id, updates);
    return { success: true };
  },

  triggerAutoNotification: async (eventType, context) => {
    const { schedules, broadcastNotification } = get();
    const matchingRule = schedules.find(
      (s) => s.triggerType === 'auto_event' && s.autoEventType === eventType && s.enabled
    );

    if (!matchingRule) return { success: false };

    const formattedTitle = interpolateNotificationTemplate(matchingRule.title, context);
    const formattedBody = interpolateNotificationTemplate(matchingRule.body, context);

    await broadcastNotification({
      title: formattedTitle,
      body: formattedBody,
      type: matchingRule.type,
      devotionalId: context?.devotionalId || matchingRule.devotionalId || undefined,
      createdBy: 'MDMI Ministry Auto-Engine',
    });

    const nowIso = new Date().toISOString();
    const updates: Partial<NotificationSchedule> = {
      lastTriggeredAt: nowIso,
      triggerCount: (matchingRule.triggerCount || 0) + 1,
    };

    if (matchingRule.recurrence) {
      updates.nextTriggerAt = computeNextRecurrence(matchingRule.recurrence, new Date()).toISOString();
    }

    await get().updateSchedule(matchingRule.id, updates);
    return { success: true };
  },

  initializeNotifications: () => {
    const readIds = new Set(getStoredArray(STORAGE_KEY_READ_IDS));
    const archivedSet = new Set(getStoredArray(STORAGE_KEY_ARCHIVED_IDS));

    // Register SW in background
    registerServiceWorker().catch(() => {});

    // Sync initial permission with backend
    syncDeviceRegistration(getDeviceNotificationPermission()).catch(() => {});

    set({
      permission: getDeviceNotificationPermission(),
      platform: detectPlatform(),
      archivedIds: Array.from(archivedSet),
      resolvedActions: getStoredRecord(STORAGE_KEY_RESOLVED_ACTIONS),
    });

    // 1. Attach Firestore realtime listener for Notifications
    let unsubNotifications = () => {};
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      unsubNotifications = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remote: AppNotification[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              const createdAt = data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt || new Date().toISOString();
              return {
                id: docSnap.id,
                title: data.title,
                body: data.body,
                type: data.type || 'broadcast',
                devotionalId: data.devotionalId,
                createdBy: data.createdBy || 'Overseer',
                createdAt,
                read: readIds.has(docSnap.id),
              };
            });

            const dedupedRemote = deduplicateNotifications(remote);

            // Check if there are newly arrived notifications to trigger a device popup
            const previousIds = new Set(get().notifications.map((n) => n.id));
            const newest = dedupedRemote.find((n) => !previousIds.has(n.id) && !readIds.has(n.id) && !isTestNotificationItem(n));
            if (newest && get().notifications.length > 0) {
              showDeviceNotification(newest.title, {
                body: newest.body,
                tag: newest.id,
              });
              playNotificationSound();
            }

            const unread = dedupedRemote.filter((n) => !n.read && !archivedSet.has(n.id) && !isTestNotificationItem(n)).length;
            set({
              notifications: dedupedRemote,
              unreadCount: unread,
            });
          } else {
            // Clean empty state when no broadcasts yet (NO dummy test seeds)
            set({
              notifications: [],
              unreadCount: 0,
            });
          }
        },
        (err) => {
          console.info('Notifications snapshot listener note:', err);
        }
      );
    } catch (err) {
      console.info('Using local notifications mode:', err);
    }

    // 2. Attach Firestore realtime listener for Notification Schedules
    let unsubSchedules = () => {};
    try {
      unsubSchedules = onSnapshot(
        collection(db, 'notificationSchedules'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: NotificationSchedule[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: data.title,
                body: data.body,
                type: data.type || 'broadcast',
                triggerType: data.triggerType || 'timer',
                status: data.status || 'active',
                enabled: data.enabled !== false,
                scheduledAt: data.scheduledAt || null,
                delayMinutes: data.delayMinutes || undefined,
                recurrence: data.recurrence || undefined,
                autoEventType: data.autoEventType || undefined,
                devotionalId: data.devotionalId || null,
                lastTriggeredAt: data.lastTriggeredAt || null,
                nextTriggerAt: data.nextTriggerAt || null,
                triggerCount: data.triggerCount || 0,
                createdAt: data.createdAt?.toDate
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt || new Date().toISOString(),
                createdBy: data.createdBy || 'Overseer',
              };
            });

            const deduped = deduplicateSchedules(list);
            saveStoredSchedules(deduped);
            set({ schedules: deduped });
          } else {
            // Seed default automatic rules into Firestore if collection is empty
            const seedSchedules: NotificationSchedule[] = DEFAULT_AUTOMATIC_RULES.map((rule, idx) => ({
              ...rule,
              id: `preset_auto_${idx + 1}`,
              createdAt: new Date().toISOString(),
            }));

            // Attempt to write presets to Firestore for persistent syncing
            seedSchedules.forEach((preset) => {
              setDoc(doc(db, 'notificationSchedules', preset.id), preset).catch(() => {});
            });

            saveStoredSchedules(seedSchedules);
            set({ schedules: seedSchedules });
          }
        },
        (err) => {
          console.info('Schedules listener notice:', err);
          // Load local cache if offline
          const cached = getStoredSchedules();
          if (cached.length > 0) {
            set({ schedules: cached });
          } else {
            const seedSchedules: NotificationSchedule[] = DEFAULT_AUTOMATIC_RULES.map((rule, idx) => ({
              ...rule,
              id: `local_auto_${idx + 1}`,
              createdAt: new Date().toISOString(),
            }));
            set({ schedules: seedSchedules });
          }
        }
      );
    } catch (err) {
      console.info('Using local schedules cache:', err);
    }

    // 3. Background Engine Ticker (Runs every 10 seconds to check active timers & schedules)
    const tickerInterval = setInterval(async () => {
      const { schedules, broadcastNotification, updateSchedule } = get();
      const now = Date.now();

      for (const item of schedules) {
        if (!item.enabled || item.status !== 'active') continue;

        // A) Timer Triggers
        if (item.triggerType === 'timer' && item.scheduledAt) {
          const scheduledTime = new Date(item.scheduledAt).getTime();
          if (scheduledTime <= now) {
            console.log(`[Timer Trigger] Firing scheduled notification: "${item.title}"`);
            await broadcastNotification({
              title: item.title,
              body: item.body,
              type: item.type,
              devotionalId: item.devotionalId || undefined,
              createdBy: `${item.createdBy} (Timer Trigger)`,
            });

            await updateSchedule(item.id, {
              status: 'completed',
              lastTriggeredAt: new Date().toISOString(),
              triggerCount: (item.triggerCount || 0) + 1,
            });
          }
        }

        // B) Recurring Schedules & Scheduled Automatic Events
        if (
          (item.triggerType === 'recurring' || item.triggerType === 'auto_event') &&
          item.nextTriggerAt &&
          item.recurrence
        ) {
          const nextTime = new Date(item.nextTriggerAt).getTime();
          if (nextTime <= now) {
            console.log(`[Recurring/Auto Trigger] Firing: "${item.title}"`);
            await broadcastNotification({
              title: item.title,
              body: item.body,
              type: item.type,
              devotionalId: item.devotionalId || undefined,
              createdBy: `${item.createdBy} (Automated Schedule)`,
            });

            const nextIso = computeNextRecurrence(item.recurrence, new Date()).toISOString();
            await updateSchedule(item.id, {
              lastTriggeredAt: new Date().toISOString(),
              nextTriggerAt: nextIso,
              triggerCount: (item.triggerCount || 0) + 1,
            });
          }
        }
      }
    }, 10000);

    return () => {
      unsubNotifications();
      unsubSchedules();
      clearInterval(tickerInterval);
    };
  },
}));
