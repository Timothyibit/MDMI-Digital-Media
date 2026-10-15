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
  onAuthStateChanged,
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

let activeJournalUnsub: (() => void) | null = null;
let activeAuthUnsub: (() => void) | null = null;
let storageListenerAttached = false;

export const useJournalStore = create<JournalState>((set, get) => {
  const persist = (items: JournalEntry[], uid?: string | null) => {
    try {
      localStorage.setItem(getStorageKey(uid), JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const cleanData = (data: Record<string, any>) => {
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        sanitized[k] = v;
      }
    }
    return sanitized;
  };

  const attachFirestoreListener = (targetUid: string) => {
    if (activeJournalUnsub) {
      activeJournalUnsub();
      activeJournalUnsub = null;
    }

    try {
      const journalColRef = collection(db, 'users', targetUid, 'journal');
      activeJournalUnsub = onSnapshot(
        journalColRef,
        (snapshot) => {
          const remoteList: JournalEntry[] = [];
          snapshot.forEach((entryDoc) => {
            remoteList.push({ id: entryDoc.id, ...entryDoc.data() } as JournalEntry);
          });
          
          // Merge with any freshly added local entries so nothing is lost if snapshot is in-flight
          const currentLocal = get().entries;
          const map = new Map<string, JournalEntry>();
          remoteList.forEach((e) => map.set(e.id, e));
          currentLocal.forEach((e) => {
            if (!map.has(e.id)) {
              map.set(e.id, e);
            }
          });

          const finalList = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          persist(finalList, targetUid);
          set({ entries: finalList });
        },
        (err) => {
          console.info('Journal real-time sync notice:', err.message);
        }
      );
    } catch (err) {
      console.warn('Journal listener setup notice:', err);
    }
  };

  // Cross-tab real-time storage synchronization
  if (typeof window !== 'undefined' && !storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener('storage', (e) => {
      const currentUid = get().currentUid;
      if (e.key === getStorageKey(currentUid) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            set({ entries: parsed });
          }
        } catch {
          // ignore
        }
      }
    });
  }

  return {
    entries: [],
    currentUid: null,

    resetJournal: () => {
      if (activeJournalUnsub) {
        activeJournalUnsub();
        activeJournalUnsub = null;
      }
      if (activeAuthUnsub) {
        activeAuthUnsub();
        activeAuthUnsub = null;
      }
      set({ entries: [], currentUid: null });
    },

    initializeJournal: (uid: string) => {
      set({ currentUid: uid });

      // 1. Load cached entries immediately for instant UI
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

      // 2. If auth is already ready, attach listener right away
      if (auth.currentUser && auth.currentUser.uid === uid) {
        attachFirestoreListener(uid);
      }

      // 3. Keep listening for auth state changes so when Firebase Auth initializes or session refreshes, real-time sync is permanently active
      if (!activeAuthUnsub) {
        activeAuthUnsub = onAuthStateChanged(auth, (fbUser) => {
          if (fbUser && fbUser.uid === get().currentUid) {
            attachFirestoreListener(fbUser.uid);
          }
        });
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
          await setDoc(entryRef, cleanData(newEntry));
        } catch (err) {
          console.warn('Journal Firestore write notice:', err);
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
