import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Heart,
  Share2,
  Copy,
  Check,
  Archive,
  Inbox,
  ExternalLink,
  Sparkles,
  MessageSquare,
  FileText,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { AppNotification } from '../../types';

interface NotificationDetailModalProps {
  onOpenDevotional?: (devotionalId: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  onOpenDevotional,
}) => {
  const {
    selectedNotificationDetail,
    closeNotificationDetail,
    markAsRead,
    archiveNotification,
    archivedIds,
    resolveAction,
    resolvedActions,
  } = useNotificationStore();

  const { setActiveTab } = useUIStore();
  const { devotionals, setActiveDevotionalId } = useDevotionalStore();
  const [copied, setCopied] = React.useState(false);

  const notif = selectedNotificationDetail;
  const isArchived = notif ? archivedIds.includes(notif.id) : false;
  const isResolved = notif ? resolvedActions[notif.id] : undefined;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeNotificationDetail();
      }
    };
    if (notif) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notif, closeNotificationDetail]);

  if (!notif) return null;

  const handleCopyText = async () => {
    try {
      const fullText = `${notif.title}\n\n${notif.body}\n\n— ${notif.createdBy || 'MDMI Ministry'} (${new Date(
        notif.createdAt
      ).toLocaleDateString()})`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleReadDevotional = () => {
    closeNotificationDetail();
    if (notif.devotionalId) {
      if (onOpenDevotional) {
        onOpenDevotional(notif.devotionalId);
      } else {
        const found = devotionals.find((d) => d.id === notif.devotionalId);
        if (found) {
          setActiveDevotionalId(found.id);
          setActiveTab('reader');
        }
      }
    } else if (devotionals.length > 0) {
      setActiveDevotionalId(devotionals[0].id);
      setActiveTab('reader');
    }
  };

  const handlePrayerAgree = () => {
    resolveAction(notif.id, 'pray_agree', 'Prayed in Agreement');
    useNotificationStore.getState().triggerTestNotification();
  };

  // Format readable full date & time
  let formattedDate = 'Recently';
  try {
    const d = new Date(notif.createdAt);
    formattedDate = d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    formattedDate = notif.createdAt;
  }

  const categoryLabel =
    notif.type === 'devotional'
      ? 'Daily Devotional'
      : notif.type === 'prayer'
      ? 'Prayer Request'
      : notif.type === 'study'
      ? 'Bible Study'
      : notif.type === 'comment'
      ? 'Community Reflection'
      : 'Ministry Announcement';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="absolute inset-0"
          onClick={closeNotificationDetail}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-detail-title"
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 transition-colors"
        >
          {/* Header Bar */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/90 dark:bg-neutral-850/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7] flex items-center justify-center font-bold shrink-0">
                {notif.type === 'devotional' ? (
                  <BookOpen className="w-5 h-5" />
                ) : notif.type === 'prayer' ? (
                  <Heart className="w-5 h-5" />
                ) : notif.type === 'comment' ? (
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#5E72E4] dark:text-[#889af7]">
                  {categoryLabel}
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1.5 font-medium mt-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{formattedDate}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyText}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Copy notification text"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={closeNotificationDetail}
                aria-label="Close alert detail"
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
            {/* Title / Headline */}
            <div>
              <h2
                id="notification-detail-title"
                className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-snug tracking-tight"
              >
                {notif.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                <span>By</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {notif.createdBy || 'MDMI Ministry Team'}
                </span>
                <span>•</span>
                <span>Ministry Broadcast</span>
              </div>
            </div>

            {/* Main Rich Text Notification Body */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-850/80 border border-neutral-200/90 dark:border-neutral-800">
              <p className="text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans whitespace-pre-line">
                {notif.body}
              </p>
            </div>

            {/* Resolved state or action banner */}
            {isResolved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Action completed: {isResolved}</span>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  archiveNotification(notif.id, !isArchived);
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {isArchived ? (
                  <>
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Move to Inbox</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Alert</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  markAsRead(notif.id, !notif.read);
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{notif.read ? 'Mark as Unread' : 'Mark as Read'}</span>
              </button>
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-2">
              {notif.type === 'devotional' || notif.devotionalId ? (
                <button
                  type="button"
                  onClick={handleReadDevotional}
                  className="px-4 py-2 rounded-xl bg-[#5E72E4] hover:bg-[#485ec4] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Devotional</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              ) : notif.type === 'prayer' ? (
                <button
                  type="button"
                  onClick={handlePrayerAgree}
                  className="px-4 py-2 rounded-xl bg-[#5E72E4] hover:bg-[#485ec4] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
                >
                  <Heart className="w-4 h-4" />
                  <span>Amen & Pray</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeNotificationDetail}
                  className="px-4 py-2 rounded-xl bg-[#5E72E4] hover:bg-[#485ec4] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
