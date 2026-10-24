import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  BookOpen,
  BookHeart,
  User,
  ShieldCheck,
  Flame,
  Search,
} from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import { useDevotionalStore } from './store/useDevotionalStore';
import { useJournalStore } from './store/useJournalStore';
import { useBookmarkStore } from './store/useBookmarkStore';
import { Devotional, TabType } from './types';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { scheduleNativeDailyReminder, initPushNotifications, ensureNotificationChannels } from './services/notificationService';

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
import { AudioErrorBoundary } from './components/common/AudioErrorBoundary';
import { AuthGateSheet } from './features/auth/AuthGateSheet';
import { CommentsSheet } from './components/comments/CommentsSheet';
import { VerseShareCard } from './components/share/VerseShareCard';
import { VoiceSelectorModal } from './components/ui/VoiceSelectorModal';
import { StreakConfetti } from './components/celebration/StreakConfetti';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { NotificationDeliveryTroubleshooterModal } from './components/notifications/NotificationDeliveryTroubleshooterModal';
import { DiagnosticLogsModal } from './components/debug/DiagnosticLogsModal';
import { NotificationsScreen } from './components/notifications/NotificationsScreen';
import { IntroLoadingScreen } from './components/onboarding/IntroLoadingScreen';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { MdmiLogo } from './components/ui/MdmiLogo';
import { AnimatedNavFramer, NavItem } from './components/animated-nav-framer';
import { CodeherenceHeader } from './components/header/CodeherenceHeader';
import { AboutTab } from './tabs/AboutTab';
import { useNotificationStore } from './store/useNotificationStore';
import { useLayoutStore } from './store/useLayoutStore';

