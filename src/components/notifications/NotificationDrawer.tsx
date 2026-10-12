import React, { useMemo, useState } from 'react';
import {
  Bell,
  X,
  Volume2,
  Settings,
  ChevronDown,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useNotificationStore, isTestNotificationItem, playNotificationSound } from '../../store/useNotificationStore';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import {
  NotificationPanel,
  NotificationItem,
  NotificationKind,
} from '../../../components/ui/notification-panel';
import { NotificationConfigPanel } from './NotificationConfigPanel';
import { NotificationDetailModal } from './NotificationDetailModal';

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
    openNotificationDetail,
  } = useNotificationStore();

  const { setActiveTab } = useUIStore();
  const { devotionals, setActiveDevotionalId } = useDevotionalStore();
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const handleOpenFullScreenPage = () => {
    closeDrawer();
    setActiveTab('notifications');
  };

  const handleTestChime = () => {
    playNotificationSound();
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
        fullBody: notif.body,
        actions: actions.length > 0 ? actions : undefined,
        resolvedAction: resolvedActions[notif.id],
        targetId: notif.devotionalId,
        type: notif.type,
      };
    });
  }, [notifications, archivedIds, resolvedActions]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex ${
          isFullscreen ? 'items-center justify-center p-0 sm:p-4' : 'justify-end'
        } bg-black/60 backdrop-blur-sm transition-all duration-200`}
      >
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={closeDrawer} aria-hidden="true" />

        <aside
          role="dialog"
          aria-label="Ministry Notifications"
          className={`relative w-full ${
            isFullscreen
              ? 'max-w-4xl h-full sm:h-[94vh] sm:rounded-3xl'
              : 'max-w-lg md:max-w-xl h-full'
          } bg-white dark:bg-neutral-900 shadow-2xl border-l sm:border border-neutral-200 dark:border-neutral-800 flex flex-col z-10 transition-all duration-200 overflow-hidden`}
        >
          {/* Top Header */}
          <div className="p-3.5 sm:p-4.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/90 dark:bg-neutral-900/90 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7] flex items-center justify-center font-bold shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white truncate">
                  Discipleship Alerts
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
                  {unreadCount > 0
                    ? `${unreadCount} unread announcements`
                    : 'All spiritual updates caught up'}
                </p>
              </div>
            </div>

            {/* Header Right Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleTestChime}
                className="px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-neutral-700 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Test chime sound"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#5E72E4] dark:text-[#889af7]" />
                <span className="hidden sm:inline">
                  {testSent ? 'Chimed!' : 'Test Sound'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSettings((p) => !p)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showSettings
                    ? 'bg-[#5E72E4] text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
                title="Alert Configurations"
                aria-label="Alert settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen((f) => !f)}
                className="hidden sm:flex p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={isFullscreen ? 'Dock as side drawer' : 'Maximize to full view'}
                aria-label="Toggle full view"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleOpenFullScreenPage}
                className="hidden sm:flex p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Open as full dedicated page"
                aria-label="Open as full page"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close notifications"
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer ml-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Collapsible Configurations Section */}
          {showSettings ? (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <NotificationConfigPanel onClose={() => setShowSettings(false)} />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden p-2 sm:p-3.5 flex flex-col min-h-0">
              <NotificationPanel
                items={panelItems}
                maxHeight={isFullscreen ? 800 : 640}
                className="h-full border border-neutral-200/90 dark:border-neutral-800 shadow-none bg-white dark:bg-neutral-900"
                onMarkAllRead={markAllAsRead}
                onReadChange={(item, unread) => markAsRead(item.id, !unread)}
                onArchiveChange={(item, archived) => archiveNotification(item.id, archived)}
                onViewFullItem={(item) => {
                  const found = notifications.find((n) => n.id === item.id);
                  if (found) {
                    openNotificationDetail(found);
                  } else {
                    openNotificationDetail({
                      id: item.id,
                      title: typeof item.body[1] === 'object' ? item.body[1].entity : item.actor.name,
                      body: item.fullBody || item.quote || item.actor.name,
                      type: (item.type as any) || 'broadcast',
                      read: !item.unread,
                      createdAt: new Date().toISOString(),
                      createdBy: item.actor.name,
                      devotionalId: item.targetId,
                    });
                  }
                }}
                onSettings={() => setShowSettings(true)}
                onAction={(item, actionId) => {
                  if (actionId === 'read_devotional') {
                    resolveAction(item.id, actionId, 'Opened Devotional');
                    handleOpenDevotional(item.targetId);
                  } else if (actionId === 'pray_agree') {
                    resolveAction(item.id, actionId, 'Prayed in Agreement');
                    playNotificationSound();
                  }
                }}
                onOpenItem={(item) => {
                  markAsRead(item.id, true);
                  if (item.targetId) {
                    handleOpenDevotional(item.targetId);
                  } else {
                    const found = notifications.find((n) => n.id === item.id);
                    if (found) {
                      openNotificationDetail(found);
                    }
                  }
                }}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Full Notification Detail Modal */}
      <NotificationDetailModal onOpenDevotional={handleOpenDevotional} />
    </>
  );
};
