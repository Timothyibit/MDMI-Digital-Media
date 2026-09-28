import { create } from 'zustand';
import { db, auth, doc, setDoc, deleteDoc, collection, onSnapshot } from '../lib/firebase';

interface BookmarkState {
  bookmarkedIds: string[];
  currentUid: string | null;
  initializeBookmarks: (uid: string) => void;
  resetBookmarks: () => void;
  toggleBookmark: (devotionalId: string) => Promise<boolean>;
  isBookmarked: (devotionalId: string) => boolean;
}

const getStorageKey = (uid?: string | null) => `mdmi_bookmarks_${uid || 'guest'}`;

export const useBookmarkStore = create<BookmarkState>((set, get) => {
  return {
    bookmarkedIds: [],
    currentUid: null,

    resetBookmarks: () => {
      set({ bookmarkedIds: [], currentUid: null });
    },

    initializeBookmarks: (uid: string) => {
      set({ currentUid: uid });

      // Load cached bookmarks for this user
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

      // Only attach Firestore listener for real authenticated users matching currentUser
      if (!auth.currentUser || auth.currentUser.uid !== uid) {
        return;
      }

      try {
        const bookmarksColRef = collection(db, 'users', uid, 'bookmarks');
        onSnapshot(
          bookmarksColRef,
          (snapshot) => {
            const ids: string[] = [];
            snapshot.forEach((bDoc) => ids.push(bDoc.id));
            localStorage.setItem(getStorageKey(uid), JSON.stringify(ids));
            set({ bookmarkedIds: ids });
          },
          (err) => {
            console.info('Bookmarks stored locally:', err.message);
          }
        );
      } catch (err) {
        console.warn('Bookmarks listener notice:', err);
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