export default function App() {
  const { initialize: initAuth, isAdmin, user } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    theme,
    introSplashOpen,
    openIntroSplash,
    closeIntroSplash,
    onboardingOpen,
    openOnboarding,
    closeOnboarding,
    diagnosticLogsOpen,
    closeDiagnosticLogs,
  } = useUIStore();
  const { devotionals, initializeDevotionals, activeDevotionalId, setActiveDevotionalId } = useDevotionalStore();
  const { initializeJournal } = useJournalStore();
  const { initializeBookmarks } = useBookmarkStore();
  const { initializeNotifications } = useNotificationStore();
  const { initialize: initializeLayout } = useLayoutStore();

  const selectedDevotional = useMemo(() => {
    if (activeDevotionalId) {
      const found = devotionals.find((d) => d.id === activeDevotionalId);
      if (found) return found;
    }
    return devotionals[0] || null;
  }, [devotionals, activeDevotionalId]);

  const [previousTab, setPreviousTab] = useState<TabType>('home');

  // First-launch opening flow & deep link routing for notifications
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      // Deep link to devotional reader or notification screen
      if (urlParams.has('devotionalId')) {
        const dId = urlParams.get('devotionalId')!;
        setActiveDevotionalId(dId);
        setActiveTab('reader');
      } else if (urlParams.has('notificationId')) {
        const nId = urlParams.get('notificationId')!;
        useNotificationStore.getState().openNotificationDetail(nId);
        setActiveTab('notifications');
      }

      if (urlParams.has('onboarding') || urlParams.has('welcome')) {
        openOnboarding();
        return;
      }

      const completedOnboarding = localStorage.getItem('mdmi_onboarding_completed');
      if (!completedOnboarding) {
        openOnboarding();
      } else {
        const seenIntro = localStorage.getItem('mdmi_has_seen_intro');
        if (!seenIntro) {
          localStorage.setItem('mdmi_has_seen_intro', 'true');
          openIntroSplash();
        }
      }
    } catch {
      // ignore
    }
  }, [openIntroSplash, openOnboarding, setActiveDevotionalId, setActiveTab]);

  const handleFinishIntro = () => {
    closeIntroSplash();
    try {
      const completedOnboarding = localStorage.getItem('mdmi_onboarding_completed');
      if (!completedOnboarding) {
        openOnboarding();
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    initAuth();
    initializeDevotionals();
    initializeLayout();
    const unsubNotifs = initializeNotifications();
    ensureNotificationChannels().catch(() => {});

    let actionListener: any = null;
    let appStateListener: any = null;

    // 1. Native Android notification click handler: Routes user directly to that specific notification/devotional
    try {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const extra = action.notification?.extra || {};
        const devotionalId = extra.devotionalId;
        const notifId = extra.notificationId || extra.id;

        if (devotionalId) {
          setActiveDevotionalId(devotionalId);
          setActiveTab('reader');
        } else if (notifId) {
          const found = useNotificationStore.getState().notifications.find((n) => n.id === notifId);
          if (found) {
            useNotificationStore.getState().openNotificationDetail(found);
          } else {
            useNotificationStore.getState().openNotificationDetail({
              id: notifId,
              title: action.notification.title || 'Ministry Broadcast',
              body: action.notification.body || '',
              type: extra.type || 'broadcast',
              createdAt: new Date().toISOString(),
              read: true,
              createdBy: extra.createdBy || 'Ministry Overseer',
            });
          }
          setActiveTab('notifications');
        } else {
          setActiveTab('notifications');
        }
      }).then((handle) => {
        actionListener = handle;
      }).catch(() => {});

      // 2. Rigorous background & minimized lifecycle management:
      // When app resumes from background or screen is unlocked, catch up on broadcasts immediately
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          useNotificationStore.getState().checkAndSyncPermissions().catch(() => {});
          useNotificationStore.getState().retryPendingDeliveries().catch(() => {});
        }
      }).then((handle) => {
        appStateListener = handle;
      }).catch(() => {});

      // Daily morning offline alarm check via Capacitor LocalNotifications
      LocalNotifications.checkPermissions().then((status) => {
        if (status.display !== 'granted') {
          LocalNotifications.requestPermissions().then((res) => {
            if (res.display === 'granted') {
              const savedTime = localStorage.getItem('mdmi_notification_reminder_time') || '07:00';
              scheduleNativeDailyReminder(savedTime).catch(() => {});
            }
          }).catch(() => {});
        } else {
          const savedTime = localStorage.getItem('mdmi_notification_reminder_time') || '07:00';
          scheduleNativeDailyReminder(savedTime).catch(() => {});
        }
      }).catch(() => {});

      // 3. Native Firebase Push Notifications (FCM) for instant closed-app broadcasts
      initPushNotifications((data) => {
        const devotionalId = data?.devotionalId;
        const notifId = data?.notificationId || data?.id;

        if (devotionalId) {
          setActiveDevotionalId(devotionalId);
          setActiveTab('reader');
        } else if (notifId) {
          useNotificationStore.getState().openNotificationDetail(notifId);
          setActiveTab('notifications');
        } else {
          setActiveTab('notifications');
        }
      }).catch(() => {});
    } catch {
      // ignore
    }

    // 3. Web browser postMessage notification click listener
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MDMI_NOTIFICATION_CLICKED' && event.data.data) {
        const data = event.data.data;
        if (data.devotionalId) {
          setActiveDevotionalId(data.devotionalId);
          setActiveTab('reader');
        } else if (data.notificationId || data.id) {
          useNotificationStore.getState().openNotificationDetail(data.notificationId || data.id);
          setActiveTab('notifications');
        } else {
          setActiveTab('notifications');
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleWindowMessage);
    }

    return () => {
      unsubNotifs?.();
      actionListener?.remove?.();
      appStateListener?.remove?.();
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleWindowMessage);
      }
    };
  }, [initAuth, initializeDevotionals, initializeLayout, initializeNotifications, setActiveDevotionalId, setActiveTab]);

  // Native Android Hardware / Gesture Back Button Handling
  useEffect(() => {
    let backListener: any = null;

    try {
      CapApp.addListener('backButton', () => {
        const {
          voiceSelectorOpen,
          closeVoiceSelector,
          onboardingOpen,
          closeOnboarding,
          introSplashOpen,
          closeIntroSplash,
          activeTab,
          setActiveTab,
        } = useUIStore.getState();

        const { activeDevotionalId, setActiveDevotionalId } = useDevotionalStore.getState();

        // 1. If reading a devotional, close reader and return to devotional list
        if (activeDevotionalId) {
          setActiveDevotionalId(null);
          return;
        }

        // 2. If modal is open, close it
        if (voiceSelectorOpen) {
          closeVoiceSelector();
          return;
        }
        if (onboardingOpen) {
          closeOnboarding();
          return;
        }
        if (introSplashOpen) {
          closeIntroSplash();
          return;
        }

        // 3. If on a sub-tab (library, journal, profile, admin), navigate back to Home
        if (activeTab !== 'home') {
          setActiveTab('home');
          return;
        }

        // 4. If already at Home root with nothing open, exit/minimize app cleanly
        CapApp.exitApp();
      }).then((handle) => {
        backListener = handle;
      }).catch(() => {});
    } catch {
      // Not on native device
    }

    return () => {
      backListener?.remove?.();
    };
  }, []);

  // Connect user subcollections when authenticated
  useEffect(() => {
    if (user?.uid) {
      initializeJournal(user.uid);
      initializeBookmarks(user.uid);
    }
  }, [user?.uid, initializeJournal, initializeBookmarks]);

  // Guard admin tab from unauthorized access
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, isAdmin, setActiveTab]);

  // Keep DOM theme class in sync with Zustand UI state
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleOpenDevotional = (devotional: Devotional) => {
    if (activeTab !== 'reader') {
      setPreviousTab(activeTab as any);
    }
    setActiveDevotionalId(devotional.id);
    setActiveTab('reader');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackFromReader = () => {
    setActiveTab(previousTab);
  };

  const isDark = theme === 'dark';

  const containerBg = isDark
    ? 'bg-neutral-950 text-[#EDEDED]'
    : 'bg-[#F8F9FA] text-neutral-900';

  const navBg = isDark
    ? 'bg-neutral-950/95 border-neutral-800'
    : 'bg-white/95 border-neutral-200';

  const tabs = [
    { id: 'home', label: 'Today', icon: Compass },
    { id: 'devotionals', label: 'Library', icon: BookOpen },
    { id: 'journal', label: 'Journal', icon: BookHeart },
    { id: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  const framerNavItems: NavItem[] = tabs.map(({ id, label, icon: Icon }) => ({
    id,
    name: label,
    icon: Icon,
    active: activeTab === id,
    onClick: () => setActiveTab(id as any),
  }));

  return (
    <div
      className={`min-h-screen ${containerBg} flex flex-col font-sans transition-colors duration-200 selection:bg-[#84CC16]/25 selection:text-[#4D7C0F] dark:selection:text-[#A3E635]`}
    >
      {/* Offline Status Slide-down Banner */}
      <OfflineBanner />

      {/* Global Streak Confetti Celebration */}
      <StreakConfetti />

      {/* Persistent Narration Player (Audio engine active across all tabs including devotional reader) */}
      <AudioErrorBoundary>
        <AudioPlayer />
      </AudioErrorBoundary>

      {/* Intro Loading Screen & Craft Onboarding Tour */}
      <IntroLoadingScreen isOpen={introSplashOpen} onFinish={handleFinishIntro} />
      <OnboardingModal isOpen={onboardingOpen} onClose={closeOnboarding} />

      {/* Modal & Sheet Overlays */}
      <AuthGateSheet />
      <CommentsSheet />
      <VerseShareCard />
      <VoiceSelectorModal />
      <NotificationDrawer />
      <NotificationDeliveryTroubleshooterModal />
      <DiagnosticLogsModal isOpen={diagnosticLogsOpen} onClose={closeDiagnosticLogs} />

      {/* App Header (Primary tabs only; reader has its own dedicated header) */}
      {activeTab !== 'reader' && (
        <CodeherenceHeader
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28">
        <AnimatePresence mode="wait">
          {activeTab === 'reader' && selectedDevotional ? (
            <motion.div
              key={`reader-${selectedDevotional.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <DevotionalReader
                devotional={selectedDevotional}
                onBack={handleBackFromReader}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {activeTab === 'home' ? (
                <HomeTab onSelectDevotional={handleOpenDevotional} />
              ) : activeTab === 'devotionals' ? (
                <DevotionalsTab onSelectDevotional={handleOpenDevotional} />
              ) : activeTab === 'journal' ? (
                <JournalTab />
              ) : activeTab === 'profile' ? (
                <ProfileTab onSelectDevotional={handleOpenDevotional} />
              ) : activeTab === 'admin' ? (
                <AdminTab />
              ) : activeTab === 'about' ? (
                <AboutTab
                  onBack={() => setActiveTab('profile')}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              ) : activeTab === 'notifications' ? (
                <NotificationsScreen />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Animated Framer Bottom Dock Navigation Bar */}
      {activeTab !== 'reader' && (
        <AnimatedNavFramer
          items={framerNavItems}
          position="bottom"
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as TabType)}
        />
      )}
    </div>
  );
}
