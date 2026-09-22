import React, { useEffect, useState } from 'react';
import {
  Home,
  BookOpen,
  PenTool,
  User,
  Shield,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import { useDevotionalStore } from './store/useDevotionalStore';
import { useJournalStore } from './store/useJournalStore';
import { useBookmarkStore } from './store/useBookmarkStore';
import { Devotional } from './types';

// Components & Tabs
import { HomeTab } from './tabs/HomeTab';
import { DevotionalsTab } from './tabs/DevotionalsTab';
import { JournalTab } from './tabs/JournalTab';
import { ProfileTab } from './tabs/ProfileTab';
import { AdminTab } from './tabs/AdminTab';
import { DevotionalReader } from './components/reader/DevotionalReader';

// UI Overlays & Sheets
import { OfflineBanner } from './components/ui/OfflineBanner';
import { AudioPlayer } from './components/ui/AudioPlayer';
import { AuthGateSheet } from './features/auth/AuthGateSheet';
import { CommentsSheet } from './components/comments/CommentsSheet';
import { VerseShareCard } from './components/share/VerseShareCard';
import { StreakConfetti } from './components/celebration/StreakConfetti';

export default function App() {
  const { initialize: initAuth, isAdmin, user } = useAuthStore();
  const { activeTab, setActiveTab, theme } = useUIStore();
  const { devotionals, initializeDevotionals } = useDevotionalStore();
  const { initializeJournal } = useJournalStore();
  const { initializeBookmarks } = useBookmarkStore();

  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(
    devotionals[0] || null
  );
  const [previousTab, setPreviousTab] = useState<'home' | 'devotionals' | 'journal' | 'profile' | 'admin'>('home');

  useEffect(() => {
    initAuth();
    initializeDevotionals();
  }, [initAuth, initializeDevotionals]);

  // When user is authenticated (anonymous or Google), connect user subcollections
  useEffect(() => {
    if (user?.uid) {
      initializeJournal(user.uid);
      initializeBookmarks(user.uid);
    }
  }, [user?.uid, initializeJournal, initializeBookmarks]);

  // Apply dark mode class to HTML root element based on user theme
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('theme-sepia');
    } else if (theme === 'sepia') {
      root.classList.remove('dark');
      root.classList.add('theme-sepia');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.remove('theme-sepia');
    } else {
      // system
      root.classList.remove('theme-sepia');
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleOpenDevotional = (devotional: Devotional) => {
    if (activeTab !== 'reader') {
      setPreviousTab(activeTab as any);
    }
    setSelectedDevotional(devotional);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromReader = () => {
    setActiveTab(previousTab);
  };

  const isSepia = theme === 'sepia';
  const isDark = theme === 'dark';

  const containerBg = isSepia
    ? 'bg-[#F4ECD8] text-[#5B4636]'
    : isDark
    ? 'bg-black text-[#EDEDED]'
    : 'bg-[#F8F9FA] text-neutral-900';

  const navBg = isSepia
    ? 'bg-[#EFE6D0]/95 border-[#DFD1B5] text-[#5B4636]'
    : isDark
    ? 'bg-black/95 border-neutral-900 text-white'
    : 'bg-white/95 border-neutral-200 text-neutral-900';

  return (
    <div
      id="app-root"
      className={`min-h-screen flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white ${containerBg}`}
    >
      {/* Offline Status Slide-down Banner */}
      <OfflineBanner />

      {/* Global Streak Confetti Celebration */}
      <StreakConfetti />

      {/* Persistent Narration Player (Floats above tab bar) */}
      <AudioPlayer />

      {/* Modal & Sheet Overlays */}
      <AuthGateSheet />
      <CommentsSheet />
      <VerseShareCard />

      {/* Desktop Navigation Top Bar (hidden on reader mode) */}
      {activeTab !== 'reader' && (
        <header
          id="desktop-header"
          className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 sm:px-8 py-3 transition-colors ${navBg}`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setActiveTab('home')}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-display-scripture font-bold text-sm shadow-md">
                M
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase font-display-scripture block leading-none">
                  MDMI DEVOTIONALS
                </span>
                <span className="text-sm font-extrabold font-display-scripture text-neutral-900 dark:text-white leading-tight">
                  The Master's Discipleship
                </span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'home', label: 'Today', icon: Home },
                { id: 'devotionals', label: 'Library', icon: BookOpen },
                { id: 'journal', label: 'Journal', icon: PenTool },
                { id: 'profile', label: 'Profile & Walk', icon: User },
                ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    id={`desktop-nav-${id}`}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </header>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'reader' && selectedDevotional ? (
          <DevotionalReader
            devotional={selectedDevotional}
            onBack={handleBackFromReader}
          />
        ) : activeTab === 'home' ? (
          <HomeTab onSelectDevotional={handleOpenDevotional} />
        ) : activeTab === 'devotionals' ? (
          <DevotionalsTab onSelectDevotional={handleOpenDevotional} />
        ) : activeTab === 'journal' ? (
          <JournalTab />
        ) : activeTab === 'profile' ? (
          <ProfileTab onSelectDevotional={handleOpenDevotional} />
        ) : activeTab === 'admin' ? (
          <AdminTab />
        ) : null}
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden when in Reader view to maximize reading immersion) */}
      {activeTab !== 'reader' && (
        <nav
          id="mobile-bottom-nav"
          aria-label="Mobile Navigation"
          className={`md:hidden fixed bottom-0 inset-x-0 z-30 border-t backdrop-blur-xl px-2 py-1.5 transition-colors ${navBg}`}
        >
          <div className="flex items-center justify-around max-w-md mx-auto">
            {[
              { id: 'home', label: 'Today', icon: Home },
              { id: 'devotionals', label: 'Library', icon: BookOpen },
              { id: 'journal', label: 'Journal', icon: PenTool },
              { id: 'profile', label: 'Profile', icon: User },
              ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  id={`mobile-tab-${id}`}
                  onClick={() => setActiveTab(id as any)}
                  aria-label={label}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  <span className="text-[10px] mt-0.5">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
