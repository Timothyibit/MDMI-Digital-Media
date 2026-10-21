import { create } from 'zustand';
import { AppHomeLayoutConfig, HomeLayoutSection, Devotional } from '../types';
import { db, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';
import { sortDevotionalsByLatest } from './useDevotionalStore';
import { isDevotionalLive } from '../services/schedulingService';

const DEFAULT_SECTIONS: HomeLayoutSection[] = [
  { id: 'headerBanner', label: 'Ministry Banner & Motto', description: 'MDMI top brand identity and motto badge', enabled: true, order: 0 },
  { id: 'featuredHero', label: 'Featured Devotional Hero Card', description: 'Primary focal devotional with reading & audio actions', enabled: true, order: 1 },
  { id: 'stackedDeck', label: '3D Stacked Deck Carousel', description: 'Interactive card deck with smooth gestures', enabled: true, order: 2 },
  { id: 'activityStats', label: 'Spiritual Walk & Action Tiles', description: '7-day meditation minutes graph and quick pathway links', enabled: true, order: 3 },
  { id: 'horizontalFeed', label: 'Latest Devotionals Feed', description: 'Detailed horizontal cards with scripture and reading time', enabled: true, order: 4 },
  { id: 'tiltedCollage', label: 'Consecration Topic Showcase', description: 'Artistic tilted cards highlighting spiritual themes', enabled: true, order: 5 },
];

const DEFAULT_CONFIG: AppHomeLayoutConfig = {
  featuredDevotionalId: 'today',
  heroCardStyle: 'organic',
  sections: DEFAULT_SECTIONS,
  showSpokenReflectionCard: true,
  showPrayerJournalCard: true,
  customWelcomeMessage: 'Winning souls, maturing believers in Christ, and serving in love',
  defaultAuthorName: "The Master's Discipleship Ministries",
  updatedAt: new Date().toISOString(),
};

interface LayoutState {
  config: AppHomeLayoutConfig;
  isLoading: boolean;
  initialize: () => Promise<void>;
  initializeLayout: () => Promise<void>;
  updateConfig: (updates: Partial<AppHomeLayoutConfig>) => Promise<void>;
  toggleSection: (sectionId: string) => Promise<void>;
  moveSection: (sectionId: string, direction: 'up' | 'down') => Promise<void>;
  setFeaturedDevotional: (devotionalId: string | 'latest' | 'today') => Promise<void>;
  setHeroStyle: (style: 'organic' | 'argon' | 'classic' | 'modern') => Promise<void>;
  getFeaturedDevotional: (devotionals: Devotional[]) => Devotional | undefined;
}

const STORAGE_KEY_LAYOUT = 'mdmi_home_layout_config';
let layoutSnapshotUnsub: (() => void) | null = null;
let layoutStorageListenerAttached = false;

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useLayoutStore = create<LayoutState>((set, get) => {
  let initial = DEFAULT_CONFIG;
  try {
    const cached = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (cached) {
      initial = { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
    }
  } catch {
    // fallback
  }

  const persist = (cfg: AppHomeLayoutConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(cfg));
    } catch {
      // ignore
    }
  };

  // Cross-tab real-time sync
  if (typeof window !== 'undefined' && !layoutStorageListenerAttached) {
    layoutStorageListenerAttached = true;
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY_LAYOUT && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            set({ config: { ...DEFAULT_CONFIG, ...parsed } });
          }
        } catch {
          // ignore
        }
      }
    });
  }

  const initializeLayout = async () => {
    if (layoutSnapshotUnsub) {
      layoutSnapshotUnsub();
      layoutSnapshotUnsub = null;
    }

    try {
      const layoutRef = doc(db, 'appConfig', 'homeLayout');
      // 1. Instant realtime subscription
      layoutSnapshotUnsub = onSnapshot(
        layoutRef,
        (snap) => {
          if (snap.exists()) {
            const remoteData = snap.data() as AppHomeLayoutConfig;
            const merged: AppHomeLayoutConfig = {
              ...DEFAULT_CONFIG,
              ...remoteData,
              sections: remoteData.sections || DEFAULT_SECTIONS,
            };
            persist(merged);
            set({ config: merged, isLoading: false });
          }
        },
        (err) => {
          console.info('Layout realtime listener notice:', err);
        }
      );
    } catch (err) {
      console.warn('Failed setting up layout realtime listener:', err);
    }
  };

  return {
    config: initial,
    isLoading: false,

    initialize: initializeLayout,
    initializeLayout,

    getFeaturedDevotional: (devotionals: Devotional[]) => {
      if (!devotionals || devotionals.length === 0) return undefined;
      const sorted = sortDevotionalsByLatest(devotionals);
      const { featuredDevotionalId } = get().config;
      const todayStr = formatLocalDate(new Date());

      // Published live teachings sorted latest-first
      const live = sorted.filter((d) => isDevotionalLive(d));
      const pool = live.length > 0 ? live : sorted;

      if (featuredDevotionalId === 'today') {
        // Find matching devotional for today's date
        const todayMatch = sorted.find(
          (d) =>
            d.scheduledDate === todayStr ||
            (d.publishedAt && d.publishedAt.startsWith(todayStr)) ||
            (d.createdAt && d.createdAt.startsWith(todayStr))
        );
        if (todayMatch) return todayMatch;
        return pool[0];
      }

      if (featuredDevotionalId && featuredDevotionalId !== 'latest') {
        const found = sorted.find((d) => d.id === featuredDevotionalId);
        if (found) return found;
      }

      // 'latest' or fallback: always return newest live devotional
      return pool[0];
    },

    updateConfig: async (updates) => {
      const current = get().config;
      const updated: AppHomeLayoutConfig = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      persist(updated);
      set({ config: updated });

      try {
        const layoutRef = doc(db, 'appConfig', 'homeLayout');
        await setDoc(layoutRef, updated, { merge: true });
      } catch (err) {
        console.info('Layout saved locally:', err);
      }
    },

    toggleSection: async (sectionId) => {
      const current = get().config;
      const updatedSections = current.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      );
      await get().updateConfig({ sections: updatedSections });
    },

    moveSection: async (sectionId, direction) => {
      const current = get().config;
      const sorted = [...current.sections].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((s) => s.id === sectionId);
      if (index === -1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return;

      const temp = sorted[index];
      sorted[index] = sorted[targetIndex];
      sorted[targetIndex] = temp;

      // Re-assign order numbers
      const updatedSections = sorted.map((s, idx) => ({ ...s, order: idx }));
      await get().updateConfig({ sections: updatedSections });
    },

    setFeaturedDevotional: async (devotionalId) => {
      await get().updateConfig({ featuredDevotionalId: devotionalId });
    },

    setHeroStyle: async (heroCardStyle) => {
      await get().updateConfig({ heroCardStyle });
    },
  };
});
