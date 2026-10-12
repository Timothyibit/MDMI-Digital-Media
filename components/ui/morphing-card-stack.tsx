"use client"

import { useState, type ReactNode } from "react"
import { motion, AnimatePresence, LayoutGroup, type PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"
import { Grid3X3, Layers, LayoutList, Hand } from "lucide-react"

export type LayoutMode = "stack" | "grid" | "list"

export interface CardData {
  id: string
  title: string
  description: string
  icon?: ReactNode
  color?: string
  image?: string
}

export interface MorphingCardStackProps {
  cards?: CardData[]
  className?: string
  defaultLayout?: LayoutMode
  onCardClick?: (card: CardData) => void
  deckTitle?: string
}

const layoutIcons = {
  stack: Layers,
  grid: Grid3X3,
  list: LayoutList,
}

const layoutLabels: Record<LayoutMode, string> = {
  stack: "Deck",
  grid: "Grid",
  list: "List",
}

const SWIPE_THRESHOLD = 40

export function Component({
  cards = [],
  className,
  defaultLayout = "stack",
  onCardClick,
  deckTitle,
}: MorphingCardStackProps) {
  const [layout, setLayout] = useState<LayoutMode>(defaultLayout)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  if (!cards || cards.length === 0) {
    return null
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    const swipe = Math.abs(offset.x) * velocity.x

    if (offset.x < -SWIPE_THRESHOLD || swipe < -800) {
      // Swiped left - go to next card
      setActiveIndex((prev) => (prev + 1) % cards.length)
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 800) {
      // Swiped right - go to previous card
      setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }
    setIsDragging(false)
  }

  const getStackOrder = () => {
    const reordered = []
    for (let i = 0; i < cards.length; i++) {
      const index = (activeIndex + i) % cards.length
      reordered.push({ ...cards[index], stackPosition: i })
    }
    return reordered.reverse() // Reverse so top card renders last (on top)
  }

  const getLayoutStyles = (stackPosition: number) => {
    switch (layout) {
      case "stack":
        return {
          top: stackPosition * 8,
          left: 0,
          right: 0,
          zIndex: cards.length - stackPosition,
          rotate: (stackPosition - 1) * 2.5,
          scale: 1 - stackPosition * 0.04,
          opacity: stackPosition > 3 ? 0 : 1 - stackPosition * 0.12,
        }
      case "grid":
        return {
          top: 0,
          left: 0,
          right: "auto",
          zIndex: 1,
          rotate: 0,
          scale: 1,
          opacity: 1,
        }
      case "list":
        return {
          top: 0,
          left: 0,
          right: "auto",
          zIndex: 1,
          rotate: 0,
          scale: 1,
          opacity: 1,
        }
    }
  }

  const containerStyles = {
    stack: "relative h-72 sm:h-80 w-full max-w-sm sm:max-w-md mx-auto",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full max-w-2xl mx-auto",
    list: "flex flex-col gap-3 sm:gap-3.5 w-full max-w-2xl mx-auto",
  }

  const displayCards = layout === "stack" ? getStackOrder() : cards.map((c, i) => ({ ...c, stackPosition: i }))

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {/* Layout Toggle Bar */}
      <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          <span className="font-bold text-neutral-900 dark:text-white">
            {deckTitle || (layout === "stack" ? "Deck View" : layout === "grid" ? "Grid View" : "List View")}
          </span>
          <span>•</span>
          <span>{cards.length} Cards</span>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-neutral-150 dark:bg-neutral-800/90 p-1 border border-neutral-200 dark:border-neutral-700/80 shadow-xs">
          {(Object.keys(layoutIcons) as LayoutMode[]).map((mode) => {
            const Icon = layoutIcons[mode]
            const isCurrent = layout === mode
            const labelText = layoutLabels[mode] || mode
            return (
              <button
                key={mode}
                onClick={() => setLayout(mode)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  isCurrent
                    ? "bg-white dark:bg-neutral-700 text-[#5E72E4] dark:text-white shadow-xs"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50",
                )}
                aria-label={`Switch to ${labelText} view`}
                title={`Switch to ${labelText} view`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize hidden sm:inline">{labelText}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards Container */}
      <LayoutGroup>
        <motion.div layout className={cn(containerStyles[layout])}>
          <AnimatePresence mode="popLayout">
            {displayCards.map((card) => {
              const styles = getLayoutStyles(card.stackPosition)
              const isExpanded = expandedCard === card.id
              const isTopCard = layout === "stack" && card.stackPosition === 0

              return (
                <motion.div
                  key={card.id}
                  layoutId={card.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{
                    x: 0,
                    ...styles,
                    scale: isExpanded ? 1.03 : styles.scale,
                  }}
                  exit={{ opacity: 0, scale: 0.85, x: -180 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 26,
                  }}
                  drag={isTopCard ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.65}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  whileDrag={{ scale: 1.02, cursor: "grabbing" }}
                  onClick={() => {
                    if (isDragging) return
                    setExpandedCard(isExpanded ? null : card.id)
                    onCardClick?.(card)
                  }}
                  className={cn(
                    "group relative overflow-hidden cursor-pointer rounded-2xl border transition-all duration-200",
                    // High-contrast, theme-fluid foundation: brighter colors for dark text, darker colors for white text
                    "bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border-slate-200/90 dark:border-neutral-800 text-neutral-950 dark:text-white",
                    "hover:border-[#5E72E4]/60 dark:hover:border-[#5E72E4]/60",
                    "shadow-sm hover:shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
                    layout === "stack" && "absolute w-[90%] sm:w-[94%] max-w-[380px] min-h-[190px] sm:min-h-[210px] mx-auto p-5 flex flex-col justify-between select-none",
                    layout === "stack" && isTopCard && "cursor-grab active:cursor-grabbing ring-1 ring-neutral-200 dark:ring-neutral-750",
                    layout === "grid" && "w-full min-h-[155px] p-5 flex flex-col justify-between",
                    layout === "list" && "w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                    isExpanded && "ring-2 ring-[#5E72E4] dark:ring-[#5E72E4] shadow-lg",
                  )}
                >
                  {/* Subtle Top Accent Stripe for Theme Fluid Color Accents */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all"
                    style={{ backgroundColor: card.color || "#5E72E4" }}
                  />

                  {/* Related Image / Iconic Background with Scrim */}
                  {card.image ? (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
                      <img
                        src={card.image}
                        alt=""
                        className="w-full h-full object-cover opacity-20 dark:opacity-35 group-hover:scale-105 group-hover:opacity-30 dark:group-hover:opacity-45 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/85 to-white/70 dark:from-[#080E1B]/95 dark:via-[#101C33]/85 dark:to-[#04070D]/75" />
                    </div>
                  ) : (
                    /* Iconic Geometric Watermark & Glow Background */
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0 opacity-15 dark:opacity-25">
                      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="180" cy="20" r="80" stroke={card.color || "#5E72E4"} strokeWidth="1.5" strokeDasharray="4 6" />
                        <circle cx="180" cy="20" r="50" stroke={card.color || "#5E72E4"} strokeWidth="1" />
                        <circle cx="20" cy="180" r="60" stroke={card.color || "#5E72E4"} strokeWidth="1" strokeDasharray="3 5" />
                      </svg>
                    </div>
                  )}

                  {/* Soft Theme-Aware Ambient Glow */}
                  <div
                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20 dark:opacity-30 pointer-events-none z-0"
                    style={{ backgroundColor: card.color || "#5E72E4" }}
                  />

                  <div className={cn("relative z-10 flex gap-3.5", layout === "list" ? "items-center flex-1 min-w-0" : "items-start")}>
                    {card.icon && (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700/70 text-[#5E72E4] dark:text-[#7BDEB2] shadow-xs group-hover:scale-105 transition-transform">
                        {card.icon}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-neutral-950 dark:text-white text-sm sm:text-base tracking-tight truncate">
                          {card.title}
                        </h3>
                        {isExpanded && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E72E4] bg-[#5E72E4]/10 px-1.5 py-0.5 rounded">
                            Expanded
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 mt-1 leading-relaxed font-medium",
                          layout === "stack" && "line-clamp-3",
                          layout === "grid" && "line-clamp-3",
                          layout === "list" && "line-clamp-2",
                        )}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {layout === "stack" && isTopCard && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Hand className="w-3.5 h-3.5 text-[#5E72E4]" />
                        <span>Swipe or tap card</span>
                      </span>
                      <span className="font-mono text-[10px]">
                        Card {activeIndex + 1} of {cards.length}
                      </span>
                    </div>
                  )}

                  {layout === "list" && (
                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] font-bold text-[#5E72E4] hover:underline flex items-center gap-1">
                        <span>Details</span>
                      </span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {/* Stack Navigation Dots */}
      {layout === "stack" && cards.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                index === activeIndex
                  ? "w-6 bg-[#5E72E4] dark:bg-[#7BDEB2]"
                  : "w-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600",
              )}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const MorphingCardStack = Component;
export default Component;
