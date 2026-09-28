import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  BarChart3,
  PlusCircle,
  FileText,
  Trash2,
  CheckCircle,
  Eye,
  Heart,
  Users,
  Send,
  Flag,
  Sparkles,
  Edit3,
  Camera,
  LayoutTemplate,
  Bell,
  Calendar,
  Clock,
  Search,
  X,
  Music,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDevotionalStore } from '../store/useDevotionalStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useUIStore } from '../store/useUIStore';
import { Devotional } from '../types';
import { ScrollView, View } from '../lib/react-native';
import { Button, Badge, Tabs } from '../components/common';
import { EditDevotionalModal } from '../components/admin/EditDevotionalModal';
import { AdminLayoutManager } from '../components/admin/AdminLayoutManager';
import { AdminBroadcastManager } from '../components/admin/AdminBroadcastManager';
import { AdminUserManager } from '../components/admin/AdminUserManager';
import { ScheduledPublishingConfig } from '../components/admin/ScheduledPublishingConfig';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { DateTimePicker } from '../components/ui/DateTimePicker';
import { calculateAudioDuration, formatAudioDuration } from '../services/aiAudioService';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import { MorphingCardStack } from '@/components/ui/morphing-card-stack';
import { DeviceImageUploader } from '../components/common/DeviceImageUploader';

const ADMIN_PAGE_SIZE = 6;
const MODERATE_PAGE_SIZE = 4;

const PRESET_DEVOTIONAL_PHOTOS = [
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80',
];

