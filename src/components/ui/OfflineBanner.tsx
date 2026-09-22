import React, { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '../../store/useUIStore';

export const OfflineBanner: React.FC = () => {
  const { isOffline, setIsOffline } = useUIStore();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.aside
          id="offline-banner"
          aria-label="Offline Mode Notification"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-md"
        >
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>You are currently offline. Viewing cached devotionals from offline storage.</span>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
