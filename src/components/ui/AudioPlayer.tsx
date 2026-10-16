import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import Card from './music-player-card';

export const AudioPlayer: React.FC = () => {
  const { audioState } = useUIStore();

  if (!audioState.devotionalId) return null;

  return (
    <AnimatePresence>
      <motion.aside
        id="persistent-audio-player"
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-20 lg:bottom-6 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[380px] z-40"
        aria-label="Audio player card"
      >
        <Card showCloseButton={true} />
      </motion.aside>
    </AnimatePresence>
  );
};

export default AudioPlayer;
