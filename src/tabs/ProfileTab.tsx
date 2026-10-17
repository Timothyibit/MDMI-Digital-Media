import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  Shield,
  Bookmark,
  Bell,
  Award,
  ChevronRight,
  ShieldCheck,
  Flame,
  Check,
  LogOut,
  Database,
  Moon,
  Sun,
  User,
  Sparkles,
  Info,
  Edit3,
  Church,
  Phone,
  MapPin,
  Send,
  Compass,
  Mail,
  AlertTriangle,
  RefreshCw,
  Camera,
  Globe,
  ExternalLink,
  Volume2,
  LogIn,
  UserPlus,
  Terminal,
} from 'lucide-react';
import { MotionButton } from '@/components/ui/motion-button';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useDevotionalStore, sortDevotionalsByLatest } from '../store/useDevotionalStore';
import { useNotificationStore, playNotificationSound } from '../store/useNotificationStore';
import { showDeviceNotification } from '../services/notificationService';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { RichTextRenderer } from '../components/ui/RichTextRenderer';
import { DateTimePicker } from '../components/ui/DateTimePicker';
import { Devotional } from '../types';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button, Badge } from '../components/common';
import {
  ActivityCardBarGraph,
  ProductCardHorizontal,
  TiltedCollageCard,
} from '../components/cards';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import { AlertCard } from '@/components/ui/card-8';

