import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Volume2,
  Trash2,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Bell,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import MotionButton from './motion-button';
import { AlertCard } from './card-8';

export default function Demo() {
  const [isDark, setIsDark] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [clickNotice, setClickNotice] = useState<string | null>(null);

  const handleClick = (variant: string) => {
    setClickNotice(`Clicked "${variant}" button - fluid state maintained!`);
    setTimeout(() => setClickNotice(null), 2500);
  };

  return (
    <div
      className={`min-h-screen p-4 sm:p-8 transition-colors duration-300 ${
        isDark ? 'dark bg-neutral-950 text-white' : 'bg-[#F8F9FA] text-[#172B4D]'
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border border-slate-200/90 dark:border-neutral-800 shadow-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Card Gradients & Button Contrast Suite
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Darker gradient colors for white text • Brighter gradient colors for dark text • Fluid responsive cards
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MotionButton
              size="sm"
              variant="secondary"
              icon={isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
              label={isDark ? 'Light Theme' : 'Dark Theme'}
              onClick={() => setIsDark(!isDark)}
            />
            <MotionButton
              size="sm"
              variant="outline"
              icon={isMobileView ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              label={isMobileView ? 'Desktop View' : 'Mobile View (360px)'}
              onClick={() => setIsMobileView(!isMobileView)}
            />
          </div>
        </div>

        {clickNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center animate-fade-in">
            {clickNotice}
          </div>
        )}

        {/* Responsive Testing Container */}
        <div
          className={`mx-auto transition-all duration-300 space-y-8 ${
            isMobileView ? 'max-w-[360px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-4 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50' : 'w-full'
          }`}
        >
          {/* Section: Card Contrast Gradients (Darker for White Text, Brighter for Dark Text) */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-5">
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#65A30D]">
                Card Gradient Contrast Specification
              </span>
              <h3 className="text-lg font-bold mt-0.5">
                Created Cards: Darker Gradients for White Text, Brighter for Dark Text
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Guaranteed WCAG AAA readability: Rich saturated darker color gradients for pure white text, luminous pastel gradients for deep dark text.
              </p>
            </div>

            {/* A: Cards with Darker Colors Gradient for Pure White Text */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                1. Darker Gradients with Pure White Text
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AlertCard
                  variant="ministry-green"
                  badge="Forest Gradient • White Text"
                  icon={<Volume2 className="h-6 w-6 text-white" />}
                  title="Daily Spoken Reflection"
                  description="Darker rich forest green gradient ensures white typography pops with maximum contrast."
                  buttonText="Listen Audio Now"
                  onButtonClick={() => handleClick('card-green')}
                />

                <AlertCard
                  variant="ministry-red"
                  badge="Crimson Gradient • White Text"
                  icon={<Heart className="h-6 w-6 text-white" />}
                  title="Private Prayer Journal"
                  description="Darker crimson wine gradient creates deep contrast for crystal clear reading."
                  buttonText="Open Sanctuary"
                  onButtonClick={() => handleClick('card-red')}
                />
              </div>
            </div>

            {/* B: Cards with Brighter Colors Gradient for Deep Dark Text */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                2. Brighter Gradients with Deep Dark Text
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AlertCard
                  variant="light-amber"
                  badge="Warm Gold • Deep Dark Text"
                  icon={<Sparkles className="h-6 w-6 text-[#451A03]" />}
                  title="Scripture Manna Vault"
                  description="Brighter warm gold gradient with deep espresso text (#451A03) for soft daylight reading."
                  buttonText="Explore Manna"
                  onButtonClick={() => handleClick('card-light-amber')}
                />

                <AlertCard
                  variant="light-emerald"
                  badge="Mint Grace • Deep Dark Text"
                  icon={<CheckCircle2 className="h-6 w-6 text-[#052E16]" />}
                  title="Morning Grace Walk"
                  description="Brighter luminous mint gradient paired with deep pine text (#052E16) for pristine clarity."
                  buttonText="View Reflections"
                  onButtonClick={() => handleClick('card-light-emerald')}
                />
              </div>
            </div>
          </div>

          {/* Section 1: Green & Red Variants (Pure White Text on White Theme) */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#65A30D]">
                Verified Pure White Text
              </span>
              <h3 className="text-base font-bold mt-0.5">
                Green, Forest & Cross Red Variants
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Text stays 100% pure white in unhovered, hovered, and clicked states in both light and dark themes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MotionButton
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4 text-white" />}
                label="Primary Green"
                onClick={() => handleClick('primary')}
              />

              <MotionButton
                variant="ministry-green"
                size="md"
                icon={<Volume2 className="w-4 h-4 text-white" />}
                label="Ministry Forest Green"
                onClick={() => handleClick('ministry-green')}
              />

              <MotionButton
                variant="ministry-red"
                size="md"
                icon={<Heart className="w-4 h-4 text-white" />}
                label="Cross Red (Ministry)"
                onClick={() => handleClick('ministry-red')}
              />

              <MotionButton
                variant="danger"
                size="md"
                icon={<Trash2 className="w-4 h-4 text-white" />}
                label="Danger Red"
                onClick={() => handleClick('danger')}
              />
            </div>
          </div>

          {/* Section 2: Deep Dark Navy & Amber Variants */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#172B4D] dark:text-neutral-300">
                Saturated Variants
              </span>
              <h3 className="text-base font-bold mt-0.5">
                Deep Dark Navy & Amber
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MotionButton
                variant="dark"
                size="md"
                icon={<Lock className="w-4 h-4 text-white" />}
                label="Dark Navy (#172B4D)"
                onClick={() => handleClick('dark')}
              />

              <MotionButton
                variant="warning"
                size="md"
                label="Amber Gold Warning"
                onClick={() => handleClick('warning')}
              />
            </div>
          </div>

          {/* Section 3: Neutral & Theme Surface Buttons */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
                Neutral High-Contrast
              </span>
              <h3 className="text-base font-bold mt-0.5">
                Secondary, White, Outline & Ghost
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MotionButton
                variant="secondary"
                size="md"
                label="Secondary Surface"
                onClick={() => handleClick('secondary')}
              />

              <MotionButton
                variant="white"
                size="md"
                label="White Raised"
                onClick={() => handleClick('white')}
              />

              <MotionButton
                variant="outline"
                size="md"
                label="Outlined"
                onClick={() => handleClick('outline')}
              />

              <MotionButton
                variant="ghost"
                size="md"
                label="Ghost Action"
                onClick={() => handleClick('ghost')}
              />
            </div>
          </div>

          {/* Section 4: Sizing & Full-Width Zero-Layout-Shift Tests */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#65A30D]">
                Scale & Width Robustness
              </span>
              <h3 className="text-base font-bold mt-0.5">
                Small (sm), Medium (md), and Full Width
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Full-width buttons maintain optical balance with zero jitter on smaller screens.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <MotionButton
                  size="sm"
                  variant="primary"
                  label="Small (sm)"
                  onClick={() => handleClick('size-sm')}
                />
                <MotionButton
                  size="md"
                  variant="ministry-green"
                  label="Medium (md)"
                  onClick={() => handleClick('size-md')}
                />
                <MotionButton
                  size="lg"
                  variant="dark"
                  label="Large (lg)"
                  onClick={() => handleClick('size-lg')}
                />
                <MotionButton
                  size="sm"
                  variant="primary"
                  icon={<ArrowRight className="w-3.5 h-3.5 text-white" />}
                  onClick={() => handleClick('icon-only')}
                />
              </div>

              <div className="pt-2">
                <MotionButton
                  size="full"
                  variant="ministry-green"
                  icon={<ArrowRight className="w-4 h-4 text-white" />}
                  label="Full Width Centered Action"
                  onClick={() => handleClick('full-width')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
