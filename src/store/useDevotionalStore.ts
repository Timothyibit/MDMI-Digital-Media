import { create } from 'zustand';
import { Devotional, Comment } from '../types';
import { SEED_DEVOTIONALS, SEED_COMMENTS } from '../data/seedDevotionals';
import { useAuthStore } from './useAuthStore';
import {
  isDevotionalLive,
  computeIsoFromZonedDateTime,
} from '../services/schedulingService';
import {
  db,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
} from '../lib/firebase';

let autoPublishTimer: any = null;

interface DevotionalState {
  devotionals: Devotional[];
  comments: Comment[];
  likedIds: string[];
  searchQuery: string;
  filterDate: string | null;
  selectedTag: string | null;
  activeDevotionalId: string | null;
  isLoading: boolean;

  initializeDevotionals: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterDate: (date: string | null) => void;
  setSelectedTag: (tag: string | null) => void;
  setActiveDevotionalId: (id: string | null) => void;

  likeDevotional: (devotionalId: string, uid: string) => Promise<void>;
  incrementViewCount: (devotionalId: string) => Promise<void>;

  // Comments
  fetchCommentsForDevotional: (devotionalId: string) => void;
  addComment: (
    devotionalId: string,
    uid: string,
    displayName: string,
    body: string,
    photoUrl?: string | null,
    imageUrl?: string | null
  ) => Promise<void>;
  editComment: (
    commentId: string,
    newBody: string,
    devotionalId?: string,
    newImageUrl?: string | null
  ) => Promise<void>;
  reportComment: (commentId: string, uid: string, devotionalId?: string) => Promise<void>;
  approveComment: (commentId: string, devotionalId?: string) => Promise<void>;
  removeComment: (commentId: string, devotionalId?: string) => Promise<void>;
  syncUserToComments: (uid: string, profile: { displayName?: string | null; photoUrl?: string | null }) => Promise<void>;

  // Admin Management
  createDevotional: (devotional: Omit<Devotional, 'id' | 'viewCount' | 'likeCount' | 'createdAt'>) => Promise<void>;
  updateDevotional: (id: string, updates: Partial<Devotional>) => Promise<void>;
  deleteDevotional: (id: string) => Promise<void>;
  publishDevotional: (id: string) => Promise<void>;
  autoPublishScheduledDrafts: () => Promise<void>;
}

const STORAGE_KEY_DEVOTIONALS = 'mdmi_devotionals_data';
const STORAGE_KEY_COMMENTS = 'mdmi_comments_data';
const STORAGE_KEY_LIKES = 'mdmi_liked_ids';

const DUMMY_LIKE_COUNTS = new Set([382, 512, 678, 445, 560]);
const DUMMY_VIEW_COUNTS = new Set([1420, 1890, 2310, 1650, 1980]);
const DUMMY_COMMENT_IDS = new Set(['comm-1', 'comm-2', 'comm-3', 'c1', 'c2', 'e1', 'e2', 'e3']);

