import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Mail,
  CheckCircle2,
  UserPlus,
  LogIn,
  KeyRound,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthGateSheet: React.FC = () => {
  const { authGateOpen, authGateReason, authModalMode, setAuthModalMode, closeAuthGate } =
    useUIStore();
  const {
    user,
    signInWithGoogle,
    registerWithEmail,
    signInWithEmail,
    sendPasswordReset,
    resendVerificationEmail,
    checkEmailVerification,
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'register' | 'forgot' | 'verify'>(
    authModalMode || 'signin'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Sync mode with store when opened
  useEffect(() => {
    if (authGateOpen && authModalMode) {
      setMode(authModalMode);
      setError(null);
      setSuccessMessage(null);
    }
  }, [authGateOpen, authModalMode]);

  if (!authGateOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setSuccessMessage('Signed in with Google successfully! Your walk is now backed up.');
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
      setError(err?.message || 'Google Sign-In encountered an issue.');
      setIsGoogleLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        setSuccessMessage('Welcome back! Your discipleship history and journals are synced.');
        setTimeout(() => {
          setIsLoading(false);
          setSuccessMessage(null);
          closeAuthGate();
        }, 1400);
      } else {
        setError(res.error || 'Invalid email or password.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your full name or disciple title.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await registerWithEmail(email, password, displayName);
      if (res.success) {
        setVerificationSent(Boolean(res.verificationSent));
        setSuccessMessage(
          'Account created successfully! You are now a registered disciple in the MDMI fellowship.'
        );
        setTimeout(() => {
          setIsLoading(false);
          if (res.verificationSent) {
            setMode('verify');
          } else {
            closeAuthGate();
          }
        }, 1500);
      } else {
        setError(res.error || 'Failed to create account.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during registration.');
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address to receive reset instructions.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await sendPasswordReset(email);
      if (res.success) {
        setSuccessMessage(
          'Password reset email sent! Please check your inbox and spam folder for the link.'
        );
        setIsLoading(false);
      } else {
        setError(res.error || 'Failed to dispatch reset email.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch reset email.');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        setSuccessMessage('A fresh verification link has been sent to your email address.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError(res.error || 'Could not send verification email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    setError(null);
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setSuccessMessage('Your email has been verified! Welcome to full fellowship.');
        setTimeout(() => {
          setCheckingVerification(false);
          closeAuthGate();
        }, 1500);
      } else {
        setError('Email is not yet verified. Please click the link in your email inbox.');
        setCheckingVerification(false);
      }
    } catch {
      setError('Failed to refresh verification status.');
      setCheckingVerification(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="auth-gate-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
        onClick={closeAuthGate}
      >
        <motion.div
          id="auth-gate-sheet"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto text-neutral-900 dark:text-neutral-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E9ECEF] dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 text-[#5E72E4] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base font-display-scripture text-[#172B4D] dark:text-white">
                  {mode === 'signin'
                    ? 'Disciple Sign In'
                    : mode === 'register'
                    ? 'Register Free Account'
                    : mode === 'forgot'
                    ? 'Forgot Password'
                    : 'Verify Your Email'}
                </h3>
                <p className="text-[11px] text-[#525F7F] dark:text-neutral-400">
                  The Master's Discipleship Ministries
                </p>
              </div>
            </div>
            <button
              id="close-auth-gate-btn"
              onClick={closeAuthGate}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Notice */}
          <div className="mt-3.5 p-3 rounded-xl bg-[#F4F5FE] dark:bg-[#5E72E4]/10 border border-[#5E72E4]/20 text-xs text-[#172B4D] dark:text-blue-200 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-[#5E72E4] dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-[#5E72E4]" />
              Persistent Discipleship Account
            </p>
            <p className="mt-0.5 text-[11px] text-[#525F7F] dark:text-neutral-300">
              {authGateReason}
            </p>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-[#F5365C]/10 border border-[#F5365C]/20 text-[#F5365C] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span>{error}</span>
                {error.includes('Firebase Console') && (
                  <p className="mt-1 font-semibold text-[11px] underline">
                    Enable Authentication → Email/Password in your Firebase project.
                  </p>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. SIGN IN MODE */}
          {mode === 'signin' && (
            <div className="mt-4 space-y-4">
              {/* Google Fast Sign-In */}
              <button
                id="google-sign-in-gate-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-[#F4F5FE] dark:hover:bg-neutral-750 active:scale-[0.98] text-[#172B4D] dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs transition-all disabled:opacity-50"
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
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E9ECEF] dark:border-neutral-800" />
                </div>
                <span className="relative px-3 bg-white dark:bg-neutral-900 text-[10px] text-[#8898AA] uppercase tracking-wider font-semibold">
                  or sign in with email & password
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="signin-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] font-bold text-[#5E72E4] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="signin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Your account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="signin-submit-btn"
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#5E72E4] hover:bg-[#4a5ec4] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(94,114,228,0.35)] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Toggle to Register */}
              <div className="text-center pt-3 border-t border-[#E9ECEF] dark:border-neutral-800">
                <p className="text-xs text-[#525F7F] dark:text-neutral-400">
                  New to The Master's Discipleship Ministries?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-[#5E72E4] hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 2. REGISTER MODE */}
          {mode === 'register' && (
            <div className="mt-4 space-y-4">
              <button
                id="google-register-gate-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-[#F4F5FE] dark:hover:bg-neutral-750 active:scale-[0.98] text-[#172B4D] dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs transition-all disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <span>Connecting with Google...</span>
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
                    <span>Register with Google</span>
                  </>
                )}
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E9ECEF] dark:border-neutral-800" />
                </div>
                <span className="relative px-3 bg-white dark:bg-neutral-900 text-[10px] text-[#8898AA] uppercase tracking-wider font-semibold">
                  or register with email
                </span>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                    Full Name / Disciple Name
                  </label>
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    placeholder="e.g. Bro. David Joshua"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                    Password (Min. 6 characters)
                  </label>
                  <input
                    id="register-password-input"
                    type="password"
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="register-confirm-password-input"
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#525F7F] dark:text-neutral-400 pt-1">
                  <Mail className="w-3.5 h-3.5 text-[#5E72E4]" />
                  <span>An email verification link will be sent automatically.</span>
                </div>

                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#5E72E4] hover:bg-[#4a5ec4] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(94,114,228,0.35)] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Registering Account...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Disciple Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-3 border-t border-[#E9ECEF] dark:border-neutral-800">
                <p className="text-xs text-[#525F7F] dark:text-neutral-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-[#5E72E4] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <div className="mt-4 space-y-4">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-300">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Password Recovery
                </p>
                <p className="mt-1 leading-relaxed text-[11px] text-blue-800/80 dark:text-blue-300/80">
                  Enter the email address registered with your MDMI account. We'll send a secure link
                  to reset your credentials.
                </p>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#525F7F] dark:text-neutral-300 mb-1">
                    Registered Email Address
                  </label>
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm text-[#172B4D] dark:text-white focus:outline-none focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]"
                  />
                </div>

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#5E72E4] hover:bg-[#4a5ec4] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(94,114,228,0.35)] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Password Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 4. EMAIL VERIFICATION MODE */}
          {mode === 'verify' && (
            <div className="mt-4 space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Mail className="w-7 h-7" />
              </div>

              <div>
                <h4 className="font-extrabold text-base text-[#172B4D] dark:text-white">
                  Verify Your Email Address
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  A verification link was dispatched to{' '}
                  <span className="font-bold text-[#5E72E4]">{user?.email || email}</span>. Please click
                  the link in your inbox to confirm your discipleship account.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={checkingVerification}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#5E72E4] hover:bg-[#4a5ec4] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(94,114,228,0.35)] transition-all disabled:opacity-50"
                >
                  {checkingVerification ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>I Have Verified My Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Verification Link</span>
                </button>

                <button
                  type="button"
                  onClick={closeAuthGate}
                  className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                >
                  Continue to App (Verify Later)
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
