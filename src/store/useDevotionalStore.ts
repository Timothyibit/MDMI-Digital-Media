import { create } from 'zustand';
import { Devotional, Comment } from '../types';
import { SEED_DEVOTIONALS, SEED_COMMENTS } from '../data/seedDevotionals';
import {
  db,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from '../lib/firebase';

interface DevotionalState {
  devotionals: Devotional[];
  comments: Comment[];
  likedIds: string[];
  searchQuery: string;
  selectedTag: string | null;
  activeDevotionalId: string | null;
  isLoading: boolean;

  initializeDevotionals: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setActiveDevotionalId: (id: string | null) => void;

  likeDevotional: (devotionalId: string, uid: string) => Promise<void>;
  incrementViewCount: (devotionalId: string) => Promise<void>;

  // Comments
  fetchCommentsForDevotional: (devotionalId: string) => void;
  addComment: (devotionalId: string, uid: string, displayName: string, body: string) => Promise<void>;
  reportComment: (commentId: string, uid: string, devotionalId?: string) => Promise<void>;
  approveComment: (commentId: string, devotionalId?: string) => Promise<void>;
  removeComment: (commentId: string, devotionalId?: string) => Promise<void>;

  // Admin Management
  createDevotional: (devotional: Omit<Devotional, 'id' | 'viewCount' | 'likeCount' | 'createdAt'>) => Promise<void>;
  updateDevotional: (id: string, updates: Partial<Devotional>) => Promise<void>;
  deleteDevotional: (id: string) => Promise<void>;
  publishDevotional: (id: string) => Promise<void>;
}

const STORAGE_KEY_DEVOTIONALS = 'mdmi_devotionals_data';
const STORAGE_KEY_COMMENTS = 'mdmi_comments_data';
const STORAGE_KEY_LIKES = 'mdmi_liked_ids';

export const useDevotionalStore = create<DevotionalState>((set, get) => {
  let initialDevotionals = SEED_DEVOTIONALS;
  let initialComments = SEED_COMMENTS;
  let initialLikes: string[] = ['abide-in-the-vine'];

  try {
    const storedD = localStorage.getItem(STORAGE_KEY_DEVOTIONALS);
    if (storedD) initialDevotionals = JSON.parse(storedD);
    const storedC = localStorage.getItem(STORAGE_KEY_COMMENTS);
    if (storedC) initialComments = JSON.parse(storedC);
    const storedL = localStorage.getItem(STORAGE_KEY_LIKES);
    if (storedL) initialLikes = JSON.parse(storedL);
  } catch {
    // fallback
  }

  const persistDevotionals = (items: Devotional[]) => {
    localStorage.setItem(STORAGE_KEY_DEVOTIONALS, JSON.stringify(items));
  };

  const persistComments = (items: Comment[]) => {
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(items));
  };

  const persistLikes = (items: string[]) => {
    localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(items));
  };

  return {
    devotionals: initialDevotionals,
    comments: initialComments,
    likedIds: initialLikes,
    searchQuery: '',
    selectedTag: null,
    activeDevotionalId: initialDevotionals[0]?.id || null,
    isLoading: false,

    initializeDevotionals: async () => {
      try {
        const devotionalsRef = collection(db, 'devotionals');

        // Safe realtime snapshot listener with error handler to prevent uncaught exceptions
        onSnapshot(
          devotionalsRef,
          async (snapshot) => {
            if (!snapshot.empty) {
              const remoteDevotionals: Devotional[] = [];
              snapshot.forEach((dDoc) => {
                remoteDevotionals.push({ id: dDoc.id, ...dDoc.data() } as Devotional);
              });
              persistDevotionals(remoteDevotionals);
              set({ devotionals: remoteDevotionals, isLoading: false });
            } else {
              // Remote collection is empty; seed initial teachings
              try {
                for (const dev of SEED_DEVOTIONALS) {
                  const { id, ...data } = dev;
                  await setDoc(doc(db, 'devotionals', id), data);
                }
                for (const comm of SEED_COMMENTS) {
                  const { id, devotionalId, ...cData } = comm;
                  await setDoc(doc(db, 'devotionals', devotionalId, 'comments', id), {
                    ...cData,
                    devotionalId,
                  });
                }
              } catch (seedErr) {
                console.info('Initial Firestore seeding notice:', seedErr);
              }
              set({ devotionals: SEED_DEVOTIONALS, isLoading: false });
            }
          },
          (snapshotError) => {
            // Gracefully fall back to local storage / seed data without throwing unhandled error
            console.info('Operating with offline devotional cache:', snapshotError.message);
            set({ devotionals: get().devotionals || SEED_DEVOTIONALS, isLoading: false });
          }
        );
      } catch (err) {
        console.warn('Devotionals connection notice:', err);
        set({ devotionals: get().devotionals || SEED_DEVOTIONALS, isLoading: false });
      }
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedTag: (selectedTag) => set({ selectedTag }),
    setActiveDevotionalId: (activeDevotionalId) => set({ activeDevotionalId }),

    fetchCommentsForDevotional: (devotionalId: string) => {
      try {
        const commentsRef = collection(db, 'devotionals', devotionalId, 'comments');
        onSnapshot(
          commentsRef,
          (snapshot) => {
            const loaded: Comment[] = [];
            snapshot.forEach((cDoc) => {
              loaded.push({ id: cDoc.id, ...cDoc.data() } as Comment);
            });
            if (loaded.length > 0) {
              const otherComments = get().comments.filter((c) => c.devotionalId !== devotionalId);
              const combined = [...loaded, ...otherComments];
              persistComments(combined);
              set({ comments: combined });
            }
          },
          (err) => {
            console.info('Comments offline cache active:', err.message);
          }
        );
      } catch (err) {
        console.warn('Comments fetch notice:', err);
      }
    },

    likeDevotional: async (devotionalId: string, _uid: string) => {
      const { likedIds, devotionals } = get();
      const isLiked = likedIds.includes(devotionalId);
      const newLikes = isLiked
        ? likedIds.filter((id) => id !== devotionalId)
        : [...likedIds, devotionalId];

      let newCount = 0;
      const updatedDevotionals = devotionals.map((d) => {
        if (d.id === devotionalId) {
          newCount = isLiked ? Math.max(0, d.likeCount - 1) : d.likeCount + 1;
          return {
            ...d,
            likeCount: newCount,
          };
        }
        return d;
      });

      persistLikes(newLikes);
      persistDevotionals(updatedDevotionals);
      set({ likedIds: newLikes, devotionals: updatedDevotionals });

      try {
        const dRef = doc(db, 'devotionals', devotionalId);
        await updateDoc(dRef, { likeCount: newCount });
      } catch (err) {
        console.info('Like synced locally:', err);
      }
    },

    incrementViewCount: async (devotionalId: string) => {
      const { devotionals } = get();
      let updatedCount = 1;
      const updated = devotionals.map((d) => {
        if (d.id === devotionalId) {
          updatedCount = (d.viewCount || 0) + 1;
          return { ...d, viewCount: updatedCount };
        }
        return d;
      });
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        const dRef = doc(db, 'devotionals', devotionalId);
        await updateDoc(dRef, { viewCount: updatedCount });
      } catch (err) {
        console.info('View counted locally:', err);
      }
    },

    addComment: async (devotionalId, uid, displayName, body) => {
      const commentId = 'comm_' + Date.now();
      const newComment: Comment = {
        id: commentId,
        devotionalId,
        uid,
        displayName: displayName || 'Disciple of Christ',
        body: body.trim(),
        createdAt: new Date().toISOString(),
        reported: false,
        reportedBy: [],
      };

      const updated = [newComment, ...get().comments];
      persistComments(updated);
      set({ comments: updated });

      try {
        const commRef = doc(db, 'devotionals', devotionalId, 'comments', commentId);
        await setDoc(commRef, newComment);
      } catch (err) {
        console.info('Comment stored locally:', err);
      }
    },

    reportComment: async (commentId, uid, devotionalId) => {
      const updated = get().comments.map((c) => {
        if (c.id === commentId) {
          const already = c.reportedBy.includes(uid);
          const reportedBy = already ? c.reportedBy : [...c.reportedBy, uid];
          return { ...c, reported: true, reportedBy };
        }
        return c;
      });
      persistComments(updated);
      set({ comments: updated });

      const targetDevotionalId = devotionalId || get().comments.find((c) => c.id === commentId)?.devotionalId;
      if (targetDevotionalId) {
        try {
          const commRef = doc(db, 'devotionals', targetDevotionalId, 'comments', commentId);
          const c = updated.find((item) => item.id === commentId);
          if (c) {
            await updateDoc(commRef, { reported: true, reportedBy: c.reportedBy });
          }
        } catch (err) {
          console.info('Report stored locally:', err);
        }
      }
    },

    approveComment: async (commentId, devotionalId) => {
      const updated = get().comments.map((c) => {
        if (c.id === commentId) {
          return { ...c, reported: false, reportedBy: [] };
        }
        return c;
      });
      persistComments(updated);
      set({ comments: updated });

      const targetDevotionalId = devotionalId || get().comments.find((c) => c.id === commentId)?.devotionalId;
      if (targetDevotionalId) {
        try {
          const commRef = doc(db, 'devotionals', targetDevotionalId, 'comments', commentId);
          await updateDoc(commRef, { reported: false, reportedBy: [] });
        } catch (err) {
          console.info('Approval stored locally:', err);
        }
      }
    },

    removeComment: async (commentId, devotionalId) => {
      const targetDevotionalId = devotionalId || get().comments.find((c) => c.id === commentId)?.devotionalId;
      const updated = get().comments.filter((c) => c.id !== commentId);
      persistComments(updated);
      set({ comments: updated });

      if (targetDevotionalId) {
        try {
          const commRef = doc(db, 'devotionals', targetDevotionalId, 'comments', commentId);
          await deleteDoc(commRef);
        } catch (err) {
          console.info('Deletion completed locally:', err);
        }
      }
    },

    createDevotional: async (devotionalData) => {
      const id = 'dev_' + Date.now().toString(36);
      const newDevotional: Devotional = {
        ...devotionalData,
        id,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updated = [newDevotional, ...get().devotionals];
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        const { id: dId, ...data } = newDevotional;
        await setDoc(doc(db, 'devotionals', dId), data);
      } catch (err) {
        console.info('Devotional creation saved locally:', err);
      }
    },

    updateDevotional: async (id, updates) => {
      const updated = get().devotionals.map((d) => (d.id === id ? { ...d, ...updates } : d));
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        await updateDoc(doc(db, 'devotionals', id), updates);
      } catch (err) {
        console.info('Update saved locally:', err);
      }
    },

    deleteDevotional: async (id) => {
      const updated = get().devotionals.filter((d) => d.id !== id);
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        await deleteDoc(doc(db, 'devotionals', id));
      } catch (err) {
        console.info('Deletion saved locally:', err);
      }
    },

    publishDevotional: async (id) => {
      const now = new Date().toISOString();
      const updated = get().devotionals.map((d) =>
        d.id === id ? { ...d, publishedAt: now } : d
      );
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        await updateDoc(doc(db, 'devotionals', id), { publishedAt: now });
      } catch (err) {
        console.info('Publish status saved locally:', err);
      }
    },
  };
});
