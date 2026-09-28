import { create } from 'zustand';
import { UserProfile, DailyActivityItem, ReadingSessionRecord } from '../types';
import { useJournalStore } from './useJournalStore';
import { useBookmarkStore } from './useBookmarkStore';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  fbSignInAnonymously,
  linkWithPopup,
  fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from '../lib/firebase';

export const BOOTSTRAP_ADMIN_EMAIL = 'ibitoyetimothy5@gmail.com';

interface WeeklySummary {
  days: DailyActivityItem[];
  totalMinutes: number;
  changePercent: number;
  previousWeekMinutes: number;
}

interface AuthState {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => void;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string; verificationSent?: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  checkEmailVerification: () => Promise<boolean>;
  linkAccount: (email: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  toggleAdminRole: () => Promise<void>;
  fetchAllRegisteredUsers: () => Promise<UserProfile[]>;
  promoteUserToAdmin: (targetUid: string) => Promise<{ success: boolean; error?: string }>;
  demoteUserFromAdmin: (targetUid: string, targetEmail?: string | null) => Promise<{ success: boolean; error?: string }>;
  adminVerifyDisciple: (targetUid: string) => Promise<{ success: boolean; error?: string }>;
  recordDevotionalRead: () => Promise<{ streakIncreased: boolean; milestone: number | null }>;
  recordReadingSession: (
    devotionalId: string,
    devotionalTitle: string,
    minutes?: number
  ) => Promise<{ streakIncreased: boolean; milestone: number | null; totalMinutes: number; currentStreak: number }>;
  getWeeklyActivity: () => WeeklySummary;
  updateNotificationSettings: (enabled: boolean, reminderTime: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const STORAGE_KEY_USER = 'mdmi_user_profile';
const STORAGE_KEY_GUEST_ID = 'mdmi_guest_uid';

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const createLocalGuest = (): UserProfile => {
  let guestId = localStorage.getItem(STORAGE_KEY_GUEST_ID);
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_KEY_GUEST_ID, guestId);
  }

  let streak = 0;
  let totalMinutes = 0;
  let completed = 0;
  let readingLogs: Record<string, number> = {};
  let lastReadAt: string | null = null;

  try {
    const cached = localStorage.getItem(STORAGE_KEY_USER);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (typeof parsed.streakCount === 'number' && parsed.streakCount !== 3) streak = parsed.streakCount;
      if (typeof parsed.totalMinutesRead === 'number' && parsed.totalMinutesRead !== 68 && parsed.totalMinutesRead !== 65) totalMinutes = parsed.totalMinutesRead;
      if (typeof parsed.completedDevotionalsCount === 'number' && parsed.completedDevotionalsCount !== 5 && parsed.completedDevotionalsCount !== 4) completed = parsed.completedDevotionalsCount;
      if (parsed.readingLogs && typeof parsed.readingLogs === 'object') readingLogs = parsed.readingLogs;
      if (parsed.lastReadAt) lastReadAt = parsed.lastReadAt;
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
    totalMinutesRead: totalMinutes,
    completedDevotionalsCount: completed,
    readingLogs,
    lastReadAt,
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
        if (!parsed.readingLogs) {
          parsed.readingLogs = {};
        }
        if (parsed.totalMinutesRead === undefined || parsed.totalMinutesRead === 68 || parsed.totalMinutesRead === 65) {
          parsed.totalMinutesRead = Object.values(parsed.readingLogs).reduce((a, b) => a + b, 0);
        }
        if (parsed.completedDevotionalsCount === undefined || parsed.completedDevotionalsCount === 4 || parsed.completedDevotionalsCount === 5) {
          parsed.completedDevotionalsCount = 0;
        }
        if (parsed.streakCount === undefined || parsed.streakCount === 3) {
          parsed.streakCount = Object.keys(parsed.readingLogs).length > 0 ? 1 : 0;
        }

        const isBootstrapEmail =
          parsed.email?.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        const effectiveAdmin = parsed.role === 'admin' || isBootstrapEmail;

        set({
          user: {
            ...parsed,
            role: effectiveAdmin ? 'admin' : 'user',
          },
          isAdmin: effectiveAdmin,
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

    // 2. Check for incoming Firebase Auth action codes in the URL (e.g. Email Verification links)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const oobCode = urlParams.get('oobCode');

        if (mode === 'verifyEmail' && oobCode) {
          applyActionCode(auth, oobCode)
            .then(async () => {
              console.info('Email verified successfully via email link action code.');
              if (auth.currentUser) {
                await auth.currentUser.reload();
                const currentProfile = get().user;
                if (currentProfile) {
                  const updated = { ...currentProfile, emailVerified: true };
                  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
                  set({ user: updated });
                  try {
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                      emailVerified: true,
                    });
                  } catch {
                    // ignore
                  }
                }
              }
              // Clean URL query params so verification doesn't re-trigger
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            })
            .catch((codeErr) => {
              console.warn('Notice processing email verification link code:', codeErr);
            });
        }
      } catch (paramErr) {
        console.warn('URL param parse notice:', paramErr);
      }
    }

