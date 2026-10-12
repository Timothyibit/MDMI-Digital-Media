import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
  Calendar,
  Repeat,
  Zap,
  Play,
  Pause,
  Trash2,
  Volume2,
  RefreshCw,
  Edit3,
  Timer,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  X,
  RotateCcw,
  Plus,
  Layers,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  NotificationSchedule,
  NotificationRecurrenceRule,
  AutoNotificationEventType,
} from '../../types';
import { formatTimeRemaining } from '../../services/notificationSchedulerEngine';
import { AlertCard } from '@/components/ui/card-8';
import { playNotificationSound } from '../../services/notificationService';
import { DateTimePicker } from '../ui/DateTimePicker';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import { MotionButton } from '@/components/ui/motion-button';

type AdminNotificationSubTab = 'instant' | 'timer' | 'recurring' | 'automatic' | 'history';

const QUICK_TIMER_PRESETS = [
  { label: '5 Minutes', minutes: 5 },
  { label: '15 Minutes', minutes: 15 },
  { label: '30 Minutes', minutes: 30 },
  { label: '1 Hour', minutes: 60 },
  { label: '3 Hours', minutes: 180 },
  { label: '12 Hours', minutes: 720 },
  { label: '24 Hours', minutes: 1440 },
];

const DAYS_OF_WEEK = [
  { index: 0, label: 'Sun', full: 'Sunday' },
  { index: 1, label: 'Mon', full: 'Monday' },
  { index: 2, label: 'Tue', full: 'Tuesday' },
  { index: 3, label: 'Wed', full: 'Wednesday' },
  { index: 4, label: 'Thu', full: 'Thursday' },
  { index: 5, label: 'Fri', full: 'Friday' },
  { index: 6, label: 'Sat', full: 'Saturday' },
];

const HISTORY_PAGE_SIZE = 6;
const TIMERS_PAGE_SIZE = 5;
const RECURRING_PAGE_SIZE = 5;
const AUTOMATIC_PAGE_SIZE = 4;