export function deduplicateDevotionals(items: Devotional[]): Devotional[] {
  const seen = new Set<string>();
  return items.filter((d) => {
    if (!d || !d.id || seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });
}

export function deduplicateComments(items: Comment[]): Comment[] {
  const seen = new Set<string>();
  return items.filter((c) => {
    if (!c || !c.id || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export function isMyComment(comment: Comment, user: { uid?: string | null; displayName?: string | null } | null): boolean {
  if (!comment) return false;
  if (user?.uid && comment.uid === user.uid) return true;
  if (user?.displayName && comment.displayName && comment.displayName.toLowerCase() === user.displayName.toLowerCase()) return true;
  try {
    const stored = localStorage.getItem('mdmi_my_comment_ids');
    if (stored) {
      const setIds = new Set(JSON.parse(stored));
      if (setIds.has(comment.id)) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export const useDevotionalStore = create<DevotionalState>((set, get) => {
  let initialDevotionals = deduplicateDevotionals(SEED_DEVOTIONALS);
  let initialComments: Comment[] = [];
  let initialLikes: string[] = [];

  try {
    const storedD = localStorage.getItem(STORAGE_KEY_DEVOTIONALS);
    if (storedD) {
      const parsed = JSON.parse(storedD);
      if (Array.isArray(parsed)) {
        initialDevotionals = deduplicateDevotionals(
          parsed.map((d: Devotional) => ({
            ...d,
            likeCount: DUMMY_LIKE_COUNTS.has(d.likeCount) ? 0 : (d.likeCount || 0),
            viewCount: DUMMY_VIEW_COUNTS.has(d.viewCount) ? 0 : (d.viewCount || 0),
          }))
        );
      }
    }
    const storedC = localStorage.getItem(STORAGE_KEY_COMMENTS);
    if (storedC) {
      const parsedC = JSON.parse(storedC);
      if (Array.isArray(parsedC)) {
        initialComments = deduplicateComments(
          parsedC.filter((c: Comment) => !DUMMY_COMMENT_IDS.has(c.id))
        );
      }
    }
    const storedL = localStorage.getItem(STORAGE_KEY_LIKES);
    if (storedL) initialLikes = Array.from(new Set(JSON.parse(storedL)));
  } catch {
    // fallback
  }

  const persistDevotionals = (items: Devotional[]) => {
    const deduped = deduplicateDevotionals(items);
    localStorage.setItem(STORAGE_KEY_DEVOTIONALS, JSON.stringify(deduped));
  };

  const persistComments = (items: Comment[]) => {
    const deduped = deduplicateComments(items);
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(deduped));
  };

  const persistLikes = (items: string[]) => {
    localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(items));
  };

  return {
    devotionals: initialDevotionals,
    comments: initialComments,
    likedIds: initialLikes,
    searchQuery: '',
    filterDate: null,
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
                const data = dDoc.data() as Partial<Devotional>;
                let likeCount = data.likeCount ?? 0;
                let viewCount = data.viewCount ?? 0;
                let needsDocUpdate = false;

                if (DUMMY_LIKE_COUNTS.has(likeCount)) {
                  likeCount = 0;
                  needsDocUpdate = true;
                }
                if (DUMMY_VIEW_COUNTS.has(viewCount)) {
                  viewCount = 0;
                  needsDocUpdate = true;
                }

                if (needsDocUpdate) {
                  try {
                    updateDoc(doc(db, 'devotionals', dDoc.id), {
                      likeCount,
                      viewCount,
                    });
                  } catch {
                    // ignore
                  }
                }

                remoteDevotionals.push({
                  id: dDoc.id,
                  ...data,
                  likeCount,
                  viewCount,
                } as Devotional);
              });
              const dedupedRemote = deduplicateDevotionals(remoteDevotionals);
              persistDevotionals(dedupedRemote);
              set({ devotionals: dedupedRemote, isLoading: false });
              // Auto-publish drafts if any are scheduled for today
              get().autoPublishScheduledDrafts();

              if (!autoPublishTimer && typeof window !== 'undefined') {
                autoPublishTimer = setInterval(() => {
                  get().autoPublishScheduledDrafts();
                }, 30000);
              }
            } else {
              // Remote collection is empty; seed initial teachings if admin, otherwise use local seed
              if (useAuthStore.getState().isAdmin) {
                try {
                  for (const dev of SEED_DEVOTIONALS) {
                    const { id, ...data } = dev;
                    await setDoc(doc(db, 'devotionals', id), data);
                  }
                } catch (seedErr) {
                  console.info('Initial Firestore seeding notice:', seedErr);
                }
              }
              const dedupedSeed = deduplicateDevotionals(SEED_DEVOTIONALS);
              set({ devotionals: dedupedSeed, isLoading: false });
              get().autoPublishScheduledDrafts();
            }
          },
          (snapshotError) => {
            // Gracefully fall back to local storage / seed data without throwing unhandled error
            console.info('Operating with offline devotional cache:', snapshotError.message);
            set({ devotionals: deduplicateDevotionals(get().devotionals || SEED_DEVOTIONALS), isLoading: false });
            get().autoPublishScheduledDrafts();
          }
        );
      } catch (err) {
        console.warn('Devotionals connection notice:', err);
        set({ devotionals: deduplicateDevotionals(get().devotionals || SEED_DEVOTIONALS), isLoading: false });
      }
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setFilterDate: (filterDate) => set({ filterDate }),
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
              if (!DUMMY_COMMENT_IDS.has(cDoc.id)) {
                loaded.push({ id: cDoc.id, ...cDoc.data() } as Comment);
              }
            });

            const otherComments = get().comments.filter(
              (c) => c.devotionalId !== devotionalId && !DUMMY_COMMENT_IDS.has(c.id)
            );
            const combined = deduplicateComments([...loaded, ...otherComments]);
            persistComments(combined);
            set({ comments: combined });
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
        await updateDoc(dRef, { viewCount: increment(1) });
      } catch (err) {
        console.info('View counted locally:', err);
      }
    },

    addComment: async (devotionalId, uid, displayName, body, photoUrl, imageUrl) => {
      const commentId = 'comm_' + Date.now();
      const newComment: Comment = {
        id: commentId,
        devotionalId,
        uid,
        displayName: displayName || 'Disciple of Christ',
        photoUrl: photoUrl || null,
        body: body.trim(),
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
        reported: false,
        reportedBy: [],
      };

      const updated = deduplicateComments([newComment, ...get().comments]);
      persistComments(updated);
      set({ comments: updated });

      try {
        const stored = localStorage.getItem('mdmi_my_comment_ids');
        const setIds = stored ? new Set(JSON.parse(stored)) : new Set<string>();
        setIds.add(commentId);
        localStorage.setItem('mdmi_my_comment_ids', JSON.stringify(Array.from(setIds)));
      } catch {
        // ignore
      }

      try {
        const commRef = doc(db, 'devotionals', devotionalId, 'comments', commentId);
        await setDoc(commRef, newComment);
      } catch (err) {
        console.info('Comment stored locally:', err);
      }
    },

    editComment: async (commentId, newBody, devotionalId, newImageUrl) => {
      const now = new Date().toISOString();
      const targetDevotionalId =
        devotionalId || get().comments.find((c) => c.id === commentId)?.devotionalId;

      const updated = get().comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            body: newBody.trim(),
            ...(newImageUrl !== undefined ? { imageUrl: newImageUrl } : {}),
            updatedAt: now,
          };
        }
        return c;
      });
      persistComments(updated);
      set({ comments: updated });

      if (targetDevotionalId) {
        try {
          const commRef = doc(db, 'devotionals', targetDevotionalId, 'comments', commentId);
          const fieldsToMerge: Record<string, any> = { body: newBody.trim(), updatedAt: now };
          if (newImageUrl !== undefined) {
            fieldsToMerge.imageUrl = newImageUrl;
          }
          await setDoc(commRef, fieldsToMerge, { merge: true });
        } catch (err) {
          console.info('Comment edit saved locally:', err);
        }
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

    syncUserToComments: async (uid, profile) => {
      const currentComments = get().comments;
      const updatedComments = currentComments.map((c) => {
        if (c.uid === uid) {
          return {
            ...c,
            displayName: profile.displayName !== undefined ? (profile.displayName || 'Devoted Disciple') : c.displayName,
            photoUrl: profile.photoUrl !== undefined ? profile.photoUrl : c.photoUrl,
          };
        }
        return c;
      });
      persistComments(updatedComments);
      set({ comments: updatedComments });

      // If matching comments exist in database, update them in Firestore
      const matching = currentComments.filter((c) => c.uid === uid);
      for (const c of matching) {
        try {
          const commRef = doc(db, 'devotionals', c.devotionalId, 'comments', c.id);
          const updates: Record<string, any> = {};
          if (profile.displayName !== undefined) updates.displayName = profile.displayName || 'Devoted Disciple';
          if (profile.photoUrl !== undefined) updates.photoUrl = profile.photoUrl || null;
          await updateDoc(commRef, updates);
        } catch (err) {
          // silently handle
        }
      }
    },

    createDevotional: async (devotionalData) => {
      const id = 'dev_' + Date.now().toString(36);
      let scheduledPublishAt = devotionalData.scheduledPublishAt || null;
      if (
        !scheduledPublishAt &&
        devotionalData.scheduledDate &&
        devotionalData.scheduledTimezone !== 'user_local'
      ) {
        scheduledPublishAt = computeIsoFromZonedDateTime(
          devotionalData.scheduledDate,
          devotionalData.scheduledTime || '06:00',
          devotionalData.scheduledTimezone || 'Africa/Lagos'
        );
      }

      const newDevotional: Devotional = {
        ...devotionalData,
        id,
        scheduledPublishAt,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updated = deduplicateDevotionals([newDevotional, ...get().devotionals]);
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
      const current = get().devotionals;
      const target = current.find((d) => d.id === id);

      const effectiveDate =
        updates.scheduledDate !== undefined ? updates.scheduledDate : target?.scheduledDate;
      const effectiveTime =
        updates.scheduledTime !== undefined ? updates.scheduledTime : target?.scheduledTime;
      const effectiveTimezone =
        updates.scheduledTimezone !== undefined ? updates.scheduledTimezone : target?.scheduledTimezone;

      let scheduledPublishAt: string | null = null;
      if (effectiveDate && effectiveTimezone !== 'user_local') {
        scheduledPublishAt = computeIsoFromZonedDateTime(
          effectiveDate,
          effectiveTime || '06:00',
          effectiveTimezone || 'Africa/Lagos'
        );
      }

      const merged: Devotional = target
        ? { ...target, ...updates, scheduledPublishAt }
        : ({ id, ...updates, scheduledPublishAt } as Devotional);

      const updated = deduplicateDevotionals(
        !current.some((d) => d.id === id) ? [merged, ...current] : current.map((d) => (d.id === id ? merged : d))
      );
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        const { id: _, ...dataToSave } = merged;
        await setDoc(doc(db, 'devotionals', id), dataToSave, { merge: true });
        console.info('Devotional updated successfully in Firestore:', id);
      } catch (err) {
        console.warn('Update saved locally, cloud sync notice:', err);
      }
    },

    deleteDevotional: async (id) => {
      const updated = get().devotionals.filter((d) => d.id !== id);
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        await deleteDoc(doc(db, 'devotionals', id));
      } catch (err) {
        console.info('Deletion completed locally:', err);
      }
    },

    publishDevotional: async (id) => {
      const now = new Date().toISOString();
      const current = get().devotionals;
      const target = current.find((d) => d.id === id);
      const updated = current.map((d) =>
        d.id === id ? { ...d, publishedAt: now } : d
      );
      persistDevotionals(updated);
      set({ devotionals: updated });

      try {
        if (target) {
          const { id: _, ...data } = { ...target, publishedAt: now };
          await setDoc(doc(db, 'devotionals', id), data, { merge: true });
        } else {
          await updateDoc(doc(db, 'devotionals', id), { publishedAt: now });
        }
      } catch (err) {
        console.info('Publish status saved locally:', err);
      }
    },

    autoPublishScheduledDrafts: async () => {
      const { devotionals } = get();

      // Find all draft devotionals that are due to publish based on date, time, and timezone
      const toAutoPublish = devotionals.filter(
        (d) =>
          d.publishedAt === null &&
          Boolean(d.scheduledDate || d.scheduledPublishAt) &&
          isDevotionalLive(d)
      );

      if (toAutoPublish.length === 0) return;

      const now = new Date().toISOString();
      const publishIds = new Set(toAutoPublish.map((d) => d.id));

      const updated = devotionals.map((d) =>
        publishIds.has(d.id) ? { ...d, publishedAt: now } : d
      );

      persistDevotionals(updated);
      set({ devotionals: updated });

      if (useAuthStore.getState().isAdmin) {
        for (const dev of toAutoPublish) {
          try {
            await updateDoc(doc(db, 'devotionals', dev.id), { publishedAt: now });
            console.info('Automatically published scheduled devotional:', dev.title);
          } catch (err) {
            console.info('Scheduled draft auto-publish noted locally:', err);
          }
        }
      }
    },
  };
});
