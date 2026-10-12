// components/ui/card-8.tsx
import * as React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { MotionButton } from "@/components/ui/motion-button";

// Define the props for the AlertCard component
export interface AlertCardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
  > {
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  isVisible?: boolean;
  onDismiss?: () => void;
  variant?:
    | "ministry-green"
    | "ministry-red"
    | "ministry-dark"
    | "destructive"
    | "primary"
    | "indigo"
    | "amber"
    | "emerald"
    | "secondary"
    | "default"
    | "light-emerald"
    | "light-amber"
    | "light-rose";
  badge?: string;
}

const variantStyles: Record<
  string,
  {
    container: string;
    text: string;
    description: string;
    button: string;
    iconBg: string;
  }
> = {
  // Darker rich forest green gradient for pure white text (WCAG AAA)
  "ministry-green": {
    container:
      "bg-gradient-to-br from-[#092B15] via-[#0F4222] to-[#04170A] text-white shadow-[0_15px_35px_rgba(4,23,10,0.45)] border border-emerald-500/40",
    text: "text-white font-extrabold",
    description: "text-emerald-100/95 font-medium",
    button:
      "bg-white text-[#092B15] hover:bg-neutral-100 shadow-xl active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white shadow-inner ring-1 ring-white/25",
  },
  // Darker rich crimson gradient for pure white text (WCAG AAA)
  "ministry-red": {
    container:
      "bg-gradient-to-br from-[#5C0A0A] via-[#751111] to-[#300404] text-white shadow-[0_15px_35px_rgba(48,4,4,0.45)] border border-red-500/40",
    text: "text-white font-extrabold",
    description: "text-rose-100/95 font-medium",
    button:
      "bg-white text-[#5C0A0A] hover:bg-neutral-100 shadow-xl active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white shadow-inner ring-1 ring-white/25",
  },
  // Darker midnight navy gradient for pure white text (WCAG AAA)
  "ministry-dark": {
    container:
      "bg-gradient-to-br from-[#080E1B] via-[#101C33] to-[#04070D] text-white border-2 border-emerald-500/45 shadow-[0_15px_35px_rgba(0,0,0,0.6)]",
    text: "text-white font-extrabold",
    description: "text-slate-200 font-medium",
    button:
      "bg-gradient-to-r from-[#65A30D] to-[#4D7C0F] hover:from-[#76bb12] hover:to-[#548a0a] text-white shadow-xl active:scale-95 font-extrabold",
    iconBg: "bg-emerald-500/20 text-[#84CC16] ring-1 ring-emerald-500/40",
  },
  // Darker bordeaux gradient for pure white text
  destructive: {
    container:
      "bg-gradient-to-br from-[#4C0519] via-[#650822] to-[#2B020D] text-white shadow-2xl border border-rose-500/40",
    text: "text-white font-extrabold",
    description: "text-rose-100/95 font-medium",
    button:
      "bg-white text-[#4C0519] hover:bg-neutral-100 shadow-lg active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white shadow-inner ring-1 ring-white/25",
  },
  // Darker royal indigo gradient for pure white text
  indigo: {
    container:
      "bg-gradient-to-br from-[#120F3A] via-[#1E1754] to-[#08061C] text-white shadow-[0_15px_35px_rgba(8,6,28,0.5)] border border-indigo-400/40",
    text: "text-white font-extrabold",
    description: "text-indigo-100/95 font-medium",
    button:
      "bg-white text-[#120F3A] hover:bg-neutral-100 shadow-xl active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white shadow-inner ring-1 ring-white/25",
  },
  // Darker warm amber gradient for pure white text
  amber: {
    container:
      "bg-gradient-to-br from-[#451A03] via-[#632605] to-[#240D01] text-white shadow-[0_15px_35px_rgba(36,13,1,0.5)] border border-amber-500/40",
    text: "text-white font-extrabold",
    description: "text-amber-100/95 font-medium",
    button:
      "bg-white text-[#451A03] hover:bg-neutral-100 shadow-xl active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white shadow-inner ring-1 ring-white/25",
  },
  // Darker deep emerald gradient for pure white text
  emerald: {
    container:
      "bg-gradient-to-br from-[#04281E] via-[#093D2F] to-[#02140F] text-white shadow-[0_15px_35px_rgba(2,20,15,0.45)] border border-emerald-400/40",
    text: "text-white font-extrabold",
    description: "text-emerald-100/95 font-medium",
    button:
      "bg-white text-[#04281E] hover:bg-neutral-100 shadow-xl active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white shadow-inner ring-1 ring-white/25",
  },
  // Darker discipleship green gradient for pure white text
  primary: {
    container:
      "bg-gradient-to-br from-[#0D381B] via-[#144E26] to-[#061F0F] text-white shadow-[0_15px_35px_rgba(6,31,15,0.45)] border border-emerald-400/40",
    text: "text-white font-extrabold",
    description: "text-emerald-100/95 font-medium",
    button:
      "bg-white text-[#0D381B] hover:bg-neutral-100 shadow-xl active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white shadow-inner ring-1 ring-white/25",
  },
  // Darker obsidian charcoal gradient for pure white text
  secondary: {
    container:
      "bg-gradient-to-br from-[#111318] via-[#1B1E24] to-[#08090C] text-white border-2 border-neutral-700/80 shadow-[0_15px_35px_rgba(0,0,0,0.5)]",
    text: "text-white font-extrabold",
    description: "text-neutral-200 font-medium",
    button:
      "bg-gradient-to-r from-[#65A30D] to-[#4D7C0F] text-white hover:from-[#76bb12] hover:to-[#548a0a] shadow-lg active:scale-95 font-extrabold",
    iconBg: "bg-white/15 text-white ring-1 ring-white/25",
  },
  // Brighter luminous neutral gradient for deep dark text on light theme, darker colors in dark mode
  default: {
    container:
      "bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] text-[#0F172A] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] dark:text-white border-2 border-slate-200/90 dark:border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)]",
    text: "text-[#0F172A] dark:text-white font-extrabold",
    description: "text-[#334155] dark:text-slate-300 font-medium",
    button:
      "bg-gradient-to-r from-[#65A30D] to-[#4D7C0F] text-white hover:from-[#76bb12] hover:to-[#548a0a] shadow-lg active:scale-95 font-extrabold",
    iconBg: "bg-slate-100 text-[#0F172A] dark:bg-slate-800 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700",
  },
  // Brighter luminous emerald gradient for deep dark green text (WCAG AAA)
  "light-emerald": {
    container:
      "bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0] text-[#052E16] border-2 border-emerald-300/80 shadow-[0_15px_35px_rgba(5,46,22,0.08)]",
    text: "text-[#052E16] font-extrabold",
    description: "text-[#14532D] font-medium",
    button:
      "bg-[#052E16] text-white hover:bg-[#094020] shadow-md active:scale-95 font-extrabold",
    iconBg: "bg-emerald-600/15 text-[#052E16] ring-1 ring-emerald-600/25",
  },
  // Brighter warm gold gradient for deep dark amber/brown text (WCAG AAA)
  "light-amber": {
    container:
      "bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] text-[#451A03] border-2 border-amber-300/80 shadow-[0_15px_35px_rgba(69,26,3,0.08)]",
    text: "text-[#451A03] font-extrabold",
    description: "text-[#78350F] font-medium",
    button:
      "bg-[#451A03] text-white hover:bg-[#5C2304] shadow-md active:scale-95 font-extrabold",
    iconBg: "bg-amber-600/15 text-[#451A03] ring-1 ring-amber-600/25",
  },
  // Brighter delicate rose gradient for deep dark crimson text (WCAG AAA)
  "light-rose": {
    container:
      "bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3] text-[#4C0519] border-2 border-rose-300/80 shadow-[0_15px_35px_rgba(76,5,25,0.08)]",
    text: "text-[#4C0519] font-extrabold",
    description: "text-[#881337] font-medium",
    button:
      "bg-[#4C0519] text-white hover:bg-[#630620] shadow-md active:scale-95 font-extrabold",
    iconBg: "bg-rose-600/15 text-[#4C0519] ring-1 ring-rose-600/25",
  },
};

