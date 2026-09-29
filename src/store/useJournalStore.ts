import { create } from 'zustand';
import { JournalEntry } from '../types';
import {
  db,
  auth,
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
  resetJournal: () => void;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'uid'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const getStorageKey = (uid?: string | null) => `mdmi_journal_${uid || 'guest'}`;

export const useJournalStore = create<JournalState>((set, get) => {
  const persist = (items: JournalEntry[], uid?: string | null) => {
    try {
      localStorage.setItem(getStorageKey(uid), JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  return {
    entries: [],
    currentUid: null,

    resetJournal: () => {
      set({ entries: [], currentUid: null });
    },

    initializeJournal: (uid: string) => {
      set({ currentUid: uid });

      // Load cached entries for this specific user
      try {
        const stored = localStorage.getItem(getStorageKey(uid));
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            set({ entries: parsed });
          }
        } else {
          set({ entries: [] });
        }
      } catch {
        set({ entries: [] });
      }

      // Only attach Firestore listener for real authenticated users matching currentUser
      if (!auth.currentUser || auth.currentUser.uid !== uid) {
        return;
      }

      try {
        const journalColRef = collection(db, 'users', uid, 'journal');
        onSnapshot(
          journalColRef,
          (snapshot) => {
            const list: JournalEntry[] = [];
            snapshot.forEach((entryDoc) => {
              list.push({ id: entryDoc.id, ...entryDoc.data() } as JournalEntry);
            });
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            persist(list, uid);
            set({ entries: list });
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
      const uid = entryData.uid || get().currentUid;
      persist(updated, uid);
      set({ entries: updated });

      if (uid && auth.currentUser && auth.currentUser.uid === uid) {
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
      const uid = get().currentUid;
      persist(updated, uid);
      set({ entries: updated });

      if (uid && auth.currentUser && auth.currentUser.uid === uid) {
        try {
          const entryRef = doc(db, 'users', uid, 'journal', id);
          const sanitizedUpdates: Record<string, any> = { updatedAt: now };
          for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
              sanitizedUpdates[key] = value;
            }
          }
          await setDoc(entryRef, sanitizedUpdates, { merge: true });
        } catch (err) {
          console.info('Journal update persisted locally:', err);
        }
      }
    },

    deleteEntry: async (id) => {
      const updated = get().entries.filter((e) => e.id !== id);
      const uid = get().currentUid;
      persist(updated, uid);
      set({ entries: updated });

      if (uid && auth.currentUser && auth.currentUser.uid === uid) {
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
