import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Clock,
  Bell,
  Smartphone,
  Globe,
  Apple,
  Check,
  CheckCheck,
  Archive,
  RefreshCw,
  Send,
  ChevronDown,
  Shield,
  Layers,
  Sparkles,
  BookOpen,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { playNotificationSound } from '../../services/notificationService';

interface NotificationConfigPanelProps {
  onClose?: () => void;
  className?: string;
}

const TIME_PRESETS = [
  { label: '6:00 AM Dawn', time: '06:00' },
  { label: '7:00 AM Morning', time: '07:00' },
  { label: '8:00 AM Devotion', time: '08:00' },
  { label: '12:00 PM Midday', time: '12:00' },
  { label: '9:00 PM Evening', time: '21:00' },
];

export const NotificationConfigPanel: React.FC<NotificationConfigPanelProps> = ({
  onClose,
  className = '',
}) => {
  const {
    soundEnabled,
    toggleSoundEnabled,
    dailyReminderTime,
    setDailyReminderTime,
    categoryPreferences,
    toggleCategoryPreference,
    permission,
    requestPermission,
    platform,
    triggerTestNotification,
    markAllAsRead,
    archiveAllRead,
    restoreAllArchived,
    archivedIds,
    notifications,
    maxStoredAmount,
    setMaxStoredAmount,
    pruneOldNotifications,
    pendingDeliveriesCount,
    setShowTroubleshooterModal,
    testDeviceDelivery,
  } = useNotificationStore();

  const { user, updateNotificationSettings } = useAuthStore();
  const [showPlatformGuide, setShowPlatformGuide] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [pruneResult, setPruneResult] = useState<string | null>(null);

  const handlePruneNow = async () => {
    const res = await pruneOldNotifications();
    if (res.prunedCount > 0) {
      setPruneResult(`Pruned ${res.prunedCount} old alerts! Recent ${res.preservedCount} preserved.`);
    } else {
      setPruneResult(`All ${res.preservedCount} alerts are within the maximum limit.`);
    }
    setTimeout(() => setPruneResult(null), 3000);
  };

  const handleTestChime = () => {
    playNotificationSound();
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 2000);
  };

  const [testDeliveryFeedback, setTestDeliveryFeedback] = useState<string | null>(null);

  const handleTriggerTest = async () => {
    playNotificationSound();
    setTestSent(true);
    try {
      const res = await testDeviceDelivery();
      if (res.success) {
        setTestDeliveryFeedback('Delivered to device!');
      } else {
        setTestDeliveryFeedback(res.diagnostic || 'Blocked by phone');
      }
    } catch {
      setTestDeliveryFeedback('Delivery test failed');
    }
    setTimeout(() => {
      setTestSent(false);
      setTestDeliveryFeedback(null);
    }, 3500);
  };

  const handleTimeChange = (newTime: string) => {
    setDailyReminderTime(newTime);
    if (user) {
      updateNotificationSettings(true, newTime);
    }
  };

  const handleArchiveAllRead = () => {
    archiveAllRead();
    setArchiveSuccess(true);
    setTimeout(() => setArchiveSuccess(false), 2000);
  };

  const handleRestoreArchived = () => {
    restoreAllArchived();
    setRestoreSuccess(true);
    setTimeout(() => setRestoreSuccess(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-4 sm:p-5 space-y-6 shadow-sm transition-colors ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#5E72E4]" />
            <span>Alert Configurations & Preferences</span>
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
            Configure sound, daily devotional reminders, category filters, and device push.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        )}
      </div>

      {/* 1. Audio & Bell Sound */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7] flex items-center justify-center font-bold shrink-0">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
                Sacred Temple Bell Chime
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                Gentle, reverent chime plays when spiritual notifications arrive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestChime}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Volume2 className="w-3 h-3 text-[#5E72E4] dark:text-[#889af7]" />
              <span>{soundTested ? 'Chimed!' : 'Test Sound'}</span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => toggleSoundEnabled()}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#5E72E4] ${
                soundEnabled ? 'bg-[#5E72E4]' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Daily Quiet Time Reminder */}
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
                Daily Devotional Reminder
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                Scheduled quiet time prompt to build your daily reading streak
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="time"
              value={dailyReminderTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#5E72E4] cursor-pointer shadow-xs"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {TIME_PRESETS.map((preset) => {
            const isSelected = dailyReminderTime === preset.time;
            return (
              <button
                key={preset.time}
                type="button"
                onClick={() => handleTimeChange(preset.time)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-[#5E72E4] text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Category Subscriptions */}
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
        <div>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5E72E4]" />
            <span>Category Preferences</span>
          </p>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
            Choose what spiritual alerts you want to receive
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Devotionals */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5E72E4]" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
                  Devotional Word
                </p>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300">
                  Daily teachings & scripture
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={categoryPreferences.devotional}
              onClick={() => toggleCategoryPreference('devotional')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                categoryPreferences.devotional
                  ? 'bg-[#5E72E4]'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  categoryPreferences.devotional ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </button>
          </div>

          {/* Prayers */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
                  Prayer Requests
                </p>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300">
                  Intercession & community needs
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={categoryPreferences.prayer}
              onClick={() => toggleCategoryPreference('prayer')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                categoryPreferences.prayer
                  ? 'bg-[#5E72E4]'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  categoryPreferences.prayer ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </button>
          </div>

          {/* Fellowship */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
                  Fellowship & Replies
                </p>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300">
                  Comments & discussion updates
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={categoryPreferences.fellowship}
              onClick={() => toggleCategoryPreference('fellowship')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                categoryPreferences.fellowship
                  ? 'bg-[#5E72E4]'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  categoryPreferences.fellowship ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </button>
          </div>

          {/* Broadcasts */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
                  Overseer Broadcasts
                </p>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300">
                  Important announcements
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={categoryPreferences.broadcast}
              onClick={() => toggleCategoryPreference('broadcast')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                categoryPreferences.broadcast
                  ? 'bg-[#5E72E4]'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  categoryPreferences.broadcast ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Multi-Platform Device Push Integration */}
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {platform === 'ios' ? (
              <Apple className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            ) : platform === 'android' ? (
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Device System Push:
            </span>
            <span
              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                permission === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : permission === 'denied'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {permission === 'granted'
                ? 'Active'
                : permission === 'denied'
                ? 'Blocked'
                : 'Not Prompted'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {permission !== 'granted' ? (
              <button
                type="button"
                onClick={() => requestPermission()}
                className="px-3.5 py-1.5 bg-[#5E72E4] hover:bg-[#485ec4] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Enable Push
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTriggerTest}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3 text-[#5E72E4] dark:text-[#889af7]" />
                <span>{testSent ? (testDeliveryFeedback || 'Chimed!') : 'Preview Alert'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTroubleshooterModal(true)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-300/80 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Phone Notification Diagnostics & Delivery"
            >
              <Smartphone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Troubleshoot</span>
              {pendingDeliveriesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-extrabold">
                  {pendingDeliveriesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowPlatformGuide((p) => !p)}
              className="text-xs font-bold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white flex items-center gap-0.5 cursor-pointer ml-0.5"
            >
              <span>Guide</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showPlatformGuide ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {testDeliveryFeedback && !testSent && (
          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg">
            {testDeliveryFeedback}
          </p>
        )}

        {/* Collapsible Device Push Guide */}
        {showPlatformGuide && (
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 space-y-1.5 animate-in fade-in duration-150">
            {platform === 'ios' ? (
              <div>
                <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Apple className="w-3.5 h-3.5" />
                  <span>iOS (iPhone / iPad) PWA Push Setup</span>
                </p>
                <ol className="list-decimal list-inside text-[11px] text-neutral-600 dark:text-neutral-300 space-y-0.5 mt-1">
                  <li>Tap the Share icon in Safari (⎙ / box with arrow).</li>
                  <li>Scroll down and select "Add to Home Screen".</li>
                  <li>Open MDMI from your Home Screen to unlock push alerts.</li>
                </ol>
              </div>
            ) : platform === 'android' ? (
              <div>
                <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Android Push Setup</span>
                </p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                  Tap <strong>Enable Push</strong> above. Android Chrome will prompt you to allow
                  notifications. Alert popups will show up on your lock screen with the sacred
                  temple chime.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Desktop Browser Push Setup</span>
                </p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                  Allow notifications when prompted by your browser to receive instant spiritual
                  encouragements and morning devotional reminders right on your desktop.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Storage Capacity & Auto-Deletion Limit */}
      <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-[#5E72E4]" />
              <span>Storage Retention &amp; Automatic Cleanup</span>
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Marked notifications remain permanently saved. Older notifications exceeding the max capacity are auto-deleted.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Capacity:
            </span>
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
              {[15, 30, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxStoredAmount(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    maxStoredAmount === num
                      ? 'bg-[#5E72E4] text-white shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/90 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
              <span>{notifications.length} of {maxStoredAmount} alerts saved</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold">
                {notifications.length <= maxStoredAmount ? 'Within Capacity' : 'Auto-Pruning'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Recent {maxStoredAmount} alerts remain saved across sessions. Alerts past {maxStoredAmount} are automatically purged.
            </p>
            {pruneResult && (
              <p className="text-xs font-bold text-[#5E72E4] dark:text-[#889af7] animate-in fade-in">
                {pruneResult}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handlePruneNow}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            Prune Old Alerts Now
          </button>
        </div>
      </div>

      {/* 6. Quick Actions & Maintenance (High Contrast Bottom Buttons) */}
      <div className="pt-3.5 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={markAllAsRead}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#5E72E4] dark:text-[#889af7]" />
            <span>Mark All as Read</span>
          </button>

          <button
            type="button"
            onClick={handleArchiveAllRead}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
          >
            <Archive className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
            <span>{archiveSuccess ? 'Archived!' : 'Archive Read Alerts'}</span>
          </button>

          {archivedIds.length > 0 && (
            <button
              type="button"
              onClick={handleRestoreArchived}
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
              <span>{restoreSuccess ? 'Restored!' : 'Restore Archived'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleTriggerTest}
          className="px-3.5 py-2 rounded-xl bg-[#5E72E4] hover:bg-[#485ec4] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>{testSent ? 'Sample Alert Added!' : 'Add Sample Alert'}</span>
        </button>
      </div>
    </div>
  );
};
