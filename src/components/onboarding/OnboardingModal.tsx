import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  BookOpen,
  Volume2,
  Flame,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  UserPlus,
  LogIn,
  HeartHandshake,
  Clock,
  Compass,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MdmiLogo } from '../ui/MdmiLogo';
import { WelcomeScreen } from '@/components/ui/onboarding-welcome-screen';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedReminder, setSelectedReminder] = useState('06:00');
  const [selectedFocus, setSelectedFocus] = useState('Spiritual Growth');
  const { openAuthGate } = useUIStore();
  const { updateNotificationSettings } = useAuthStore();

  if (!isOpen) return null;

  const totalSteps = 4; // 0: WelcomeScreen, 1: Spoken Word & Audio, 2: Habits & Consecration, 3: Personalize & Commit

  const handleComplete = () => {
    try {
      localStorage.setItem('mdmi_onboarding_completed', 'true');
      updateNotificationSettings(true, selectedReminder);
    } catch {
      // ignore
    }
    onClose();
  };

  const handleRegister = () => {
    handleComplete();
    openAuthGate('Create a disciple account to back up streaks and reflections.', 'register');
  };

  const handleSignIn = () => {
    handleComplete();
    openAuthGate('Sign in with email or Google to restore your devotional walk.', 'signin');
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.28,
        staggerChildren: 0.12,
      },
    },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 120, damping: 16 },
    },
  };

  return (
    <AnimatePresence>
      <div
        id="onboarding-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="onboarding-modal-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-lg bg-background text-foreground rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]"
        >
          {/* Top navigation header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-border/40 bg-card/60 backdrop-blur-sm z-20">
            <div className="flex items-center gap-2">
              <MdmiLogo size={24} />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                MDMI Sanctuary
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="skip-onboarding-btn"
                type="button"
                onClick={handleComplete}
                className="text-xs font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleComplete}
                aria-label="Close onboarding"
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slide Content Area */}
          <div className="flex-1 overflow-y-auto min-h-[460px] flex flex-col">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="welcome-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col"
                >
                  <WelcomeScreen
                    imageUrl="https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=900&q=80"
                    title={
                      <>
                        Welcome To <span className="text-primary font-black">MDMI Devotionals</span>
                      </>
                    }
                    description="Daily theological bread, spoken audio narration, and consecrated habit tracking by The Master's Discipleship Ministries."
                    buttonText="Begin Spiritual Walk"
                    onButtonClick={nextStep}
                    secondaryActionText={
                      <>
                        Already have an account?{' '}
                        <span className="font-semibold text-primary underline underline-offset-4">
                          Sign In
                        </span>
                      </>
                    }
                    onSecondaryActionClick={handleSignIn}
                  />
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="audio-step"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-6 flex-1 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header badge & Title */}
                    <motion.div variants={itemVariants} className="text-center space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Volume2 className="w-3.5 h-3.5" />
                        Audio Companion
                      </span>
                      <h2 className="text-2xl font-black font-display-scripture tracking-tight text-foreground">
                        Listen to the Spoken Word
                      </h2>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Experience daily devotionals read aloud with natural, calming voices. Designed for morning commutes, prayer walks, and quiet evening meditation.
                      </p>
                    </motion.div>

                    {/* Audio Feature Showcase Card */}
                    <motion.div
                      variants={itemVariants}
                      className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-primary/5 to-muted border border-border/80 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              Abiding in the True Vine
                            </p>
                            <p className="text-[10px] text-muted-foreground">Voice: Michael • 1.0x Pace</p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] border border-emerald-500/20">
                          Spoken Audio
                        </span>
                      </div>

                      {/* Sound wave visual bar */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex items-center gap-0.5 px-0.5">
                        <div className="h-full bg-emerald-500/70 rounded-full w-2/5" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                        <span>Hands-free devotional listening</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Sparkles className="w-3 h-3" />
                          Lockscreen controls supported
                        </span>
                      </div>
                    </motion.div>

                    {/* Feature Bullets */}
                    <motion.div variants={itemVariants} className="space-y-2 pt-1">
                      <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Curated lifelike voices tailored for reverence and clarity.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Adjust playback speed from 0.75x to 1.5x to match your pace.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Offline caching so you can listen even without cellular signal.</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Quote footer */}
                  <motion.div
                    variants={itemVariants}
                    className="p-3 rounded-xl bg-card border border-border text-center"
                  >
                    <p className="font-serif-reading italic text-xs text-foreground/85">
                      “So then faith cometh by hearing, and hearing by the word of God.”
                    </p>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mt-1">
                      Romans 10:17
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="habits-step"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-6 flex-1 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header badge & Title */}
                    <motion.div variants={itemVariants} className="text-center space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <Flame className="w-3.5 h-3.5" />
                        Habit & Fellowship
                      </span>
                      <h2 className="text-2xl font-black font-display-scripture tracking-tight text-foreground">
                        Build a Lasting Devotional Walk
                      </h2>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Discipleship is cultivated day by day. Track your spiritual streak, keep private reflection journals, and fellowship with believers worldwide.
                      </p>
                    </motion.div>

                    {/* Streak & Journal Visual Showcase */}
                    <motion.div
                      variants={itemVariants}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />
                          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                            Streak
                          </span>
                        </div>
                        <div>
                          <p className="text-xl font-black text-foreground">7 Days</p>
                          <p className="text-[10px] text-muted-foreground">Daily consecration milestone</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <span className="text-[10px] font-black uppercase text-primary">
                            Journal
                          </span>
                        </div>
                        <div>
                          <p className="text-xl font-black text-foreground">Private Notes</p>
                          <p className="text-[10px] text-muted-foreground">Cloud-backed meditations</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Feature Bullets */}
                    <motion.div variants={itemVariants} className="space-y-2 pt-1">
                      <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Real-time streak calculation with gracious 36-hour grace periods.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Private spiritual journal to document prayers, answered cries, and lessons.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Fellowship reflection board to affirm brothers and sisters with "Amen".</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Quote footer */}
                  <motion.div
                    variants={itemVariants}
                    className="p-3 rounded-xl bg-card border border-border text-center"
                  >
                    <p className="font-serif-reading italic text-xs text-foreground/85">
                      “And let us consider one another to provoke unto love and to good works.”
                    </p>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mt-1">
                      Hebrews 10:24
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="personalize-step"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-6 flex-1 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Header badge & Title */}
                    <motion.div variants={itemVariants} className="text-center space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                        <Compass className="w-3.5 h-3.5" />
                        Personalize Your Walk
                      </span>
                      <h2 className="text-2xl font-black font-display-scripture tracking-tight text-foreground">
                        Anchor Your Devotional Rhythm
                      </h2>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Choose your quiet time reminder and primary focus so the app can guide your daily walk with the Master.
                      </p>
                    </motion.div>

                    {/* Quiet Time Selector */}
                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Quiet Time Reminder</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { time: '06:00', label: 'Morning Dawn', sub: '6:00 AM' },
                          { time: '12:00', label: 'Midday Manna', sub: '12:00 PM' },
                          { time: '20:00', label: 'Evening Rest', sub: '8:00 PM' },
                        ].map((opt) => (
                          <button
                            key={opt.time}
                            type="button"
                            onClick={() => setSelectedReminder(opt.time)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedReminder === opt.time
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30'
                                : 'bg-card text-foreground border-border hover:bg-muted/80'
                            }`}
                          >
                            <p className="text-xs font-bold">{opt.label}</p>
                            <p
                              className={`text-[10px] mt-0.5 ${
                                selectedReminder === opt.time
                                  ? 'text-primary-foreground/80'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {opt.sub}
                            </p>
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Devotional Study Focus */}
                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Primary Spiritual Focus</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Spiritual Growth', 'Prayer Life', 'Consecration', 'Faith & Trust'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setSelectedFocus(f)}
                            className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                              selectedFocus === f
                                ? 'bg-primary/10 border-primary text-primary font-bold ring-1 ring-primary/40'
                                : 'bg-card border-border text-foreground hover:bg-muted/70'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Auth / Continue Action Options */}
                  <motion.div variants={itemVariants} className="space-y-2 pt-2 border-t border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="onboarding-register-btn"
                        type="button"
                        onClick={handleRegister}
                        className="py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </button>

                      <button
                        id="onboarding-signin-btn"
                        type="button"
                        onClick={handleSignIn}
                        className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted active:scale-[0.98] text-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </button>
                    </div>

                    <button
                      id="onboarding-guest-btn"
                      type="button"
                      onClick={handleComplete}
                      className="w-full py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-border/60"
                    >
                      <HeartHandshake className="w-4 h-4 text-primary" />
                      <span>Enter Sanctuary as Guest Disciple</span>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls (For Steps 1, 2, 3) */}
          {currentStep > 0 && (
            <div className="p-4 px-5 border-t border-border bg-card/60 flex items-center justify-between">
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((stepIdx) => (
                  <button
                    key={stepIdx}
                    type="button"
                    onClick={() => setCurrentStep(stepIdx)}
                    aria-label={`Go to step ${stepIdx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentStep === stepIdx
                        ? 'w-7 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                {currentStep < totalSteps - 1 && (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
