export type ThemeMode = 'system' | 'light' | 'dark' | 'sepia';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
  role: 'user' | 'admin';
  streakCount: number;
  lastReadAt: string | null;
  expoPushToken: string | null;
  notificationsEnabled: boolean;
  reminderTime: string; // e.g. "07:00"
  createdAt: string;
}

export interface Devotional {
  id: string;
  title: string;
  scripture: string;
  scriptureText: string;
  body: string; // Markdown / paragraphs
  audioUrl: string | null;
  audioDurationSeconds: number;
  authorId: string;
  authorName: string;
  authorRole: string;
  publishedAt: string | null; // null = draft
  tags: string[];
  viewCount: number;
  likeCount: number;
  keyThought: string;
  prayerPrompt: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  devotionalId: string;
  uid: string;
  displayName: string;
  body: string;
  createdAt: string;
  reported: boolean;
  reportedBy: string[];
}

export interface JournalEntry {
  id: string;
  uid: string;
  devotionalId: string | null;
  devotionalTitle?: string;
  title: string;
  content: string;
  scriptureRef?: string;
  prayerPoint?: string;
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