interface ProfileTabProps {
  onSelectDevotional: (devotional: Devotional) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onSelectDevotional }) => {
  const {
    user,
    isAdmin,
    toggleAdminRole,
    updateNotificationSettings,
    signOut,
    signInWithGoogle,
    resendVerificationEmail,
    checkEmailVerification,
    isLoading,
  } = useAuthStore();
  const {
    openAuthGate,
    openOnboarding,
    openIntroSplash,
    reducedMotion,
    setReducedMotion,
    setActiveTab,
    triggerConfetti,
    playDevotionalAudio,
    openDiagnosticLogs,
  } = useUIStore();
  const { bookmarkedIds, toggleBookmark, isBookmarked } = useBookmarkStore();
  const { devotionals } = useDevotionalStore();
  const { permission, requestPermission } = useNotificationStore();

  const [reminderTime, setReminderTime] = useState(user?.reminderTime || '07:00');
  const [notificationsActive, setNotificationsActive] = useState(
    user?.notificationsEnabled || false
  );
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [testNotifSent, setTestNotifSent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  const streak = user?.streakCount ?? 0;
  const bookmarkedDevotionals = useMemo(() => {
    const seen = new Set<string>();
    const filtered = devotionals
      .filter((d) => bookmarkedIds.includes(d.id))
      .filter((d) => {
        if (!d || !d.id || seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
    return sortDevotionalsByLatest(filtered);
  }, [devotionals, bookmarkedIds]);
  const BOOKMARK_PAGE_SIZE = 6;
  const [bookmarkPage, setBookmarkPage] = useState(1);
  const totalBookmarkPages = Math.max(1, Math.ceil(bookmarkedDevotionals.length / BOOKMARK_PAGE_SIZE));
  const paginatedBookmarks = bookmarkedDevotionals.slice(
    (bookmarkPage - 1) * BOOKMARK_PAGE_SIZE,
    bookmarkPage * BOOKMARK_PAGE_SIZE
  );

  const handleResendVerify = async () => {
    setVerifyLoading(true);
    const res = await resendVerificationEmail();
    setVerifyLoading(false);
    if (res.success) {
      setVerifyNotice('Verification email sent! Please check your inbox.');
      setTimeout(() => setVerifyNotice(null), 5000);
    } else {
      setVerifyNotice(res.error || 'Failed to send verification email.');
      setTimeout(() => setVerifyNotice(null), 5000);
    }
  };

  const handleRefreshVerify = async () => {
    setVerifyLoading(true);
    const isVerified = await checkEmailVerification();
    setVerifyLoading(false);
    if (isVerified) {
      setVerifyNotice('Email verified successfully! Thank you.');
      setTimeout(() => setVerifyNotice(null), 4000);
    } else {
      setVerifyNotice('Email not verified yet. Please check your inbox.');
      setTimeout(() => setVerifyNotice(null), 4000);
    }
  };

  const handleSaveNotifications = (enabled: boolean, time: string) => {
    setNotificationsActive(enabled);
    setReminderTime(time);
    updateNotificationSettings(enabled, time);
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 2000);
  };

  const handlePreviewAlert = () => {
    playNotificationSound();
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 2500);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      openAuthGate(res.error || 'Please sign in or create your account in-app.');
    }
    setGoogleLoading(false);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 170 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="space-y-6 max-w-3xl mx-auto w-full px-1">
        {/* Header */}
        <View>
          <Text className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white">
            Profile & Spiritual Walk
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Your spiritual journey, reading habit, and account settings
          </Text>
        </View>

        {/* Identity Card with Device Banner & Avatar */}
        <div className="rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Cover Banner with Device Upload Quick Action */}
          <div className="h-32 sm:h-40 relative bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            {user?.bannerUrl ? (
              <img
                src={user.bannerUrl}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-[#5E72E4] via-[#7BDEB2] to-[#11CDEF] opacity-85" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-3 right-3 z-10">
              <MotionButton
                size="sm"
                variant="dark"
                icon={<Camera className="w-3.5 h-3.5 text-white" />}
                label="Edit Photos"
                onClick={() => setIsEditProfileOpen(true)}
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 space-y-4">
            <View className="flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
              <View className="flex-row items-end gap-3.5">
                <div className="relative group">
                  {user?.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.displayName || 'Disciple Profile'}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-neutral-900 shadow-[0_4px_14px_rgba(94,114,228,0.35)] shrink-0 bg-white dark:bg-neutral-800"
                    />
                  ) : (
                    <View className="w-20 h-20 rounded-2xl bg-[#5E72E4] border-4 border-white dark:border-neutral-900 items-center justify-center shadow-[0_4px_14px_rgba(94,114,228,0.35)] shrink-0">
                      <Text className="text-white font-extrabold text-2xl">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'D'}
                      </Text>
                    </View>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(true)}
                    className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer"
                    title="Change profile picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <View className="pb-1">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <Text className="font-bold text-base text-[#172B4D] dark:text-white">
                      {user?.displayName || 'Guest Disciple'}
                    </Text>
                    {user?.isAnonymous ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        Guest
                      </span>
                    ) : user?.emailVerified ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 inline" />
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 inline" />
                        Unverified Email
                      </span>
                    )}
                  </View>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                    {user?.email || (user?.isAnonymous ? 'Guest Member' : `Member ID: ${user?.uid.substring(0, 10)}`)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 flex-wrap">
                <MotionButton
                  size="sm"
                  variant="secondary"
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                  label="Edit Profile"
                  onClick={() => setIsEditProfileOpen(true)}
                />

              {user?.isAnonymous ? (
                <View className="flex-row items-center gap-2 flex-wrap">
                  <MotionButton
                    size="sm"
                    variant="ministry-green"
                    id="profile-signin-btn"
                    icon={<LogIn className="w-3.5 h-3.5 text-white" />}
                    label="Sign In"
                    onClick={() =>
                      openAuthGate(
                        'Sign in with your email or Google account to access your spiritual journey.',
                        'signin'
                      )
                    }
                  />

                  <MotionButton
                    size="sm"
                    variant="secondary"
                    id="profile-register-btn"
                    icon={<UserPlus className="w-3.5 h-3.5" />}
                    label="Register"
                    onClick={() =>
                      openAuthGate(
                        'Create an account to keep your reading streak and private journal safe.',
                        'register'
                      )
                    }
                  />

                  <button
                    type="button"
                    id="profile-google-signin-btn"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || isLoading}
                    className="p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-bold transition-all"
                    title="Sign in with Google"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  </button>
                </View>
              ) : (
                <MotionButton
                  size="sm"
                  variant="danger"
                  id="profile-sign-out-btn"
                  icon={<LogOut className="w-3.5 h-3.5 text-white" />}
                  label="Sign Out"
                  onClick={signOut}
                />
              )}
            </View>
          </View>

          {/* Unverified Email Warning Banner */}
          {!user?.isAnonymous && user?.email && !user?.emailVerified && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-300">
                    Email Verification Pending
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70 mt-0.5">
                    Click the verification link sent to {user.email} to confirm your disciple profile.
                  </p>
                  {verifyNotice && (
                    <p className="text-[11px] font-semibold text-[#5E72E4] mt-1">{verifyNotice}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <MotionButton
                  size="sm"
                  variant="warning"
                  icon={<RefreshCw className={`w-3.5 h-3.5 text-white ${verifyLoading ? 'animate-spin' : ''}`} />}
                  label={verifyLoading ? 'Sending...' : 'Resend Link'}
                  onClick={handleResendVerify}
                  disabled={verifyLoading}
                />
                <button
                  type="button"
                  onClick={handleRefreshVerify}
                  disabled={verifyLoading}
                  className="p-2 rounded-full border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 transition-colors cursor-pointer"
                  title="Check verification status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* Disciple Spiritual Bio & Church Details */}
          {(user?.bio || user?.churchAttending || user?.contact || user?.address || user?.spiritualGifts) && (
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
              {user.bio && (
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5E72E4] block mb-1">
                    Spiritual Bio & Life Verse
                  </span>
                  <div className="text-xs text-neutral-700 dark:text-neutral-300">
                    <RichTextRenderer content={user.bio} />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {user.churchAttending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#5E72E4]/10 text-[#5E72E4] font-medium">
                    <Church className="w-3.5 h-3.5" />
                    <span>{user.churchAttending}</span>
                  </span>
                )}
                {user.contact && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{user.contact}</span>
                  </span>
                )}
                {user.address && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{user.address}</span>
                  </span>
                )}
                {user.spiritualGifts && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{user.spiritualGifts}</span>
                  </span>
                )}
                {user.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium hover:underline cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{user.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          <View className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Database className="w-4 h-4 text-[#5E72E4]" />
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                Connected & Saved to Your Account
              </Text>
            </View>
            <Text className="text-[11px] text-[#5E72E4] font-bold font-mono">
              {streak} day streak
            </Text>
          </View>
        </div>
      </div>

        {/* 1. Interactive 7-Day Spiritual Activity Card (Template 4 Spec) */}
        <ActivityCardBarGraph
          onMorePress={() => triggerConfetti(streak)}
        />

        {/* Real Discipleship Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Active Streak
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
                {streak}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {streak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">Daily consistency</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Completed
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
                {user?.completedDevotionalsCount ?? 0}
              </span>
              <span className="text-xs font-bold text-[#5E72E4]">read</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">Devotionals finished</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Word Time
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
                {user?.totalMinutesRead ?? 0}
              </span>
              <span className="text-xs font-bold text-amber-500">mins</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">Scripture meditation</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Bookmarks
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tabular-nums">
                {bookmarkedIds.length}
              </span>
              <span className="text-xs font-bold text-purple-500">saved</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1">In personal library</span>
          </div>
        </div>

        {/* 2. Discipleship Milestones & Badges with Real Progress */}
        <div className="p-5 sm:p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <Text className="font-bold text-sm text-neutral-900 dark:text-white">
                Spiritual Milestones
              </Text>
            </View>
            <Text className="text-xs font-bold text-amber-500">
              {streak} {streak === 1 ? 'Day' : 'Days'} Walked
            </Text>
          </View>

          <View className="grid grid-cols-3 gap-2.5">
            {[
              {
                days: 7,
                title: '7-Day Dedication',
                desc: 'One Week',
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
            ].map((badge) => {
              const progressPct = Math.min(100, Math.round((streak / badge.days) * 100));
              return (
                <TouchableOpacity
                  key={badge.days}
                  onPress={() => triggerConfetti(badge.days)}
                  className={`p-3.5 rounded-2xl border items-center text-center transition-all ${
                    badge.unlocked
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${
                      badge.unlocked
                        ? 'bg-amber-500/20'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <Flame
                      className={`w-5 h-5 ${
                        badge.unlocked ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'
                      }`}
                    />
                  </View>
                  <Text className="text-xs font-bold text-neutral-900 dark:text-white">
                    {badge.title}
                  </Text>
                  <Text className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {badge.desc}
                  </Text>
                  {/* Progress bar */}
                  <div className="w-full mt-2.5 bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.unlocked ? 'bg-amber-500' : 'bg-neutral-400 dark:bg-neutral-600'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400 mt-1">
                    {badge.unlocked ? 'Unlocked' : `${progressPct}%`}
                  </span>
                </TouchableOpacity>
              );
            })}
          </View>
        </div>

        {/* 3. Bookmarked Devotionals: ProductCardHorizontal (Template 3 Spec) */}
        <div className="p-5 sm:p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#5E72E4]" />
              <Text className="font-bold text-sm text-neutral-900 dark:text-white">
                Saved Bookmarks ({bookmarkedDevotionals.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveTab('devotionals')}
              className="px-3.5 py-1.5 rounded-full border border-[#5E72E4]/40 bg-[#5E72E4]/10 hover:bg-[#5E72E4] text-[#5E72E4] hover:text-white transition-colors flex-row items-center gap-1 shadow-sm"
            >
              <Text className="text-xs font-bold uppercase tracking-wider">
                Explore Library
              </Text>
              <ChevronRight className="w-3.5 h-3.5" />
            </TouchableOpacity>
          </View>

          {bookmarkedDevotionals.length === 0 ? (
            <div className="py-2">
              <AlertCard
                variant="ministry-green"
                badge="Scripture Vault • MDMI Discipleship"
                icon={<Bookmark className="h-6 w-6 text-white" />}
                title="Saved Bookmarks"
                description="Keep your favorite scriptures, teachings, and reflections bookmarked for offline study and quick access."
                buttonText="Explore Library"
                onButtonClick={() => setActiveTab('devotionals')}
                className="max-w-none shadow-md"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <AlertCard
                variant="ministry-dark"
                badge={`Scripture Vault • ${bookmarkedDevotionals.length} Saved`}
                icon={<Bookmark className="h-6 w-6 text-[#84CC16]" />}
                title="Saved Bookmarks"
                description={`You have ${bookmarkedDevotionals.length} bookmarked devotionals preserved for personal study, quiet reflection, and spiritual growth.`}
                buttonText="Explore Library"
                onButtonClick={() => setActiveTab('devotionals')}
                className="max-w-none shadow-md mb-3"
              />
              {paginatedBookmarks.map((dev: Devotional, idx: number) => (
                <ProductCardHorizontal
                  key={`bm-${dev.id || 'dev'}-${idx}`}
                  devotional={dev}
                  onPress={() => onSelectDevotional(dev)}
                  onBookmark={toggleBookmark}
                  isBookmarked={isBookmarked(dev.id)}
                  onAudio={playDevotionalAudio}
                />
              ))}

              {bookmarkedDevotionals.length > BOOKMARK_PAGE_SIZE && (
                <div className="pt-2">
                  <PaginationPageDefault
                    page={bookmarkPage}
                    total={totalBookmarkPages}
                    onPageChange={setBookmarkPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications & Daily Reminders */}
        <div className="p-5 sm:p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
          <AlertCard
            variant={notificationsActive ? "ministry-green" : "ministry-red"}
            badge={notificationsActive ? "Active Schedule • Discipling to Serve" : "Daily Quiet Time • Scheduled Prompt"}
            icon={<Bell className="h-6 w-6 text-white" />}
            title="Devotional Daily Reminder"
            description={`Morning notification prompt set for ${reminderTime} to protect your quiet time before God.`}
            buttonText={notificationsActive ? "Reminder Active • Tap to Toggle" : "Turn On Daily Reminder"}
            onButtonClick={() => handleSaveNotifications(!notificationsActive, reminderTime)}
            className="max-w-none shadow-md"
          />

          <View className="flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <View className="flex-1">
              <Text className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Adjust Reminder Time
              </Text>
              <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Choose the best hour for your morning discipleship routine
              </Text>
            </View>

            <View className="flex-row items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <div className="flex-1 sm:w-36 min-w-[140px]">
                <DateTimePicker
                  value={(() => {
                    const d = new Date();
                    if (reminderTime && reminderTime.includes(':')) {
                      const [h, m] = reminderTime.split(':');
                      d.setHours(parseInt(h, 10) || 7, parseInt(m, 10) || 0, 0, 0);
                    } else {
                      d.setHours(7, 0, 0, 0);
                    }
                    return d;
                  })()}
                  mode="time"
                  onChange={(event, date) => {
                    if (event.type === 'set' && date) {
                      const h = String(date.getHours()).padStart(2, '0');
                      const m = String(date.getMinutes()).padStart(2, '0');
                      const timeStr = `${h}:${m}`;
                      handleSaveNotifications(notificationsActive, timeStr);
                    }
                  }}
                />
              </div>
              <MotionButton
                size="sm"
                variant={notificationsActive ? "ministry-green" : "secondary"}
                icon={<Bell className="w-3.5 h-3.5" />}
                label={notificationsActive ? 'Active' : 'Turn On'}
                onClick={() => handleSaveNotifications(!notificationsActive, reminderTime)}
                className="shrink-0"
              />
            </View>
          </View>

          {/* Device Notification Integration */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Device System Alerts & Popups
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Permission status: <span className="font-bold text-[#5E72E4] uppercase">{permission}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MotionButton
                size="sm"
                variant="secondary"
                icon={<Volume2 className="w-3.5 h-3.5 text-[#5E72E4]" />}
                label={testNotifSent ? 'Chimed!' : 'Preview Alert Chime'}
                onClick={handlePreviewAlert}
              />
            </div>
          </div>

          {saveSettingsSuccess && (
            <View className="flex-row items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Reminder time saved!
              </Text>
            </View>
          )}
        </div>

        {/* Display & Accessibility */}
        <div className="p-5 sm:p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
          <Text className="font-bold text-sm text-neutral-900 dark:text-white">
            Display & Experience
          </Text>

          <View className="flex-row items-center justify-between pt-1">
            <View>
              <Text className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Theme Mode
              </Text>
              <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Toggle between light and dark discipleship ambiance
              </Text>
            </View>
            <ThemeToggle />
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <View>
              <Text className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Reduced Motion
              </Text>
              <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Disable non-essential slide animations
              </Text>
            </View>
            <Switch
              value={reducedMotion}
              onValueChange={setReducedMotion}
            />
          </View>

          <View className="flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <View>
              <Text className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                App Intro & Onboarding Guide
              </Text>
              <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Replay the craft opening screen and interactive feature tour
              </Text>
            </View>
            <div className="flex items-center gap-2">
              <MotionButton
                size="sm"
                variant="secondary"
                icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                label="Splash Intro"
                onClick={() => openIntroSplash()}
              />
              <MotionButton
                size="sm"
                variant="primary"
                icon={<Compass className="w-3.5 h-3.5 text-white" />}
                label="Tour Screens"
                onClick={() => openOnboarding()}
              />
            </div>
          </View>
        </div>

        {/* 4. Tilted Image Collage Card (Template 5 Spec) */}
        <TiltedCollageCard
          title="About The Master's Discipleship Ministries"
          message="Rooted in Christ, devoted to holy scripture, and raising disciples across the nations."
          actionText="About MDMI Ministry"
          onAction={() => setActiveTab('about')}
        />

        {/* Device Diagnostics & Debug Logs Card */}
        <div className="p-5 rounded-[24px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <View>
                <Text className="text-xs font-bold text-neutral-900 dark:text-white">
                  APK Diagnostics & Logs
                </Text>
                <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Inspect in-app runtime logs and copy sanitized error reports
                </Text>
              </View>
            </View>
            <MotionButton
              size="sm"
              variant="secondary"
              icon={<Terminal className="w-3.5 h-3.5 text-indigo-500" />}
              label="View Logs"
              onClick={openDiagnosticLogs}
            />
          </View>
        </div>

        {/* Overseer Console Card - Only visible to Admins */}
        {isAdmin && (
          <div className="p-5 rounded-[24px] border border-[#84CC16]/40 bg-gradient-to-br from-[#F7FEE7] via-[#ECFCCB] to-[#D9F99D] dark:from-[#081F06] dark:via-[#113B09] dark:to-[#041203] text-[#14532D] dark:text-white shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#84CC16]/15 text-[#65A30D] dark:text-[#84CC16] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <View>
                  <Text className="text-xs font-bold text-neutral-900 dark:text-white">
                    Ministry Overseer Access
                  </Text>
                  <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Author devotionals, manage disciples & promote overseers
                  </Text>
                </View>
              </View>
              <MotionButton
                size="sm"
                variant="ministry-green"
                id="profile-open-admin-btn"
                icon={<ChevronRight className="w-3.5 h-3.5 text-white" />}
                label="Open Console"
                onClick={() => setActiveTab('admin')}
              />
            </View>
          </div>
        )}
      </View>

      {/* Edit Profile & Bio Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </ScrollView>
  );
};
