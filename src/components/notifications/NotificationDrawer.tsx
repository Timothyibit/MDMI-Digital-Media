import React, { useMemo, useState } from 'react';
import {
  Bell,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  SlidersHorizontal,
  CheckCheck,
  BookOpen,
  Heart,
  Layers,
  Clock,
  Archive,
  RefreshCw,
  Smartphone,
  ExternalLink,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useNotificationStore,
  isTestNotificationItem,
  playNotificationSound,
} from '../../store/useNotificationStore';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { interpolateNotificationTemplate } from '../../services/notificationSchedulerEngine';
import { NotificationDetailModal } from './NotificationDetailModal';
import { AppNotification } from '../../types';

export const NotificationDrawer: React.FC = () => {
  const {
    isOpen,
    closeDrawer,
    notifications,
    archivedIds,
    resolvedActions,
    unreadCount,
    soundEnabled,
    toggleSoundEnabled,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAllRead,
    restoreAllArchived,
    resolveAction,
    openNotificationDetail,
    setShowTroubleshooterModal,
    pendingDeliveriesCount,
    permission,
    platform,
  } = useNotificationStore();

  const { setActiveTab } = useUIStore();
  const { devotionals, setActiveDevotionalId } = useDevotionalStore();

  const [activeTabIdx, setActiveTabIdx] = useState<number>(0);
  const [showOptionsSheet, setShowOptionsSheet] = useState<boolean>(false);
  const [soundFeedback, setSoundFeedback] = useState<boolean>(false);

  const handleOpenDevotional = (devotionalId?: string) => {
    closeDrawer();
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

  const handleToggleSound = () => {
    toggleSoundEnabled();
    setSoundFeedback(true);
    setTimeout(() => setSoundFeedback(false), 2000);
  };

  // Filtered notifications list based on active Craft tab
  const filteredNotifications = useMemo(() => {
    const archivedSet = new Set(archivedIds);
    const seenIds = new Set<string>();

    const validList = notifications.filter((notif) => {
      if (!notif || !notif.id || seenIds.has(notif.id) || isTestNotificationItem(notif)) return false;
      seenIds.add(notif.id);
      return !archivedSet.has(notif.id);
    });

    if (activeTabIdx === 1) {
      return validList.filter((n) => n.type === 'devotional');
    } else if (activeTabIdx === 2) {
      return validList.filter((n) => n.type === 'prayer' || n.type === 'comment');
    } else if (activeTabIdx === 3) {
      return validList.filter((n) => n.type === 'broadcast' || n.type === 'study');
    }
    return validList;
  }, [notifications, archivedIds, activeTabIdx]);

  // Craft Tabs Metadata with dynamic unread counts
  const craftTabs = useMemo(() => {
    const archivedSet = new Set(archivedIds);
    const countUnread = (predicate?: (n: AppNotification) => boolean) => {
      return notifications.filter((n) => {
        if (!n || !n.id || n.read || archivedSet.has(n.id) || isTestNotificationItem(n)) return false;
        return predicate ? predicate(n) : true;
      }).length;
    };

    return [
      { id: 0, label: 'All', icon: Layers, unread: countUnread() },
      { id: 1, label: 'Devotionals', icon: BookOpen, unread: countUnread((n) => n.type === 'devotional') },
      { id: 2, label: 'Prayers', icon: Heart, unread: countUnread((n) => n.type === 'prayer' || n.type === 'comment') },
      { id: 3, label: 'Broadcasts', icon: Sparkles, unread: countUnread((n) => n.type === 'broadcast' || n.type === 'study') },
    ];
  }, [notifications, archivedIds]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={closeDrawer} aria-hidden="true" />

      {/* Craft Minimalist Slide-over Panel */}
      <aside
        role="dialog"
        aria-label="Notifications"
        className="relative w-full max-w-md sm:max-w-lg h-full bg-white dark:bg-neutral-950 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col z-10 overflow-hidden"
      >
        {/* 1. Header */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between bg-white dark:bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7] flex items-center justify-center font-bold shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-neutral-950 dark:text-white leading-none">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#5E72E4] text-white text-[10px] font-extrabold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium truncate mt-0.5">
                Spiritual alerts &amp; announcements
              </p>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                soundEnabled
                  ? 'text-[#5E72E4] dark:text-[#889af7] bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={soundEnabled ? 'Mute chime' : 'Enable chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="p-2 rounded-xl text-neutral-600 hover:text-[#5E72E4] dark:text-neutral-300 dark:hover:text-[#889af7] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowOptionsSheet(true)}
              className="p-2 rounded-xl text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="More options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={closeDrawer}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Temporary Sound Feedback Pill */}
        <AnimatePresence>
          {soundFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="px-3 py-1 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold text-center mx-3 my-1.5 rounded-xl flex items-center justify-center gap-1.5"
            >
              {soundEnabled ? <span>Sound chime enabled</span> : <span>Notifications muted</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Craft Minimalist Tabs */}
        <div className="bg-white dark:bg-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800/80 px-2 sm:px-3 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {craftTabs.map((tab) => {
              const isActive = activeTabIdx === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabIdx(tab.id)}
                  className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-neutral-950 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5E72E4] dark:text-[#889af7]' : 'opacity-70'}`} />
                  <span>{tab.label}</span>
                  {tab.unread > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-[#5E72E4] text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {tab.unread}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="craftDrawerTabIndicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#5E72E4] dark:bg-[#889af7] rounded-full"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-neutral-100 dark:divide-neutral-900">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400 mx-auto flex items-center justify-center">
                <Bell className="w-5 h-5 stroke-1" />
              </div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">
                All caught up
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                No notifications in this tab right now.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;
              const cleanTitle = interpolateNotificationTemplate(notif.title || 'Devotional Word');
              const cleanBody = interpolateNotificationTemplate(notif.body || '');
              const resolvedLabel = resolvedActions[notif.id];

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id, true);
                    if (notif.devotionalId) {
                      handleOpenDevotional(notif.devotionalId);
                    } else {
                      openNotificationDetail(notif);
                    }
                  }}
                  className={`py-3 px-2.5 rounded-2xl transition-all cursor-pointer group flex items-start gap-2.5 ${
                    isUnread
                      ? 'bg-[#5E72E4]/5 hover:bg-[#5E72E4]/10 dark:bg-[#5E72E4]/10 dark:hover:bg-[#5E72E4]/15'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                  }`}
                >
                  {/* Left Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      notif.type === 'devotional'
                        ? 'bg-[#5E72E4]/15 text-[#5E72E4]'
                        : notif.type === 'prayer'
                        ? 'bg-rose-500/15 text-rose-600'
                        : notif.type === 'comment'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}
                  >
                    {notif.type === 'devotional' ? (
                      <BookOpen className="w-3.5 h-3.5" />
                    ) : notif.type === 'prayer' ? (
                      <Heart className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#5E72E4] dark:text-[#889af7]">
                        {notif.type.toUpperCase()}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-700">•</span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-0.5 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-neutral-950 dark:text-white leading-snug line-clamp-1">
                      {cleanTitle}
                    </p>

                    {cleanBody && (
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                        {cleanBody}
                      </p>
                    )}

                    <div className="pt-0.5 flex items-center gap-1.5">
                      {resolvedLabel ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                          <Check className="w-2.5 h-2.5" />
                          <span>{resolvedLabel}</span>
                        </span>
                      ) : notif.type === 'devotional' || notif.devotionalId ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id, true);
                            handleOpenDevotional(notif.devotionalId);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5E72E4] dark:text-[#889af7] bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>Read Now</span>
                        </button>
                      ) : notif.type === 'prayer' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAction(notif.id, 'amen_pray', 'Amen & Prayed');
                            playNotificationSound();
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <Heart className="w-2.5 h-2.5" />
                          <span>Amen &amp; Pray</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Right: Unread Dot */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pt-1">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#5E72E4] shadow-xs" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotification(notif.id, true);
                      }}
                      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Archive alert"
                    >
                      <Archive className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Options Bottom Sheet */}
        <AnimatePresence>
          {showOptionsSheet && (
            <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="absolute inset-0" onClick={() => setShowOptionsSheet(false)} />

              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.2 }}
                className="relative w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl shadow-2xl p-4 space-y-3 z-10 max-h-[80vh] overflow-y-auto"
              >
                <div className="w-8 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto" />

                <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Options &amp; Preferences
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowOptionsSheet(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Sound Toggle */}
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-[#5E72E4]" />
                      <span className="font-bold text-neutral-900 dark:text-white">Notification Sound</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={soundEnabled}
                      onClick={handleToggleSound}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                        soundEnabled ? 'bg-[#5E72E4]' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                          soundEnabled ? 'translate-x-4' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </button>
                  </div>

                  {/* Mark All Read */}
                  <button
                    type="button"
                    onClick={() => {
                      markAllAsRead();
                      setShowOptionsSheet(false);
                    }}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left flex items-center gap-2 font-bold text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                    <span>Mark All as Read</span>
                  </button>

                  {/* Archive Read */}
                  <button
                    type="button"
                    onClick={() => {
                      archiveAllRead();
                      setShowOptionsSheet(false);
                    }}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left flex items-center gap-2 font-bold text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                    <span>Archive Read Alerts</span>
                  </button>

                  {/* Troubleshooter */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsSheet(false);
                      closeDrawer();
                      setShowTroubleshooterModal(true);
                    }}
                    className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-left flex items-center justify-between text-amber-900 dark:text-amber-200 font-bold cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>{platform === 'android' ? 'Phone System & Battery Setup' : 'Browser Notification Setup'}</span>
                    </div>
                    {pendingDeliveriesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-extrabold">
                        {pendingDeliveriesCount}
                      </span>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </aside>

      <NotificationDetailModal onOpenDevotional={handleOpenDevotional} />
    </div>
  );
};
