import React, { useRef, useState } from 'react';
import { RichTextToolbar } from './RichTextToolbar';
import { RichTextRenderer } from './RichTextRenderer';
import { Eye, Edit3, Columns, Code2, Sparkles, Check } from 'lucide-react';

interface RichTextEditorProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  showPreviewToggle?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Write devotional content...',
  rows = 6,
  required = false,
  className = '',
  showPreviewToggle = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Editor mode: 'editor' (compose with toolbar & live book preview toggle), 'preview' (book view), 'split' (side by side)
  const [mode, setMode] = useState<'editor' | 'preview' | 'split'>('editor');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Helper to capture all scrollable ancestors
  const captureScrollSnapshot = (el: HTMLElement | null) => {
    const snapshots: Array<{ element: HTMLElement | Window; scrollTop: number; scrollLeft: number }> = [];
    if (el) {
      snapshots.push({ element: el, scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });
      let current: HTMLElement | null = el.parentElement;
      while (current) {
        if (
          current.scrollHeight > current.clientHeight ||
          current.scrollWidth > current.clientWidth ||
          current.scrollTop > 0 ||
          current.scrollLeft > 0
        ) {
          snapshots.push({ element: current, scrollTop: current.scrollTop, scrollLeft: current.scrollLeft });
        }
        current = current.parentElement;
      }
    }
    if (typeof window !== 'undefined') {
      snapshots.push({
        element: window,
        scrollTop: window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0,
        scrollLeft: window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0,
      });
      if (document.scrollingElement) {
        snapshots.push({
          element: document.scrollingElement as HTMLElement,
          scrollTop: document.scrollingElement.scrollTop,
          scrollLeft: document.scrollingElement.scrollLeft,
        });
      }
    }
    return snapshots;
  };

  const restoreScrollSnapshot = (snapshots: Array<{ element: HTMLElement | Window; scrollTop: number; scrollLeft: number }>) => {
    for (const snap of snapshots) {
      try {
        if (snap.element === window) {
          window.scrollTo({ top: snap.scrollTop, left: snap.scrollLeft, behavior: 'instant' as any });
        } else if (snap.element && 'scrollTop' in snap.element) {
          (snap.element as HTMLElement).scrollTop = snap.scrollTop;
          (snap.element as HTMLElement).scrollLeft = snap.scrollLeft;
        }
      } catch {
        // ignore safely
      }
    }
  };

  // Switch modes without scrolling to top
  const handleSwitchMode = (newMode: 'editor' | 'preview' | 'split') => {
    const snapshots = captureScrollSnapshot(textareaRef.current);
    setMode(newMode);

    const restore = () => restoreScrollSnapshot(snapshots);
    restore();
    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 0);
    });
  };

  // Quick helper to insert or reformat markdown without scrolling
  const handleAutoReformat = (e?: React.MouseEvent) => {
    e?.preventDefault();
    const el = textareaRef.current;
    const snapshots = captureScrollSnapshot(el);

    // Normalizes headings, cleans multi-breaks, trims trailing spaces
    const cleaned = value
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    onChange(cleaned);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);

    const restore = () => {
      if (el) {
        try {
          el.focus({ preventScroll: true });
        } catch {
          el.focus();
        }
      }
      restoreScrollSnapshot(snapshots);
    };

    restore();
    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 0);
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {label && (
          <label htmlFor={id} className="block text-xs font-bold text-[#525F7F] dark:text-neutral-200">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        {showPreviewToggle && (
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl self-start sm:self-auto border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSwitchMode('editor')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                mode === 'editor'
                  ? 'bg-white dark:bg-neutral-900 text-[#5E72E4] dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Compose</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSwitchMode('preview')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                mode === 'preview'
                  ? 'bg-white dark:bg-neutral-900 text-[#5E72E4] dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Book Preview</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSwitchMode('split')}
              className={`hidden md:flex px-2.5 py-1 rounded-lg text-[11px] font-bold items-center gap-1 transition-all ${
                mode === 'split'
                  ? 'bg-white dark:bg-neutral-900 text-[#5E72E4] dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Side-by-side editing and preview"
            >
              <Columns className="w-3 h-3" />
              <span>Split View</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleAutoReformat}
              title="Clean & Reformat Markdown Structure"
              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-[#5E72E4] dark:hover:text-[#7BDEB2] flex items-center gap-1 transition-colors"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Cleaned!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">Format</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Formatting Toolbar */}
      {mode !== 'preview' && (
        <RichTextToolbar textareaRef={textareaRef} value={value} onChange={onChange} />
      )}

      {/* Mode Renderings */}
      {mode === 'editor' && (
        <div className="space-y-2">
          <textarea
            id={id}
            ref={textareaRef}
            rows={rows}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-[#172B4D] dark:text-neutral-100 focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4] font-mono leading-relaxed shadow-xs"
          />
          {value.trim() && (
            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-[#5E72E4]" />
                  <span>Live Book Typography Preview</span>
                </span>
                <span className="text-[10px]">{value.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <div className="max-h-[180px] overflow-y-auto pr-1">
                <RichTextRenderer content={value} />
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'preview' && (
        <div className="space-y-2">
          <div className="relative rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
            <div className="p-5 min-h-[220px] max-h-[440px] overflow-y-auto">
              {value.trim() ? (
                <RichTextRenderer content={value} />
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  {placeholder || 'Devotional body is empty. Switch to Compose to write...'}
                </p>
              )}
            </div>
            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Exact typography seen by disciples</span>
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSwitchMode('editor')}
                className="text-[11px] font-bold text-[#5E72E4] hover:underline"
              >
                Return to Compose
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'split' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
          <textarea
            ref={textareaRef}
            rows={rows}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-[#172B4D] dark:text-neutral-100 focus:outline-none focus:border-[#5E72E4] font-mono leading-relaxed resize-none"
          />
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-y-auto max-h-[300px]">
            <RichTextRenderer content={value} />
          </div>
        </div>
      )}
    </div>
  );
};
