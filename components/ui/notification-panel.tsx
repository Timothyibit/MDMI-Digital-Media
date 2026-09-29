"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AtSign,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  FileText,
  Inbox,
  MessageSquare,
  MoreHorizontal,
  PencilLine,
  Settings2,
  Sparkles,
  UserPlus,
  Archive,
  ExternalLink,
  ChevronDown,
  Search,
  X,
  SlidersHorizontal,
  Filter,
  BookOpen,
  Copy,
  Eye,
  Clock,
} from "lucide-react";
import { useNotificationStore } from "../../src/store/useNotificationStore";

/* ==========================================================================
   NotificationPanel

   The list you open when the bell has a dot on it. Everything here follows
   from one observation: a notification is a sentence, and the reason these
   panels turn to soup is that the sentence gets buried under chrome.

   So the row is built around the sentence. The actor's name and the thing
   they touched are the only emphasised words; the verb stays quiet, and the
   time and the place it happened sit underneath in one dim line. The little
   badge on the avatar says what kind of event it was, which is what lets the
   eye skip a whole class of rows without reading any of them.

   Three behaviours earn their place:

   Actions resolve in place. A request row that offers Approve and Deny does
   not vanish when you answer — vanishing is how people lose track of what
   they just did. It settles into a quiet line that says which way you went,
   so the panel still reads as a history.

   Repeats collapse. Six edits to the same file by the same person is one
   row with a count, not six rows; that is the difference between a list you
   scan and a list you abandon.

   Archiving is a move, not a delete. Rows leave the inbox with a spring and
   land in Archived, and the row's menu can send them back.
   ========================================================================== */

const FONT_STACK =
  '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
const SQUIRCLE = "[corner-shape:squircle]";
const EDGE = "ring-1 ring-inset ring-black/[0.12] dark:ring-white/[0.16]";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */

export type NotificationKind =
  | "mention"
  | "comment"
  | "edit"
  | "file"
  | "request"
  | "join"
  | "created"
  | "due";

/** A sentence is plain strings plus the words worth emphasising. */
export type NotificationPiece = string | { entity: string };

export type NotificationAction = {
  id: string;
  label: string;
  tone?: "primary" | "quiet";
  /** What the row says once this action has been taken. */
  resolved?: string;
};

export type NotificationItem = {
  id: string;
  actor: { name: string; avatar?: string };
  kind: NotificationKind;
  /** The sentence after the actor's name. */
  body: NotificationPiece[];
  time: string;
  /** Where it happened — rendered as a dim breadcrumb. */
  context?: string[];
  unread?: boolean;
  archived?: boolean;
  /** Shows in the Following tab. */
  following?: boolean;
  /** Repeats folded into this row, counting this one. */
  count?: number;
  /** An excerpt of the comment that triggered it. */
  quote?: string;
  /** Full text of the notification for complete reading */
  fullBody?: string;
  attachment?: { name: string; size?: string; type?: string };
  actions?: NotificationAction[];
  /** Track which action was taken locally if any */
  resolvedAction?: string;
  /** Custom click handler or link */
  link?: string;
  targetId?: string;
  type?: string;
};

export type NotificationPanelProps = {
  items: NotificationItem[];
  /** Called with the row and the action taken. */
  onAction?: (item: NotificationItem, actionId: string) => void;
  onOpenItem?: (item: NotificationItem) => void;
  onViewFullItem?: (item: NotificationItem) => void;
  onReadChange?: (item: NotificationItem, unread: boolean) => void;
  onArchiveChange?: (item: NotificationItem, archived: boolean) => void;
  onMarkAllRead?: () => void;
  onSettings?: () => void;
  /** Height of the scrolling list. */
  maxHeight?: number;
  className?: string;
};

/* -------------------------------------------------------------------------- */

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  mention: AtSign,
  comment: MessageSquare,
  edit: PencilLine,
  file: FileText,
  request: Sparkles,
  join: UserPlus,
  created: Sparkles,
  due: Calendar,
};

/* Badge tints, kept to the same families the rest of the set uses. */
const KIND_TINT: Record<NotificationKind, string> = {
  mention: "bg-violet-500 text-white",
  comment: "bg-blue-500 text-white",
  edit: "bg-neutral-700 text-white dark:bg-neutral-600",
  file: "bg-teal-500 text-white",
  request: "bg-amber-500 text-white",
  join: "bg-emerald-500 text-white",
  created: "bg-violet-500 text-white",
  due: "bg-rose-500 text-white",
};

