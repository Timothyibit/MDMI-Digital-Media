"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent, type Variants } from "framer-motion";
import { Navigation, Menu, ChevronDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  href?: string;
  id?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  active?: boolean;
  badge?: string | number;
  onClick?: (e: React.MouseEvent) => void;
}

const defaultNavItems: NavItem[] = [
  { name: "Today", href: "#today", id: "home" },
  { name: "Library", href: "#library", id: "devotionals" },
  { name: "Journal", href: "#journal", id: "journal" },
  { name: "Profile", href: "#profile", id: "profile" },
];

const EXPAND_SCROLL_DELTA = 35; // Sensitive scroll-up detection to restore navbar quickly

const containerVariants: Variants = {
  expanded: {
    y: 0,
    opacity: 1,
    transition: {
      y: { type: "spring", damping: 20, stiffness: 280 },
      opacity: { duration: 0.25 },
      type: "spring",
      damping: 22,
      stiffness: 320,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  collapsed: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 320,
      when: "afterChildren",
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const logoVariants: Variants = {
  expanded: { opacity: 1, x: 0, rotate: 0, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -20, rotate: -90, transition: { duration: 0.2 } },
};

const itemVariants: Variants = {
  expanded: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -15, scale: 0.9, transition: { duration: 0.15 } },
};

const collapsedIconVariants: Variants = {
  expanded: { opacity: 0, scale: 0.7, pointerEvents: "none", transition: { duration: 0.15 } },
  collapsed: {
    opacity: 1,
    scale: 1,
    pointerEvents: "auto",
    transition: {
      type: "spring",
      damping: 16,
      stiffness: 320,
      delay: 0.1,
    },
  },
};

export interface AnimatedNavFramerProps {
  items?: NavItem[];
  position?: "top" | "bottom";
  className?: string;
  logo?: React.ReactNode;
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function AnimatedNavFramer({
  items = defaultNavItems,
  position = "top",
  className,
  logo,
  activeId,
  onSelect,
}: AnimatedNavFramerProps) {
  const [isExpanded, setExpanded] = React.useState(true);

  const { scrollY } = useScroll();
  const lastScrollY = React.useRef(0);
  const scrollPositionOnCollapse = React.useRef(0);

  // Motion value listener from Framer Motion (window scroll)
  useMotionValueEvent(scrollY, "change", (latest) => {
    handleScrollDelta(latest);
  });

  // Listen for container/window scroll events across all viewports & touch surfaces
  const handleScrollDelta = React.useCallback(
    (latest: number) => {
      const previous = lastScrollY.current;

      // Automatically re-expand whenever near top of the page
      if (!isExpanded && latest < 60) {
        setExpanded(true);
        lastScrollY.current = latest;
        return;
      }

      // Scrolling down past 100px -> auto-retract to clear view
      if (isExpanded && latest > previous && latest > 100 && latest - previous > 15) {
        setExpanded(false);
        scrollPositionOnCollapse.current = latest;
      } else if (
        !isExpanded &&
        latest < previous &&
        scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_DELTA
      ) {
        // Scrolling up -> re-expand smoothly
        setExpanded(true);
      }

      lastScrollY.current = latest;
    },
    [isExpanded]
  );

  React.useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let scrollPos = 0;
      if (target === document || target === document.documentElement) {
        scrollPos = window.scrollY || document.documentElement.scrollTop;
      } else if (target instanceof HTMLElement) {
        scrollPos = target.scrollTop;
      }
      handleScrollDelta(scrollPos);
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [handleScrollDelta]);

  // Find the active item to display in the collapsed state pill
  const activeItem = React.useMemo(() => {
    return items.find((item) => {
      return activeId
        ? activeId === item.id || activeId === item.name.toLowerCase()
        : item.active;
    }) || items[0];
  }, [items, activeId]);

  const ActiveIcon = activeItem?.icon || Menu;

  const handlePillClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault();
      e.stopPropagation();
      setExpanded(true);
    }
  };

  const handleToggleRetract = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const isTop = position === "top";

  return (
    <div
      aria-label="Navigation Container"
      className={cn(
        // CRITICAL: pointer-events-none on outer wrapper ensures full click-through everywhere around the pill
        "fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none flex justify-center w-full max-w-[calc(100vw-1rem)] sm:max-w-max px-1",
        isTop ? "top-3 sm:top-5" : "bottom-2 sm:bottom-5 pb-[max(env(safe-area-inset-bottom),0.25rem)]",
        className
      )}
    >
      <motion.nav
        initial={{ y: isTop ? -80 : 80, opacity: 0 }}
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={containerVariants}
        whileHover={!isExpanded ? { scale: 1.08 } : {}}
        whileTap={!isExpanded ? { scale: 0.94 } : {}}
        onClick={handlePillClick}
        role="navigation"
        aria-label={isExpanded ? "Navigation Bar" : "Expand Navigation Menu"}
        title={isExpanded ? undefined : "Tap to expand navigation menu"}
        className={cn(
          "pointer-events-auto relative flex items-center overflow-hidden rounded-full border border-neutral-300/80 dark:border-neutral-700/80 bg-white/95 dark:bg-neutral-900/95 shadow-[0_10px_35px_rgba(0,0,0,0.18)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.65)] backdrop-blur-md select-none transition-all duration-200",
          isExpanded
            ? "w-[94%] max-w-md sm:w-auto h-14 sm:h-12 justify-around sm:justify-center px-2 sm:px-3"
            : "cursor-pointer justify-center w-12 h-12 ring-2 ring-[#84CC16]/40 hover:ring-[#84CC16]/70"
        )}
      >
        {/* Brand Icon (shown on desktop or when isTop; hidden on bottom mobile dock to maximize tab space) */}
        <motion.div
          variants={logoVariants}
          className={cn(
            "flex-shrink-0 items-center font-semibold pl-2 pr-1",
            isTop ? "flex" : "hidden sm:flex"
          )}
        >
          {logo || <Navigation className="h-5 w-5 text-[#65A30D] dark:text-[#84CC16]" />}
        </motion.div>

        {/* Navigation Items (smoothly animated with stagger children) */}
        <motion.div
          className={cn(
            "flex items-center justify-around sm:justify-start gap-1 sm:gap-1.5 w-full min-w-0 pr-0.5",
            !isExpanded && "pointer-events-none"
          )}
        >
          {items.map((item) => {
            const isActive = activeId
              ? activeId === item.id || activeId === item.name.toLowerCase()
              : item.active;
            const ItemIcon = item.icon;

            return (
              <motion.button
                key={item.id || item.name}
                type="button"
                variants={itemVariants}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick?.(e);
                  if (item.id && onSelect) {
                    onSelect(item.id);
                  }
                }}
                aria-label={item.name}
                title={item.name}
                className={cn(
                  "relative flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-xs font-semibold rounded-2xl sm:rounded-full px-2 sm:px-3.5 py-1 sm:py-1.5 transition-all duration-200 min-h-[44px] cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-[#84CC16] to-[#65A30D] text-white shadow-sm font-bold active:scale-95"
                    : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-[#84CC16]/10 active:scale-95"
                )}
              >
                {ItemIcon && (
                  <ItemIcon
                    className={cn(
                      "w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0 transition-transform",
                      isActive ? "text-white scale-105" : "text-neutral-500 dark:text-neutral-400"
                    )}
                  />
                )}
                {/* Visible on mobile and desktop */}
                <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap leading-none tracking-tight">
                  {item.name}
                </span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "ml-0.5 px-1.5 py-0.2 text-[9px] font-black rounded-full leading-none",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#DC2626] text-white"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}

          {/* Quick Manual Retract Button (Tap to collapse navbar instantly to read/click freely) */}
          {isExpanded && (
            <motion.button
              type="button"
              variants={itemVariants}
              onClick={handleToggleRetract}
              aria-label="Minimize navigation"
              title="Minimize navigation"
              className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 ml-0.5 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>

        {/* Collapsed Pill State: Active tab icon with pulse dot + menu indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            variants={collapsedIconVariants}
            animate={isExpanded ? "expanded" : "collapsed"}
            className="flex items-center justify-center relative w-full h-full text-[#65A30D] dark:text-[#84CC16]"
          >
            <ActiveIcon className="w-5 h-5" />
            {/* Ambient active indicator dot in Cross Red */}
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#DC2626] ring-2 ring-white dark:ring-neutral-900 shadow-xs" />
          </motion.div>
        </div>
      </motion.nav>
    </div>
  );
}

export default AnimatedNavFramer;
