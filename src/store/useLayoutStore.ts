import { create } from 'zustand';
import { AppHomeLayoutConfig, HomeLayoutSection, Devotional } from '../types';
import { db, doc, getDoc, setDoc } from '../lib/firebase';

const DEFAULT_SECTIONS: HomeLayoutSection[] = [
  { id: 'headerBanner', label: 'Ministry Banner & Motto', description: 'MDMI top brand identity and motto badge', enabled: true, order: 0 },
  { id: 'featuredHero', label: 'Featured Devotional Hero Card', description: 'Primary focal devotional with reading & audio actions', enabled: true, order: 1 },
  { id: 'stackedDeck', label: '3D Stacked Deck Carousel', description: 'Interactive card deck with smooth gestures', enabled: true, order: 2 },
  { id: 'activityStats', label: 'Spiritual Walk & Action Tiles', description: '7-day meditation minutes graph and quick pathway links', enabled: true, order: 3 },
  { id: 'horizontalFeed', label: 'Latest Devotionals Feed', description: 'Detailed horizontal cards with scripture and reading time', enabled: true, order: 4 },
  { id: 'tiltedCollage', label: 'Consecration Topic Showcase', description: 'Artistic tilted cards highlighting spiritual themes', enabled: true, order: 5 },
];

const DEFAULT_CONFIG: AppHomeLayoutConfig = {
  featuredDevotionalId: 'latest',
  heroCardStyle: 'organic',
  sections: DEFAULT_SECTIONS,
  customWelcomeMessage: 'Winning souls, maturing believers in Christ, and serving in love',
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
  setFeaturedDevotional: (devotionalId: string | 'latest') => Promise<void>;
  setHeroStyle: (style: 'organic' | 'argon' | 'classic' | 'modern') => Promise<void>;
  getFeaturedDevotional: (devotionals: Devotional[]) => Devotional | undefined;
}

const STORAGE_KEY_LAYOUT = 'mdmi_home_layout_config';

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
    localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(cfg));
  };

  const initializeLayout = async () => {
    try {
      const layoutRef = doc(db, 'appConfig', 'homeLayout');
      const snap = await getDoc(layoutRef);
      if (snap.exists()) {
        const remoteData = snap.data() as AppHomeLayoutConfig;
        const merged: AppHomeLayoutConfig = {
          ...DEFAULT_CONFIG,
          ...remoteData,
          sections: remoteData.sections || DEFAULT_SECTIONS,
        };
        persist(merged);
        set({ config: merged });
      }
    } catch (err) {
      console.warn('Failed loading remote home layout, using local defaults:', err);
    }
  };

  return {
    config: initial,
    isLoading: false,

    initialize: initializeLayout,
    initializeLayout,

    getFeaturedDevotional: (devotionals: Devotional[]) => {
      const { featuredDevotionalId } = get().config;
      if (featuredDevotionalId && featuredDevotionalId !== 'latest') {
        const found = devotionals.find((d) => d.id === featuredDevotionalId);
        if (found) return found;
      }
      const published = devotionals.filter((d) => d.publishedAt !== null);
      return published[0] || devotionals[0];
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
