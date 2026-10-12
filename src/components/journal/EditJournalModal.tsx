"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  BookHeart,
  Sparkles,
  Calendar,
  BookOpen,
  Check,
  Trash2,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import MotionButton from '@/components/ui/motion-button';
import { JournalEntry, Devotional } from '../../types';
import { useJournalStore } from '../../store/useJournalStore';
import { useDevotionalStore, sortDevotionalsByLatest } from '../../store/useDevotionalStore';
import { DeviceImageUploader } from '../common/DeviceImageUploader';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditJournalModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_JOURNAL_PHOTOS = [
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=80',
];

export const EditJournalModal: React.FC<EditJournalModalProps> = ({
  entry,
  isOpen,
  onClose,
}) => {
  const { updateEntry, deleteEntry } = useJournalStore();
  const { devotionals } = useDevotionalStore();

  const [title, setTitle] = useState('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [content, setContent] = useState('');
  const [prayerPoint, setPrayerPoint] = useState('');
  const [devotionalId, setDevotionalId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (entry && isOpen) {
      setTitle(entry.title || '');
      setScriptureRef(entry.scriptureRef || '');
      setContent(entry.content || '');
      setPrayerPoint(entry.prayerPoint || '');
      setDevotionalId(entry.devotionalId || '');
      setImageUrl(entry.imageUrl || null);
      if (entry.createdAt) {
        try {
          const d = new Date(entry.createdAt);
          setEntryDate(d.toISOString().slice(0, 10));
        } catch {
          setEntryDate('');
        }
      } else {
        setEntryDate('');
      }
      setConfirmDelete(false);
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    const selectedDev = devotionals.find((d) => d.id === devotionalId);

    let finalCreatedAt = entry.createdAt;
    if (entryDate) {
      try {
        const d = new Date(entryDate);
        if (!isNaN(d.getTime())) {
          finalCreatedAt = d.toISOString();
        }
      } catch {
        // keep existing
      }
    }

    await updateEntry(entry.id, {
      title: title.trim(),
      scriptureRef: scriptureRef.trim() || 'Holy Scripture',
      content: content.trim(),
      prayerPoint: prayerPoint.trim() ? prayerPoint.trim() : null,
      devotionalId: devotionalId || null,
      devotionalTitle: selectedDev ? selectedDev.title : (devotionalId ? entry.devotionalTitle : undefined),
      imageUrl: imageUrl || null,
      createdAt: finalCreatedAt,
    });

    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    await deleteEntry(entry.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-xl [&>button:last-child]:top-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 text-base font-bold text-neutral-900 dark:text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center">
                <BookHeart className="w-4 h-4" />
              </div>
              <div>
                <span>Edit Journal Reflection</span>
                <p className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
                  Update and keep your personal reflections safe
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Completely edit your journal reflection, update scripture anchor, prayer point, and upload an image from your device.
        </DialogDescription>

        <form id="edit-journal-form" onSubmit={handleSave} className="overflow-y-auto max-h-[72vh] p-6 space-y-4">
          {/* Device Image Uploader for Journal */}
          <div>
            <DeviceImageUploader
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              label="Journal Memory Photo (Optional)"
              helperText="Upload a photo from your phone/computer (Bible notes, altar, baptism), select preset, or URL"
              presets={PRESET_JOURNAL_PHOTOS}
              aspectRatio="wide"
            />
          </div>

          {/* Title & Scripture Anchor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="edit-journal-title" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Reflection Title *
              </Label>
              <Input
                id="edit-journal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Abiding Through Uncertainty"
                required
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-journal-scripture" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Scripture Anchor
              </Label>
              <Input
                id="edit-journal-scripture"
                value={scriptureRef}
                onChange={(e) => setScriptureRef(e.target.value)}
                placeholder="e.g. Philippians 4:6-7"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Linked Devotional Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-journal-devotional" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#5E72E4]" />
              <span>Linked Devotional (Optional)</span>
            </Label>
            <select
              id="edit-journal-devotional"
              value={devotionalId}
              onChange={(e) => setDevotionalId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#5E72E4]"
            >
              <option value="">None (Independent Meditation)</option>
              {sortDevotionalsByLatest(devotionals).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.scripture})
                </option>
              ))}
            </select>
          </div>

          {/* Spiritual Reflection Content */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-journal-content" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Spiritual Impressions & Reflection *
            </Label>
            <Textarea
              id="edit-journal-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did the Lord reveal to your spirit? How does this apply to your walk today?"
              rows={5}
              required
              className="text-xs rounded-xl resize-none min-h-[110px]"
            />
          </div>

          {/* Prayer Point */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-journal-prayer" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Personal Prayer Point (Optional)</span>
            </Label>
            <Input
              id="edit-journal-prayer"
              value={prayerPoint}
              onChange={(e) => setPrayerPoint(e.target.value)}
              placeholder="e.g. Lord, give me the grace to crucify self-will today..."
              className="text-xs rounded-xl"
            />
          </div>

          {/* Entry Date & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="edit-journal-date" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Reflection Date</span>
              </Label>
              <Input
                id="edit-journal-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end text-[11px] text-neutral-500 dark:text-neutral-400 pb-2">
              <div className="flex items-center gap-1.5">
                <span>Created: {new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
              {entry.updatedAt && (
                <span>Last edited: {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900/90 rounded-b-2xl flex flex-wrap items-center justify-between gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">Delete this note?</span>
              <MotionButton
                size="sm"
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5 text-white" />}
                label="Yes, Delete"
                onClick={handleDelete}
              />
              <MotionButton
                size="sm"
                variant="secondary"
                icon={<X className="w-3.5 h-3.5" />}
                label="Cancel"
                onClick={() => setConfirmDelete(false)}
              />
            </div>
          ) : (
            <MotionButton
              size="sm"
              variant="danger"
              icon={<Trash2 className="w-3.5 h-3.5 text-white" />}
              label="Delete Note"
              onClick={() => setConfirmDelete(true)}
            />
          )}

          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <MotionButton
                type="button"
                variant="secondary"
                size="sm"
                icon={<X className="w-3.5 h-3.5" />}
                label="Cancel"
              />
            </DialogClose>
            <MotionButton
              type="submit"
              form="edit-journal-form"
              variant="ministry-green"
              size="sm"
              disabled={saving || !title.trim() || !content.trim()}
              icon={<Save className="w-3.5 h-3.5 text-white" />}
              label={saving ? 'Saving...' : 'Save Changes'}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditJournalModal;
