import React from 'react';
import { MdmiLogo } from './MdmiLogo';
import { Globe, Heart, BookOpen, ExternalLink, Mail, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { TabType } from '../../types';

interface FooterProps {
  onNavigate: (tab: TabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { isAdmin } = useAuthStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#E9ECEF] dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-16 text-[#525F7F] dark:text-neutral-400">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Ministry Info & Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <MdmiLogo size={42} />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#84CC16] bg-lime-500/10 dark:bg-lime-900/30 px-2 py-0.5 rounded">
                  Discipling to Serve
                </span>
                <h4 className="text-base font-bold text-[#172B4D] dark:text-white mt-0.5">
                  The Master's Discipleship Ministries
                </h4>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#525F7F] dark:text-neutral-400 font-serif-reading leading-relaxed max-w-md">
              Committed to raising devoted disciples of our Lord Jesus Christ through daily scripture meditation, fervent prayer, transformative teaching, and selfless kingdom service.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
              <a
                href="https://themastersdiscipleshipministries.org/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-bold text-[#5E72E4] hover:text-[#465AD1] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>themastersdiscipleshipministries.org</span>
                <ExternalLink className="w-3 h-3 text-[#8898AA]" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-[#172B4D] dark:text-white">
              Spiritual Pathways
            </h5>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#5E72E4] transition-colors text-left"
                >
                  Today's Devotional
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('devotionals')}
                  className="hover:text-[#5E72E4] transition-colors text-left"
                >
                  Scripture Library & Archive
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('journal')}
                  className="hover:text-[#5E72E4] transition-colors text-left"
                >
                  Personal Prayer Journal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="hover:text-[#5E72E4] transition-colors text-left"
                >
                  Disciple Settings & Streak
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('admin')}
                    className="hover:text-[#5E72E4] text-[#5E72E4] font-bold transition-colors text-left flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Overseer Console
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Ministry Core Anchors */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-[#172B4D] dark:text-white">
              The Great Commission
            </h5>
            <blockquote className="border-l-2 border-[#5E72E4] pl-3 text-xs italic font-serif-reading text-[#525F7F] dark:text-neutral-400">
              “Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit...”
              <span className="block mt-1 font-sans font-bold text-[10px] text-[#8898AA] not-italic">
                Matthew 28:19
              </span>
            </blockquote>
            <p className="text-[11px] text-[#8898AA] pt-1">
              Serving disciples globally across Africa, the Americas, Europe, Asia, and worldwide.
            </p>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 border-t border-[#E9ECEF] dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8898AA]">
          <p>© {currentYear} The Master's Discipleship Ministries Int'l. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Discipling to Serve</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#5E72E4]">
              <Heart className="w-3 h-3 fill-current text-[#F5365C]" /> In His Love
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