    // 3. Attach Firebase Auth listener
    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userEmail = (fbUser.email || '').toLowerCase().trim();
          const isBootstrapAdmin = userEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

          // Check if explicit authorization exists in /admins/{uid}
          let hasAdminDoc = false;
          try {
            const adminDocSnap = await getDoc(doc(db, 'admins', fbUser.uid));
            if (adminDocSnap.exists()) {
              hasAdminDoc = true;
            }
          } catch {
            // ignore
          }

          // If bootstrapped admin, guarantee doc in /admins/{uid}
          if (isBootstrapAdmin && !hasAdminDoc) {
            try {
              await setDoc(doc(db, 'admins', fbUser.uid), {
                uid: fbUser.uid,
                email: fbUser.email,
                role: 'admin',
                promotedAt: new Date().toISOString(),
                promotedBy: 'system_bootstrap',
              });
              hasAdminDoc = true;
            } catch (adminErr) {
              console.warn('Admin record write notice:', adminErr);
            }
          }

          // GUEST SESSIONS: If anonymous, do NOT create or fetch document in Firestore 'users' collection!
          // Guest users operate locally so they are NOT added to the disciples roster.
          if (fbUser.isAnonymous) {
            const guestProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: null,
              email: null,
              emailVerified: false,
              isAnonymous: true,
              role: 'user',
              streakCount: 0,
              totalMinutesRead: 0,
              completedDevotionalsCount: 0,
              readingLogs: {},
              lastReadAt: null,
              expoPushToken: null,
              notificationsEnabled: false,
              reminderTime: '07:00',
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(guestProfile));
            set({
              user: guestProfile,
              isAdmin: false,
              isLoading: false,
              error: null,
            });
            return;
          }

          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            const isDocAdmin = data.role === 'admin';
            const finalRole: 'user' | 'admin' =
              isBootstrapAdmin || hasAdminDoc || isDocAdmin ? 'admin' : 'user';

            const updatedProfile: UserProfile = {
              ...data,
              uid: fbUser.uid,
              displayName: fbUser.displayName || data.displayName,
              email: fbUser.email || data.email,
              emailVerified: fbUser.emailVerified,
              role: finalRole,
              isAnonymous: false,
              streakCount: data.streakCount ?? 0,
              readingLogs: data.readingLogs || {},
              totalMinutesRead: data.totalMinutesRead ?? 0,
              completedDevotionalsCount: data.completedDevotionalsCount ?? 0,
              lastReadAt: data.lastReadAt || null,
            };

            // If role needed to be synchronized to admin in Firestore
            if (finalRole === 'admin' && data.role !== 'admin') {
              try {
                await updateDoc(userDocRef, { role: 'admin' });
              } catch {
                // ignore
              }
            }

            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedProfile));
            set({
              user: updatedProfile,
              isAdmin: finalRole === 'admin',
              isLoading: false,
              error: null,
            });
          } else {
            const finalRole: 'user' | 'admin' = isBootstrapAdmin ? 'admin' : 'user';
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || 'Devoted Disciple',
              email: fbUser.email || null,
              emailVerified: fbUser.emailVerified,
              isAnonymous: false,
              role: finalRole,
              streakCount: 0,
              totalMinutesRead: 0,
              completedDevotionalsCount: 0,
              readingLogs: {},
              lastReadAt: null,
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
              isAdmin: finalRole === 'admin',
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
          console.info('Operating with local guest session.');
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
      if (currentFbUser && currentFbUser.isAnonymous) {
        try {
          credential = await linkWithPopup(currentFbUser, googleProvider);
        } catch (linkError: any) {
          credential = await signInWithPopup(auth, googleProvider);
        }
      } else {
        credential = await signInWithPopup(auth, googleProvider);
      }

      const fbUser = credential.user;
      const userEmail = (fbUser.email || '').toLowerCase().trim();
      const isBootstrapAdmin = userEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      // Check /admins/{uid}
      let hasAdminDoc = false;
      try {
        const adminDocSnap = await getDoc(doc(db, 'admins', fbUser.uid));
        if (adminDocSnap.exists()) {
          hasAdminDoc = true;
        }
      } catch {
        // ignore
      }

      if (isBootstrapAdmin && !hasAdminDoc) {
        try {
          await setDoc(doc(db, 'admins', fbUser.uid), {
            uid: fbUser.uid,
            email: fbUser.email,
            role: 'admin',
            promotedAt: new Date().toISOString(),
            promotedBy: 'system_bootstrap',
          });
          hasAdminDoc = true;
        } catch (err) {
          console.warn('Admin record write notice:', err);
        }
      }

      const userDocRef = doc(db, 'users', fbUser.uid);

      let profile: UserProfile;
      try {
        const userDocSnap = await getDoc(userDocRef);
        const prev = get().user;

        if (userDocSnap.exists()) {
          const snapData = userDocSnap.data() as UserProfile;
          const isDocAdmin = snapData.role === 'admin';
          const finalRole: 'user' | 'admin' =
            isBootstrapAdmin || hasAdminDoc || isDocAdmin ? 'admin' : 'user';

          profile = {
            ...snapData,
            displayName: fbUser.displayName || snapData.displayName,
            email: fbUser.email || snapData.email,
            role: finalRole,
            isAnonymous: false,
            streakCount: snapData.streakCount ?? 0,
            readingLogs: snapData.readingLogs || {},
            totalMinutesRead: snapData.totalMinutesRead ?? 0,
            completedDevotionalsCount: snapData.completedDevotionalsCount ?? 0,
            lastReadAt: snapData.lastReadAt || null,
          };

          await updateDoc(userDocRef, {
            displayName: profile.displayName,
            email: profile.email,
            role: finalRole,
            isAnonymous: false,
          });
        } else {
          const finalRole: 'user' | 'admin' = isBootstrapAdmin ? 'admin' : 'user';
          profile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Devoted Disciple',
            email: fbUser.email,
            isAnonymous: false,
            role: finalRole,
            streakCount: 0,
            totalMinutesRead: 0,
            completedDevotionalsCount: 0,
            readingLogs: {},
            lastReadAt: null,
            expoPushToken: null,
            notificationsEnabled: false,
            reminderTime: '07:00',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, profile);
        }
      } catch {
        const finalRole: 'user' | 'admin' = isBootstrapAdmin ? 'admin' : 'user';
        profile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Devoted Disciple',
          email: fbUser.email,
          isAnonymous: false,
          role: finalRole,
          streakCount: 0,
          totalMinutesRead: 0,
          completedDevotionalsCount: 0,
          readingLogs: {},
          lastReadAt: null,
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

  registerWithEmail: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim() || 'Devoted Disciple';

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      try {
        await updateProfile(fbUser, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('Profile name update notice:', profileErr);
      }

      let verificationSent = false;
      try {
        await sendEmailVerification(fbUser);
        verificationSent = true;
      } catch (verErr) {
        console.warn('Verification email dispatch notice:', verErr);
      }

      const isBootstrapAdmin = cleanEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      const finalRole: 'user' | 'admin' = isBootstrapAdmin ? 'admin' : 'user';

      if (isBootstrapAdmin) {
        try {
          await setDoc(doc(db, 'admins', fbUser.uid), {
            uid: fbUser.uid,
            email: cleanEmail,
            role: 'admin',
            promotedAt: new Date().toISOString(),
            promotedBy: 'bootstrap_registration',
          });
        } catch (adminErr) {
          console.warn('Admin record write notice:', adminErr);
        }
      }

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        displayName: cleanName,
        email: cleanEmail,
        emailVerified: fbUser.emailVerified,
        isAnonymous: false,
        role: finalRole,
        streakCount: 0,
        totalMinutesRead: 0,
        completedDevotionalsCount: 0,
        readingLogs: {},
        lastReadAt: null,
        expoPushToken: null,
        notificationsEnabled: false,
        reminderTime: '07:00',
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), newProfile);
      } catch (firestoreErr) {
        console.warn('Firestore profile registration notice:', firestoreErr);
      }

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newProfile));
      set({
        user: newProfile,
        isAdmin: finalRole === 'admin',
        isLoading: false,
        error: null,
      });

      return { success: true, verificationSent };
    } catch (err: any) {
      console.warn('Registration error:', err);
      let errorMsg = 'Failed to register account. Please check your details.';
      if (err.code === 'auth/operation-not-allowed') {
        errorMsg =
          'Email/Password sign-in is disabled in Firebase console. Please enable it in Firebase Console under Authentication > Sign-in method > Email/Password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please sign in or use Forgot Password.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      const isBootstrapAdmin = cleanEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      // Check /admins/{uid}
      let hasAdminDoc = false;
      try {
        const adminDocSnap = await getDoc(doc(db, 'admins', fbUser.uid));
        if (adminDocSnap.exists()) {
          hasAdminDoc = true;
        }
      } catch {
        // ignore
      }

      if (isBootstrapAdmin && !hasAdminDoc) {
        try {
          await setDoc(doc(db, 'admins', fbUser.uid), {
            uid: fbUser.uid,
            email: cleanEmail,
            role: 'admin',
            promotedAt: new Date().toISOString(),
            promotedBy: 'bootstrap_signin',
          });
          hasAdminDoc = true;
        } catch {
          // ignore
        }
      }

      const userDocRef = doc(db, 'users', fbUser.uid);
      let profile: UserProfile;

      try {
        const userDocSnap = await getDoc(userDocRef);
        const prev = get().user;

        if (userDocSnap.exists()) {
          const snapData = userDocSnap.data() as UserProfile;
          const isDocAdmin = snapData.role === 'admin';
          const finalRole: 'user' | 'admin' =
            isBootstrapAdmin || hasAdminDoc || isDocAdmin ? 'admin' : 'user';

          profile = {
            ...snapData,
            uid: fbUser.uid,
            displayName: fbUser.displayName || snapData.displayName || 'Devoted Disciple',
            email: cleanEmail,
            emailVerified: fbUser.emailVerified,
            role: finalRole,
            isAnonymous: false,
            streakCount: snapData.streakCount ?? 0,
            readingLogs: snapData.readingLogs || {},
            totalMinutesRead: snapData.totalMinutesRead ?? 0,
            completedDevotionalsCount: snapData.completedDevotionalsCount ?? 0,
            lastReadAt: snapData.lastReadAt || null,
          };

          await updateDoc(userDocRef, {
            displayName: profile.displayName,
            email: cleanEmail,
            role: finalRole,
            isAnonymous: false,
            emailVerified: fbUser.emailVerified,
          });
        } else {
          const finalRole: 'user' | 'admin' = isBootstrapAdmin ? 'admin' : 'user';
          profile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Devoted Disciple',
            email: cleanEmail,
            emailVerified: fbUser.emailVerified,
            isAnonymous: false,
            role: finalRole,
            streakCount: 0,
            totalMinutesRead: 0,
            completedDevotionalsCount: 0,
            readingLogs: {},
            lastReadAt: null,
            expoPushToken: null,
            notificationsEnabled: false,
            reminderTime: '07:00',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, profile);
        }
      } catch {
        const finalRole: 'user' | 'admin' = isBootstrapAdmin ? 'admin' : 'user';
        profile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Devoted Disciple',
          email: cleanEmail,
          emailVerified: fbUser.emailVerified,
          isAnonymous: false,
          role: finalRole,
          streakCount: 0,
          totalMinutesRead: 0,
          completedDevotionalsCount: 0,
          readingLogs: {},
          lastReadAt: null,
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
      console.warn('Sign-in error:', err);
      let errorMsg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/operation-not-allowed') {
        errorMsg =
          'Email/Password sign-in is disabled in Firebase console. Please enable it in Firebase Console under Authentication > Sign-in method > Email/Password.';
      } else if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        errorMsg = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Access temporarily locked due to many failed attempts. Try again later or reset password.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  sendPasswordReset: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (err: any) {
      console.warn('Password reset error:', err);
      let errorMsg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No registered disciple found with that email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  },

  resendVerificationEmail: async () => {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser) {
      return { success: false, error: 'No active authenticated user found. Please sign in.' };
    }

    try {
      if (typeof window !== 'undefined') {
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        await sendEmailVerification(currentFbUser, actionCodeSettings);
      } else {
        await sendEmailVerification(currentFbUser);
      }
      return { success: true };
    } catch (err: any) {
      console.info('Retrying verification email without actionCodeSettings URL:', err);
      try {
        await sendEmailVerification(currentFbUser);
        return { success: true };
      } catch (fallbackErr: any) {
        console.warn('Resend verification error:', fallbackErr);
        return {
          success: false,
          error:
            fallbackErr.message ||
            'Failed to dispatch verification email. Please check your network and try again in 1 minute.',
        };
      }
    }
  },

  checkEmailVerification: async () => {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser) return false;

    try {
      await currentFbUser.reload();
      const isVerified = currentFbUser.emailVerified;
      const currentProfile = get().user;
      if (currentProfile && currentProfile.emailVerified !== isVerified) {
        const updated = { ...currentProfile, emailVerified: isVerified };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
        set({ user: updated });
        try {
          await updateDoc(doc(db, 'users', currentFbUser.uid), { emailVerified: isVerified });
        } catch {
          // ignore
        }
      }
      return isVerified;
    } catch {
      return false;
    }
  },

  linkAccount: async (email: string, displayName: string) => {
    const current = get().user;
    if (!current) {
      return { success: false, error: 'No active session found.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const isBootstrapAdmin = cleanEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const targetRole = isBootstrapAdmin || current.role === 'admin' ? 'admin' : 'user';

    const updatedUser: UserProfile = {
      ...current,
      displayName: displayName.trim() || 'Devoted Disciple',
      email: cleanEmail,
      role: targetRole,
      isAnonymous: false,
    };

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await setDoc(userDocRef, updatedUser, { merge: true });

        if (targetRole === 'admin') {
          await setDoc(doc(db, 'admins', current.uid), {
            uid: current.uid,
            email: cleanEmail,
            role: 'admin',
            promotedAt: new Date().toISOString(),
            promotedBy: 'account_link',
          });
        }
      } catch (err) {
        console.warn('Firestore link notice:', err);
      }
    }

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    set({ user: updatedUser, isAdmin: targetRole === 'admin' });
    return { success: true };
  },

  signOut: async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    useJournalStore.getState().resetJournal();
    useBookmarkStore.getState().resetBookmarks();
    const freshGuest = createLocalGuest();
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(freshGuest));
    set({ user: freshGuest, isAdmin: false });
  },

  // Internal safety toggle (only works for verified administrators or bootstrap)
  toggleAdminRole: async () => {
    const current = get().user;
    if (!current) return;
    
    // Only permit role changes if user is already an admin or matches bootstrap email
    const isBootstrap = current.email?.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    if (!get().isAdmin && !isBootstrap) {
      console.warn('Unauthorized attempt to elevate to admin role.');
      return;
    }

    const newRole = current.role === 'admin' ? 'user' : 'admin';
    const updated: UserProfile = { ...current, role: newRole };

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await updateDoc(userDocRef, { role: newRole });
        if (newRole === 'admin') {
          await setDoc(doc(db, 'admins', current.uid), {
            uid: current.uid,
            email: current.email,
            role: 'admin',
            promotedAt: new Date().toISOString(),
          });
        } else {
          await deleteDoc(doc(db, 'admins', current.uid));
        }
      } catch (err) {
        console.warn('Firestore admin role update notice:', err);
      }
    }

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    set({ user: updated, isAdmin: newRole === 'admin' });
  },

  fetchAllRegisteredUsers: async () => {
    if (!get().isAdmin) {
      return [];
    }
    try {
      const usersColRef = collection(db, 'users');
      const snapshot = await getDocs(usersColRef);
      const userList: UserProfile[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        const uid = docSnap.id;
        const email = data.email || null;

        // CRITICAL: Strictly exclude guest / anonymous users from registered disciples list!
        if (data.isAnonymous || !email) {
          return;
        }

        const isBootstrap = email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        const role = isBootstrap ? 'admin' : (data.role || 'user');

        userList.push({
          ...data,
          uid,
          displayName: data.displayName || 'Devoted Disciple',
          email,
          emailVerified: data.emailVerified ?? false,
          isAnonymous: false,
          role,
          streakCount: data.streakCount ?? 0,
          totalMinutesRead: data.totalMinutesRead ?? 0,
          completedDevotionalsCount: data.completedDevotionalsCount ?? 0,
          notificationsEnabled: data.notificationsEnabled ?? false,
          reminderTime: data.reminderTime || '07:00',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // If current user is registered (not guest), ensure their latest state is synchronized
      const current = get().user;
      if (current && !current.isAnonymous && current.email) {
        const idx = userList.findIndex((u) => u.uid === current.uid);
        if (idx >= 0) {
          userList[idx] = { ...userList[idx], ...current };
        } else {
          userList.unshift(current);
        }
      }

      return userList;
    } catch (err: any) {
      console.warn('Notice fetching registered users from Firestore:', err);
      const current = get().user;
      return current && !current.isAnonymous && current.email ? [current] : [];
    }
  },

  promoteUserToAdmin: async (targetUid: string) => {
    if (!get().isAdmin) {
      return { success: false, error: 'Only authorized ministry overseers can promote users.' };
    }

    try {
      const targetUserRef = doc(db, 'users', targetUid);
      await updateDoc(targetUserRef, { role: 'admin' });

      // Record in /admins/{targetUid}
      const adminDocRef = doc(db, 'admins', targetUid);
      await setDoc(adminDocRef, {
        uid: targetUid,
        role: 'admin',
        promotedAt: new Date().toISOString(),
        promotedBy: get().user?.email || get().user?.uid || 'overseer',
      });

      // If promoting self
      if (get().user?.uid === targetUid) {
        const updated = { ...get().user!, role: 'admin' as const };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
        set({ user: updated, isAdmin: true });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error promoting user to admin:', err);
      return { success: false, error: err.message || 'Failed to promote user to admin.' };
    }
  },

  demoteUserFromAdmin: async (targetUid: string, targetEmail?: string | null) => {
    if (!get().isAdmin) {
      return { success: false, error: 'Only authorized ministry overseers can modify admin roles.' };
    }

    // Safety guard: cannot demote primary overseer
    if (
      targetEmail?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
      targetUid === BOOTSTRAP_ADMIN_EMAIL
    ) {
      return { success: false, error: 'The primary ministry overseer cannot be demoted.' };
    }

    // Safety guard: cannot demote self
    if (get().user?.uid === targetUid) {
      return { success: false, error: 'You cannot demote yourself from the admin console.' };
    }

    try {
      const targetUserRef = doc(db, 'users', targetUid);
      await updateDoc(targetUserRef, { role: 'user' });

      try {
        const adminDocRef = doc(db, 'admins', targetUid);
        await deleteDoc(adminDocRef);
      } catch {
        // ignore if not found
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error demoting user from admin:', err);
      return { success: false, error: err.message || 'Failed to revoke admin privileges.' };
    }
  },

  adminVerifyDisciple: async (targetUid: string) => {
    if (!get().isAdmin) {
      return { success: false, error: 'Only authorized ministry overseers can verify disciples.' };
    }
    try {
      const targetUserRef = doc(db, 'users', targetUid);
      await updateDoc(targetUserRef, { emailVerified: true });
      if (get().user?.uid === targetUid) {
        const updated = { ...get().user!, emailVerified: true };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
        set({ user: updated });
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error verifying disciple:', err);
      return { success: false, error: err.message || 'Failed to verify disciple.' };
    }
  },

  recordReadingSession: async (devotionalId: string, devotionalTitle: string, minutes = 5) => {
    const current = get().user;
    if (!current) {
      return { streakIncreased: false, milestone: null, totalMinutes: 0, currentStreak: 0 };
    }

    const now = new Date();
    const todayStr = formatLocalDate(now);
    const last = current.lastReadAt ? new Date(current.lastReadAt) : null;

    let streakCount = current.streakCount || 0;
    let streakIncreased = false;

    if (!last || streakCount === 0) {
      streakCount = 1;
      streakIncreased = true;
    } else {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = formatLocalDate(yesterday);
      const lastStr = formatLocalDate(last);

      if (lastStr === todayStr) {
        streakIncreased = false;
      } else if (lastStr === yesterdayStr) {
        streakCount += 1;
        streakIncreased = true;
      } else {
        streakCount = 1;
        streakIncreased = true;
      }
    }

    let milestone: number | null = null;
    if (streakCount === 7 || streakCount === 30 || streakCount === 100) {
      milestone = streakCount;
    }

    const currentLogs = { ...(current.readingLogs || {}) };
    currentLogs[todayStr] = (currentLogs[todayStr] || 0) + minutes;

    const totalMinutes = (current.totalMinutesRead || 0) + minutes;
    const completedCount = (current.completedDevotionalsCount || 0) + 1;

    const updatedUser: UserProfile = {
      ...current,
      streakCount,
      totalMinutesRead: totalMinutes,
      completedDevotionalsCount: completedCount,
      readingLogs: currentLogs,
      lastReadAt: now.toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    set({ user: updatedUser });

    // Persist to Firestore
    if (auth.currentUser && auth.currentUser.uid === current.uid) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await updateDoc(userDocRef, {
          streakCount,
          totalMinutesRead: totalMinutes,
          completedDevotionalsCount: completedCount,
          readingLogs: currentLogs,
          lastReadAt: now.toISOString(),
        });

        // Record session into readingHistory subcollection
        const sessionLogRef = doc(collection(db, 'users', current.uid, 'readingHistory'));
        await setDoc(sessionLogRef, {
          devotionalId,
          devotionalTitle,
          minutes,
          date: todayStr,
          timestamp: now.toISOString(),
        });
      } catch (err) {
        console.info('Reading session saved locally:', err);
      }
    }

    return {
      streakIncreased,
      milestone,
      totalMinutes,
      currentStreak: streakCount,
    };
  },

  recordDevotionalRead: async () => {
    const res = await get().recordReadingSession('daily-devotional', 'Today Scripture', 5);
    return { streakIncreased: res.streakIncreased, milestone: res.milestone };
  },

  getWeeklyActivity: () => {
    const user = get().user;
    const readingLogs = user?.readingLogs || {};
    const today = new Date();
    const todayStr = formatLocalDate(today);

    const currentDay = today.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days: DailyActivityItem[] = [];

    let thisWeekTotal = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatLocalDate(d);
      const minutes = readingLogs[dateStr] || 0;
      thisWeekTotal += minutes;

      days.push({
        date: dateStr,
        label: dayLabels[i],
        minutes,
        completed: minutes > 0,
        isToday: dateStr === todayStr,
      });
    }

    let previousWeekMinutes = 0;
    for (let i = 7; i < 14; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() - i);
      const dateStr = formatLocalDate(d);
      previousWeekMinutes += readingLogs[dateStr] || 0;
    }

    let changePercent = 0;
    if (previousWeekMinutes === 0 && thisWeekTotal > 0) {
      changePercent = 100;
    } else if (previousWeekMinutes > 0) {
      changePercent = Math.round(((thisWeekTotal - previousWeekMinutes) / previousWeekMinutes) * 100);
    }

    return {
      days,
      totalMinutes: thisWeekTotal,
      changePercent,
      previousWeekMinutes,
    };
  },

  updateNotificationSettings: async (enabled: boolean, reminderTime: string) => {
    const current = get().user;
    if (!current) return;
    const updated: UserProfile = {
      ...current,
      notificationsEnabled: enabled,
      reminderTime,
    };

    if (auth.currentUser && auth.currentUser.uid === current.uid) {
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

  updateUserProfile: async (updates: Partial<UserProfile>) => {
    const current = get().user;
    if (!current) return;

    // Zero-trust guard: only administrators can alter role
    const safeUpdates: Partial<UserProfile> = { ...updates };
    if (!get().isAdmin) {
      delete safeUpdates.role;
    }

    const updated: UserProfile = {
      ...current,
      ...safeUpdates,
    };

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    set({ user: updated });

    if (auth.currentUser && auth.currentUser.uid === current.uid) {
      try {
        const userDocRef = doc(db, 'users', current.uid);
        await setDoc(userDocRef, safeUpdates, { merge: true });
      } catch (err) {
        console.warn('Firestore profile update notice:', err);
      }
    }
  },
}));
