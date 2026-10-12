"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export interface StateIconProps {
  size?: number;
  color?: string;
  className?: string;
  duration?: number;
  /**
   * If provided, controls the state explicitly.
   * If undefined, toggles automatically using the specified duration.
   */
  active?: boolean;
}

export function useAutoToggle(interval: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), interval);
    return () => clearInterval(id);
  }, [interval]);
  return on;
}

/* ─── 1. LOADING → SUCCESS ─── spinner morphs into checkmark */
export function SuccessIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2200,
  active,
}: StateIconProps) {
  const autoDone = useAutoToggle(duration);
  const done = active !== undefined ? active : autoDone;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <motion.circle
        cx="20"
        cy="20"
        r="16"
        stroke={color}
        strokeWidth={2.5}
        animate={
          done
            ? { pathLength: 1, opacity: 1 }
            : { pathLength: 0.7, opacity: 0.4 }
        }
        transition={{ duration: 0.5 }}
      />
      {!done && (
        <motion.circle
          cx="20"
          cy="20"
          r="16"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="25 75"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "20px 20px" }}
        />
      )}
      <motion.path
        d="M12 20l6 6 10-12"
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          done
            ? { pathLength: 1, opacity: 1 }
            : { pathLength: 0, opacity: 0 }
        }
        transition={{ duration: 0.4, delay: done ? 0.15 : 0 }}
      />
    </svg>
  );
}

/* ─── 2. MENU → CLOSE ─── hamburger morphs to X */
export function MenuCloseIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2000,
  active,
}: StateIconProps) {
  const autoOpen = useAutoToggle(duration);
  const open = active !== undefined ? active : autoOpen;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <motion.line
        x1="10"
        x2="30"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        animate={
          open
            ? { y1: 20, y2: 20, rotate: 45 }
            : { y1: 12, y2: 12, rotate: 0 }
        }
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformOrigin: "20px 20px" }}
      />
      <motion.line
        x1="10"
        y1="20"
        x2="30"
        y2="20"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.2 }}
        style={{ transformOrigin: "20px 20px" }}
      />
      <motion.line
        x1="10"
        x2="30"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        animate={
          open
            ? { y1: 20, y2: 20, rotate: -45 }
            : { y1: 28, y2: 28, rotate: 0 }
        }
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformOrigin: "20px 20px" }}
      />
    </svg>
  );
}

/* ─── 3. PLAY → PAUSE ─── */
export function PlayPauseIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2400,
  active,
}: StateIconProps) {
  const autoPlaying = useAutoToggle(duration);
  const playing = active !== undefined ? active : autoPlaying;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <AnimatePresence mode="wait">
        {playing ? (
          <motion.g
            key="pause"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ transformOrigin: "20px 20px" }}
          >
            <rect x="12" y="10" width="5" height="20" rx="1.5" fill={color} />
            <rect x="23" y="10" width="5" height="20" rx="1.5" fill={color} />
          </motion.g>
        ) : (
          <motion.g
            key="play"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ transformOrigin: "20px 20px" }}
          >
            <polygon points="14,10 30,20 14,30" fill={color} />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

/* ─── 4. LOCK → UNLOCK ─── */
export function LockUnlockIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2400,
  active,
}: StateIconProps) {
  const autoLocked = useAutoToggle(duration);
  const locked = active !== undefined ? active : autoLocked;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <rect x="10" y="18" width="20" height="15" rx="3" stroke={color} strokeWidth={2.5} />
      <motion.path
        d="M14 18V12a6 6 0 0 1 12 0v6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        animate={locked ? { y: 0, rotate: 0 } : { y: -4, rotate: -25 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: "14px 18px" }}
      />
    </svg>
  );
}

/* ─── 5. HEART / LIKE TOGGLE ─── */
export function HeartPulseIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2000,
  active,
}: StateIconProps) {
  const autoLiked = useAutoToggle(duration);
  const liked = active !== undefined ? active : autoLiked;

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill={liked ? color : "none"}
      stroke={color}
      strokeWidth={2}
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size }}
      animate={liked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </motion.svg>
  );
}

const AnimatedStateIcons = {
  SuccessIcon,
  MenuCloseIcon,
  PlayPauseIcon,
  LockUnlockIcon,
  HeartPulseIcon,
};

export default AnimatedStateIcons;
