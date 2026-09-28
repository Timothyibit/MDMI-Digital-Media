import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  Quote,
  Highlighter,
  BookOpen,
} from 'lucide-react';

interface RichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

interface ScrollSnapshot {
  element: HTMLElement | Window;
  scrollTop: number;
  scrollLeft: number;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  textareaRef,
  value,
  onChange,
  className = '',
}) => {
  // Capture all scrollable ancestors and the window scroll position
  const captureScrollSnapshot = (el: HTMLElement): ScrollSnapshot[] => {
    const snapshots: ScrollSnapshot[] = [];

    // Capture element's own internal scroll
    snapshots.push({
      element: el,
      scrollTop: el.scrollTop,
      scrollLeft: el.scrollLeft,
    });

    // Walk up all ancestors
    let current: HTMLElement | null = el.parentElement;
    while (current) {
      if (
        current.scrollHeight > current.clientHeight ||
        current.scrollWidth > current.clientWidth ||
        current.scrollTop > 0 ||
        current.scrollLeft > 0
      ) {
        snapshots.push({
          element: current,
          scrollTop: current.scrollTop,
          scrollLeft: current.scrollLeft,
        });
      }
      current = current.parentElement;
    }

    // Capture document / window
    if (typeof window !== 'undefined') {
      snapshots.push({
        element: window,
        scrollTop: window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0,
        scrollLeft: window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0,
      });
      if (document.scrollingElement && document.scrollingElement !== (snapshots[snapshots.length - 1]?.element as any)) {
        snapshots.push({
          element: document.scrollingElement as HTMLElement,
          scrollTop: document.scrollingElement.scrollTop,
          scrollLeft: document.scrollingElement.scrollLeft,
        });
      }
    }

    return snapshots;
  };

  const restoreScrollSnapshot = (snapshots: ScrollSnapshot[]) => {
    for (const snap of snapshots) {
      try {
        if (snap.element === window) {
          window.scrollTo({
            top: snap.scrollTop,
            left: snap.scrollLeft,
            behavior: 'instant' as any,
          });
        } else if (snap.element && 'scrollTop' in snap.element) {
          (snap.element as HTMLElement).scrollTop = snap.scrollTop;
          (snap.element as HTMLElement).scrollLeft = snap.scrollLeft;
        }
      } catch {
        // ignore safely
      }
    }
  };

  const preserveScrollAndFocus = (
    el: HTMLTextAreaElement | HTMLInputElement,
    newStart: number,
    newEnd: number,
    snapshots: ScrollSnapshot[]
  ) => {
    const applyFocusAndSelection = () => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
      try {
        el.setSelectionRange(newStart, newEnd);
      } catch {
        // ignore for inputs that might not support selection
      }
      restoreScrollSnapshot(snapshots);
    };

    // 1. Immediate restore
    applyFocusAndSelection();

    // 2. Next animation frame (after React reconciliation)
    requestAnimationFrame(() => {
      applyFocusAndSelection();

      // 3. Second frame / microtask to defeat late browser auto-scrolling
      setTimeout(() => {
        applyFocusAndSelection();
      }, 0);
    });
  };

  const applyFormat = (prefix: string, suffix = '', defaultText = 'text') => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + prefix + defaultText + suffix);
      return;
    }

    const snapshots = captureScrollSnapshot(el);

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selectedText = value.substring(start, end) || defaultText;

    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = `${before}${prefix}${selectedText}${suffix}${after}`;

    onChange(updated);

    const newStart = start + prefix.length;
    const newEnd = start + prefix.length + selectedText.length;
    preserveScrollAndFocus(el, newStart, newEnd, snapshots);
  };

  const applyLinePrefix = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + '\n' + prefix);
      return;
    }

    const snapshots = captureScrollSnapshot(el);

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const before = value.substring(0, lineStart);
    const after = value.substring(lineStart);

    onChange(`${before}${prefix} ${after}`);

    const newStart = start + prefix.length + 1;
    const newEnd = end + prefix.length + 1;
    preserveScrollAndFocus(el, newStart, newEnd, snapshots);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Crucial: prevents the toolbar button from stealing focus and triggering page scroll
    e.preventDefault();
  };

  return (
    <div
      className={`flex items-center flex-wrap gap-1 p-1.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs ${className}`}
    >
      <button
        type="button"
        title="Bold (**text**)"
        onMouseDown={handleMouseDown}
        onClick={() => applyFormat('**', '**', 'bold text')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Italic (*text*)"
        onMouseDown={handleMouseDown}
        onClick={() => applyFormat('*', '*', 'italic text')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Underline (<u>text</u>)"
        onMouseDown={handleMouseDown}
        onClick={() => applyFormat('<u>', '</u>', 'underlined text')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />

      <button
        type="button"
        title="Section Heading (### )"
        onMouseDown={handleMouseDown}
        onClick={() => applyLinePrefix('###')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Sub-heading (#### )"
        onMouseDown={handleMouseDown}
        onClick={() => applyLinePrefix('####')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />

      <button
        type="button"
        title="Scripture Callout (> Quote)"
        onMouseDown={handleMouseDown}
        onClick={() => applyLinePrefix('>')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Verse Callout (<verse>...</verse>)"
        onMouseDown={handleMouseDown}
        onClick={() => applyFormat('<verse>', '</verse>', 'John 15:5 — "I am the vine, ye are the branches"')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#5E72E4] dark:text-[#7BDEB2] active:scale-95 transition-all font-semibold flex items-center gap-1"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span className="text-[10px] hidden sm:inline">Verse</span>
      </button>

      <button
        type="button"
        title="Bullet List (- item)"
        onMouseDown={handleMouseDown}
        onClick={() => applyLinePrefix('-')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Highlight (<mark>...</mark>)"
        onMouseDown={handleMouseDown}
        onClick={() => applyFormat('<mark>', '</mark>', 'highlighted text')}
        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-amber-500 dark:text-amber-400 active:scale-95 transition-all"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
