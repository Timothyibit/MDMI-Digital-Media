import React, { useState } from 'react';
import {
  PenTool,
  Plus,
  Trash2,
  Lock,
  Calendar,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useJournalStore } from '../store/useJournalStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDevotionalStore } from '../store/useDevotionalStore';

export const JournalTab: React.FC = () => {
  const { entries, addEntry, deleteEntry } = useJournalStore();
  const { user } = useAuthStore();
  const { openAuthGate } = useUIStore();
  const { devotionals } = useDevotionalStore();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedDevotionalId, setSelectedDevotionalId] = useState<string>(
    devotionals[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [scriptureRef, setScriptureRef] = useState('John 15:5');
  const [content, setContent] = useState('');
  const [prayerPoint, setPrayerPoint] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (user?.isAnonymous) {
      openAuthGate(
        'To write and sync private prayer journal notes, please link your account with your email.'
      );
      return;
    }

    const dev = devotionals.find((d) => d.id === selectedDevotionalId);

    addEntry({
      uid: user?.uid || 'user',
      devotionalId: selectedDevotionalId || null,
      devotionalTitle: dev ? dev.title : undefined,
      title: title.trim(),
      scriptureRef: scriptureRef.trim() || dev?.scripture || 'Holy Scripture',
      content: content.trim(),
      prayerPoint: prayerPoint.trim() || undefined,
    });

    setTitle('');
    setContent('');
    setPrayerPoint('');
    setIsCreating(false);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  return (
    <div className="space-y-5 pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display-scripture text-neutral-900 dark:text-white">
            Prayer & Devotional Journal
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Your private sanctuary for prayer points and divine impressions
          </p>
        </div>

        <button
          id="new-journal-entry-btn"
          onClick={() => {
            if (user?.isAnonymous) {
              openAuthGate(
                'Link your account to unlock your personal Prayer Journal and preserve your notes.'
              );
            } else {
              setIsCreating(!isCreating);
            }
          }}
          className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Anonymous Notice Banner if Guest */}
      {user?.isAnonymous && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Guest Mode Active
              </h4>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Connect your account to write persistent journal reflections and protect your notes across devices.
              </p>
            </div>
          </div>

          <button
            id="journal-auth-gate-trigger"
            onClick={() =>
              openAuthGate(
                'Connect your account to write private prayer reflections and sync securely across devices.'
              )
            }
            className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs whitespace-nowrap active:scale-95 transition-all shadow-sm"
          >
            Connect Account
          </button>
        </div>
      )}

      {/* Success alert */}
      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Journal reflection saved securely to your personal sanctuary.</span>
        </div>
      )}

      {/* Entry Creation Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveEntry}
            className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-3.5 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-display-scripture">
                New Journal Reflection
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Link to Today's Devotional (Optional)
              </label>
              <select
                id="journal-devotional-select"
                value={selectedDevotionalId}
                onChange={(e) => {
                  setSelectedDevotionalId(e.target.value);
                  const found = devotionals.find((d) => d.id === e.target.value);
                  if (found) setScriptureRef(found.scripture);
                }}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500 text-neutral-800 dark:text-neutral-200"
              >
                {devotionals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.scripture})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Reflection Title
                </label>
                <input
                  id="journal-title-input"
                  type="text"
                  required
                  placeholder="e.g. Abiding Through Uncertainty"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Scripture Anchor
                </label>
                <input
                  id="journal-scripture-input"
                  type="text"
                  placeholder="e.g. Philippians 4:6-7"
                  value={scriptureRef}
                  onChange={(e) => setScriptureRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Your Reflection & Spiritual Impressions
              </label>
              <textarea
                id="journal-content-textarea"
                required
                rows={4}
                placeholder="Write honestly before God. What truth touched you? What is the Holy Spirit instructing you to surrender or obey?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Personal Prayer Point
              </label>
              <input
                id="journal-prayer-input"
                type="text"
                placeholder="e.g. Father, give me strength to crucify impatience today..."
                value={prayerPoint}
                onChange={(e) => setPrayerPoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
              >
                Discard
              </button>
              <button
                id="save-journal-entry-btn"
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
              >
                Save To Journal
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Journal Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
            <PenTool className="w-10 h-10 stroke-1 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
              Your journal is ready for your reflections
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              Cultivate the habit of writing what God teaches you during your devotional time.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm relative group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-display-scripture">
                      {entry.scriptureRef}
                    </span>
                    {entry.devotionalTitle && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {entry.devotionalTitle}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {entry.title}
                  </h3>
                </div>

                <button
                  id={`delete-journal-${entry.id}`}
                  onClick={() => deleteEntry(entry.id)}
                  title="Delete journal entry"
                  aria-label="Delete entry"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 mt-2.5 leading-relaxed font-serif-reading">
                {entry.content}
              </p>

              {entry.prayerPoint && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-600 dark:text-amber-400 block text-[10px] uppercase">
                      Prayer Point
                    </span>
                    <span className="italic">{entry.prayerPoint}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Encrypted & Private
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
