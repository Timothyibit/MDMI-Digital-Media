import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { MdmiLogo } from '../ui/MdmiLogo';

interface IntroLoadingScreenProps {
  isOpen: boolean;
  onFinish: () => void;
}

export const IntroLoadingScreen: React.FC<IntroLoadingScreenProps> = ({ isOpen, onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('Opening the sanctuary...');

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onFinish();
          }, 350);
          return 100;
        }
        const next = prev + 5;
        if (next > 70) {
          setPhaseText("Preparing today's devotional bread...");
        } else if (next > 35) {
          setPhaseText('Connecting to fellowship records...');
        }
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [isOpen, onFinish]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="intro-loading-splash"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-neutral-950 text-white overflow-hidden select-none"
      >
        {/* Sacred ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5E72E4]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar with Skip button */}
        <div className="w-full max-w-md flex items-center justify-between z-10 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">
              MDMI Devotionals
            </span>
          </div>
          <button
            id="skip-intro-btn"
            onClick={onFinish}
            className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1"
          >
            <span>Skip</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Centerpiece: Logo with pulse & scripture */}
        <div className="flex flex-col items-center text-center max-w-sm z-10 my-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="relative mb-6"
          >
            <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#5E72E4] to-amber-400 opacity-25 blur-lg animate-pulse" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900 border border-white/15 shadow-2xl flex items-center justify-center p-3">
              <MdmiLogo size={58} />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#84CC16] block mb-1">
              Discipling to Serve
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display-scripture tracking-tight text-white">
              The Master's Discipleship Ministries
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 font-serif-reading italic leading-relaxed px-2">
              “Let the word of Christ dwell in you richly in all wisdom, teaching and admonishing one another.”
            </p>
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest block mt-1">
              — Colossians 3:16
            </span>
          </motion.div>
        </div>

        {/* Bottom progress bar & status */}
        <div className="w-full max-w-md z-10 pb-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {phaseText}
            </span>
            <span className="font-mono text-[11px] font-bold text-neutral-300">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#5E72E4] via-blue-400 to-amber-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.1 }}
            />
          </div>

          <button
            onClick={onFinish}
            className="w-full text-center mt-3 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Tap anywhere or click to enter immediately
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
