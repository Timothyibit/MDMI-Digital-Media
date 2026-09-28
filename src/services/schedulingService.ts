/**
 * Scheduling & Timezone Service for Devotional Auto-Publishing
 * Supports exact timezone targets or rolling "Per User Time Zone" releases.
 */
import { Devotional } from '../types';

export interface TimezoneOption {
  value: string;
  label: string;
  badge: string;
  offset: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  {
    value: 'user_local',
    label: 'Per User’s Local Time Zone (Rolling Worldwide)',
    badge: 'USER-LOCAL',
    offset: 'Local Device Clock',
  },
  {
    value: 'Africa/Lagos',
    label: 'West Africa Time (WAT) — Lagos / Abuja (MDMI Base)',
    badge: 'WAT (UTC+1)',
    offset: '+01:00',
  },
  {
    value: 'UTC',
    label: 'Coordinated Universal Time (UTC / GMT)',
    badge: 'UTC',
    offset: '+00:00',
  },
  {
    value: 'Africa/Johannesburg',
    label: 'South Africa Standard Time (SAST) — Johannesburg',
    badge: 'SAST (UTC+2)',
    offset: '+02:00',
  },
  {
    value: 'Africa/Nairobi',
    label: 'East Africa Time (EAT) — Nairobi',
    badge: 'EAT (UTC+3)',
    offset: '+03:00',
  },
  {
    value: 'Africa/Accra',
    label: 'Greenwich Mean Time (GMT) — Accra',
    badge: 'GMT (UTC+0)',
    offset: '+00:00',
  },
  {
    value: 'Europe/London',
    label: 'London / UK Time (GMT / BST)',
    badge: 'UK',
    offset: 'London',
  },
  {
    value: 'America/New_York',
    label: 'Eastern Time (ET) — New York / Miami / Atlanta',
    badge: 'EST/EDT',
    offset: '-05:00/-04:00',
  },
  {
    value: 'America/Chicago',
    label: 'Central Time (CT) — Chicago / Dallas / Houston',
    badge: 'CST/CDT',
    offset: '-06:00/-05:00',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Time (PT) — Los Angeles / San Francisco',
    badge: 'PST/PDT',
    offset: '-08:00/-07:00',
  },
  {
    value: 'Asia/Dubai',
    label: 'Gulf Standard Time (GST) — Dubai / Abu Dhabi',
    badge: 'GST (UTC+4)',
    offset: '+04:00',
  },
  {
    value: 'Asia/Singapore',
    label: 'Singapore / Malaysia Time (SGT) — Singapore',
    badge: 'SGT (UTC+8)',
    offset: '+08:00',
  },
  {
    value: 'Asia/Tokyo',
    label: 'Japan Standard Time (JST) — Tokyo',
    badge: 'JST (UTC+9)',
    offset: '+09:00',
  },
  {
    value: 'Asia/Kolkata',
    label: 'India Standard Time (IST) — New Delhi / Mumbai',
    badge: 'IST (UTC+5:30)',
    offset: '+05:30',
  },
  {
    value: 'Australia/Sydney',
    label: 'Australian Eastern Time (AEST) — Sydney / Melbourne',
    badge: 'AEST',
    offset: '+10:00/+11:00',
  },
];

/**
 * Computes the exact ISO 8601 UTC timestamp for a specified Date string (YYYY-MM-DD),
 * Time string (HH:mm), and IANA Timezone.
 */
export function computeIsoFromZonedDateTime(
  dateStr: string,
  timeStr: string,
  timeZone: string
): string {
  try {
    if (!timeZone || timeZone === 'UTC' || timeZone === 'user_local') {
      return new Date(`${dateStr}T${timeStr || '00:00'}:00.000Z`).toISOString();
    }

    const cleanTime = timeStr ? (timeStr.length === 5 ? `${timeStr}:00` : timeStr) : '00:00:00';
    const guessDate = new Date(`${dateStr}T${cleanTime}Z`);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(guessDate);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    let y = parseInt(getPart('year'), 10);
    let m = parseInt(getPart('month'), 10);
    let d = parseInt(getPart('day'), 10);
    let h = parseInt(getPart('hour'), 10);
    let min = parseInt(getPart('minute'), 10);
    let s = parseInt(getPart('second'), 10);
    if (h === 24) h = 0;

    const formattedAsUtc = Date.UTC(y, m - 1, d, h, min, s);
    const offsetMs = formattedAsUtc - guessDate.getTime();
    const correctUtcMs = guessDate.getTime() - offsetMs;
    return new Date(correctUtcMs).toISOString();
  } catch {
    return new Date(`${dateStr}T${timeStr || '00:00'}:00.000Z`).toISOString();
  }
}

/**
 * Determines whether a devotional is live / visible for a disciple.
 */
export function isDevotionalLive(devotional: Devotional): boolean {
  // If explicitly published
  if (devotional.publishedAt !== null && devotional.publishedAt !== undefined) {
    return true;
  }

  // If no scheduled date, it's an un-scheduled draft
  if (!devotional.scheduledDate) {
    return false;
  }

  const targetDate = devotional.scheduledDate;
  const targetTime = devotional.scheduledTime || '00:00';

  // "Per User Time Zone" mode: compares against device's local clock
  if (devotional.scheduledTimezone === 'user_local') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const localDate = `${y}-${m}-${d}`;
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const localTime = `${h}:${min}`;

    if (localDate > targetDate) return true;
    if (localDate === targetDate && localTime >= targetTime) return true;
    return false;
  }

  // Specific global timezone mode
  if (devotional.scheduledPublishAt) {
    return new Date() >= new Date(devotional.scheduledPublishAt);
  }

  // If scheduledPublishAt was not cached, compute dynamically
  const targetUtcIso = computeIsoFromZonedDateTime(
    targetDate,
    targetTime,
    devotional.scheduledTimezone || 'Africa/Lagos'
  );

  return new Date() >= new Date(targetUtcIso);
}

/**
 * Returns a human-readable summary of the scheduled publishing configuration.
 */
export function formatScheduledSummary(
  date?: string | null,
  time?: string | null,
  timezone?: string | null
): { title: string; subtitle: string; isPast: boolean } {
  if (!date) {
    return {
      title: 'Not Scheduled',
      subtitle: 'Draft saved in queue. Set a date & time to auto-publish.',
      isPast: false,
    };
  }

  const cleanTime = time || '06:00';
  const tz = timezone || 'Africa/Lagos';

  if (tz === 'user_local') {
    return {
      title: `${date} at ${cleanTime}`,
      subtitle: 'Rolling release: Triggers at this time in each disciple’s local device time zone.',
      isPast: false,
    };
  }

  const targetIso = computeIsoFromZonedDateTime(date, cleanTime, tz);
  const isPast = new Date() >= new Date(targetIso);
  const tzOption = COMMON_TIMEZONES.find((t) => t.value === tz);
  const tzLabel = tzOption ? tzOption.badge : tz;

  return {
    title: `${date} at ${cleanTime} (${tzLabel})`,
    subtitle: isPast
      ? 'Scheduled time reached. Devotional is live.'
      : `Will automatically unlock for all disciples worldwide at ${cleanTime} ${tzLabel}.`,
    isPast,
  };
}