export const AdminTab: React.FC = () => {
  const { user, isAdmin, toggleAdminRole, fetchAllRegisteredUsers } = useAuthStore();
  const { setActiveTab } = useUIStore();
  const {
    devotionals,
    comments,
    createDevotional,
    deleteDevotional,
    publishDevotional,
    approveComment,
    removeComment,
    setActiveDevotionalId,
  } = useDevotionalStore();

  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);
  const [totalReadingMinutes, setTotalReadingMinutes] = useState<number>(0);
  const [totalCompletedDevotionals, setTotalCompletedDevotionals] = useState<number>(0);
  const [activeStreaksCount, setActiveStreaksCount] = useState<number>(0);
  const [notificationsSubscribersCount, setNotificationsSubscribersCount] = useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;
    if (isAdmin) {
      fetchAllRegisteredUsers().then((list) => {
        if (isMounted && list) {
          setRegisteredUsersCount(list.length);
          const mins = list.reduce((sum, u) => sum + (u.totalMinutesRead || 0), 0);
          const completed = list.reduce((sum, u) => sum + (u.completedDevotionalsCount || 0), 0);
          const streaks = list.filter((u) => (u.streakCount || 0) > 0).length;
          const notifs = list.filter((u) => u.notificationsEnabled).length;
          setTotalReadingMinutes(mins);
          setTotalCompletedDevotionals(completed);
          setActiveStreaksCount(streaks);
          setNotificationsSubscribersCount(notifs);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [fetchAllRegisteredUsers, isAdmin]);

  const [activeSection, setActiveSection] = useState<
    'metrics' | 'users' | 'manage' | 'create' | 'layout' | 'broadcast' | 'moderate'
  >('metrics');

  // Edit Devotional State
  const [editingDevotional, setEditingDevotional] = useState<Devotional | null>(null);

  // Authoring Form State
  const [title, setTitle] = useState('');
  const [scripture, setScripture] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [keyThought, setKeyThought] = useState('');
  const [body, setBody] = useState('');
  const [prayerPrompt, setPrayerPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_DEVOTIONAL_PHOTOS[0]);
  const [authorName, setAuthorName] = useState(user?.displayName || "The Master's Discipleship Ministries");
  const [authorRole, setAuthorRole] = useState('Senior Ministry Overseer');
  const [audioUrl, setAudioUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('06:00');
  const [scheduledTimezone, setScheduledTimezone] = useState('Africa/Lagos');
  const [tagInput, setTagInput] = useState('Discipleship, Prayer, Consecration');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [adminDevotionalPage, setAdminDevotionalPage] = useState(1);
  const [moderatePage, setModeratePage] = useState(1);
  const [adminFilterStatus, setAdminFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'draft'>('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminDateFilter, setAdminDateFilter] = useState<string | null>(null);

  const uniqueDevotionals = useMemo(() => {
    const seen = new Set<string>();
    return devotionals.filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [devotionals]);

  const filteredAdminDevotionals = useMemo(() => {
    return uniqueDevotionals.filter((d) => {
      if (adminFilterStatus === 'scheduled') {
        if (!d.scheduledDate || d.publishedAt !== null) return false;
      } else if (adminFilterStatus === 'live') {
        if (d.publishedAt === null) return false;
      } else if (adminFilterStatus === 'draft') {
        if (d.publishedAt !== null || d.scheduledDate) return false;
      }

      if (adminDateFilter) {
        const matchesDate =
          (d.scheduledDate && d.scheduledDate === adminDateFilter) ||
          (d.publishedAt && d.publishedAt.startsWith(adminDateFilter));
        if (!matchesDate) return false;
      }

      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.toLowerCase();
        const matches =
          d.title.toLowerCase().includes(q) ||
          d.scripture.toLowerCase().includes(q) ||
          (d.tags && d.tags.some((t) => t.toLowerCase().includes(q)));
        if (!matches) return false;
      }

      return true;
    });
  }, [uniqueDevotionals, adminFilterStatus, adminDateFilter, adminSearchQuery]);

  const totalAdminPages = Math.max(1, Math.ceil(filteredAdminDevotionals.length / ADMIN_PAGE_SIZE));
  const paginatedAdminDevotionals = useMemo(() => {
    const list = filteredAdminDevotionals.slice(
      (adminDevotionalPage - 1) * ADMIN_PAGE_SIZE,
      adminDevotionalPage * ADMIN_PAGE_SIZE
    );
    const seen = new Set<string>();
    return list.filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [filteredAdminDevotionals, adminDevotionalPage]);

  // Calculate Metrics
  const totalViews = devotionals.reduce((sum, d) => sum + (d.viewCount || 0), 0);
  const totalLikes = devotionals.reduce((sum, d) => sum + (d.likeCount || 0), 0);
  const publishedCount = devotionals.filter((d) => d.publishedAt !== null).length;
  const draftCount = devotionals.length - publishedCount;
  const reportedComments = comments.filter((c) => c.reported);

  const totalModeratePages = Math.max(1, Math.ceil(reportedComments.length / MODERATE_PAGE_SIZE));
  const safeModeratePage = Math.min(Math.max(1, moderatePage), totalModeratePages);
  const paginatedReportedComments = useMemo(() => {
    return reportedComments.slice(
      (safeModeratePage - 1) * MODERATE_PAGE_SIZE,
      safeModeratePage * MODERATE_PAGE_SIZE
    );
  }, [reportedComments, safeModeratePage]);

  // Morphing Card Stack cards for Metrics
  const ministryInsightCards = useMemo(() => [
    {
      id: "metric_views",
      title: "Global Discipleship Reach",
      description: `${totalViews} readings completed across active disciples and seekers worldwide.`,
      icon: <Eye className="w-5 h-5 text-[#5E72E4]" />,
      color: "#5E72E4",
    },
    {
      id: "metric_users",
      title: "Consecrated Disciples",
      description: `${registeredUsersCount} registered saints walking in covenant fellowship and study.`,
      icon: <Users className="w-5 h-5 text-[#2DCE89]" />,
      color: "#2DCE89",
    },
    {
      id: "metric_amens",
      title: "Fellowship Amens",
      description: `${totalLikes} affirmations and amens lifted up in reverence and agreement.`,
      icon: <Heart className="w-5 h-5 text-[#FB6340]" />,
      color: "#FB6340",
    },
    {
      id: "metric_meditation",
      title: "Scripture Meditation",
      description: `${totalReadingMinutes} minutes spent feeding on God's Holy Word and meditation.`,
      icon: <Sparkles className="w-5 h-5 text-[#11CDEF]" />,
      color: "#11CDEF",
    },
  ], [totalViews, registeredUsersCount, totalLikes, totalReadingMinutes]);

  if (!isAdmin) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 w-full max-w-md mx-auto">
        <View className="py-16 sm:py-20 px-4 text-center items-center w-full">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FB6340]/15 text-[#FB6340] flex items-center justify-center mb-4 shadow-[0_4px_10px_rgba(251,99,64,0.25)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#172B4D] dark:text-white">
            Ministry Overseer Access Required
          </h2>
          <p className="text-xs text-[#525F7F] dark:text-neutral-400 mt-2 leading-relaxed max-w-sm">
            The Admin Console is restricted to authorized ministry leadership for authoring daily devotionals, managing disciples, and broadcasting alerts.
          </p>
          <div className="mt-6">
            <Button
              id="return-home-btn"
              color="primary"
              onPress={() => setActiveTab('home')}
            >
              Return to Today's Word
            </Button>
          </div>
        </View>
      </ScrollView>
    );
  }

  const handleSaveDevotional = (isDraft: boolean) => {
    if (!title.trim() || !scripture.trim() || !body.trim()) {
      setStatusNotice('Title, scripture, and body are required fields.');
      return;
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const calculatedAudioDuration = calculateAudioDuration({
      title: title.trim(),
      scripture: scripture.trim(),
      scriptureText: scriptureText.trim() || scripture.trim(),
      keyThought: keyThought.trim(),
      body: body.trim(),
      prayerPrompt: prayerPrompt.trim(),
      audioUrl: audioUrl.trim() || null,
    });

    createDevotional({
      authorId: user?.uid || 'admin_mdmi',
      title: title.trim(),
      scripture: scripture.trim(),
      scriptureText: scriptureText.trim() || scripture.trim(),
      keyThought: keyThought.trim() || title.trim(),
      body: body.trim(),
      prayerPrompt: prayerPrompt.trim() || 'Lord Jesus, conform my heart to Your likeness.',
      authorName: authorName.trim(),
      authorRole: authorRole.trim(),
      imageUrl: imageUrl.trim() || null,
      audioUrl: audioUrl.trim() || null,
      audioDurationSeconds: calculatedAudioDuration,
      scheduledDate: scheduledDate.trim() || null,
      scheduledTime: scheduledDate.trim() ? (scheduledTime.trim() || '06:00') : null,
      scheduledTimezone: scheduledDate.trim() ? scheduledTimezone : null,
      publishedAt: isDraft ? null : new Date().toISOString(),
      tags: tags.length > 0 ? tags : ['Discipleship'],
    });

    if (!isDraft) {
      useNotificationStore.getState().triggerAutoNotification('new_devotional', {
        title: title.trim(),
        scripture: scripture.trim(),
      });
    }

    setTitle('');
    setScripture('');
    setScriptureText('');
    setKeyThought('');
    setBody('');
    setPrayerPrompt('');
    setScheduledDate('');
    setScheduledTime('06:00');
    setScheduledTimezone('Africa/Lagos');
    setStatusNotice(
      isDraft
        ? 'Devotional saved as draft in queue.'
        : 'Devotional published immediately to live feed!'
    );
    setTimeout(() => setStatusNotice(null), 3500);
    setActiveSection('manage');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1 w-full max-w-4xl mx-auto">
      <View className="space-y-6 pb-40 sm:pb-32 w-full">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-[#E9ECEF] dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#5E72E4] text-white font-mono">
                MDMI Overseer
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display-scripture text-[#172B4D] dark:text-white">
                Ministry Management Console
              </h1>
            </div>
            <p className="text-xs text-[#525F7F] dark:text-neutral-400 mt-0.5">
              Full control over devotionals, photos, template layout, and push notifications
            </p>
          </div>

          {/* Section Tabs */}
          <div className="w-full max-w-full overflow-x-auto pb-1">
            <Tabs
              data={[
                { id: 'metrics', title: 'Metrics' },
                { id: 'users', title: 'Disciples & Admins' },
                { id: 'manage', title: `Writings (${devotionals.length})` },
                { id: 'create', title: 'Author & Photos' },
                { id: 'layout', title: 'Page Structure' },
                { id: 'broadcast', title: 'Device Alerts' },
                { id: 'moderate', title: `Queue (${reportedComments.length})` },
              ]}
              activeTab={activeSection}
              onChange={(id) => setActiveSection(id as any)}
            />
          </div>
        </div>

        {statusNotice && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* REGISTERED DISCIPLES & USER MANAGEMENT */}
        {activeSection === 'users' && <AdminUserManager />}

        {/* METRICS DASHBOARD */}
        {activeSection === 'metrics' && (
          <div className="space-y-6">
            {/* Interactive Morphing Executive Summary Cards */}
            <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <h3 className="font-bold text-sm text-[#172B4D] dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5E72E4]" />
                    <span>Executive Ministry Insights (Morphing Cards Stack)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Switch between interactive Swipeable Deck, Responsive Grid, and Expanded List modes.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#5E72E4] bg-[#5E72E4]/10 px-2 py-0.5 rounded-full w-fit">
                  Live Firestore Analytics
                </span>
              </div>
              <MorphingCardStack
                cards={ministryInsightCards}
                defaultLayout="stack"
              />
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#525F7F] dark:text-neutral-300">
                      Total Views
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#5E72E4]/15 flex items-center justify-center text-[#5E72E4]">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] dark:text-white tabular-nums">
                    {totalViews}
                  </p>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-3 block">
                  ↑ Live counts across all readers & visitors
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#525F7F] dark:text-neutral-300">
                      Active Disciples
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] dark:text-white tabular-nums">
                    {registeredUsersCount}
                  </p>
                </div>
                <span className="text-[11px] text-[#525F7F] dark:text-neutral-400 font-medium mt-3 block">
                  Verified registered disciple accounts
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#525F7F] dark:text-neutral-300">
                      Total Amens
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
                      <Heart className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] dark:text-white tabular-nums">
                    {totalLikes}
                  </p>
                </div>
                <span className="text-[11px] text-rose-500 font-bold mt-3 block">
                  Fellowship prayer affirmations
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#525F7F] dark:text-neutral-300">
                      Published / Drafts
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] dark:text-white tabular-nums">
                    {publishedCount}{' '}
                    <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">
                      / {draftCount}
                    </span>
                  </p>
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-3 block">
                  {draftCount > 0 ? `${draftCount} scheduled in queue` : 'All teachings published'}
                </span>
              </div>
            </div>

            {/* Secondary Real Engagement Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Total Meditation Time
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#172B4D] dark:text-white mt-1 tabular-nums">
                  {totalReadingMinutes}m
                </p>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 block">
                  Cumulative minutes in Word
                </span>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Devotions Completed
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#172B4D] dark:text-white mt-1 tabular-nums">
                  {totalCompletedDevotionals}
                </p>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 block">
                  Finished discipleship logs
                </span>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Disciples With Streaks
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#172B4D] dark:text-white mt-1 tabular-nums">
                  {activeStreaksCount}
                </p>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 block">
                  Active daily readers
                </span>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Push Alert Subscribers
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#172B4D] dark:text-white mt-1 tabular-nums">
                  {notificationsSubscribersCount}
                </p>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 block">
                  Subscribed for morning alerts
                </span>
              </div>
            </div>

            {/* Top Engaged Devotionals Rankings (100% Real Live Firestore Data) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#5E72E4]" />
                    <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
                      Most Read Teachings
                    </h4>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">Real Views</span>
                </div>
                <div className="space-y-2">
                  {[...uniqueDevotionals]
                    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                    .slice(0, 5)
                    .map((d, idx) => (
                      <div
                        key={`top-view-${d.id}-${idx}`}
                        className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-[#5E72E4]/10 text-[#5E72E4] font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {d.title}
                            </p>
                            <span className="text-[10px] text-[#5E72E4] font-mono">{d.scripture}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-extrabold tabular-nums border border-neutral-200 dark:border-neutral-600 shrink-0">
                          {d.viewCount || 0} views
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
                      Top Affirmed Devotionals
                    </h4>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">Total Amens</span>
                </div>
                <div className="space-y-2">
                  {[...uniqueDevotionals]
                    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
                    .slice(0, 5)
                    .map((d, idx) => (
                      <div
                        key={`top-like-${d.id}-${idx}`}
                        className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-rose-500/10 text-rose-500 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {d.title}
                            </p>
                            <span className="text-[10px] text-[#5E72E4] font-mono">{d.scripture}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-700 text-rose-600 dark:text-rose-400 text-xs font-extrabold tabular-nums border border-neutral-200 dark:border-neutral-600 shrink-0">
                          {d.likeCount || 0} amens
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MANAGE WRITINGS SECTION */}
        {activeSection === 'manage' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
                  Devotional Archives & Editable Photos ({devotionals.length})
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select, search, and edit any teaching, scheduled release date, photo, or audio
                </p>
              </div>
              <Button
                small
                color="primary"
                onPress={() => setActiveSection('create')}
                className="flex items-center gap-1 self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Create New
              </Button>
            </div>

            {/* Quick Devotional Selector & Scheduled Publishing Tools */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Instant Devotional Selector Dropdown */}
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-neutral-900 dark:text-neutral-200 mb-1 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#5E72E4] dark:text-[#7BDEB2]" />
                    <span>Select Devotional to Edit:</span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = devotionals.find((d) => d.id === e.target.value);
                      if (selected) {
                        setEditingDevotional(selected);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#5E72E4]/40"
                  >
                    <option value="">Choose a devotional to open editor & schedule...</option>
                    {uniqueDevotionals.map((d, idx) => (
                      <option key={`admin-opt-${d.id}-${idx}`} value={d.id} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                        {d.title} ({d.scripture}) — {d.publishedAt ? 'Live' : d.scheduledDate ? `Scheduled for ${d.scheduledDate}` : 'Draft'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter Bar */}
                <div className="sm:w-64">
                  <label className="block text-[11px] font-bold text-neutral-900 dark:text-neutral-200 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Filter by Scheduled Date:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <DateTimePicker
                        value={adminDateFilter ? new Date(adminDateFilter + 'T00:00:00') : new Date()}
                        mode="date"
                        placeholder="Pick date..."
                        onChange={(event, date) => {
                          if (event.type === 'set' && date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            setAdminDateFilter(`${y}-${m}-${d}`);
                            setAdminDevotionalPage(1);
                          }
                        }}
                      />
                    </div>
                    {adminDateFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminDateFilter(null);
                          setAdminDevotionalPage(1);
                        }}
                        className="px-2.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 shrink-0 transition-colors"
                        title="Clear date filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Filter Buttons & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: 'all', label: `All (${devotionals.length})` },
                    { id: 'scheduled', label: `Scheduled Queue (${devotionals.filter((d) => d.scheduledDate && !d.publishedAt).length})` },
                    { id: 'live', label: `Live Feed (${publishedCount})` },
                    { id: 'draft', label: `Drafts (${devotionals.filter((d) => !d.scheduledDate && !d.publishedAt).length})` },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      type="button"
                      onClick={() => {
                        setAdminFilterStatus(filterTab.id as any);
                        setAdminDevotionalPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                        adminFilterStatus === filterTab.id
                          ? 'bg-[#5E72E4] text-white border-[#5E72E4] shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                {/* Instant search input */}
                <div className="relative sm:w-60">
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => {
                      setAdminSearchQuery(e.target.value);
                      setAdminDevotionalPage(1);
                    }}
                    placeholder="Search titles or scripture..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {adminSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSearchQuery('');
                        setAdminDevotionalPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {paginatedAdminDevotionals.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    No devotionals found
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Try clearing your date or status filters to view all ministry teachings.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminFilterStatus('all');
                      setAdminSearchQuery('');
                      setAdminDateFilter(null);
                      setAdminDevotionalPage(1);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-[#5E72E4] dark:text-[#7BDEB2] hover:underline"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                paginatedAdminDevotionals.map((d, idx) => (
                  <div
                    key={`admin-dev-${d.id}-${idx}`}
                    className="p-4 sm:p-5 rounded-xl border border-[#E9ECEF] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Devotional Photo Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                        {d.imageUrl ? (
                          <img
                            src={d.imageUrl}
                            alt={d.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#5E72E4] font-mono">
                            {d.scripture}
                          </span>
                          {d.publishedAt ? (
                            <Badge color="success" size="sm">
                              Live Feed
                            </Badge>
                          ) : (
                            <Badge color="warning" size="sm">
                              Draft Queue
                            </Badge>
                          )}
                          {d.scheduledDate && (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border shadow-xs transition-colors ${
                                d.publishedAt
                                  ? 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-900 dark:text-emerald-100 border-emerald-500/35 dark:border-emerald-500/40'
                                  : 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border-amber-500/40 dark:border-amber-400/40'
                              }`}
                              title={
                                d.scheduledTimezone === 'user_local'
                                  ? `Auto-publishes on ${d.scheduledDate} at ${d.scheduledTime || '06:00'} per user time zone`
                                  : `Auto-publishes on ${d.scheduledDate} at ${d.scheduledTime || '06:00'} (${d.scheduledTimezone || 'WAT'})`
                              }
                            >
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>
                                {d.scheduledDate} • {d.scheduledTime || '06:00'}{' '}
                                <span className="opacity-90 font-medium">
                                  ({d.scheduledTimezone === 'user_local' ? 'Per User TZ' : d.scheduledTimezone || 'WAT'})
                                </span>
                              </span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#172B4D] dark:text-white truncate">
                          {d.title}
                        </h4>
                        <p className="text-xs text-[#525F7F] dark:text-neutral-400 mt-0.5 truncate">
                          By {d.authorName} • {d.viewCount || 0} views • {d.likeCount || 0} amens
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E9ECEF] dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDevotionalId(d.id);
                          setActiveTab('reader');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
                        title="Read devotional in Reader View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingDevotional(d)}
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-[#5E72E4] flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit & Photo</span>
                      </button>

                      {!d.publishedAt && (
                        <Button
                          small
                          color="info"
                          onPress={() => {
                            publishDevotional(d.id);
                            useNotificationStore.getState().triggerAutoNotification('new_devotional', {
                              title: d.title,
                              scripture: d.scripture,
                              devotionalId: d.id,
                            });
                          }}
                        >
                          Publish
                        </Button>
                      )}

                      <Button
                        small
                        color="secondary"
                        onPress={() => deleteDevotional(d.id)}
                        title="Delete devotional"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#F5365C]" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {filteredAdminDevotionals.length > ADMIN_PAGE_SIZE && (
                <div className="pt-3">
                  <PaginationPageDefault
                    page={adminDevotionalPage}
                    total={totalAdminPages}
                    onPageChange={setAdminDevotionalPage}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUTHOR NEW DEVOTIONAL */}
        {activeSection === 'create' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveDevotional(false);
            }}
            className="p-5 sm:p-6 rounded-xl border border-[#E9ECEF] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E9ECEF] dark:border-neutral-800">
              <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
                Author Devotional with Photo & Rich Formatting
              </h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Markdown & custom tags supported
              </span>
            </div>

            {/* Device Image Uploader */}
            <DeviceImageUploader
              value={imageUrl}
              onChange={(url) => setImageUrl(url || PRESET_DEVOTIONAL_PHOTOS[0])}
              label="Devotional Header Photo"
              helperText="Upload image directly from your phone/computer, choose a spiritual preset, or enter URL"
              presets={PRESET_DEVOTIONAL_PHOTOS}
              aspectRatio="video"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                  Devotional Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walking in Resurrection Power"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                  Scripture Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Romans 8:11"
                  value={scripture}
                  onChange={(e) => setScripture(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                Scripture Verse Text *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. But if the Spirit of him that raised up Jesus from the dead dwell in you..."
                value={scriptureText}
                onChange={(e) => setScriptureText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] italic"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                Key Meditation Thought (Callout Banner)
              </label>
              <input
                type="text"
                placeholder="e.g. The same divine energy that emptied the tomb lives inside every disciple."
                value={keyThought}
                onChange={(e) => setKeyThought(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4]"
              />
            </div>

            {/* Rich Text Editor for Body */}
            <div>
              <RichTextEditor
                label="Devotional Body (Rich Text Formatting)"
                value={body}
                onChange={setBody}
                rows={7}
                placeholder="Enter theological exposition. Highlight scripture with <verse>...</verse> or <mark>...</mark>"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                Daily Prayer of Consecration
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Heavenly Father, let the power that raised Christ quicken my mortal body today..."
                value={prayerPrompt}
                onChange={(e) => setPrayerPrompt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] italic"
              />
            </div>

            {/* Audio Stream URL */}
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Audio Narration URL (Optional MP3 / WAV Stream)</span>
              </label>
              <input
                type="url"
                placeholder="https://... MP3 file URL"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-[#172B4D] dark:text-white"
              />
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>Calculated Audio Duration:</span>
                <span className="font-bold text-[#5E72E4]">
                  {formatAudioDuration(
                    calculateAudioDuration({
                      title,
                      scripture,
                      scriptureText,
                      keyThought,
                      body,
                      prayerPrompt,
                      audioUrl,
                    })
                  )}
                </span>
              </div>
            </div>

            {/* Scheduled Auto-Publishing & Time Zone Configuration */}
            <ScheduledPublishingConfig
              scheduledDate={scheduledDate}
              setScheduledDate={setScheduledDate}
              scheduledTime={scheduledTime}
              setScheduledTime={setScheduledTime}
              scheduledTimezone={scheduledTimezone}
              setScheduledTimezone={setScheduledTimezone}
            />

            <div className="pt-4 border-t border-[#E9ECEF] dark:border-neutral-800 flex flex-wrap items-center justify-end gap-3">
              <Button
                id="save-draft-devotional-btn"
                color="secondary"
                onPress={() => handleSaveDevotional(true)}
              >
                Queue as Draft
              </Button>

              <Button
                id="publish-now-devotional-btn"
                color="primary"
                onPress={() => handleSaveDevotional(false)}
                className="flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Publish Live Now
              </Button>
            </div>
          </form>
        )}

        {/* PAGE STRUCTURE & TEMPLATE CONTROL */}
        {activeSection === 'layout' && <AdminLayoutManager />}

        {/* PUSH NOTIFICATIONS & DEVICE POPUPS */}
        {activeSection === 'broadcast' && <AdminBroadcastManager />}

        {/* MODERATION QUEUE */}
        {activeSection === 'moderate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
                Reported Reflections Queue ({reportedComments.length})
              </h3>
            </div>

            {reportedComments.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 border border-dashed border-[#E9ECEF] dark:border-neutral-800 rounded-lg bg-white/40 dark:bg-neutral-900/40">
                <CheckCircle className="w-10 h-10 stroke-1 mx-auto mb-2 text-[#2DCE89]" />
                <p className="font-semibold text-sm text-[#172B4D] dark:text-neutral-300">
                  Moderation queue is clear
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedReportedComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-5 rounded-lg border border-[#F5365C]/30 bg-[#F5365C]/5 dark:bg-rose-950/20 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge color="error" size="sm">
                        Flagged by {comment.reportedBy.length} user{comment.reportedBy.length === 1 ? '' : 's'}
                      </Badge>
                      <span className="text-xs font-bold text-[#172B4D] dark:text-white">
                        Author: {comment.displayName}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      “{comment.body}”
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        small
                        color="success"
                        onPress={() => approveComment(comment.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        small
                        color="error"
                        onPress={() => removeComment(comment.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Moderation Pagination */}
                {totalModeratePages > 1 && (
                  <div className="pt-2">
                    <PaginationPageDefault
                      page={safeModeratePage}
                      total={totalModeratePages}
                      onPageChange={setModeratePage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </View>

      {/* Edit Devotional Modal */}
      <EditDevotionalModal
        devotional={editingDevotional}
        isOpen={editingDevotional !== null}
        onClose={() => setEditingDevotional(null)}
      />
    </ScrollView>
  );
};