export const AdminBroadcastManager: React.FC = () => {
  const {
    broadcastNotification,
    notifications,
    schedules,
    addTimerTrigger,
    addRecurringSchedule,
    addAutomaticRule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleEnabled,
    fireScheduleNow,
    triggerAutoNotification,
    clearTestNotifications,
    deleteNotification,
    clearAllBroadcastHistory,
    permission,
    requestPermission,
    platform,
    triggerTestNotification,
  } = useNotificationStore();

  const { devotionals } = useDevotionalStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AdminNotificationSubTab>('instant');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isClearingTests, setIsClearingTests] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Pagination states
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [timerPage, setTimerPage] = useState<number>(1);
  const [recurringPage, setRecurringPage] = useState<number>(1);
  const [automaticPage, setAutomaticPage] = useState<number>(1);

  // New Automatic Rule Form State
  const [isCreatingAutoRule, setIsCreatingAutoRule] = useState(false);
  const [newAutoTitle, setNewAutoTitle] = useState('');
  const [newAutoBody, setNewAutoBody] = useState('');
  const [newAutoEventType, setNewAutoEventType] = useState('new_devotional');
  const [newAutoType, setNewAutoType] = useState<'broadcast' | 'daily' | 'fellowship' | 'prayer' | 'devotional'>('devotional');
  const [newAutoTimeOfDay, setNewAutoTimeOfDay] = useState('06:00');
  const [isSavingAutoRule, setIsSavingAutoRule] = useState(false);

  // 1-second ticker for real-time countdown clocks
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // Instant Broadcast Form State
  // -------------------------------------------------------------
  const [instantTitle, setInstantTitle] = useState('');
  const [instantBody, setInstantBody] = useState('');
  const [instantType, setInstantType] = useState<'broadcast' | 'daily' | 'fellowship' | 'prayer'>('broadcast');
  const [instantDevotionalId, setInstantDevotionalId] = useState('');
  const [isSendingInstant, setIsSendingInstant] = useState(false);

  // -------------------------------------------------------------
  // Timer Trigger Form State
  // -------------------------------------------------------------
  const [timerTitle, setTimerTitle] = useState('');
  const [timerBody, setTimerBody] = useState('');
  const [timerType, setTimerType] = useState<'broadcast' | 'daily' | 'fellowship' | 'prayer'>('broadcast');
  const [timerPresetMinutes, setTimerPresetMinutes] = useState<number>(15);
  const [timerCustomDate, setTimerCustomDate] = useState<Date>(new Date(Date.now() + 15 * 60 * 1000));
  const [timerMode, setTimerMode] = useState<'preset' | 'custom'>('preset');
  const [timerDevotionalId, setTimerDevotionalId] = useState('');
  const [isSavingTimer, setIsSavingTimer] = useState(false);

  // -------------------------------------------------------------
  // Recurring Schedule Form State
  // -------------------------------------------------------------
  const [recTitle, setRecTitle] = useState('');
  const [recBody, setRecBody] = useState('');
  const [recType, setRecType] = useState<'broadcast' | 'daily' | 'fellowship' | 'prayer'>('daily');
  const [recFrequency, setRecFrequency] = useState<'daily' | 'weekly' | 'custom_hours'>('daily');
  const [recTimeOfDay, setRecTimeOfDay] = useState('07:00');
  const [recDaysOfWeek, setRecDaysOfWeek] = useState<number[]>([0]); // Sunday default
  const [recIntervalHours, setRecIntervalHours] = useState(6);
  const [recTimezone, setRecTimezone] = useState('user_local');
  const [recDevotionalId, setRecDevotionalId] = useState('');
  const [isSavingRec, setIsSavingRec] = useState(false);

  // -------------------------------------------------------------
  // Edit Rule Modal State
  // -------------------------------------------------------------
  const [editingSchedule, setEditingSchedule] = useState<NotificationSchedule | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTimeOfDay, setEditTimeOfDay] = useState('07:00');

  const uniqueDevotionals = useMemo(() => {
    const seen = new Set<string>();
    return devotionals.filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [devotionals]);

  const activeTimers = useMemo(() => {
    return schedules.filter((s) => s.triggerType === 'timer' && s.status === 'active');
  }, [schedules]);

  const recurringSchedules = useMemo(() => {
    return schedules.filter((s) => s.triggerType === 'recurring');
  }, [schedules]);

  const automaticRules = useMemo(() => {
    return schedules.filter((s) => s.triggerType === 'auto_event');
  }, [schedules]);

  const broadcastHistory = useMemo(() => {
    const seen = new Set<string>();
    return notifications.filter((n) => {
      if (!n || !n.id || seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [notifications]);

  // Paginated Slices
  const totalHistoryPages = Math.max(1, Math.ceil(broadcastHistory.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage = Math.min(Math.max(1, historyPage), totalHistoryPages);
  const paginatedHistory = useMemo(() => {
    const start = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
    return broadcastHistory.slice(start, start + HISTORY_PAGE_SIZE);
  }, [broadcastHistory, safeHistoryPage]);

  const totalTimerPages = Math.max(1, Math.ceil(activeTimers.length / TIMERS_PAGE_SIZE));
  const safeTimerPage = Math.min(Math.max(1, timerPage), totalTimerPages);
  const paginatedTimers = useMemo(() => {
    const start = (safeTimerPage - 1) * TIMERS_PAGE_SIZE;
    return activeTimers.slice(start, start + TIMERS_PAGE_SIZE);
  }, [activeTimers, safeTimerPage]);

  const totalRecurringPages = Math.max(1, Math.ceil(recurringSchedules.length / RECURRING_PAGE_SIZE));
  const safeRecurringPage = Math.min(Math.max(1, recurringPage), totalRecurringPages);
  const paginatedRecurring = useMemo(() => {
    const start = (safeRecurringPage - 1) * RECURRING_PAGE_SIZE;
    return recurringSchedules.slice(start, start + RECURRING_PAGE_SIZE);
  }, [recurringSchedules, safeRecurringPage]);

  const totalAutomaticPages = Math.max(1, Math.ceil(automaticRules.length / AUTOMATIC_PAGE_SIZE));
  const safeAutomaticPage = Math.min(Math.max(1, automaticPage), totalAutomaticPages);
  const paginatedAutomatic = useMemo(() => {
    const start = (safeAutomaticPage - 1) * AUTOMATIC_PAGE_SIZE;
    return automaticRules.slice(start, start + AUTOMATIC_PAGE_SIZE);
  }, [automaticRules, safeAutomaticPage]);

  // Preset templates for MorphingCardStack
  const dispatchPresets = useMemo(() => [
    {
      id: "preset_1",
      title: "Morning Manna Awakening",
      description: "Today's spiritual bread is ready. Tap to receive fresh revelation for your soul.",
      icon: <Sparkles className="w-5 h-5" />,
      color: "rgba(94, 114, 228, 0.08)",
    },
    {
      id: "preset_2",
      title: "Watchman Intercession Call",
      description: "The Lord summons His watchmen. Join disciples globally in prevailing prayer.",
      icon: <Clock className="w-5 h-5" />,
      color: "rgba(45, 206, 137, 0.08)",
    },
    {
      id: "preset_3",
      title: "Reading Streak Celebration",
      description: "Dedication crowned with grace! Keep feeding on the truth day and night.",
      icon: <Bell className="w-5 h-5" />,
      color: "rgba(251, 99, 64, 0.08)",
    },
    {
      id: "preset_4",
      title: "Pastoral Ministry Broadcast",
      description: "Special communication from overseers regarding upcoming discipleship assemblies.",
      icon: <Send className="w-5 h-5" />,
      color: "rgba(17, 205, 239, 0.08)",
    },
  ], []);

  // Clear Test Notifications Action
  const handleClearTestNotifications = async () => {
    setIsClearingTests(true);
    const res = await clearTestNotifications();
    setIsClearingTests(false);
    setHistoryPage(1);
    setStatusNotice(
      res.clearedCount > 0
        ? `Cleaned ${res.clearedCount} test notifications. All automatic ministry notifications preserved.`
        : 'All test notifications already cleared. Live feeds and automatic rules are active.'
    );
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Clear All Broadcast History Action
  const handleClearAllLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all notification broadcast history? All automatic and recurring ministry triggers will be completely preserved.")) {
      return;
    }
    setIsClearingAll(true);
    const res = await clearAllBroadcastHistory();
    setIsClearingAll(false);
    setHistoryPage(1);
    setStatusNotice(`Purged ${res.clearedCount} broadcast history records. All automatic notification rules preserved.`);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Create Custom Automatic Notification Rule
  const handleCreateAutomaticRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAutoTitle.trim() || !newAutoBody.trim()) {
      setStatusNotice('Title and template message are required.');
      return;
    }

    setIsSavingAutoRule(true);
    const res = await addAutomaticRule({
      title: newAutoTitle.trim(),
      body: newAutoBody.trim(),
      autoEventType: newAutoEventType,
      type: newAutoType as any,
      timeOfDay: ['morning_manna', 'evening_watch', 'midday_pause'].includes(newAutoEventType) ? newAutoTimeOfDay : undefined,
      createdBy: user?.displayName || 'Ministry Overseer',
    });
    setIsSavingAutoRule(false);

    if (res.success) {
      setIsCreatingAutoRule(false);
      setNewAutoTitle('');
      setNewAutoBody('');
      setAutomaticPage(1);
      setStatusNotice('New automatic ministry trigger rule registered successfully!');
      setTimeout(() => setStatusNotice(null), 4000);
    } else {
      setStatusNotice('Failed to register automatic notification rule.');
    }
  };

  // Handle Instant Broadcast
  const handleInstantBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantTitle.trim() || !instantBody.trim()) {
      setStatusNotice('Title and message are required.');
      return;
    }

    setIsSendingInstant(true);
    const res = await broadcastNotification({
      title: instantTitle.trim(),
      body: instantBody.trim(),
      type: instantType,
      devotionalId: instantDevotionalId || undefined,
      createdBy: user?.displayName || 'Ministry Overseer',
    });

    setIsSendingInstant(false);
    if (res.success) {
      setInstantTitle('');
      setInstantBody('');
      setInstantDevotionalId('');
      setStatusNotice('Push broadcast sent instantly with live audio chime!');
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Handle Timer Trigger Creation
  const handleCreateTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timerTitle.trim() || !timerBody.trim()) {
      setStatusNotice('Title and message are required.');
      return;
    }

    setIsSavingTimer(true);
    let delayMinutes = timerPresetMinutes;
    let scheduledAtIso: string | undefined = undefined;

    if (timerMode === 'custom') {
      scheduledAtIso = timerCustomDate.toISOString();
      const diffMs = timerCustomDate.getTime() - Date.now();
      delayMinutes = Math.max(1, Math.round(diffMs / 60000));
    }

    const res = await addTimerTrigger({
      title: timerTitle.trim(),
      body: timerBody.trim(),
      type: timerType,
      delayMinutes,
      scheduledAt: scheduledAtIso,
      devotionalId: timerDevotionalId || undefined,
      createdBy: user?.displayName || 'Ministry Overseer',
    });

    setIsSavingTimer(false);
    if (res.success) {
      setTimerTitle('');
      setTimerBody('');
      setTimerDevotionalId('');
      setTimerPage(1);
      setStatusNotice(`Notification timer trigger armed! Will fire in ${delayMinutes} minutes.`);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Handle Recurring Schedule Creation
  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim() || !recBody.trim()) {
      setStatusNotice('Title and message are required.');
      return;
    }

    setIsSavingRec(true);
    const recurrenceRule: NotificationRecurrenceRule = {
      frequency: recFrequency,
      timeOfDay: recTimeOfDay,
      timezone: recTimezone,
    };

    if (recFrequency === 'weekly') {
      recurrenceRule.daysOfWeek = recDaysOfWeek.length > 0 ? recDaysOfWeek : [0];
    } else if (recFrequency === 'custom_hours') {
      recurrenceRule.intervalHours = Math.max(1, recIntervalHours);
    }

    const res = await addRecurringSchedule({
      title: recTitle.trim(),
      body: recBody.trim(),
      type: recType,
      recurrence: recurrenceRule,
      devotionalId: recDevotionalId || undefined,
      createdBy: user?.displayName || 'Ministry Overseer',
    });

    setIsSavingRec(false);
    if (res.success) {
      setRecTitle('');
      setRecBody('');
      setRecDevotionalId('');
      setRecurringPage(1);
      setStatusNotice('Recurring notification schedule established and active!');
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Save Edit Modal
  const handleSaveEditSchedule = async () => {
    if (!editingSchedule) return;

    const updates: Partial<NotificationSchedule> = {
      title: editTitle.trim() || editingSchedule.title,
      body: editBody.trim() || editingSchedule.body,
    };

    if (editingSchedule.recurrence) {
      updates.recurrence = {
        ...editingSchedule.recurrence,
        timeOfDay: editTimeOfDay,
      };
    }

    await updateSchedule(editingSchedule.id, updates);
    setEditingSchedule(null);
    setStatusNotice('Notification configuration updated.');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Device & Push Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#5E72E4]/10 via-[#2DCE89]/10 to-indigo-500/10 dark:from-neutral-900 dark:to-neutral-900 border border-[#5E72E4]/20 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5E72E4] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#172B4D] dark:text-white">
                Admin Notification Automation Hub
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Live Engine Active
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Timer triggers, recurring schedules, and automatic ministry events for disciples
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleClearTestNotifications}
            disabled={isClearingTests}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-xs flex items-center gap-1.5 transition-all"
            title="Purge all test/demo notifications while preserving automatic schedules"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isClearingTests ? 'animate-spin' : ''}`} />
            <span>{isClearingTests ? 'Clearing...' : 'Clear Test Alerts'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playNotificationSound();
              triggerTestNotification();
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-xs flex items-center gap-1.5 transition-all"
            title="Play chime and send test alert"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#5E72E4]" />
            <span>Test Sound & Push</span>
          </button>

          {permission !== 'granted' && (
            <button
              type="button"
              onClick={requestPermission}
              className="px-3 py-1.5 rounded-xl bg-[#2DCE89] hover:bg-[#28b97b] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enable Device Popups</span>
            </button>
          )}
        </div>
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'instant', label: 'Instant Broadcast', icon: Send },
          {
            id: 'timer',
            label: `Timer Triggers ${activeTimers.length > 0 ? `(${activeTimers.length})` : ''}`,
            icon: Timer,
          },
          {
            id: 'recurring',
            label: `Recurring Schedules (${recurringSchedules.length})`,
            icon: Repeat,
          },
          {
            id: 'automatic',
            label: `Automatic Rules (${automaticRules.length})`,
            icon: Zap,
          },
          {
            id: 'history',
            label: `Logs & Delivery (${broadcastHistory.length})`,
            icon: Clock,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminNotificationSubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#5E72E4] text-white border-[#5E72E4] shadow-sm'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. INSTANT BROADCAST TAB */}
      {/* ========================================================= */}
      {activeTab === 'instant' && (
        <div className="space-y-5">
          {/* Lead AlertCard Banner */}
          <AlertCard
            variant="ministry-red"
            badge="Device Alerts: Admin Notification Hub • Ministry Cross"
            icon={<Bell className="h-6 w-6 text-white" />}
            title="Broadcast to All Disciples"
            description="Broadcast instant pastoral alerts, new devotional notifications, and prayer summons to all online and registered disciple devices with reverent chimes."
            buttonText={isSendingInstant ? "Dispatching Broadcast..." : "Broadcast to All Disciples"}
            onButtonClick={() => {
              const el = document.getElementById('instant-broadcast-submit-btn');
              if (el) el.click();
            }}
            className="max-w-none shadow-md"
          />

          <form
            id="instant-broadcast-form"
            onSubmit={handleInstantBroadcast}
            className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4"
          >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[#5E72E4]" />
              <div>
                <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
                  Broadcast Instant Alert to All Devices
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sends live notification popup and plays reverent chime on all connected disciple phones & browsers
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#2DCE89] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant Dispatch</span>
            </span>
          </div>

          {/* Quick Broadcast Preset Templates */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Quick Dispatch Templates (Click to autofill composer)</span>
              </span>
              <span className="text-[10px] text-neutral-400">1-click populate</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {dispatchPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setInstantTitle(preset.title);
                    setInstantBody(preset.description);
                    if (preset.id === 'preset_2') setInstantType('prayer');
                    else if (preset.id === 'preset_1') setInstantType('daily');
                    else setInstantType('broadcast');
                    setStatusNotice(`Loaded template: "${preset.title}"`);
                    setTimeout(() => setStatusNotice(null), 2500);
                  }}
                  className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/90 hover:bg-neutral-100/80 dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-700 text-left transition-all hover:border-[#5E72E4] dark:hover:border-[#5E72E4] cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-[#5E72E4] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      {preset.icon}
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {preset.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Notification Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Special Word: Night Vigil & Fasting"
                value={instantTitle}
                onChange={(e) => setInstantTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={instantType}
                onChange={(e) => setInstantType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
              >
                <option value="broadcast">Ministry Announcement / Broadcast</option>
                <option value="daily">Daily Devotional Reminder</option>
                <option value="prayer">Prayer Request / Intercession</option>
                <option value="fellowship">Fellowship Reflection</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Notification Body / Message *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Enter the alert message to show on device lock screens and notification banners..."
              value={instantBody}
              onChange={(e) => setInstantBody(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Link to Specific Devotional (Optional)
            </label>
            <select
              value={instantDevotionalId}
              onChange={(e) => setInstantDevotionalId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
            >
              <option value="">None (General ministry announcement)</option>
              {uniqueDevotionals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.scripture})
                </option>
              ))}
            </select>
          </div>

          {/* Quick presets buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] font-bold text-neutral-500">Quick Templates:</span>
            {[
              {
                title: "Dawn Devotional Meditation",
                body: "Today's meditation is ready. Open your heart to the incorruptible seed of God's Word.",
              },
              {
                title: "Midday Prayer Watch",
                body: "Take 3 quiet minutes to pause and pray with the saints across the nations.",
              },
              {
                title: "Night Vigil Alert",
                body: "Blessed vigil tonight: seeking the face of the Lord in quiet consecration.",
              },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInstantTitle(tmpl.title);
                  setInstantBody(tmpl.body);
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
              >
                {tmpl.title}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 font-medium">
              Triggers web push, Android/iOS device banners, and reverent dual chime
            </span>
            <MotionButton
              id="instant-broadcast-submit-btn"
              type="submit"
              disabled={isSendingInstant}
              variant="ministry-red"
              size="md"
              icon={<Send className="w-3.5 h-3.5 text-white" />}
              label={isSendingInstant ? 'Dispatching...' : 'Broadcast to All Disciples'}
            />
          </div>
        </form>
      </div>
      )}

      {/* ========================================================= */}
      {/* 2. TIMER TRIGGERS TAB */}
      {/* ========================================================= */}
      {activeTab === 'timer' && (
        <div className="space-y-6">
          {/* Timer Trigger Composer */}
          <form
            onSubmit={handleCreateTimer}
            className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
                    Set Notification Timer Trigger (Delayed Broadcast)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Arm a countdown timer that automatically triggers a push notification and chime when the countdown reaches zero
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Countdown Mode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prayer Fellowship Begins in 15 Minutes"
                  value={timerTitle}
                  onChange={(e) => setTimerTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category
                </label>
                <select
                  value={timerType}
                  onChange={(e) => setTimerType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
                >
                  <option value="broadcast">Ministry Announcement / Broadcast</option>
                  <option value="daily">Daily Word Reminder</option>
                  <option value="prayer">Prayer Fellowship / Intercession</option>
                  <option value="fellowship">Community Fellowship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Notification Message *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Message that will pop up on disciple screens when the timer fires..."
                value={timerBody}
                onChange={(e) => setTimerBody(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
              />
            </div>

            {/* Timer Duration / Schedule Mode */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>When should this trigger fire?</span>
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setTimerMode('preset')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      timerMode === 'preset'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Quick Countdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimerMode('custom')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      timerMode === 'custom'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Specific Date & Time
                  </button>
                </div>
              </div>

              {timerMode === 'preset' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {QUICK_TIMER_PRESETS.map((p) => (
                    <button
                      key={p.minutes}
                      type="button"
                      onClick={() => setTimerPresetMinutes(p.minutes)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        timerPresetMinutes === p.minutes
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="pt-1">
                  <DateTimePicker
                    value={timerCustomDate}
                    mode="datetime"
                    onChange={(_e, date) => {
                      if (date) setTimerCustomDate(date);
                    }}
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Will fire at exact timestamp: {timerCustomDate.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-medium">
                Timers are saved securely and will send on schedule even if you close this page
              </span>
              <MotionButton
                type="submit"
                disabled={isSavingTimer}
                variant="warning"
                size="md"
                icon={<Timer className="w-3.5 h-3.5 text-white" />}
                label={isSavingTimer ? 'Scheduling...' : 'Schedule Countdown'}
              />
            </div>
          </form>

          {/* Active Countdown Timers Queue */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
                  Scheduled Countdowns ({activeTimers.length})
                </h4>
              </div>
              <span className="text-[11px] text-neutral-500">Live 1-second ticking</span>
            </div>

            {activeTimers.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
                <Timer className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-amber-500" />
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  No countdowns scheduled yet
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Set a quick 5-min or custom countdown above to send your message at the exact time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedTimers.map((timer) => {
                  const rem = formatTimeRemaining(timer.scheduledAt);
                  return (
                    <div
                      key={timer.id}
                      className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#172B4D] dark:text-white">
                            {timer.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            {timer.type}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                          {timer.body}
                        </p>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-2 pt-1">
                          <span>Target: {timer.scheduledAt ? new Date(timer.scheduledAt).toLocaleTimeString() : 'Pending'}</span>
                          <span>• Created by {timer.createdBy}</span>
                        </div>
                      </div>

                      {/* Live Ticker Clock Card */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="px-3.5 py-2 rounded-xl bg-amber-500 text-white font-mono font-extrabold text-sm shadow-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>{rem.formatted}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fireScheduleNow(timer.id)}
                            className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            title="Trigger Now Immediately"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSchedule(timer.id)}
                            className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-rose-500 hover:text-white text-neutral-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                            title="Cancel & Delete Timer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Timers Pagination */}
                {totalTimerPages > 1 && (
                  <div className="pt-2">
                    <PaginationPageDefault
                      page={safeTimerPage}
                      total={totalTimerPages}
                      onPageChange={setTimerPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RECURRING SCHEDULES TAB */}
      {/* ========================================================= */}
      {activeTab === 'recurring' && (
        <div className="space-y-6">
          {/* Recurring Schedule Composer */}
          <form
            onSubmit={handleCreateRecurring}
            className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
                    Configure Recurring Notification Schedule
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Set up daily prayer calls, weekly study reminders, or recurring announcements
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                Recurring Schedule
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Schedule Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Dawn Scripture & Manna"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category
                </label>
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
                >
                  <option value="daily">Daily Word Alert</option>
                  <option value="prayer">Prayer Watch & Intercession</option>
                  <option value="fellowship">Weekly Fellowship / Sabbath</option>
                  <option value="broadcast">Ministry General Announcement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Notification Message Body *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Alert message delivered periodically..."
                value={recBody}
                onChange={(e) => setRecBody(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
              />
            </div>

            {/* Recurrence Rule Config */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">
                  Recurrence Cadence
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setRecFrequency('daily')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      recFrequency === 'daily'
                        ? 'bg-indigo-600 text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecFrequency('weekly')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      recFrequency === 'weekly'
                        ? 'bg-indigo-600 text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecFrequency('custom_hours')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      recFrequency === 'custom_hours'
                        ? 'bg-indigo-600 text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Interval (Hours)
                  </button>
                </div>
              </div>

              {/* Time of Day */}
              {recFrequency !== 'custom_hours' && (
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      Release Time of Day:
                    </label>
                    <input
                      type="time"
                      value={recTimeOfDay}
                      onChange={(e) => setRecTimeOfDay(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div className="text-xs text-neutral-500 pt-4">
                    Delivered at {recTimeOfDay} every day
                  </div>
                </div>
              )}

              {/* Weekly Day Selector */}
              {recFrequency === 'weekly' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                    Select Days of Week:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DAYS_OF_WEEK.map((day) => {
                      const selected = recDaysOfWeek.includes(day.index);
                      return (
                        <button
                          key={day.index}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              if (recDaysOfWeek.length > 1) {
                                setRecDaysOfWeek(recDaysOfWeek.filter((d) => d !== day.index));
                              }
                            } else {
                              setRecDaysOfWeek([...recDaysOfWeek, day.index]);
                            }
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Hours Interval */}
              {recFrequency === 'custom_hours' && (
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      Interval (Every X Hours):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={recIntervalHours}
                      onChange={(e) => setRecIntervalHours(parseInt(e.target.value, 10) || 4)}
                      className="w-28 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div className="text-xs text-neutral-500 pt-4">
                    Will trigger automatically every {recIntervalHours} hours
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-medium">
                Recurring engine continuously recalculates next trigger time upon each fire
              </span>
              <MotionButton
                type="submit"
                disabled={isSavingRec}
                variant="primary"
                size="md"
                icon={<Repeat className="w-3.5 h-3.5 text-white" />}
                label={isSavingRec ? 'Saving...' : 'Establish Recurring Schedule'}
              />
            </div>
          </form>

          {/* List of Recurring Schedules */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
              Active Recurring Ministry Schedules ({recurringSchedules.length})
            </h4>

            {recurringSchedules.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
                <Repeat className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-indigo-500" />
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  No recurring schedules established yet
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Create a daily dawn devotional or weekly fellowship alert using the form above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedRecurring.map((schedule) => {
                  const rem = formatTimeRemaining(schedule.nextTriggerAt);
                  const isEnabled = schedule.enabled && schedule.status === 'active';

                  return (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isEnabled
                          ? 'border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#172B4D] dark:text-white">
                              {schedule.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                isEnabled
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300'
                              }`}
                            >
                              {isEnabled ? 'Active' : 'Paused'}
                            </span>
                            <span className="text-[10px] text-indigo-500 font-bold uppercase font-mono">
                              {schedule.recurrence?.frequency === 'daily'
                                ? `Daily at ${schedule.recurrence.timeOfDay || '07:00'}`
                                : schedule.recurrence?.frequency === 'weekly'
                                ? `Weekly at ${schedule.recurrence.timeOfDay || '07:00'}`
                                : `Every ${schedule.recurrence?.intervalHours || 4}h`}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300">
                            {schedule.body}
                          </p>
                          <div className="text-[10px] text-neutral-400 flex items-center gap-3 pt-1">
                            <span>Triggered {schedule.triggerCount || 0} times</span>
                            {schedule.lastTriggeredAt && (
                              <span>• Last: {new Date(schedule.lastTriggeredAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>

                        {/* Next Trigger Pill & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isEnabled && schedule.nextTriggerAt && (
                            <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-mono font-bold shadow-xs">
                              Next: {rem.formatted}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleScheduleEnabled(schedule.id, !isEnabled)}
                            className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isEnabled
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                            title={isEnabled ? 'Pause schedule' : 'Activate schedule'}
                          >
                            {isEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => fireScheduleNow(schedule.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-xs font-bold text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Run a test dispatch right now"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>Test Fire</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-rose-500 hover:text-white text-neutral-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                            title="Delete recurring schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Recurring Pagination */}
                {totalRecurringPages > 1 && (
                  <div className="pt-2">
                    <PaginationPageDefault
                      page={safeRecurringPage}
                      total={totalRecurringPages}
                      onPageChange={setRecurringPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. AUTOMATIC NOTIFICATIONS TAB (EVENT-DRIVEN RULES) */}
      {/* ========================================================= */}
      {activeTab === 'automatic' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
                    Automatic Ministry Event Triggers ({automaticRules.length})
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Smart notifications that fire automatically based on discipleship events. Preserved when clearing test notifications.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingAutoRule(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Automatic Notification</span>
                </button>
              </div>
            </div>

            {automaticRules.length === 0 ? (
              <div className="p-10 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
                <Zap className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                  No Automatic Trigger Rules
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Click the button above to add an alert for devotional releases, reading streaks, or prayer hours.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {paginatedAutomatic.map((rule) => {
                  const isEnabled = rule.enabled;
                  return (
                    <div
                      key={rule.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isEnabled
                          ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#172B4D] dark:text-white">
                              {rule.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                isEnabled
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300'
                              }`}
                            >
                              {isEnabled ? 'Active Rule' : 'Rule Disabled'}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#5E72E4] px-1.5 py-0.5 rounded bg-[#5E72E4]/10">
                              {rule.autoEventType || 'auto_event'}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                            {rule.body}
                          </p>

                          <div className="text-[11px] text-neutral-400 flex items-center gap-3 pt-1">
                            <span>Total auto-dispatches: {rule.triggerCount || 0}</span>
                            {rule.lastTriggeredAt && (
                              <span>• Last triggered: {new Date(rule.lastTriggeredAt).toLocaleString()}</span>
                            )}
                            {rule.recurrence?.timeOfDay && (
                              <span>• Target hour: {rule.recurrence.timeOfDay}</span>
                            )}
                          </div>
                        </div>

                        {/* Rule Controls */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSchedule(rule);
                              setEditTitle(rule.title);
                              setEditBody(rule.body);
                              setEditTimeOfDay(rule.recurrence?.timeOfDay || '07:00');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-xs font-bold text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#5E72E4]" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (rule.autoEventType) {
                                const actualStreak = user?.streakCount ?? 0;
                                const latestDevo = devotionals[0];
                                triggerAutoNotification(rule.autoEventType as AutoNotificationEventType, {
                                  title: latestDevo?.title || 'Walking in the Spirit',
                                  scripture: latestDevo?.scripture || 'Galatians 5:16',
                                  streak: actualStreak,
                                  name: user?.displayName || 'Beloved Disciple',
                                  devotionalId: latestDevo?.id,
                                });
                                setStatusNotice(`Dispatched automatic rule: "${rule.title}"`);
                                setTimeout(() => setStatusNotice(null), 3000);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Simulate event and broadcast immediately"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Trigger Rule</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleScheduleEnabled(rule.id, !isEnabled)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isEnabled
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isEnabled ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete automatic rule "${rule.title}"?`)) {
                                deleteSchedule(rule.id);
                                setStatusNotice(`Removed automatic trigger rule.`);
                                setTimeout(() => setStatusNotice(null), 3000);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete automatic rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Automatic Rules Pagination */}
                {totalAutomaticPages > 1 && (
                  <div className="pt-2">
                    <PaginationPageDefault
                      page={safeAutomaticPage}
                      total={totalAutomaticPages}
                      onPageChange={setAutomaticPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. HISTORY & LOGS TAB (WITH PAGINATION & TEST CLEAR) */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
                Notification Dispatch History & Logs ({broadcastHistory.length})
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Chronological list of all broadcasted notifications and event triggers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearTestNotifications}
                disabled={isClearingTests}
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Wipe test notifications and clean sample items"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>{isClearingTests ? 'Purging...' : 'Clear Test Notifications'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllLogs}
                disabled={isClearingAll || broadcastHistory.length === 0}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Wipe entire broadcast dispatch history (preserves automatic & recurring rules)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isClearingAll ? 'Clearing...' : 'Clear All Logs'}</span>
              </button>
            </div>
          </div>

          {broadcastHistory.length === 0 ? (
            <div className="p-10 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                Notification Feed is Clean
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                No active or test broadcasts in the queue. Send an instant broadcast or let automatic events fire.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {paginatedHistory.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs hover:border-[#5E72E4]/40 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-1">{n.body}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-400">
                      <span className="uppercase font-bold text-[#5E72E4] bg-[#5E72E4]/10 px-1.5 py-0.5 rounded">
                        {n.type}
                      </span>
                      {n.createdBy && <span>• Source: {n.createdBy}</span>}
                    </div>
                  </div>

                  {/* Individual Delete Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteNotification(n.id);
                      setStatusNotice(`Removed notification: "${n.title}"`);
                      setTimeout(() => setStatusNotice(null), 3000);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                    title="Delete notification from log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* History Pagination Bar */}
              {totalHistoryPages > 1 && (
                <div className="pt-2">
                  <PaginationPageDefault
                    page={safeHistoryPage}
                    total={totalHistoryPages}
                    onPageChange={setHistoryPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CREATE AUTOMATIC NOTIFICATION MODAL */}
      {/* ========================================================= */}
      {isCreatingAutoRule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Create New Automatic Notification Rule</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingAutoRule(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAutomaticRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Event Trigger Type
                </label>
                <select
                  value={newAutoEventType}
                  onChange={(e) => setNewAutoEventType(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium outline-none"
                >
                  <option value="new_devotional">When New Devotional is Published</option>
                  <option value="streak_milestone">When Disciple Reaches Streak Milestone</option>
                  <option value="morning_manna">Daily Morning Manna Call (Scheduled Hour)</option>
                  <option value="evening_watch">Daily Evening Prayer Watch (Scheduled Hour)</option>
                  <option value="midday_pause">Midday Reflection Call</option>
                  <option value="community_prayer">When Disciple Shares Prayer Request</option>
                  <option value="custom_event">Custom Ministry Trigger</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notification Title Template
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Word: {title}"
                  value={newAutoTitle}
                  onChange={(e) => setNewAutoTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Message / Body Template
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Today's teaching on {scripture} is ready for your spirit."
                  value={newAutoBody}
                  onChange={(e) => setNewAutoBody(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  required
                />
                {/* Available template variables */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-neutral-500">
                  <span className="font-semibold text-neutral-600 dark:text-neutral-400">Click to insert tag:</span>
                  {['{title}', '{scripture}', '{streak}', '{name}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewAutoBody((prev) => `${prev} ${tag}`)}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[#5E72E4] font-mono text-[10px] font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Notification Category
                  </label>
                  <select
                    value={newAutoType}
                    onChange={(e) => setNewAutoType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="devotional">Devotional</option>
                    <option value="daily">Daily Word</option>
                    <option value="prayer">Prayer</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="broadcast">Broadcast</option>
                  </select>
                </div>

                {['morning_manna', 'evening_watch', 'midday_pause'].includes(newAutoEventType) && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Target Hour (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={newAutoTimeOfDay}
                      onChange={(e) => setNewAutoTimeOfDay(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingAutoRule(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAutoRule}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSavingAutoRule ? 'Saving Rule...' : 'Save & Activate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT SCHEDULE MODAL */}
      {/* ========================================================= */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#5E72E4]" />
                <span>Customize Notification Template</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Title Template
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
              <span className="text-[10px] text-neutral-400">Placeholders like {'{title}'} and {'{streak}'} are replaced dynamically.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Body / Message Template
              </label>
              <textarea
                rows={3}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            {editingSchedule.recurrence && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Target Hour of Day (HH:mm)
                </label>
                <input
                  type="time"
                  value={editTimeOfDay}
                  onChange={(e) => setEditTimeOfDay(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold"
                />
              </div>
            )}

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditSchedule}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5E72E4] hover:bg-[#4a5ec4] text-white shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
