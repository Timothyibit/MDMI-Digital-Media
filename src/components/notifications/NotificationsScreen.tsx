import React, { useState, useMemo } from 'react';
import {
  Bell,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  SlidersHorizontal,
  CheckCheck,
  BookOpen,
  Heart,
  Layers,
  Clock,
  MoreVertical,
  Archive,
  RefreshCw,
  Smartphone,
  ExternalLink,
  X,
  Inbox,
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

export const NotificationsScreen: React.FC = () => {
  const {
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

  // Active Craft Tab: 0 = All, 1 = Devotionals, 2 = Prayers, 3 = Broadcasts
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0);
  const [showOptionsSheet, setShowOptionsSheet] = useState<boolean>(false);
  const [soundFeedback, setSoundFeedback] = useState<boolean>(false);

  const handleBack = () => {
    setActiveTab('home');
  };

  const handleToggleSound = () => {
    toggleSoundEnabled();
    setSoundFeedback(true);
    setTimeout(() => setSoundFeedback(false), 2000);
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

  // Helper for humanized relative time
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

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-140px)] animate-in fade-in duration-150">
      {/* 1. Minimalist Craft Navigation Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 py-3.5 px-3 sm:px-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-neutral-950 dark:text-white tracking-tight leading-none">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#5E72E4] text-white text-[11px] font-extrabold shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium truncate mt-0.5">
              Spiritual announcements &amp; daily reminders
            </p>
          </div>
        </div>

        {/* Minimalist Top Right Header Icons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Sound Toggle Icon Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              soundEnabled
                ? 'text-[#5E72E4] dark:text-[#889af7] bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={soundEnabled ? 'Sound is ON (Tap to mute)' : 'Sound is Muted (Tap to unmute)'}
            aria-label="Notification sound toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Mark All Read Quick Icon Button */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="p-2 rounded-xl text-neutral-600 hover:text-[#5E72E4] dark:text-neutral-300 dark:hover:text-[#889af7] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Mark all as read"
              aria-label="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}

          {/* More Options Sheet Trigger Icon */}
          <button
            type="button"
            onClick={() => setShowOptionsSheet(true)}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Notification Options & Settings"
            aria-label="Open options"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sound Feedback Pill Banner (Discreet temporary toast) */}
      <AnimatePresence>
        {soundFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="px-4 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold text-center mx-4 my-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Notification sound enabled</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                <span>Notifications muted</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Minimalist Craft Sliding Tabs */}
      <div className="bg-white dark:bg-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800/80 px-2 sm:px-4">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {craftTabs.map((tab) => {
            const isActive = activeTabIdx === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabIdx(tab.id)}
                className={`relative px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
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
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="craftActiveTabIndicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#5E72E4] dark:bg-[#889af7] rounded-full"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Scrollable Minimalist Notifications Feed */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 divide-y divide-neutral-100 dark:divide-neutral-900">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400 mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6 stroke-1" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                No notifications right now
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mt-0.5">
                {activeTabIdx === 0
                  ? 'All spiritual broadcasts, teachings, and community prayers are caught up.'
                  : `No items found in this category.`}
              </p>
            </div>
            {archivedIds.length > 0 && (
              <button
                type="button"
                onClick={restoreAllArchived}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5E72E4] hover:underline cursor-pointer pt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore {archivedIds.length} archived alert(s)</span>
              </button>
            )}
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
                className={`py-3.5 px-3 rounded-2xl transition-all cursor-pointer group flex items-start gap-3 ${
                  isUnread
                    ? 'bg-[#5E72E4]/5 hover:bg-[#5E72E4]/10 dark:bg-[#5E72E4]/10 dark:hover:bg-[#5E72E4]/15'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                }`}
              >
                {/* Left: Minimalist Avatar / Icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-2xs ${
                    notif.type === 'devotional'
                      ? 'bg-[#5E72E4]/15 text-[#5E72E4] dark:text-[#889af7]'
                      : notif.type === 'prayer'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : notif.type === 'comment'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {notif.type === 'devotional' ? (
                    <BookOpen className="w-4 h-4" />
                  ) : notif.type === 'prayer' ? (
                    <Heart className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>

                {/* Center: Content Body */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Timestamp & Category */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5E72E4] dark:text-[#889af7]">
                      {notif.type.toUpperCase()}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  {/* Headline & Body */}
                  <p className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white leading-snug line-clamp-1">
                    {cleanTitle}
                  </p>

                  {cleanBody && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                      {cleanBody}
                    </p>
                  )}

                  {/* Resolved Action Notice or Quick Inline Action */}
                  <div className="pt-1 flex items-center gap-2">
                    {resolvedLabel ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" />
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
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5E72E4] dark:text-[#889af7] bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Read Devotional</span>
                      </button>
                    ) : notif.type === 'prayer' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveAction(notif.id, 'amen_pray', 'Amen & Prayed');
                          playNotificationSound();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Heart className="w-3 h-3" />
                        <span>Amen &amp; Pray</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Right: Unread Dot & Item Options */}
                <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-[#5E72E4] shadow-xs animate-pulse" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveNotification(notif.id, true);
                    }}
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Archive alert"
                    aria-label="Archive alert"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Craft Minimalist More Options Bottom Sheet ("Every other thing hidden in icons") */}
      <AnimatePresence>
        {showOptionsSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div
              className="absolute inset-0"
              onClick={() => setShowOptionsSheet(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 120 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl shadow-2xl p-5 space-y-4 z-10 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Pill */}
              <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#5E72E4]" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Notification Options
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOptionsSheet(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Options List */}
              <div className="space-y-2 text-xs">
                {/* Sound Toggle Row */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center font-bold">
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white">
                        Notification Chime
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {soundEnabled ? 'Chimes audible on arrival' : 'Muted / silent alerts'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={soundEnabled}
                    onClick={handleToggleSound}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                      soundEnabled ? 'bg-[#5E72E4]' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </button>
                </div>

                {/* Mark All As Read */}
                <button
                  type="button"
                  onClick={() => {
                    markAllAsRead();
                    setShowOptionsSheet(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center font-bold">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white">
                        Mark All as Read
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Clears unread indicators on all tabs
                      </p>
                    </div>
                  </div>
                </button>

                {/* Archive Read Alerts */}
                <button
                  type="button"
                  onClick={() => {
                    archiveAllRead();
                    setShowOptionsSheet(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center font-bold">
                      <Archive className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white">
                        Archive Read Alerts
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Keep only unread updates in the main feed
                      </p>
                    </div>
                  </div>
                </button>

                {/* Restore Archived */}
                {archivedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      restoreAllArchived();
                      setShowOptionsSheet(false);
                    }}
                    className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center font-bold">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white">
                          Restore {archivedIds.length} Archived Alerts
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Moves archived items back into your active feed
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Device & Phone Diagnostics Troubleshooter */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsSheet(false);
                    setShowTroubleshooterModal(true);
                  }}
                  className="w-full p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-950 dark:text-amber-200">
                        {platform === 'android' ? 'Phone System & Battery Setup' : 'Browser Notification Setup'}
                      </p>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        {permission === 'granted'
                          ? 'Device alerts verified active'
                          : 'Configure Android / Browser permissions'}
                      </p>
                    </div>
                  </div>
                  {pendingDeliveriesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                      {pendingDeliveriesCount} Queued
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dedicated Notification Detail Modal */}
      <NotificationDetailModal onOpenDevotional={handleOpenDevotional} />
    </div>
  );
};
