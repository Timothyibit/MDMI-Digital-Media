import { NotificationRecurrenceRule, NotificationSchedule, AutoNotificationEventType } from '../types';

/**
 * Calculates the next trigger ISO timestamp for a recurrence rule
 */
export function computeNextRecurrence(
  rule: NotificationRecurrenceRule,
  from: Date = new Date()
): Date {
  const result = new Date(from.getTime());

  if (rule.frequency === 'hourly') {
    result.setHours(result.getHours() + 1);
    result.setMinutes(0, 0, 0);
    return result;
  }

  if (rule.frequency === 'custom_hours') {
    const hours = Math.max(1, rule.intervalHours || 4);
    result.setTime(result.getTime() + hours * 60 * 60 * 1000);
    return result;
  }

  // Parse timeOfDay (HH:mm)
  const [targetH, targetM] = (rule.timeOfDay || '07:00').split(':').map((s) => parseInt(s, 10));

  if (rule.frequency === 'daily') {
    const candidate = new Date(from);
    candidate.setHours(targetH, targetM, 0, 0);

    // If candidate is already in the past or within 10 seconds of now, schedule for tomorrow
    if (candidate.getTime() <= from.getTime() + 10000) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  if (rule.frequency === 'weekly') {
    const days = rule.daysOfWeek && rule.daysOfWeek.length > 0 ? rule.daysOfWeek : [0]; // default Sunday
    const sortedDays = [...days].sort((a, b) => a - b);

    // Look up to 8 days ahead to find next matching day
    for (let i = 0; i <= 7; i++) {
      const candidate = new Date(from);
      candidate.setDate(candidate.getDate() + i);
      candidate.setHours(targetH, targetM, 0, 0);

      const dayOfWeek = candidate.getDay();
      if (sortedDays.includes(dayOfWeek)) {
        if (candidate.getTime() > from.getTime() + 10000) {
          return candidate;
        }
      }
    }

    // Fallback: 7 days from now
    const fallback = new Date(from);
    fallback.setDate(fallback.getDate() + 7);
    fallback.setHours(targetH, targetM, 0, 0);
    return fallback;
  }

  // Default fallback 24h
  result.setDate(result.getDate() + 1);
  return result;
}

/**
 * Calculates remaining time in a human-friendly format
 */
export function formatTimeRemaining(targetIso?: string | null): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
  formatted: string;
} {
  if (!targetIso) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: true, formatted: 'No timer' };
  }

  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: true, formatted: 'Due now' };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${pad(seconds)}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    isPast: false,
    formatted,
  };
}

/**
 * Default Preset Automatic Notification Rules for Ministry Overseers
 */
export const DEFAULT_AUTOMATIC_RULES: Array<Omit<NotificationSchedule, 'id' | 'createdAt'>> = [
  {
    title: 'New Devotional Released: {title}',
    body: "Fresh revelation from God's altar is ready for your meditation: '{title}'. Open to feast on His Word.",
    type: 'devotional',
    triggerType: 'auto_event',
    autoEventType: 'new_devotional',
    status: 'active',
    enabled: true,
    triggerCount: 0,
    createdBy: 'Ministry Overseer',
  },
  {
    title: 'Altar Fire Alert: Keep Your Streak Alive!',
    body: 'You have a {streak}-day spiritual streak! Do not let the sacred fire go out—meditate on today’s scripture.',
    type: 'daily',
    triggerType: 'auto_event',
    autoEventType: 'streak_reminder',
    status: 'active',
    enabled: true,
    recurrence: {
      frequency: 'daily',
      timeOfDay: '19:30',
      timezone: 'user_local',
    },
    nextTriggerAt: computeNextRecurrence({ frequency: 'daily', timeOfDay: '19:30' }).toISOString(),
    triggerCount: 0,
    createdBy: 'Ministry Overseer',
  },
  {
    title: 'Noonday Watch of Prayer & Intercession',
    body: 'Take 3 quiet minutes to lift up fellow disciples, the persecuted church, and your local community before God.',
    type: 'prayer',
    triggerType: 'auto_event',
    autoEventType: 'midday_watch',
    status: 'active',
    enabled: true,
    recurrence: {
      frequency: 'daily',
      timeOfDay: '12:00',
      timezone: 'user_local',
    },
    nextTriggerAt: computeNextRecurrence({ frequency: 'daily', timeOfDay: '12:00' }).toISOString(),
    triggerCount: 0,
    createdBy: 'Ministry Overseer',
  },
  {
    title: "Blessed Lord's Day: Sabbath Worship Fellowship",
    body: 'Rejoice and be glad! Join your local assembly today and let the word of Christ dwell in you richly.',
    type: 'fellowship',
    triggerType: 'auto_event',
    autoEventType: 'sabbath_service',
    status: 'active',
    enabled: true,
    recurrence: {
      frequency: 'weekly',
      daysOfWeek: [0], // Sunday
      timeOfDay: '08:00',
      timezone: 'user_local',
    },
    nextTriggerAt: computeNextRecurrence({
      frequency: 'weekly',
      daysOfWeek: [0],
      timeOfDay: '08:00',
    }).toISOString(),
    triggerCount: 0,
    createdBy: 'Ministry Overseer',
  },
  {
    title: 'Midnight Hour of Prayer & Vigil',
    body: 'The midnight hour: Paul and Silas prayed and sang praises unto God. Arise and watch with the Master.',
    type: 'prayer',
    triggerType: 'auto_event',
    autoEventType: 'midnight_hour',
    status: 'active',
    enabled: true,
    recurrence: {
      frequency: 'daily',
      timeOfDay: '23:30',
      timezone: 'user_local',
    },
    nextTriggerAt: computeNextRecurrence({ frequency: 'daily', timeOfDay: '23:30' }).toISOString(),
    triggerCount: 0,
    createdBy: 'Ministry Overseer',
  },
];

/**
 * Replace template tokens with real devotional/user data
 */
export function interpolateNotificationTemplate(
  text: string,
  context?: { title?: string; scripture?: string; streak?: number; name?: string }
): string {
  if (!text) return '';
  let result = text;
  if (context?.title) {
    result = result.replace(/\{title\}/gi, context.title);
  }
  if (context?.scripture) {
    result = result.replace(/\{scripture\}/gi, context.scripture);
  }
  if (context?.streak !== undefined) {
    result = result.replace(/\{streak\}/gi, String(context.streak || 1));
  }
  if (context?.name) {
    result = result.replace(/\{name\}/gi, context.name);
  }
  return result;
}
