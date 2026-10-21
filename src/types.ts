export type ThemeMode = 'light' | 'dark';

export type TabType = 'home' | 'devotionals' | 'journal' | 'profile' | 'admin' | 'reader' | 'about' | 'notifications';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  emailVerified?: boolean;
  isAnonymous: boolean;
  role: 'user' | 'admin';
  photoUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string;
  website?: string;
  churchAttending?: string;
  contact?: string;
  address?: string;
  spiritualGifts?: string;
  streakCount: number;
  totalMinutesRead?: number;
  completedDevotionalsCount?: number;
  readingLogs?: Record<string, number>; // date 'YYYY-MM-DD' => minutes spent reading
  lastReadAt: string | null;
  expoPushToken: string | null;
  notificationsEnabled: boolean;
  reminderTime: string; // e.g. "07:00"
  notificationCategories?: {
    dailyWord: boolean;
    fellowship: boolean;
    broadcasts: boolean;
  };
  createdAt: string;
}

export interface DailyActivityItem {
  date: string; // 'YYYY-MM-DD'
  label: string; // 'Mon', 'Tue', etc.
  minutes: number;
  completed: boolean;
  isToday: boolean;
}

export interface ReadingSessionRecord {
  id: string;
  devotionalId: string;
  devotionalTitle: string;
  minutes: number;
  date: string;
  timestamp: string;
}

export interface Devotional {
  id: string;
  title: string;
  scripture: string;
  scriptureText: string;
  body: string; // Rich formatting / Markdown / paragraphs
  audioUrl: string | null;
  audioDurationSeconds?: number;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorPhotoUrl?: string | null;
  publishedAt: string | null; // null = draft
  scheduledDate?: string | null; // YYYY-MM-DD queue date
  scheduledTime?: string | null; // HH:mm (e.g. "06:00")
  scheduledTimezone?: string | null; // e.g. "Africa/Lagos", "UTC", or "user_local"
  scheduledPublishAt?: string | null; // ISO string representing exact target moment when applicable
  isFeatured?: boolean;
  templateLayout?: 'organic' | 'argon' | 'classic' | 'modern';
  tags: string[];
  viewCount: number;
  likeCount: number;
  keyThought: string;
  prayerPrompt: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  devotionalId: string;
  uid: string;
  displayName: string;
  photoUrl?: string | null;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  reported: boolean;
  reportedBy: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'broadcast' | 'daily' | 'announcement' | 'comment' | 'prayer' | 'fellowship' | 'devotional' | 'study';
  devotionalId?: string;
  createdAt: string;
  createdBy?: string;
  read?: boolean;
}

export type NotificationTriggerType = 'timer' | 'scheduled_time' | 'recurring' | 'auto_event';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'hourly' | 'custom_hours';

export interface NotificationRecurrenceRule {
  frequency: RecurrenceFrequency;
  timeOfDay?: string; // e.g. "07:00"
  daysOfWeek?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Sunday)
  intervalHours?: number; // e.g. every 6 hours
  timezone?: string; // e.g. "user_local" | "Africa/Lagos" | "UTC"
}

export type AutoNotificationEventType =
  | 'new_devotional'
  | 'streak_reminder'
  | 'prayer_fellowship'
  | 'sabbath_service'
  | 'midday_watch'
  | 'midnight_hour';

export interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  type: 'broadcast' | 'daily' | 'announcement' | 'comment' | 'prayer' | 'fellowship' | 'devotional' | 'study';
  triggerType: NotificationTriggerType;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  enabled: boolean;
  scheduledAt?: string | null; // ISO string when timer fires
  delayMinutes?: number; // configured delay e.g. 5, 15, 60
  recurrence?: NotificationRecurrenceRule;
  autoEventType?: AutoNotificationEventType;
  devotionalId?: string | null;
  lastTriggeredAt?: string | null;
  nextTriggerAt?: string | null;
  triggerCount: number;
  createdAt: string;
  createdBy: string;
}

export interface HomeLayoutSection {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  order: number;
}

export interface AppHomeLayoutConfig {
  featuredDevotionalId: string | 'latest' | 'today';
  heroCardStyle: 'organic' | 'argon' | 'classic' | 'modern';
  sections: HomeLayoutSection[];
  showSpokenReflectionCard?: boolean;
  showPrayerJournalCard?: boolean;
  customWelcomeMessage?: string;
  defaultAuthorName?: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  uid: string;
  devotionalId: string | null;
  devotionalTitle?: string;
  title: string;
  content: string;
  scriptureRef?: string;
  prayerPoint?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  devotionalId: string;
  createdAt: string;
}

export interface AudioPlaybackState {
  devotionalId: string;
  title: string;
  scripture: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
}
