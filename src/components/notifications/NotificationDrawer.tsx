import React, { useMemo, useState } from 'react';
import {
  Bell,
  X,
  AlertCircle,
  Smartphone,
  Globe,
  Apple,
  Volume2,
  CheckCircle2,
  Settings,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useNotificationStore, isTestNotificationItem } from '../../store/useNotificationStore';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import {
  NotificationPanel,
  NotificationItem,
  NotificationKind,
} from '../../../components/ui/notification-panel';

export const NotificationDrawer: React.FC = () => {
  const {
    isOpen,
    closeDrawer,
    notifications,
    archivedIds,
    resolvedActions,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    resolveAction,
    permission,
    requestPermission,
    platform,
    triggerTestNotification,
  } = useNotificationStore();

  const { setActiveTab } = useUIStore();
  const { devotionals, setActiveDevotionalId } = useDevotionalStore();
  const [showPlatformGuide, setShowPlatformGuide] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleOpenDevotional = (devotionalId?: string) => {
    if (!devotionalId) {
      if (devotionals.length > 0) {
        closeDrawer();
        setActiveDevotionalId(devotionals[0].id);
        setActiveTab('reader');
      }
      return;
    }
    const found = devotionals.find((d) => d.id === devotionalId);
    if (found) {
      closeDrawer();
      setActiveDevotionalId(found.id);
      setActiveTab('reader');
    }
  };

  const handleTestChime = async () => {
    await triggerTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Convert store notifications into NotificationPanel items, ensuring strict ID uniqueness
  const panelItems: NotificationItem[] = useMemo(() => {
    const archivedSet = new Set(archivedIds);
    const seenIds = new Set<string>();

    const uniqueNotifications = notifications.filter((notif) => {
      if (!notif || !notif.id || seenIds.has(notif.id) || isTestNotificationItem(notif)) return false;
      seenIds.add(notif.id);
      return true;
    });

    return uniqueNotifications.map((notif) => {
      let kind: NotificationKind = 'created';
      if (notif.type === 'devotional') kind = 'file';
      else if (notif.type === 'prayer') kind = 'request';
      else if (notif.type === 'comment') kind = 'comment';
      else if (notif.type === 'study') kind = 'file';

      const actorName = notif.createdBy || 'Ministry Team';

      // Format relative time
      let relativeTime = 'Recently';
      try {
        const diffMs = Date.now() - new Date(notif.createdAt).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 2) relativeTime = 'Just now';
        else if (diffMins < 60) relativeTime = `${diffMins}m ago`;
        else {
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) relativeTime = `${diffHours}h ago`;
          else {
            const diffDays = Math.floor(diffHours / 24);
            relativeTime = `${diffDays}d ago`;
          }
        }
      } catch {
        relativeTime = 'Recently';
      }

      // Sentence body parts
      const bodyParts = [
        notif.type === 'devotional'
          ? 'published '
          : notif.type === 'prayer'
          ? 'requested prayer for '
          : 'shared an update: ',
        { entity: notif.title || 'Devotional Word' },
      ];

      // Actions
      const actions = [];
      if (notif.type === 'devotional' || notif.devotionalId) {
        actions.push({
          id: 'read_devotional',
          label: 'Read Now',
          tone: 'primary' as const,
          resolved: '✓ Read in Library',
        });
      } else if (notif.type === 'prayer') {
        actions.push({
          id: 'pray_agree',
          label: 'Amen & Pray',
          tone: 'primary' as const,
          resolved: '✓ Prayed in Agreement',
        });
      }

      return {
        id: notif.id,
        actor: { name: actorName },
        kind,
        body: bodyParts,
        time: relativeTime,
        context: ['MDMI Ministry', notif.type.toUpperCase()],
        unread: !notif.read,
        archived: archivedSet.has(notif.id),
        quote: notif.body && notif.body !== notif.title ? notif.body : undefined,
        actions: actions.length > 0 ? actions : undefined,
        resolvedAction: resolvedActions[notif.id],
        targetId: notif.devotionalId,
      };
    });
  }, [notifications, archivedIds, resolvedActions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeDrawer} />

      <aside
        role="dialog"
        aria-label="Ministry Notifications"
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col z-10 transition-colors"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 dark:text-white">
                Discipleship Alerts
              </h1>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                {unreadCount > 0
                  ? `${unreadCount} unread announcements`
                  : 'All spiritual updates caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestChime}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Test chime & notification"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#5E72E4]" />
              <span className="hidden sm:inline">
                {testSent ? 'Chimed!' : 'Test Sound'}
              </span>
            </button>

            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close notifications"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Platform (Web, Android, iOS) Device Permission Card */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {platform === 'ios' ? (
                <Apple className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
              ) : platform === 'android' ? (
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Device Notifications:
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  permission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : permission === 'denied'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                {permission === 'granted' ? 'Turned On' : permission === 'denied' ? 'Blocked in Settings' : 'Not Enabled Yet'}
              </span>
            </div>

            {permission !== 'granted' ? (
              <button
                type="button"
                onClick={() => requestPermission()}
                className="px-3 py-1 bg-[#5E72E4] hover:bg-[#485ec4] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Enable
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPlatformGuide((prev) => !prev)}
                className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Guide</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showPlatformGuide ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Platform Specific Guidance Drawer */}
          {(permission !== 'granted' || showPlatformGuide) && (
            <div className="mt-2.5 pt-2.5 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5">
              {platform === 'ios' && (
                <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    iOS (iPhone / iPad) Setup:
                  </p>
                  <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 mt-0.5">
                    1. Tap the Share icon (⎙) in Safari.<br />
                    2. Select <strong>"Add to Home Screen"</strong>.<br />
                    3. Open the MDMI app icon on your screen and enable alerts.
                  </p>
                </div>
              )}

              {platform === 'android' && (
                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Android Push Setup:
                  </p>
                  <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                    Click <strong>Enable</strong> above to grant browser permissions. Daily devotionals and overseer alerts will pop up on your lock screen.
                  </p>
                </div>
              )}

              {platform === 'web' && (
                <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Desktop Browser Setup:
                  </p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Allow notifications in your browser when prompted to get alerts with the sacred temple bell chime.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Integrated NotificationPanel */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          <NotificationPanel
            items={panelItems}
            maxHeight={640}
            className="h-full border border-neutral-200 dark:border-neutral-800 shadow-none bg-white dark:bg-neutral-900"
            onMarkAllRead={markAllAsRead}
            onReadChange={(item, unread) => markAsRead(item.id, !unread)}
            onArchiveChange={(item, archived) => archiveNotification(item.id, archived)}
            onAction={(item, actionId) => {
              if (actionId === 'read_devotional') {
                resolveAction(item.id, actionId, 'Opened Devotional');
                handleOpenDevotional(item.targetId);
              } else if (actionId === 'pray_agree') {
                resolveAction(item.id, actionId, 'Prayed in Agreement');
                useNotificationStore.getState().triggerTestNotification();
              }
            }}
            onOpenItem={(item) => {
              markAsRead(item.id, true);
              if (item.targetId) {
                handleOpenDevotional(item.targetId);
              }
            }}
          />
        </div>
      </aside>
    </div>
  );
};
