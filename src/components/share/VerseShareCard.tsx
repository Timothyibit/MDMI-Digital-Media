import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Copy, Check, Palette } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

type CardTheme = 'gold' | 'sepia' | 'dark' | 'olive';

export const VerseShareCard: React.FC = () => {
  const { verseShareModalOpen, shareVerseData, closeVerseShare } = useUIStore();
  const [theme, setTheme] = useState<CardTheme>('gold');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!verseShareModalOpen || !shareVerseData) return null;

  const handleCopyText = async () => {
    const text = `"${shareVerseData.scriptureText}" — ${shareVerseData.scripture}\n\nFrom: ${shareVerseData.title} | MDMI Devotionals`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    // Set background according to theme
    let bgColor = '#0F172A';
    let textColor = '#FFFFFF';
    let scriptureColor = '#FBBF24';
    let subtitleColor = '#94A3B8';
    let borderAccent = '#334155';

    if (theme === 'sepia') {
      bgColor = '#F4ECD8';
      textColor = '#5B4636';
      scriptureColor = '#966F33';
      subtitleColor = '#7A624E';
      borderAccent = '#D8C7A4';
    } else if (theme === 'dark') {
      bgColor = '#000000';
      textColor = '#F3F4F6';
      scriptureColor = '#60A5FA';
      subtitleColor = '#9CA3AF';
      borderAccent = '#262626';
    } else if (theme === 'olive') {
      bgColor = '#14281D';
      textColor = '#F0FDF4';
      scriptureColor = '#86EFAC';
      subtitleColor = '#86EFAC';
      borderAccent = '#2D4A3E';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Decorative inner border
    ctx.strokeStyle = borderAccent;
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Ministry Watermark / Top Header
    ctx.fillStyle = scriptureColor;
    ctx.font = 'bold 30px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("THE MASTER'S DISCIPLESHIP MINISTRIES", width / 2, 160);

    ctx.fillStyle = subtitleColor;
    ctx.font = '500 24px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Daily Scripture Word', width / 2, 210);

    // Scripture Text Word Wrap
    ctx.fillStyle = textColor;
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
    const startY = (height / 2) - ((lines.length * lineHeight) / 2) - 30;

    // Quote mark
    ctx.fillStyle = scriptureColor;
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('“', width / 2, startY - 40);

    // Render scripture lines
    ctx.fillStyle = textColor;
    ctx.font = 'italic 42px Newsreader, Georgia, serif';
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + (index * lineHeight));
    });

    // Scripture Reference
    const refY = startY + (lines.length * lineHeight) + 60;
    ctx.fillStyle = scriptureColor;
    ctx.font = 'bold 40px Cinzel, Georgia, serif';
    ctx.fillText(shareVerseData.scripture, width / 2, refY);

    // Devotional Title
    ctx.fillStyle = subtitleColor;
    ctx.font = '500 26px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Devotional: ${shareVerseData.title}`, width / 2, refY + 50);

    // Footer
    ctx.fillStyle = subtitleColor;
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
          className="relative max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 text-white shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-neutral-200">Share Scripture Card</h3>
            <button
              id="close-share-card-btn"
              onClick={closeVerseShare}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-2 mt-4 mb-3">
            <Palette className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs text-neutral-400 mr-2">Theme:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'gold', label: 'Royal Navy', color: 'bg-slate-900 border-amber-400' },
                { id: 'sepia', label: 'Sepia Bible', color: 'bg-[#F4ECD8] text-[#5B4636] border-[#966F33]' },
                { id: 'dark', label: 'True OLED', color: 'bg-black border-neutral-700' },
                { id: 'olive', label: 'Mount Olive', color: 'bg-emerald-950 border-emerald-500' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as CardTheme)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                    theme === t.id
                      ? 'border-white text-white font-bold ring-2 ring-white/20'
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Preview Card */}
          <div
            ref={cardRef}
            className={`my-2 p-6 rounded-2xl border transition-all flex flex-col justify-between aspect-[4/3] text-center relative overflow-hidden ${
              theme === 'sepia'
                ? 'bg-[#F4ECD8] text-[#5B4636] border-[#D8C7A4]'
                : theme === 'dark'
                ? 'bg-black text-white border-neutral-800'
                : theme === 'olive'
                ? 'bg-[#14281D] text-[#F0FDF4] border-emerald-900/60'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div>
              <p
                className={`text-[10px] font-bold tracking-widest uppercase font-display-scripture ${
                  theme === 'sepia'
                    ? 'text-[#966F33]'
                    : theme === 'olive'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                THE MASTER'S DISCIPLESHIP MINISTRIES
              </p>
            </div>

            <div className="py-3">
              <p className="font-serif-reading italic text-sm md:text-base leading-relaxed">
                “{shareVerseData.scriptureText}”
              </p>
              <p
                className={`mt-2.5 font-display-scripture font-bold text-xs md:text-sm ${
                  theme === 'sepia'
                    ? 'text-[#966F33]'
                    : theme === 'olive'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                — {shareVerseData.scripture}
              </p>
            </div>

            <div>
              <p className="text-[10px] opacity-60 truncate">
                {shareVerseData.title} • MDMI Devotionals
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              id="download-verse-image-btn"
              onClick={handleDownloadImage}
              disabled={downloading}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Saving...' : 'Save Image'}</span>
            </button>

            <button
              id="native-share-verse-btn"
              onClick={handleShareNative}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-neutral-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              id="copy-verse-text-btn"
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-neutral-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