const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  (
    {
      className,
      icon,
      title,
      description,
      buttonText,
      onButtonClick,
      isVisible = true,
      onDismiss,
      variant = "destructive",
      badge,
      ...props
    },
    ref
  ) => {
    // Animation variants for the card container
    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 50, scale: 0.95 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
          staggerChildren: 0.1,
        },
      },
      exit: {
        opacity: 0,
        y: 20,
        scale: 0.98,
        transition: { duration: 0.2 },
      },
    };

    // Animation variants for child elements for a staggered effect
    const itemVariants: Variants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    const currentVariant = variantStyles[variant] || variantStyles.destructive;

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full rounded-[24px] p-6 overflow-hidden transition-all duration-300",
              currentVariant.container,
              className
            )}
            {...props}
          >
            {/* Header: Icon, Badge, and Dismiss Button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <motion.div
                    variants={itemVariants}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 backdrop-blur-md",
                      currentVariant.iconBg
                    )}
                  >
                    {icon}
                  </motion.div>
                )}
                {badge && (
                  <motion.span
                    variants={itemVariants}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-black/25 text-white/95 backdrop-blur-md border border-white/20"
                  >
                    {badge}
                  </motion.span>
                )}
              </div>

              {onDismiss && (
                <motion.button
                  variants={itemVariants}
                  type="button"
                  onClick={onDismiss}
                  className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                  aria-label="Dismiss Alert"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>

            {/* Content Section */}
            <div className="mt-5 space-y-2">
              {/* Title */}
              <motion.h3
                variants={itemVariants}
                className={cn(
                  "text-xl sm:text-2xl font-bold tracking-tight pr-8",
                  currentVariant.text
                )}
              >
                {title}
              </motion.h3>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className={cn(
                  "text-sm max-w-[90%] leading-relaxed",
                  currentVariant.description
                )}
              >
                {description}
              </motion.p>
            </div>

            {/* Action Button */}
            <motion.div variants={itemVariants} className="mt-6">
              <MotionButton
                size="full"
                variant={
                  variant === 'ministry-green' ||
                  variant === 'indigo' ||
                  variant === 'emerald' ||
                  variant === 'primary' ||
                  variant === 'destructive' ||
                  variant === 'ministry-red' ||
                  variant === 'amber' ||
                  variant === 'secondary'
                    ? 'white'
                    : variant === 'ministry-dark'
                    ? 'primary'
                    : variant === 'light-emerald' ||
                      variant === 'light-amber' ||
                      variant === 'light-rose'
                    ? 'dark'
                    : 'primary'
                }
                label={buttonText}
                onPress={onButtonClick}
                onClick={onButtonClick}
                className="w-full shadow-md"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AlertCard.displayName = "AlertCard";

export { AlertCard };
export default AlertCard;
