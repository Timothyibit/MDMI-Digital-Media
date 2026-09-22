import { create } from 'zustand';
import { JournalEntry } from '../types';
import {
  db,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from '../lib/firebase';

interface JournalState {
  entries: JournalEntry[];
  currentUid: string | null;
  initializeJournal: (uid: string) => void;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Pick<JournalEntry, 'title' | 'content' | 'prayerPoint'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const STORAGE_KEY_JOURNAL = 'mdmi_journal_entries';

const SEED_JOURNAL: JournalEntry[] = [
  {
    id: 'journal-1',
    uid: 'user-default',
    devotionalId: 'abide-in-the-vine',
    devotionalTitle: 'Abiding in the Living Vine',
    title: 'Surrendering My Morning Anxieties',
    scriptureRef: 'John 15:5',
    content: 'Today I woke up feeling weighed down by project deadlines and family health concerns. Reading Jesus’ words about the branch and the vine reminded me that carrying this burden myself is an illusion. He holds the sap, the sun, and the season.',
    prayerPoint: 'Grant me patience to remain still in Your presence before leaping into action.',
    createdAt: '2026-09-21T07:45:00Z',
    updatedAt: '2026-09-21T07:45:00Z',
  }
];

export const useJournalStore = create<JournalState>((set, get) => {
  let initialEntries = SEED_JOURNAL;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_JOURNAL);
    if (stored) initialEntries = JSON.parse(stored);
  } catch {
    // fallback
  }

  const persist = (items: JournalEntry[]) => {
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(items));
  };

  return {
    entries: initialEntries,
    currentUid: null,

    initializeJournal: (uid: string) => {
      set({ currentUid: uid });
      try {
        const journalColRef = collection(db, 'users', uid, 'journal');
        onSnapshot(
          journalColRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const list: JournalEntry[] = [];
              snapshot.forEach((entryDoc) => {
                list.push({ id: entryDoc.id, ...entryDoc.data() } as JournalEntry);
              });
              list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              persist(list);
              set({ entries: list });
            }
          },
          (err) => {
            console.info('Journal stored locally:', err.message);
          }
        );
      } catch (err) {
        console.warn('Journal listener notice:', err);
      }
    },

    addEntry: async (entryData) => {
      const id = 'jrnl_' + Date.now().toString(36);
      const newEntry: JournalEntry = {
        ...entryData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...get().entries];
      persist(updated);
      set({ entries: updated });

      const uid = entryData.uid || get().currentUid;
      if (uid) {
        try {
          const entryRef = doc(db, 'users', uid, 'journal', id);
          await setDoc(entryRef, newEntry);
        } catch (err) {
          console.info('Journal entry persisted locally:', err);
        }
      }
    },

    updateEntry: async (id, updates) => {
      const now = new Date().toISOString();
      const updated = get().entries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: now } : e
      );
      persist(updated);
      set({ entries: updated });

      const uid = get().currentUid;
      if (uid) {
        try {
          const entryRef = doc(db, 'users', uid, 'journal', id);
          await updateDoc(entryRef, { ...updates, updatedAt: now });
        } catch (err) {
          console.info('Journal update persisted locally:', err);
        }
      }
    },

    deleteEntry: async (id) => {
      const updated = get().entries.filter((e) => e.id !== id);
      persist(updated);
      set({ entries: updated });

      const uid = get().currentUid;
      if (uid) {
        try {
          const entryRef = doc(db, 'users', uid, 'journal', id);
          await deleteDoc(entryRef);
        } catch (err) {
          console.info('Journal deletion persisted locally:', err);
        }
      }
    },
  };
});
