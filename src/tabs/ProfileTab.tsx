import React, { useState } from 'react';
import {
  Shield,
  Bookmark,
  Bell,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Flame,
  Check,
  LogOut,
  Database,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useDevotionalStore } from '../store/useDevotionalStore';
import { Devotional } from '../types';
import { ThemeToggle } from '../components/ui/ThemeToggle';

interface ProfileTabProps {
  onSelectDevotional: (devotional: Devotional) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onSelectDevotional }) => {
  const { user, isAdmin, toggleAdminRole, updateNotificationSettings, signOut, signInWithGoogle, isLoading } =
    useAuthStore();
  const { openAuthGate, reducedMotion, setReducedMotion, setActiveTab, triggerConfetti } =
    useUIStore();
  const { bookmarkedIds } = useBookmarkStore();
  const { devotionals } = useDevotionalStore();

  const [reminderTime, setReminderTime] = useState(user?.reminderTime || '07:00');
  const [notificationsActive, setNotificationsActive] = useState(
    user?.notificationsEnabled || false
  );
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const streak = user?.streakCount || 1;
  const bookmarkedDevotionals = devotionals.filter((d) => bookmarkedIds.includes(d.id));

  const handleSaveNotifications = (enabled: boolean, time: string) => {
    setNotificationsActive(enabled);
    setReminderTime(time);
    updateNotificationSettings(enabled, time);
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  return (
    <div className="space-y-6 pb-28 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display-scripture text-neutral-900 dark:text-white">
          Profile & Walk
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Your spiritual milestones and Firebase cloud sync settings
        </p>
      </div>

      {/* Identity Card */}
      <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'D'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {user?.displayName || 'Guest Disciple'}
                </h3>
                {user?.isAnonymous ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Guest (Anonymous)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Firebase Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {user?.email || `Firebase UID: ${user?.uid.substring(0, 14)}...`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {user?.isAnonymous ? (
              <div className="flex items-center gap-2">
                <button
                  id="profile-google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || isLoading}
                  className="py-2 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-white shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Signing in...' : 'Google Sign-In'}</span>
                </button>

                <button
                  id="profile-link-account-btn"
                  onClick={() =>
                    openAuthGate(
                      'Link your account to back up your streak, bookmarks, and personal journal.'
                    )
                  }
                  className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  Link Email
                </button>
              </div>
            ) : (
              <button
                id="profile-sign-out-btn"
                onClick={signOut}
                className="py-2 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Cloud Persistence Status */}
        <div className="mt-4 p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              Firestore Persistence: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected</span> (edges-africa-lms)
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {user?.streakCount}d Streak Saved
          </span>
        </div>
      </div>

      {/* Discipleship Milestones & Badges */}
      <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Spiritual Milestones
            </h3>
          </div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
            {streak} Days Walked
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              days: 7,
              title: '7-Day Dedication',
              desc: 'One Week of Seeking',
              unlocked: streak >= 7,
            },
            {
              days: 30,
              title: '30-Day Pillar',
              desc: 'Monthly Fidelity',
              unlocked: streak >= 30,
            },
            {
              days: 100,
              title: '100-Day Crown',
              desc: 'Disciplined Walk',
              unlocked: streak >= 100,
            },
          ].map((badge) => (
            <div
              key={badge.days}
              onClick={() => triggerConfetti(badge.days)}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                badge.unlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-neutral-900 dark:text-white hover:scale-105'
                  : 'bg-neutral-100/50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-800 text-neutral-400 opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                  badge.unlocked
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                }`}
              >
                <Flame className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold leading-tight">{badge.title}</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {badge.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bookmarked Devotionals Section */}
      <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Saved Bookmarks ({bookmarkedDevotionals.length})
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('devotionals')}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
          >
            Explore Library
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {bookmarkedDevotionals.length === 0 ? (
          <p className="text-xs text-neutral-400 py-3">
            You have not bookmarked any devotionals yet. Tap the bookmark icon in any reading view to save it here.
          </p>
        ) : (
          <div className="space-y-2">
            {bookmarkedDevotionals.map((dev) => (
              <div
                key={dev.id}
                onClick={() => onSelectDevotional(dev)}
                className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/40 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-display-scripture block">
                    {dev.scripture}
                  </span>
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {dev.title}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications & Daily Reminders */}
      <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
            Daily Devotion Reminder
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
              Morning Reminder Time
            </label>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Notification prompt to protect your quiet time before God
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="reminder-time-input"
              type="time"
              value={reminderTime}
              onChange={(e) => handleSaveNotifications(notificationsActive, e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSaveNotifications(!notificationsActive, reminderTime)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                notificationsActive
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {notificationsActive ? 'Active' : 'Turn On'}
            </button>
          </div>
        </div>

        {saveSettingsSuccess && (
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Reminder settings updated in Firestore!</span>
          </div>
        )}
      </div>

      {/* Preferences & Accessibility */}
      <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
          Appearance & Accessibility
        </h3>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Reading Theme
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Includes Sepia (#F4ECD8) and True OLED Black
            </p>
          </div>
          <ThemeToggle scope="global" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Reduced Motion
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Disable particle celebrations and smooth springs
            </p>
          </div>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              reducedMotion ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                reducedMotion ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Ministry Administrative Portal */}
      <div className="p-5 sm:p-6 rounded-3xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                MDMI Ministry Administration
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Author devotionals, manage drafts, and moderate reflections
              </p>
            </div>
          </div>

          <button
            id="toggle-admin-role-btn"
            onClick={toggleAdminRole}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAdmin
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
            }`}
          >
            {isAdmin ? 'Admin Mode ON' : 'Switch to Admin'}
          </button>
        </div>

        {isAdmin && (
          <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <span className="text-xs text-blue-900 dark:text-blue-200 font-medium">
              Overseer permissions active. You can now access the Admin Console.
            </span>
            <button
              onClick={() => setActiveTab('admin')}
              className="py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Open Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
