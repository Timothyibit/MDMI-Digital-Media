import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Copy, Check, Palette } from 'lucide-react';
import MotionButton from '@/components/ui/motion-button';
import { useUIStore } from '../../store/useUIStore';

export type CardTheme = 'gold' | 'sepia' | 'dark' | 'olive' | 'crimson' | 'morning';

interface ThemeDefinition {
  id: CardTheme;
  label: string;
  isDarkText: boolean;
  selectorClass: string;
  previewGradient: string;
  previewBorder: string;
  previewText: string;
  previewScripture: string;
  canvasGradStops: [string, string, string];
  canvasTextColor: string;
  canvasScriptureColor: string;
  canvasSubtitleColor: string;
  canvasBorderAccent: string;
}

const THEMES: Record<CardTheme, ThemeDefinition> = {
  gold: {
    id: 'gold',
    label: 'Royal Navy',
    isDarkText: false,
    selectorClass: 'bg-slate-900 border-amber-400 text-white',
    // Darker colors for pure white text
    previewGradient: 'bg-gradient-to-br from-[#080E1B] via-[#101C33] to-[#04070D]',
    previewBorder: 'border-slate-700/80 shadow-2xl',
    previewText: 'text-white',
    previewScripture: 'text-amber-400',
    canvasGradStops: ['#080E1B', '#101C33', '#04070D'],
    canvasTextColor: '#FFFFFF',
    canvasScriptureColor: '#FBBF24',
    canvasSubtitleColor: '#94A3B8',
    canvasBorderAccent: '#1E293B',
  },
  sepia: {
    id: 'sepia',
    label: 'Parchment Bible',
    isDarkText: true,
    selectorClass: 'bg-[#FEF3C7] text-[#3D2314] border-amber-400',
    // Brighter colors for deep dark text
    previewGradient: 'bg-gradient-to-br from-[#FFFDF5] via-[#FEF3C7] to-[#FDE68A]',
    previewBorder: 'border-amber-300 shadow-xl',
    previewText: 'text-[#3D2314]',
    previewScripture: 'text-[#92400E]',
    canvasGradStops: ['#FFFDF5', '#FEF3C7', '#FDE68A'],
    canvasTextColor: '#3D2314',
    canvasScriptureColor: '#92400E',
    canvasSubtitleColor: '#78350F',
    canvasBorderAccent: '#D8C7A4',
  },
  olive: {
    id: 'olive',
    label: 'Mount Olive',
    isDarkText: false,
    selectorClass: 'bg-emerald-950 border-emerald-500 text-white',
    // Darker colors for pure white text
    previewGradient: 'bg-gradient-to-br from-[#072413] via-[#0F3D23] to-[#04160B]',
    previewBorder: 'border-emerald-600/50 shadow-2xl',
    previewText: 'text-white',
    previewScripture: 'text-emerald-300',
    canvasGradStops: ['#072413', '#0F3D23', '#04160B'],
    canvasTextColor: '#FFFFFF',
    canvasScriptureColor: '#86EFAC',
    canvasSubtitleColor: '#A7F3D0',
    canvasBorderAccent: '#164E33',
  },
  crimson: {
    id: 'crimson',
    label: 'Cross Crimson',
    isDarkText: false,
    selectorClass: 'bg-rose-950 border-rose-500 text-white',
    // Darker colors for pure white text
    previewGradient: 'bg-gradient-to-br from-[#450808] via-[#660E0E] to-[#260404]',
    previewBorder: 'border-rose-600/50 shadow-2xl',
    previewText: 'text-white',
    previewScripture: 'text-rose-300',
    canvasGradStops: ['#450808', '#660E0E', '#260404'],
    canvasTextColor: '#FFFFFF',
    canvasScriptureColor: '#FDA4AF',
    canvasSubtitleColor: '#FECDD3',
    canvasBorderAccent: '#881337',
  },
  morning: {
    id: 'morning',
    label: 'Morning Grace',
    isDarkText: true,
    selectorClass: 'bg-emerald-100 text-[#052E16] border-emerald-400',
    // Brighter colors for deep dark text
    previewGradient: 'bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]',
    previewBorder: 'border-emerald-300 shadow-xl',
    previewText: 'text-[#052E16]',
    previewScripture: 'text-[#14532D]',
    canvasGradStops: ['#F0FDF4', '#DCFCE7', '#BBF7D0'],
    canvasTextColor: '#052E16',
    canvasScriptureColor: '#14532D',
    canvasSubtitleColor: '#166534',
    canvasBorderAccent: '#86EFAC',
  },
  dark: {
    id: 'dark',
    label: 'True OLED',
    isDarkText: false,
    selectorClass: 'bg-black border-neutral-700 text-white',
    // Darker colors for pure white text
    previewGradient: 'bg-gradient-to-br from-[#060606] via-[#121212] to-[#000000]',
    previewBorder: 'border-neutral-700/80 shadow-2xl',
    previewText: 'text-white',
    previewScripture: 'text-blue-400',
    canvasGradStops: ['#060606', '#121212', '#000000'],
    canvasTextColor: '#FFFFFF',
    canvasScriptureColor: '#60A5FA',
    canvasSubtitleColor: '#9CA3AF',
    canvasBorderAccent: '#262626',
  },
};

