import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  PenLine,
  Plus,
  Trash2,
  Lock,
  Calendar,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  BookHeart,
  Edit3,
  Image as ImageIcon,
  Save,
  X,
} from 'lucide-react';
import MotionButton from '@/components/ui/motion-button';
import { useJournalStore } from '../store/useJournalStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useDevotionalStore } from '../store/useDevotionalStore';
import { Button, Badge, Input } from '../components/common';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import { AlertCard } from '@/components/ui/card-8';
import { EditJournalModal } from '../components/journal/EditJournalModal';
import { DeviceImageUploader } from '../components/common/DeviceImageUploader';
import { JournalEntry } from '../types';

const JOURNAL_PAGE_SIZE = 6;

const PRESET_JOURNAL_PHOTOS = [
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=80',
];

export const JournalTab: React.FC = () => {
  const { entries, addEntry, deleteEntry } = useJournalStore();
  const { user } = useAuthStore();
  const { openAuthGate } = useUIStore();
  const { devotionals } = useDevotionalStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedDevotionalId, setSelectedDevotionalId] = useState<string>(
    devotionals[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [scriptureRef, setScriptureRef] = useState('John 15:5');
  const [content, setContent] = useState('');
  const [prayerPoint, setPrayerPoint] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / JOURNAL_PAGE_SIZE));
  const paginatedEntries = entries.slice(
    (currentPage - 1) * JOURNAL_PAGE_SIZE,
    currentPage * JOURNAL_PAGE_SIZE
  );

  const handleSaveEntry = () => {
    if (!title.trim() || !content.trim()) return;

    if (user?.isAnonymous) {
      openAuthGate(
        'Sign in or create an account to save and protect your private journal notes.'
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
      imageUrl: imageUrl || null,
    });

    setTitle('');
    setContent('');
    setPrayerPoint('');
    setImageUrl(null);
    setIsCreating(false);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="space-y-5 max-w-3xl mx-auto w-full">
        {/* Header */}
        <View className="flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <View>
            <Text className="text-xl sm:text-2xl font-extrabold font-display-scripture text-[#172B4D] dark:text-white">
              Prayer & Devotional Journal
            </Text>
            <Text className="text-xs text-[#525F7F] dark:text-neutral-400 mt-0.5">
              Your private sanctuary for prayer points and divine impressions
            </Text>
          </View>

          <MotionButton
            id="new-journal-entry-btn"
            variant="ministry-green"
            size="md"
            icon={<Plus className="w-4 h-4 text-white" />}
            label={isCreating ? "Close Form" : "New Entry"}
            onClick={() => {
              if (user?.isAnonymous) {
                openAuthGate(
                  'Create an account to keep your personal Prayer Journal safe.'
                );
              } else {
                setIsCreating(!isCreating);
              }
            }}
          />
        </View>

        {/* Anonymous Notice Banner if Guest */}
        {user?.isAnonymous && (
          <View className="p-4 sm:p-5 rounded-lg bg-[#FB6340]/10 border border-[#FB6340]/30 flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_2px_12px_rgba(251,99,64,0.08)]">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-lg bg-[#FB6340]/20 items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#FB6340]" />
              </View>
              <View>
                <Text className="text-xs font-bold text-[#172B4D] dark:text-white">
                  Guest Mode Active
                </Text>
                <Text className="text-[11px] text-[#525F7F] dark:text-neutral-300 mt-0.5">
                  Create an account to save your journal reflections safely and protect your notes.
                </Text>
              </View>
            </View>

            <MotionButton
              size="sm"
              variant="warning"
              id="journal-auth-gate-trigger"
              icon={<Lock className="w-3.5 h-3.5 text-white" />}
              label="Connect Account"
              onClick={() =>
                openAuthGate(
                  'Create an account to save your private prayer reflections across all your devices.'
                )
              }
            />
          </View>
        )}

        {/* Success alert */}
        {successNotice && (
          <View className="p-3 rounded-lg bg-[#2DCE89]/15 border border-[#2DCE89]/30 flex-row items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2DCE89]" />
            <Text className="text-[#2DCE89] text-xs font-semibold">
              Journal reflection saved securely to your personal sanctuary.
            </Text>
          </View>
        )}

        {/* Entry Creation Form */}
        {isCreating && (
          <div className="p-5 sm:p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9ECEF] dark:border-neutral-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5E72E4] font-mono">
                New Journal Reflection
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 text-xs font-semibold text-[#8898AA] hover:text-[#525F7F] dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1.5">
                  Reflection Title
                </label>
                <Input
                  id="journal-title-input"
                  placeholder="e.g. Abiding Through Uncertainty"
                  value={title}
                  onChangeText={setTitle}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1.5">
                  Scripture Anchor
                </label>
                <Input
                  id="journal-scripture-input"
                  placeholder="e.g. Philippians 4:6-7"
                  value={scriptureRef}
                  onChangeText={setScriptureRef}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1.5">
                Your Reflection & Spiritual Impressions
              </label>
              <textarea
                id="journal-content-textarea"
                placeholder="Write honestly before God. What truth touched you? What is the Holy Spirit instructing you to surrender or obey?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#172B4D] dark:text-neutral-100 placeholder-[#ADB5BD] leading-relaxed outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
              />
            </div>

            <div>
              <DeviceImageUploader
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                label="Attach Reflection Photo (Optional)"
                helperText="Upload image from your phone/computer (notes, Bible pages, baptism, worship)"
                presets={PRESET_JOURNAL_PHOTOS}
                aspectRatio="wide"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1.5">
                Personal Prayer Point (Optional)
              </label>
              <Input
                id="journal-prayer-input"
                placeholder="e.g. Father, give me strength to crucify impatience today..."
                value={prayerPoint}
                onChangeText={setPrayerPoint}
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <MotionButton
                variant="secondary"
                size="md"
                icon={<X className="w-3.5 h-3.5" />}
                label="Discard"
                onClick={() => setIsCreating(false)}
              />
              <MotionButton
                id="save-journal-entry-btn"
                variant="ministry-green"
                size="md"
                icon={<Save className="w-4 h-4 text-white" />}
                label="Save To Journal"
                onClick={handleSaveEntry}
              />
            </div>
          </div>
        )}

        {/* Journal Entries List */}
        <View className="space-y-4">
          {entries.length === 0 ? (
            <div className="py-4 flex justify-center w-full">
              <AlertCard
                variant="ministry-red"
                badge="Sacred Sanctuary • Discipling to Serve"
                icon={<BookHeart className="h-6 w-6 text-white" />}
                title="Write Your First Reflection"
                description="Cultivate the spiritual discipline of recording what the Lord teaches you through the scriptures, prayers, and quiet meditations."
                buttonText="Write First Reflection"
                onButtonClick={() => {
                  if (user?.isAnonymous) {
                    openAuthGate('Link your account to write personal prayer journal reflections.');
                  } else {
                    setIsCreating(true);
                  }
                }}
                className="max-w-xl mx-auto shadow-xl"
              />
            </div>
          ) : (
            <>
              {!isCreating && (
                <div className="mb-2">
                  <AlertCard
                    variant="ministry-green"
                    badge="Sanctuary Composer • MDMI"
                    icon={<PenLine className="h-6 w-6 text-white" />}
                    title="Record Today's Reflection"
                    description="Capture the impressions, scripture promises, and prayer petitions received in devotion today."
                    buttonText="New Entry"
                    onButtonClick={() => {
                      if (user?.isAnonymous) {
                        openAuthGate('Create an account to keep your personal Prayer Journal safe.');
                      } else {
                        setIsCreating(true);
                      }
                    }}
                    className="max-w-none shadow-md"
                  />
                </div>
              )}
              {paginatedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 sm:p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#5E72E4]/50 transition-all duration-200 group/card"
                >
                  {/* Author profile details & Actions header */}
                  <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      {user?.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={user.displayName || 'You'}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#5E72E4] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'D'}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block leading-tight">
                          {user?.displayName || 'My Private Sanctuary'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Private Journal Note
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <MotionButton
                        id={`edit-journal-${entry.id}`}
                        size="sm"
                        variant="primary"
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                        label="Edit Note"
                        onClick={() => setEditingEntry(entry)}
                        title="Edit reflection, scripture, and photo"
                      />
                      <MotionButton
                        id={`delete-journal-${entry.id}`}
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        label="Delete"
                        onClick={() => deleteEntry(entry.id)}
                        title="Delete reflection"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setEditingEntry(entry)}
                      title="Click to edit reflection"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5E72E4]/10 text-[#5E72E4] dark:bg-[#5E72E4]/20 dark:text-[#7BDEB2]">
                          {entry.scriptureRef}
                        </span>
                        {entry.devotionalTitle && (
                          <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                            {entry.devotionalTitle}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white group-hover/card:text-[#5E72E4] transition-colors flex items-center gap-2">
                        <span>{entry.title}</span>
                        <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover/card:opacity-100 text-[#5E72E4] transition-opacity" />
                      </h4>
                    </div>
                  </div>

                  {entry.imageUrl && (
                    <div
                      onClick={() => setEditingEntry(entry)}
                      className="mt-3 rounded-2xl overflow-hidden max-h-60 sm:max-h-72 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
                      title="Click to change or edit photo"
                    >
                      <img
                        src={entry.imageUrl}
                        alt={entry.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <p
                    onClick={() => setEditingEntry(entry)}
                    className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 mt-2.5 leading-relaxed font-serif-reading cursor-pointer"
                    title="Click to edit reflection"
                  >
                    {entry.content}
                  </p>

                  {entry.prayerPoint && (
                    <div
                      onClick={() => setEditingEntry(entry)}
                      className="mt-3.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 cursor-pointer hover:bg-amber-500/15 transition-colors"
                      title="Click to edit prayer point"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-[10px] uppercase tracking-wider block">
                          Prayer Point
                        </span>
                        <p className="italic text-xs text-neutral-800 dark:text-neutral-200 mt-0.5">
                          {entry.prayerPoint}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingEntry(entry)}
                        className="text-[11px] font-bold text-[#5E72E4] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Journal</span>
                      </button>
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Encrypted & Private</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {entries.length > JOURNAL_PAGE_SIZE && (
                <div className="pt-2 pb-4">
                  <PaginationPageDefault
                    page={currentPage}
                    total={totalPages}
                    onPageChange={(p) => {
                      setCurrentPage(p);
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </View>
      </View>

      {/* Complete Journal Reflection Editor Modal */}
      <EditJournalModal
        entry={editingEntry}
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
      />
    </ScrollView>
  );
};
