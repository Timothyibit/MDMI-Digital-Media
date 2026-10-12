import { create } from 'zustand';
import { db, auth, doc, setDoc, deleteDoc, collection, onSnapshot, onAuthStateChanged } from '../lib/firebase';

interface BookmarkState {
  bookmarkedIds: string[];
  currentUid: string | null;
  initializeBookmarks: (uid: string) => void;
  resetBookmarks: () => void;
  toggleBookmark: (devotionalId: string) => Promise<boolean>;
  isBookmarked: (devotionalId: string) => boolean;
}

const getStorageKey = (uid?: string | null) => `mdmi_bookmarks_${uid || 'guest'}`;

let activeBookmarksUnsub: (() => void) | null = null;
let activeBookmarksAuthUnsub: (() => void) | null = null;
let bookmarksStorageListenerAttached = false;

export const useBookmarkStore = create<BookmarkState>((set, get) => {
  const attachFirestoreListener = (targetUid: string) => {
    if (activeBookmarksUnsub) {
      activeBookmarksUnsub();
      activeBookmarksUnsub = null;
    }

    try {
      const bookmarksColRef = collection(db, 'users', targetUid, 'bookmarks');
      activeBookmarksUnsub = onSnapshot(
        bookmarksColRef,
        (snapshot) => {
          const ids: string[] = [];
          snapshot.forEach((bDoc) => ids.push(bDoc.id));
          localStorage.setItem(getStorageKey(targetUid), JSON.stringify(ids));
          set({ bookmarkedIds: ids });
        },
        (err) => {
          console.info('Bookmarks sync notice:', err.message);
        }
      );
    } catch (err) {
      console.warn('Bookmarks listener notice:', err);
    }
  };

  // Cross-tab real-time storage synchronization
  if (typeof window !== 'undefined' && !bookmarksStorageListenerAttached) {
    bookmarksStorageListenerAttached = true;
    window.addEventListener('storage', (e) => {
      const currentUid = get().currentUid;
      if (e.key === getStorageKey(currentUid) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            set({ bookmarkedIds: parsed });
          }
        } catch {
          // ignore
        }
      }
    });
  }

  return {
    bookmarkedIds: [],
    currentUid: null,

    resetBookmarks: () => {
      if (activeBookmarksUnsub) {
        activeBookmarksUnsub();
        activeBookmarksUnsub = null;
      }
      if (activeBookmarksAuthUnsub) {
        activeBookmarksAuthUnsub();
        activeBookmarksAuthUnsub = null;
      }
      set({ bookmarkedIds: [], currentUid: null });
    },

    initializeBookmarks: (uid: string) => {
      set({ currentUid: uid });

      // 1. Load cached bookmarks immediately
      try {
        const stored = localStorage.getItem(getStorageKey(uid));
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            set({ bookmarkedIds: parsed });
          }
        } else {
          set({ bookmarkedIds: [] });
        }
      } catch {
        set({ bookmarkedIds: [] });
      }

      // 2. If auth is already ready, attach listener right away
      if (auth.currentUser && auth.currentUser.uid === uid) {
        attachFirestoreListener(uid);
      }

      // 3. Keep listening for auth state changes so when Firebase Auth initializes or session refreshes, real-time sync is permanently active
      if (!activeBookmarksAuthUnsub) {
        activeBookmarksAuthUnsub = onAuthStateChanged(auth, (fbUser) => {
          if (fbUser && fbUser.uid === get().currentUid) {
            attachFirestoreListener(fbUser.uid);
          }
        });
      }
    },

    toggleBookmark: async (devotionalId: string) => {
      const { bookmarkedIds, currentUid } = get();
      const exists = bookmarkedIds.includes(devotionalId);
      const updated = exists
        ? bookmarkedIds.filter((id) => id !== devotionalId)
        : [...bookmarkedIds, devotionalId];

      localStorage.setItem(getStorageKey(currentUid), JSON.stringify(updated));
      set({ bookmarkedIds: updated });

      if (currentUid && auth.currentUser && auth.currentUser.uid === currentUid) {
        try {
          const bookmarkRef = doc(db, 'users', currentUid, 'bookmarks', devotionalId);
          if (exists) {
            await deleteDoc(bookmarkRef);
          } else {
            await setDoc(bookmarkRef, {
              devotionalId,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.info('Bookmark synced locally:', err);
        }
      }

      return !exists;
    },

    isBookmarked: (devotionalId: string) => get().bookmarkedIds.includes(devotionalId),
  };
});
