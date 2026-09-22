import { create } from 'zustand';
import { db, doc, setDoc, deleteDoc, collection, onSnapshot } from '../lib/firebase';

interface BookmarkState {
  bookmarkedIds: string[];
  currentUid: string | null;
  initializeBookmarks: (uid: string) => void;
  toggleBookmark: (devotionalId: string) => Promise<boolean>;
  isBookmarked: (devotionalId: string) => boolean;
}

const STORAGE_KEY_BOOKMARKS = 'mdmi_bookmarks_subcollection';

export const useBookmarkStore = create<BookmarkState>((set, get) => {
  let initialBookmarks: string[] = ['abide-in-the-vine', 'unshakable-refuge'];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (stored) initialBookmarks = JSON.parse(stored);
  } catch {
    // fallback
  }

  return {
    bookmarkedIds: initialBookmarks,
    currentUid: null,

    initializeBookmarks: (uid: string) => {
      set({ currentUid: uid });
      try {
        const bookmarksColRef = collection(db, 'users', uid, 'bookmarks');
        onSnapshot(
          bookmarksColRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const ids: string[] = [];
              snapshot.forEach((bDoc) => ids.push(bDoc.id));
              localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(ids));
              set({ bookmarkedIds: ids });
            }
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

      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updated));
      set({ bookmarkedIds: updated });

      if (currentUid) {
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
