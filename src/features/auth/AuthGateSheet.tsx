import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Mail, CheckCircle2, UserCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthGateSheet: React.FC = () => {
  const { authGateOpen, authGateReason, closeAuthGate } = useUIStore();
  const { linkAccount, signInWithGoogle, user } = useAuthStore();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!authGateOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setSuccessMessage('Signed in with Google successfully! Your walk and reflections are backed up in Firestore.');
        setTimeout(() => {
          setIsGoogleLoading(false);
          setSuccessMessage(null);
          closeAuthGate();
        }, 1500);
      } else {
        setError(res.error || 'Google Sign-In failed.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await linkAccount(email, displayName || 'Disciple of Christ');
      if (res.success) {
        setSuccessMessage('Account connected successfully! Your streak, bookmarks, and likes have been preserved in Firestore.');
        setTimeout(() => {
          setIsLoading(false);
          setSuccessMessage(null);
          closeAuthGate();
        }, 1600);
      } else {
        setError(res.error || 'Failed to connect account.');
        setIsLoading(false);
      }
    } catch {
      setError('An unexpected error occurred during account linking.');
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="auth-gate-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
        onClick={closeAuthGate}
      >
        <motion.div
          id="auth-gate-sheet"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto text-neutral-900 dark:text-neutral-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-display-scripture">Sign In with Firebase Auth</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  The Master's Discipleship Ministries
                </p>
              </div>
            </div>
            <button
              id="close-auth-gate-btn"
              onClick={closeAuthGate}
              aria-label="Close dialog"
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body notice */}
          <div className="mt-4 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Preserving Your Devotional Walk
            </p>
            <p className="mt-1">
              {authGateReason} Signing in syncs your {user?.streakCount || 1}-day streak, bookmarks, and reflections across all devices with Firestore.
            </p>
          </div>

          {successMessage ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white font-display-scripture">
                Welcome, Disciple!
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{successMessage}</p>
            </motion.div>
          ) : (
            <div className="mt-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* PRIMARY: Google Sign-In */}
              <button
                id="google-sign-in-gate-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-3 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 active:scale-[0.98] text-neutral-800 dark:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-sm transition-all disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <span>Signing in with Google...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <span className="relative px-3 bg-white dark:bg-neutral-900 text-[10px] text-neutral-400 uppercase tracking-wider">
                  or continue with email
                </span>
              </div>

              {/* SECONDARY: Email / Password Linking */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name / Display Name
                  </label>
                  <input
                    id="auth-name-input"
                    type="text"
                    placeholder="e.g. Bro. David Joshua"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Password
                  </label>
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Linking Account...</span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Link & Preserve Guest History</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Mail className="w-3.5 h-3.5" />
                <span>Protected by Firebase Auth & Firestore rules</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