export const VerseShareCard: React.FC = () => {
  const { verseShareModalOpen, shareVerseData, closeVerseShare } = useUIStore();
  const [theme, setTheme] = useState<CardTheme>('gold');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!verseShareModalOpen || !shareVerseData) return null;

  const currentTheme = THEMES[theme] || THEMES.gold;

  const handleCopyText = async () => {
    const text = `"${shareVerseData.scriptureText}" — ${shareVerseData.scripture}\n\nFrom: ${shareVerseData.title} | MDMI Devotionals`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.warn('Clipboard copy failed:', fallbackErr);
      }
    }
  };

  const handleDownloadImage = () => {
    setDownloading(true);
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDownloading(false);
      return;
    }

    // High quality linear gradient background
    // Darker colors for white text, brighter colors for dark text
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, currentTheme.canvasGradStops[0]);
    grad.addColorStop(0.5, currentTheme.canvasGradStops[1]);
    grad.addColorStop(1, currentTheme.canvasGradStops[2]);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative inner border
    ctx.strokeStyle = currentTheme.canvasBorderAccent;
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Ministry Watermark / Top Header
    ctx.fillStyle = currentTheme.canvasScriptureColor;
    ctx.font = 'bold 30px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("THE MASTER'S DISCIPLESHIP MINISTRIES", width / 2, 160);

    ctx.fillStyle = currentTheme.canvasSubtitleColor;
    ctx.font = '500 24px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Daily Scripture Word', width / 2, 210);

    // Scripture Text Word Wrap
    ctx.fillStyle = currentTheme.canvasTextColor;
    ctx.font = 'italic 44px Newsreader, Georgia, serif';
    ctx.textAlign = 'center';

    const words = shareVerseData.scriptureText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = 880;

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(currentLine.trim());
        currentLine = words[n] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    // Center vertical block for text
    const lineHeight = 64;
    const startY = height / 2 - (lines.length * lineHeight) / 2 - 30;

    // Quote mark
    ctx.fillStyle = currentTheme.canvasScriptureColor;
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('“', width / 2, startY - 40);

    // Render scripture lines
    ctx.fillStyle = currentTheme.canvasTextColor;
    ctx.font = 'italic 42px Newsreader, Georgia, serif';
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + index * lineHeight);
    });

    // Scripture Reference
    const refY = startY + lines.length * lineHeight + 60;
    ctx.fillStyle = currentTheme.canvasScriptureColor;
    ctx.font = 'bold 40px Cinzel, Georgia, serif';
    ctx.fillText(shareVerseData.scripture, width / 2, refY);

    // Devotional Title
    ctx.fillStyle = currentTheme.canvasSubtitleColor;
    ctx.font = '500 26px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Devotional: ${shareVerseData.title}`, width / 2, refY + 50);

    // Footer
    ctx.fillStyle = currentTheme.canvasSubtitleColor;
    ctx.font = '400 22px Plus Jakarta Sans, sans-serif';
    ctx.fillText('MDMI Devotionals App • Abide in Him Daily', width / 2, height - 120);

    // Download canvas as PNG
    const link = document.createElement('a');
    link.download = `MDMI-Verse-${shareVerseData.scripture.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shareVerseData.scripture} — MDMI Devotionals`,
          text: `"${shareVerseData.scriptureText}" — ${shareVerseData.scripture} (The Master's Discipleship Ministries)`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <AnimatePresence>
      <div
        id="verse-share-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={closeVerseShare}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-lg w-full bg-gradient-to-br from-[#18181B] via-[#111827] to-[#030712] border border-neutral-800 rounded-3xl p-5 md:p-6 text-white shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-neutral-200">Share Scripture Card</h3>
            <button
              id="close-share-card-btn"
              onClick={closeVerseShare}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-2 mt-4 mb-3 flex-wrap">
            <Palette className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs text-neutral-400 mr-1">Theme Gradient:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.values(THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                    theme === t.id
                      ? 'border-white text-white font-bold ring-2 ring-white/30 scale-105'
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  } ${t.selectorClass}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Preview Card with High-Contrast Gradient */}
          <div
            ref={cardRef}
            className={`my-2 p-6 rounded-2xl border transition-all flex flex-col justify-between aspect-[4/3] text-center relative overflow-hidden ${currentTheme.previewGradient} ${currentTheme.previewBorder} ${currentTheme.previewText}`}
          >
            <div>
              <p
                className={`text-[10px] font-bold tracking-widest uppercase font-display-scripture ${currentTheme.previewScripture}`}
              >
                THE MASTER'S DISCIPLESHIP MINISTRIES
              </p>
            </div>

            <div className="py-3">
              <p className="font-serif-reading italic text-sm md:text-base leading-relaxed">
                “{shareVerseData.scriptureText}”
              </p>
              <p
                className={`mt-2.5 font-display-scripture font-bold text-xs md:text-sm ${currentTheme.previewScripture}`}
              >
                — {shareVerseData.scripture}
              </p>
            </div>

            <div>
              <p className="text-[10px] opacity-75 font-medium truncate">
                {shareVerseData.title} • MDMI Devotionals
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <MotionButton
              id="download-verse-image-btn"
              onClick={handleDownloadImage}
              disabled={downloading}
              variant="ministry-green"
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-white" />}
              label={downloading ? 'Saving...' : 'Save Image'}
              className="w-full justify-center"
            />

            <MotionButton
              id="native-share-verse-btn"
              onClick={handleShareNative}
              variant="secondary"
              size="sm"
              icon={<Share2 className="w-3.5 h-3.5" />}
              label="Share"
              className="w-full justify-center"
            />

            <MotionButton
              id="copy-verse-text-btn"
              onClick={handleCopyText}
              variant="secondary"
              size="sm"
              icon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
              label={copied ? 'Copied!' : 'Copy Verse'}
              className="w-full justify-center"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VerseShareCard;
