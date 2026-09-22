import React from 'react';
import { motion } from 'motion/react';
import { useUIStore } from '../../store/useUIStore';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  onClick?: () => void;
  id?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  index = 0,
  onClick,
  id,
}) => {
  const { reducedMotion } = useUIStore();

  return (
    <motion.div
      id={id}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: reducedMotion ? 0 : index * 0.08,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl p-5 md:p-6 transition-all duration-300 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      {/* Subtle top sheen reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};

export const BentoSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-neutral-200/50 dark:bg-neutral-800/50 p-6 ${className}`}
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"
      />
      <div className="space-y-3">
        <div className="h-4 w-1/3 bg-neutral-300/60 dark:bg-neutral-700/60 rounded-md" />
        <div className="h-7 w-3/4 bg-neutral-300/60 dark:bg-neutral-700/60 rounded-lg" />
        <div className="h-4 w-full bg-neutral-300/60 dark:bg-neutral-700/60 rounded-md mt-4" />
        <div className="h-4 w-5/6 bg-neutral-300/60 dark:bg-neutral-700/60 rounded-md" />
      </div>
    </div>
  );
};
