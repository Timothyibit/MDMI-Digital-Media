import React, { useState, useMemo } from 'react';
import {
  Bell,
  ArrowLeft,
  Settings,
  Volume2,
  Sparkles,
  SlidersHorizontal,
  CheckCheck,
} from 'lucide-react';
import { useNotificationStore, isTestNotificationItem, playNotificationSound } from '../../store/useNotificationStore';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { interpolateNotificationTemplate } from '../../services/notificationSchedulerEngine';
import {
  NotificationPanel,
  NotificationItem,
  NotificationKind,
} from '../../../components/ui/notification-panel';
import { NotificationConfigPanel } from './NotificationConfigPanel';
import { NotificationDetailModal } from './NotificationDetailModal';

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    archivedIds,
    resolvedActions,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    resolveAction,
    triggerTestNotification,
    openNotificationDetail,
  } = useNotificationStore();

  const { setActiveTab } = useUIStore();
  const { devotionals, setActiveDevotionalId } = useDevotionalStore();
  const [activeView, setActiveView] = useState<'alerts' | 'settings'>('alerts');
  const [testSent, setTestSent] = useState(false);

  const handleBack = () => {
    setActiveTab('home');
  };

  const handleOpenDevotional = (devotionalId?: string) => {
    if (!devotionalId) {
      if (devotionals.length > 0) {
        setActiveDevotionalId(devotionals[0].id);
        setActiveTab('reader');
      }
      return;
    }
    const found = devotionals.find((d) => d.id === devotionalId);
    if (found) {
      setActiveDevotionalId(found.id);
      setActiveTab('reader');
    }
  };

  const handleTestChime = () => {
    playNotificationSound();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

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
      const cleanTitle = interpolateNotificationTemplate(notif.title || 'Devotional Word');
      const cleanBody = interpolateNotificationTemplate(notif.body || '');

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

      const bodyParts = [
        notif.type === 'devotional'
          ? 'published '
          : notif.type === 'prayer'
          ? 'requested prayer for '
          : 'shared an update: ',
        { entity: cleanTitle },
      ];

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
        quote: cleanBody && cleanBody !== cleanTitle ? cleanBody : undefined,
        fullBody: cleanBody,
        actions: actions.length > 0 ? actions : undefined,
        resolvedAction: resolvedActions[notif.id],
        targetId: notif.devotionalId,
        type: notif.type,
      };
    });
  }, [notifications, archivedIds, resolvedActions]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back to previous screen"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display-scripture text-neutral-950 dark:text-white tracking-tight">
                Notifications & Broadcasts
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#5E72E4] text-white text-xs font-extrabold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Live discipleship announcements, prayer requests, and daily devotional prompts.
            </p>
          </div>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center">
            <button
              type="button"
              onClick={() => setActiveView('alerts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'alerts'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Alerts Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveView('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'settings'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurations</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleTestChime}
            className="px-3 py-2 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:text-neutral-950 dark:hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Preview sacred temple bell chime"
          >
            <Volume2 className="w-4 h-4 text-[#5E72E4] dark:text-[#889af7]" />
            <span className="hidden sm:inline">{testSent ? 'Chimed!' : 'Preview Chime'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {activeView === 'settings' ? (
        <NotificationConfigPanel onClose={() => setActiveView('alerts')} />
      ) : (
        <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm overflow-hidden">
          <NotificationPanel
            items={panelItems}
            maxHeight={750}
            className="border-0 shadow-none bg-transparent"
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
            onSettings={() => setActiveView('settings')}
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

      {/* Dedicated Detail Modal */}
      <NotificationDetailModal onOpenDevotional={handleOpenDevotional} />
    </div>
  );
};
