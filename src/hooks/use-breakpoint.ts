import { useState, useEffect } from "react";

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [isMatch, setIsMatch] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= (breakpoints[breakpoint] || 768);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMatch(window.innerWidth >= (breakpoints[breakpoint] || 768));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMatch;
}