const TINTS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function tintFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

function Avatar({ item }: { item: NotificationItem }) {
  const Icon = KIND_ICON[item.kind] || Bell;
  return (
    <span className="relative block h-8 w-8 shrink-0">
      {item.actor.avatar ? (
        <img
          src={item.actor.avatar}
          alt=""
          draggable={false}
          className={cn("h-8 w-8 rounded-full object-cover", EDGE)}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold",
            EDGE,
            tintFor(item.actor.name),
          )}
        >
          {initials(item.actor.name)}
        </span>
      )}
      {/* what kind of event this was, readable without reading the sentence */}
      <span
        aria-hidden
        className={cn(
          "absolute -right-0.5 -bottom-0.5 grid h-[15px] w-[15px] place-items-center rounded-full ring-2 ring-white dark:ring-neutral-900",
          KIND_TINT[item.kind] || "bg-neutral-600 text-white",
        )}
      >
        <Icon className="h-[9px] w-[9px]" />
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */

const MENU_W = 180;
const MENU_GAP = 6;

/**
 * The row menu.
 *
 * It renders in a portal rather than inside the row, because the list
 * scrolls: a menu on the last row would otherwise be cut off by the panel's
 * own overflow.
 */
function RowMenu({
  unread,
  archived,
  onRead,
  onArchive,
  onViewFull,
  onCopy,
}: {
  unread: boolean;
  archived: boolean;
  onRead: () => void;
  onArchive: () => void;
  onViewFull?: () => void;
  onCopy?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [box, setBox] = React.useState({ top: 0, left: 0, above: false });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  /** The scrolling ancestor the trigger lives in, so we can tell when it leaves. */
  const scroller = React.useCallback(() => {
    let el = triggerRef.current?.parentElement ?? null;
    while (el) {
      const o = getComputedStyle(el).overflowY;
      if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight) return el;
      el = el.parentElement;
    }
    return null;
  }, []);

  const place = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      setOpen(false);
      return;
    }
    const r = trigger.getBoundingClientRect();

    const listBox = scroller()?.getBoundingClientRect();
    if (listBox && (r.bottom < listBox.top + 4 || r.top > listBox.bottom - 4)) {
      setOpen(false);
      return;
    }

    const height = menuRef.current?.offsetHeight ?? 80;

    const panel = trigger.closest("[data-notification-panel]")?.getBoundingClientRect();
    const lowest = Math.min(panel?.bottom ?? window.innerHeight, window.innerHeight);
    const spaceBelow = lowest - r.bottom;
    const above = spaceBelow < height + MENU_GAP && r.top > height + MENU_GAP;

    const top = above ? r.top - height - MENU_GAP : r.bottom + MENU_GAP;
    const left = Math.max(8, Math.min(window.innerWidth - MENU_W - 8, r.right - MENU_W));

    setBox({ top, left, above });
  }, [scroller]);

  React.useEffect(() => {
    if (!open) return;
    place();

    const handleDown = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label="More actions"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer",
          open && "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${box.top}px`,
              left: `${box.left}px`,
              width: `${MENU_W}px`,
              fontFamily: FONT_STACK,
              zIndex: 9999,
            }}
            className={cn(
              "rounded-xl bg-white p-1.5 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200",
              EDGE,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {onViewFull && (
              <button
                type="button"
                onClick={() => {
                  onViewFull();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-neutral-800 hover:bg-[#5E72E4]/10 hover:text-[#5E72E4] dark:text-neutral-200 dark:hover:bg-[#5E72E4]/20 dark:hover:text-[#889af7] transition-colors cursor-pointer font-semibold"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#5E72E4] dark:text-[#889af7]" />
                <span>Read full alert</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onRead();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              {unread ? (
                <>
                  <Check className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Mark as read</span>
                </>
              ) : (
                <>
                  <Inbox className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Mark as unread</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onArchive();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Archive className="h-3.5 w-3.5 text-neutral-500" />
              <span>{archived ? "Move to inbox" : "Archive"}</span>
            </button>

            {onCopy && (
              <button
                type="button"
                onClick={() => {
                  onCopy();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors cursor-pointer border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1.5"
              >
                <Copy className="h-3.5 w-3.5 text-neutral-500" />
                <span>Copy text</span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Sentence({
  actor,
  body,
}: {
  actor: { name: string };
  body: NotificationPiece[];
}) {
  return (
    <span className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-snug">
      <strong className="font-semibold text-neutral-950 dark:text-white mr-1">
        {actor.name}
      </strong>
      {body.map((piece, i) => {
        if (typeof piece === "string") {
          return <span key={i}>{piece}</span>;
        }
        return (
          <span
            key={i}
            className="font-medium text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-2"
          >
            {piece.entity}
          </span>
        );
      })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

function NotificationRow({
  item,
  onAction,
  onOpenItem,
  onViewFullItem,
  onReadChange,
  onArchiveChange,
}: {
  item: NotificationItem;
  onAction?: (item: NotificationItem, actionId: string) => void;
  onOpenItem?: (item: NotificationItem) => void;
  onViewFullItem?: (item: NotificationItem) => void;
  onReadChange?: (item: NotificationItem, unread: boolean) => void;
  onArchiveChange?: (item: NotificationItem, archived: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const textContent = item.fullBody || item.quote;
  const isLong = Boolean(textContent && textContent.length > 95);

  const handleViewFull = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onViewFullItem) {
      onViewFullItem(item);
    } else {
      // Direct store integration fallback
      const foundInStore = useNotificationStore
        .getState()
        .notifications.find((n) => n.id === item.id);
      if (foundInStore) {
        useNotificationStore.getState().openNotificationDetail(foundInStore);
      } else {
        useNotificationStore.getState().openNotificationDetail({
          id: item.id,
          title: typeof item.body[1] === 'object' ? item.body[1].entity : item.actor.name,
          body: textContent || item.actor.name,
          type: (item.type as any) || (item.kind === 'file' ? 'devotional' : item.kind === 'request' ? 'prayer' : 'broadcast'),
          read: !item.unread,
          createdAt: new Date().toISOString(),
          createdBy: item.actor.name,
          devotionalId: item.targetId,
        });
      }
    }
  };

  const handleCopyText = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const actor = item.actor.name;
      const title = typeof item.body[1] === 'object' ? item.body[1].entity : '';
      const content = textContent || '';
      const full = `${title ? `${title}\n` : ''}${actor}: ${content}`;
      await navigator.clipboard.writeText(full);
    } catch {
      // ignore
    }
  };

  return (
    <motion.li
      layout="position"
      transition={SPRING}
      onClick={() => onOpenItem?.(item)}
      className={cn(
        "group relative flex items-start gap-3 p-3.5 sm:p-4.5 transition-all duration-200 cursor-pointer border-b border-neutral-200/90 dark:border-neutral-800/90 last:border-b-0",
        item.unread
          ? "bg-[#5E72E4]/[0.05] hover:bg-[#5E72E4]/[0.10] dark:bg-[#5E72E4]/[0.14] dark:hover:bg-[#5E72E4]/[0.22] border-l-4 border-l-[#5E72E4]"
          : "bg-white hover:bg-neutral-50/95 dark:bg-neutral-900 dark:hover:bg-neutral-800/90 border-l-4 border-l-transparent",
      )}
    >
      {/* Unread indicator pip */}
      {item.unread && (
        <span
          aria-hidden
          className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-[#5E72E4] ring-4 ring-[#5E72E4]/25 animate-pulse"
        />
      )}

      {/* Avatar with Kind Badge */}
      <Avatar item={item} />

      {/* Body Content */}
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Sentence actor={item.actor} body={item.body} />
          {item.count && item.count > 1 && (
            <span className="shrink-0 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100">
              ×{item.count}
            </span>
          )}
        </div>

        {/* Full Notification Text & Quote with Read More / Read Less & Read Full Action */}
        {textContent && (
          <div className="my-1 rounded-2xl border-l-3 border-[#5E72E4] bg-neutral-100/70 dark:bg-neutral-800/80 p-3 text-xs text-neutral-800 dark:text-neutral-200 transition-colors shadow-2xs">
            <p
              className={cn(
                "leading-relaxed whitespace-pre-line text-neutral-850 dark:text-neutral-200 font-sans selection:bg-[#5E72E4]/20",
                !isExpanded && isLong && "line-clamp-2"
              )}
            >
              {textContent}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              {isLong && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5E72E4] hover:text-[#4355c7] dark:text-[#889af7] dark:hover:text-[#a5b4fc] transition-colors cursor-pointer"
                >
                  <span>{isExpanded ? "Show less" : "Read more"}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
              )}

              {/* Direct Full Reader button */}
              <button
                type="button"
                onClick={handleViewFull}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white px-2 py-0.5 rounded-lg bg-white/80 dark:bg-neutral-750/80 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer shadow-2xs"
                title="Open full notification card"
              >
                <BookOpen className="h-3 w-3 text-[#5E72E4] dark:text-[#889af7]" />
                <span>Read Full Notification</span>
              </button>
            </div>
          </div>
        )}

        {/* Attachment info */}
        {item.attachment && (
          <div className="my-0.5 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-700 dark:text-neutral-200">
            <FileText className="h-3.5 w-3.5 text-neutral-500" />
            <span className="font-semibold truncate max-w-[200px]">
              {item.attachment.name}
            </span>
            {item.attachment.size && (
              <span className="text-neutral-400">({item.attachment.size})</span>
            )}
          </div>
        )}

        {/* Inline Actions (Approve / Deny / Read / etc.) */}
        {item.actions && item.actions.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {item.resolvedAction ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 py-0.5">
                <Check className="h-3.5 w-3.5" />
                <span>{item.resolvedAction}</span>
              </div>
            ) : (
              item.actions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.(item, act.id);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]",
                    act.tone === "primary"
                      ? "bg-[#5E72E4] text-white hover:bg-[#485ec4] dark:hover:bg-[#6c7fe8]"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700",
                  )}
                >
                  {act.label}
                </button>
              ))
            )}
          </div>
        )}

        {/* Quiet Meta Line: Context Breadcrumb + Relative Time */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
          {item.context && item.context.length > 0 && (
            <>
              <span className="truncate max-w-[200px] font-semibold text-neutral-600 dark:text-neutral-300">
                {item.context.join(" › ")}
              </span>
              <span>•</span>
            </>
          )}
          <span>{item.time}</span>
        </div>
      </div>

      {/* Row Context Menu */}
      <div className="shrink-0 flex items-center">
        <RowMenu
          unread={!!item.unread}
          archived={!!item.archived}
          onRead={() => onReadChange?.(item, !item.unread)}
          onArchive={() => onArchiveChange?.(item, !item.archived)}
          onViewFull={handleViewFull}
          onCopy={handleCopyText}
        />
      </div>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */

export function NotificationPanel({
  items,
  onAction,
  onOpenItem,
  onReadChange,
  onArchiveChange,
  onMarkAllRead,
  onSettings,
  maxHeight = 440,
  className,
}: NotificationPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"inbox" | "unread" | "archived">("inbox");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | "devotional" | "prayer" | "comment" | "announcement">("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const PAGE_SIZE = 5;

  // Reset pagination when switching tabs, category, or search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, categoryFilter, searchQuery]);

  const unreadCount = React.useMemo(
    () => items.filter((i) => !i.archived && i.unread).length,
    [items],
  );

  const filteredItems = React.useMemo(() => {
    let list: NotificationItem[];
    if (activeTab === "unread") {
      list = items.filter((i) => !i.archived && i.unread);
    } else if (activeTab === "archived") {
      list = items.filter((i) => i.archived);
    } else {
      list = items.filter((i) => !i.archived);
    }

    // Category filtering
    if (categoryFilter !== "all") {
      list = list.filter((i) => {
        const itemType = (i.type || i.kind || "").toLowerCase();
        if (categoryFilter === "devotional") return itemType.includes("devotional") || i.kind === "file";
        if (categoryFilter === "prayer") return itemType.includes("prayer") || i.kind === "request";
        if (categoryFilter === "comment") return itemType.includes("comment") || i.kind === "comment";
        if (categoryFilter === "announcement") return itemType.includes("broadcast") || itemType.includes("announcement") || i.kind === "created";
        return true;
      });
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((i) => {
        const actor = (i.actor?.name || "").toLowerCase();
        const text = (i.fullBody || i.quote || "").toLowerCase();
        const bodyPieces = i.body
          .map((b) => (typeof b === "string" ? b : b.entity))
          .join(" ")
          .toLowerCase();
        return actor.includes(q) || text.includes(q) || bodyPieces.includes(q);
      });
    }

    const seen = new Set<string>();
    return list.filter((i, idx) => {
      const key = i?.id || `item-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items, activeTab, categoryFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, safePage]);

  return (
    <div
      data-notification-panel
      style={{ fontFamily: FONT_STACK }}
      className={cn(
        "flex flex-col w-full overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xl transition-colors",
        className,
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-neutral-50/90 dark:bg-neutral-850/80">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#5E72E4] px-2 py-0.5 text-[10px] font-extrabold text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-[#5E72E4] hover:bg-[#5E72E4]/10 dark:hover:bg-[#5E72E4]/20 transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}

          {onSettings && (
            <button
              type="button"
              onClick={onSettings}
              aria-label="Notification Settings"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 px-3 bg-white dark:bg-neutral-900 overflow-x-auto">
        {(
          [
            { id: "inbox", label: "Inbox" },
            {
              id: "unread",
              label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            },
            { id: "archived", label: "Archived" },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative py-2.5 px-3 text-xs font-bold transition-colors cursor-pointer shrink-0",
                isActive
                  ? "text-neutral-950 dark:text-white"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200",
              )}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#5E72E4]"
                  transition={SPRING}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Category Filter Chips */}
      <div className="p-3 border-b border-neutral-150 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-850/40 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search alerts, scripture, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#5E72E4] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          {(
            [
              { id: "all", label: "All Alerts" },
              { id: "devotional", label: "Devotionals" },
              { id: "prayer", label: "Prayers" },
              { id: "announcement", label: "Broadcasts" },
              { id: "comment", label: "Fellowship" },
            ] as const
          ).map((cat) => {
            const isCatActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full font-semibold transition-all shrink-0 cursor-pointer shadow-2xs",
                  isCatActive
                    ? "bg-[#5E72E4] text-white"
                    : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-750",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Notifications List */}
      <div
        style={{ maxHeight: `${maxHeight}px` }}
        className="overflow-y-auto divide-y divide-neutral-150 dark:divide-neutral-800/80 overscroll-contain flex-1"
      >
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 mb-3">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {searchQuery
                ? "No matching alerts found"
                : activeTab === "unread"
                ? "No unread notifications"
                : activeTab === "archived"
                ? "Archived box is empty"
                : "No notifications right now"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mt-1">
              {searchQuery
                ? `No alerts found matching "${searchQuery}". Try different keywords.`
                : activeTab === "unread"
                ? "You're all caught up with your daily devotionals, prayers, and alerts."
                : "Spiritual updates, devotional reminders, and overseer broadcasts will appear here."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 px-3 py-1 text-xs font-bold text-[#5E72E4] bg-[#5E72E4]/10 rounded-lg hover:bg-[#5E72E4]/20 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <ul className="list-none p-0 m-0">
            <AnimatePresence initial={false}>
              {paginatedItems.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onAction={onAction}
                  onOpenItem={onOpenItem}
                  onReadChange={onReadChange}
                  onArchiveChange={onArchiveChange}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Responsive Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-4 py-2.5 bg-neutral-50/80 dark:bg-neutral-850/60 text-xs">
          <span className="text-neutral-500 dark:text-neutral-400 font-medium">
            Page <span className="font-bold text-neutral-800 dark:text-neutral-200">{safePage}</span> of{" "}
            <span className="font-bold text-neutral-800 dark:text-neutral-200">{totalPages}</span>
            <span className="text-[10px] ml-1.5 opacity-75">({filteredItems.length} total)</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={cn(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer",
                safePage <= 1
                  ? "text-neutral-400 dark:text-neutral-600 opacity-50 cursor-not-allowed"
                  : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-750"
              )}
            >
              Prev
            </button>

            {/* Compact responsive page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="text-neutral-400 px-0.5">…</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          safePage === pageNum
                            ? "bg-[#5E72E4] text-white shadow-xs"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-750"
                        )}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer",
                safePage >= totalPages
                  ? "text-neutral-400 dark:text-neutral-600 opacity-50 cursor-not-allowed"
                  : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-750"
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
