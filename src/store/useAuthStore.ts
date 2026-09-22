import { create } from 'zustand';
import { UserProfile } from '../types';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  fbSignInAnonymously,
  linkWithPopup,
  fbSignOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '../lib/firebase';

interface AuthState {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => void;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  linkAccount: (email: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  toggleAdminRole: () => Promise<void>;
  recordDevotionalRead: () => Promise<{ streakIncreased: boolean; milestone: number | null }>;
  updateNotificationSettings: (enabled: boolean, reminderTime: string) => Promise<void>;
}

const STORAGE_KEY_USER = 'mdmi_user_profile';
const STORAGE_KEY_GUEST_ID = 'mdmi_guest_uid';

const createLocalGuest = (): UserProfile => {
  let guestId = localStorage.getItem(STORAGE_KEY_GUEST_ID);
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_KEY_GUEST_ID, guestId);
  }

  let streak = 1;
  try {
    const cached = localStorage.getItem(STORAGE_KEY_USER);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.streakCount) streak = parsed.streakCount;
    }
  } catch {
    // ignore
  }

  return {
    uid: guestId,
    displayName: null,
    email: null,
    isAnonymous: true,
    role: 'user',
    streakCount: streak,
    lastReadAt: new Date().toISOString(),
    expoPushToken: null,
    notificationsEnabled: false,
    reminderTime: '07:00',
    createdAt: new Date().toISOString(),
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  error: null,

  initialize: () => {
    // 1. Instantly populate with local user state so UI renders with zero layout delay
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        set({
          user: parsed,
          isAdmin: parsed.role === 'admin',
          isLoading: false,
        });
      } else {
        const guest = createLocalGuest();
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(guest));
        set({ user: guest, isAdmin: false, isLoading: false });
      }
    } catch {
      const guest = createLocalGuest();
      set({ user: guest, isAdmin: false, isLoading: false });
    }

    // 2. Attach Firebase Auth listener
    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            const updatedProfile: UserProfile = {
              ...data,
              uid: fbUser.uid,
              displayName: fbUser.displayName || data.displayName,
              email: fbUser.email || data.email,
              isAnonymous: fbUser.isAnonymous,
            };
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedProfile));
            set({
              user: updatedProfile,
              isAdmin: updatedProfile.role === 'admin',
              isLoading: false,
              error: null,
            });
          } else {
            const existingStreak = get().user?.streakCount || 1;
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || (fbUser.isAnonymous ? null : 'Devoted Disciple'),
              email: fbUser.email || null,
              isAnonymous: fbUser.isAnonymous,
              role: 'user',
              streakCount: existingStreak,
              lastReadAt: new Date().toISOString(),
              expoPushToken: null,
              notificationsEnabled: false,
              reminderTime: '07:00',
              createdAt: new Date().toISOString(),
            };

            try {
              await setDoc(userDocRef, newProfile);
            } catch (writeErr) {
              console.warn('User profile initial write notice:', writeErr);
            }

            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newProfile));
            set({
              user: newProfile,
              isAdmin: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (err) {
          console.warn('Firestore user fetch notice (using cached state):', err);
          set({ isLoading: false });
        }
      } else {
        // Attempt anonymous sign-in in the background
        try {
          await fbSignInAnonymously(auth);
        } catch (anonErr: any) {
          // If Anonymous auth is not enabled in Firebase Console (auth/admin-restricted-operation),
          // graceful fallback ensures the user has full guest access without any errors
          console.info('Operating with local guest session (Firebase anonymous provider disabled in console).');
          const guest = get().user || createLocalGuest();
          set({ user: guest, isLoading: false });
        }
      }
    });
  },

  signInAnonymously: async () => {
    try {
      await fbSignInAnonymously(auth);
    } catch {
      const guest = createLocalGuest();
      set({ user: guest, isAdmin: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    const currentFbUser = auth.currentUser;

    try {
      let credential;
      // If currently an authenticated anonymous user, link to preserve exact UID
      if (currentFbUser && currentFbUser.isAnonymous) {
        try {
          credential = await linkWithPopup(currentFbUser, googleProvider);
        } catch (linkError: any) {
          if (
            linkError.code === 'auth/credential-already-in-use' ||
            linkError.code === 'auth/email-already-in-use'
          ) {
            credential = await signInWithPopup(auth, googleProvider);
          } else {
            credential = await signInWithPopup(auth, googleProvider);
          }
        }
      } else {
        credential = await signInWithPopup(auth, googleProvider);
      }

      const fbUser = credential.user;
      const userDocRef = doc(db, 'users', fbUser.uid);

      let profile: UserProfile;
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          profile = {
            ...(userDocSnap.data() as UserProfile),
            displayName: fbUser.displayName || userDocSnap.data().displayName,
            email: fbUser.email || userDocSnap.data().email,
            isAnonymous: false,
          };
          await updateDoc(userDocRef, {
            displayName: profile.displayName,
            email: profile.email,
            isAnonymous: false,
          });
        } else {
          profile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Devoted Disciple',
            email: fbUser.email,
            isAnonymous: false,
            role: 'user',
            streakCount: get().user?.streakCount || 1,
            lastReadAt: new Date().toISOString(),
            expoPushToken: null,
            notificationsEnabled: false,
            reminderTime: '07:00',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, profile);
        }
      } catch {
        profile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Devoted Disciple',
          email: fbUser.email,
          isAnonymous: false,
          role: 'user',
          streakCount: get().user?.streakCount || 1,
          lastReadAt: new Date().toISOString(),
          expoPushToken: null,
          notificationsEnabled: false,
          reminderTime: '07:00',
          createdAt: new Date().toISOString(),
        };
      }

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      set({
        user: profile,
        isAdmin: profile.role === 'admin',
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (err: any) {
      console.warn('Google Sign-In Notice:', err);
      const errorMessage = err.message || 'Google Sign-In failed. Please try again.';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  linkAccount: async (email: string, displayName: string) => {
    const current = get().user;
    if (!current) {
      return { success: false, error: 'No active session found.' };
    }

    const updatedUser: UserProfile = {
      ...current,
      displayName: displayName.trim() || 'Devoted Disciple',
      email: email.trim().toLowerCase(),
      isAnonymous: false,
    };

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await setDoc(userDocRef, updatedUser, { merge: true });
      } catch (err) {
        console.warn('Firestore link notice:', err);
      }
    }

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    set({ user: updatedUser });
    return { success: true };
  },

  signOut: async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    const freshGuest = createLocalGuest();
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(freshGuest));
    set({ user: freshGuest, isAdmin: false });
  },

  toggleAdminRole: async () => {
    const current = get().user;
    if (!current) return;
    const newRole = current.role === 'admin' ? 'user' : 'admin';
    const updated: UserProfile = { ...current, role: newRole };

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await updateDoc(userDocRef, { role: newRole });
      } catch (err) {
        console.warn('Firestore admin role update notice:', err);
      }
    }

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    set({ user: updated, isAdmin: newRole === 'admin' });
  },

  recordDevotionalRead: async () => {
    const current = get().user;
    if (!current) return { streakIncreased: false, milestone: null };

    const now = new Date();
    const last = current.lastReadAt ? new Date(current.lastReadAt) : null;

    let streakCount = current.streakCount;
    let streakIncreased = false;

    if (!last) {
      streakCount = 1;
      streakIncreased = true;
    } else {
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      const sameDay = now.toDateString() === last.toDateString();

      if (!sameDay) {
        if (diffDays === 1) {
          streakCount += 1;
          streakIncreased = true;
        } else if (diffDays > 1) {
          streakCount = 1;
          streakIncreased = true;
        }
      }
    }

    let milestone: number | null = null;
    if (streakCount === 7 || streakCount === 30 || streakCount === 100) {
      milestone = streakCount;
    }

    const updatedUser: UserProfile = {
      ...current,
      streakCount,
      lastReadAt: now.toISOString(),
    };

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await updateDoc(userDocRef, {
          streakCount,
          lastReadAt: now.toISOString(),
        });
      } catch (err) {
        console.warn('Firestore streak update notice:', err);
      }
    }

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    set({ user: updatedUser });

    return { streakIncreased, milestone };
  },

  updateNotificationSettings: async (enabled: boolean, reminderTime: string) => {
    const current = get().user;
    if (!current) return;
    const updated: UserProfile = {
      ...current,
      notificationsEnabled: enabled,
      reminderTime,
    };

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await updateDoc(userDocRef, {
          notificationsEnabled: enabled,
          reminderTime,
        });
      } catch (err) {
        console.warn('Firestore notification update notice:', err);
      }
    }

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    set({ user: updated });
  },
}));
