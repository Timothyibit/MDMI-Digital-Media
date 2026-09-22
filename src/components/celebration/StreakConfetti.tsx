import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, X, Award } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  vx: number;
  vy: number;
}

const COLORS = ['#F59E0B', '#E11D48', '#3B82F6', '#10B981', '#8B5CF6', '#FBBF24'];

export const StreakConfetti: React.FC = () => {
  const { confettiMilestone, dismissConfetti, reducedMotion } = useUIStore();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!confettiMilestone) return;

    // Trigger haptic feedback if supported on mobile web
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 150]);
      } catch {
        // vibration not allowed
      }
    }

    if (reducedMotion) return;

    // Generate confetti particles
    const generated: Particle[] = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 360,
      y: (Math.random() - 0.5) * 360 - 50,
      color: COLORS[i % COLORS.length],
      size: Math.random() * 8 + 6,
      rotation: Math.random() * 360,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -12 - 4,
    }));
    setParticles(generated);

    const timer = setTimeout(() => {
      dismissConfetti();
    }, 5500);

    return () => clearTimeout(timer);
  }, [confettiMilestone, dismissConfetti, reducedMotion]);

  if (!confettiMilestone) return null;

  const getMilestoneTitle = (days: number) => {
    if (days >= 100) return '100-Day Crown of Faith';
    if (days >= 30) return '30-Day Pillar of Discipleship';
    return '7-Day Flame of Dedication';
  };

  const getMilestoneDescription = (days: number) => {
    if (days >= 100) return 'You have walked closely with the Master for one hundred days. A monumental testimony of daily devotion!';
    if (days >= 30) return 'One full month of seeking God’s Word daily. Your spiritual foundation is deepening in Christ.';
    return 'One full week of uninterrupted daily devotion. Keep stoking the spiritual fire!';
  };

  return (
    <AnimatePresence>
      <motion.div
        id="streak-milestone-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        {/* Confetti Particles */}
        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: [0, p.y, p.y + 400],
                  scale: [0, 1.2, 0.8, 0],
                  rotate: [0, p.rotation, p.rotation * 2],
                  opacity: [0, 1, 0.9, 0],
                }}
                transition={{ duration: 3.2, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size * (p.id % 2 === 0 ? 1 : 1.6),
                  backgroundColor: p.color,
                  borderRadius: p.id % 3 === 0 ? '50%' : '2px',
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-sm w-full bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 text-center text-white shadow-2xl overflow-hidden"
        >
          {/* Subtle glowing halo */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <button
            id="dismiss-confetti-btn"
            onClick={dismissConfetti}
            className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close milestone celebration"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
            {confettiMilestone >= 100 ? (
              <Award className="w-8 h-8 text-neutral-950" />
            ) : (
              <Flame className="w-8 h-8 text-neutral-950 animate-bounce" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Milestone Achieved</span>
          </div>

          <h3 className="text-2xl font-bold font-display-scripture text-amber-100 tracking-wide">
            {confettiMilestone} Days
          </h3>

          <h4 className="text-sm font-semibold text-amber-300 mt-1">
            {getMilestoneTitle(confettiMilestone)}
          </h4>

          <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed">
            {getMilestoneDescription(confettiMilestone)}
          </p>

          <button
            id="continue-streak-btn"
            onClick={dismissConfetti}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm tracking-wide shadow-md transition-all active:scale-95"
          >
            Praise God & Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
