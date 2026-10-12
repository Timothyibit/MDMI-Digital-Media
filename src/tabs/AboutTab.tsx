import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  BookOpen,
  Heart,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Compass,
  BookHeart,
  Sparkles,
  Flame,
} from 'lucide-react';
import { MdmiLogo } from '../components/ui/MdmiLogo';
import { useAuthStore } from '../store/useAuthStore';
import { TabType } from '../types';
import { TiltedCollageCard } from '../components/cards';
import { MorphingCardStack, CardData } from '@/components/ui/morphing-card-stack';
import MotionButton from '@/components/ui/motion-button';
import { TjTechLogo } from '../components/ui/TjTechLogo';

interface AboutTabProps {
  onBack?: () => void;
  onNavigate: (tab: TabType) => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({ onBack, onNavigate }) => {
  const { isAdmin } = useAuthStore();
  const currentYear = new Date().getFullYear();

  const ministryPillarsCards: CardData[] = [
    {
      id: "pillar_word",
      title: "The Living Word",
      description: "Rooted in infallible Holy Scripture. Expository teachings and daily meditation to anchor the soul in truth and godly wisdom.",
      icon: <BookOpen className="w-5 h-5" />,
      color: "#5E72E4",
      image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "pillar_prayer",
      title: "Prevailing Prayer",
      description: "Awakening watchmen on the wall. Fervent, spirit-led intercession and midnight prayers that dismantle darkness and align with God's will.",
      icon: <Flame className="w-5 h-5" />,
      color: "#FB6340",
      image: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "pillar_fellowship",
      title: "Holy Fellowship",
      description: "Covenant community and selfless brotherhood in Christ. Bearing one another's burdens and discipling believers to serve in love.",
      icon: <Heart className="w-5 h-5" />,
      color: "#2DCE89",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "pillar_commission",
      title: "The Great Commission",
      description: "Winning souls across nations. Equipping ordinary disciples with spiritual power to take the gospel to unreached communities.",
      icon: <Globe className="w-5 h-5" />,
      color: "#11CDEF",
      image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 170 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="space-y-6 max-w-3xl mx-auto w-full px-1">
        {/* Top Header with Back Navigation */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onBack || (() => onNavigate('profile'))}
            className="flex-row items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <Text className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Back
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
            <Text className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              Mobile App v1.0
            </Text>
          </View>
        </View>

        {/* 1. Tilted Image Collage Showcase (Template 5 Spec) */}
        <TiltedCollageCard
          title="The Master's Discipleship Ministries"
          message="Raising devoted disciples of Jesus Christ through daily scripture meditation, fervent prayer, transformative teaching, and selfless kingdom service."
          actionText="Read Today's Devotional"
          onAction={() => onNavigate('home')}
        />

        {/* Official Website Card */}
        <div className="p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 flex items-center justify-center shrink-0 text-[#5E72E4]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                  Official Ministry Website
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Explore global missions, leadership announcements, and church resources.
                </p>
                <p className="text-[11px] font-mono text-[#5E72E4] mt-1 font-semibold">
                  themastersdiscipleshipministries.org
                </p>
              </div>
            </div>

            <a
              href="https://themastersdiscipleshipministries.org/"
              target="_blank"
              rel="noreferrer noopener"
              className="px-5 py-2.5 rounded-full bg-[#5E72E4] hover:bg-[#4a5ec4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 2. Discipleship Ministry Pillars - Interactive Morphing Card Stack */}
        <div className="p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5E72E4]" />
                <span>Foundational Ministry Pillars</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                The four spiritual anchors of The Master's Discipleship Ministries. Swipe the deck or toggle view modes.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E72E4] bg-[#5E72E4]/10 px-2.5 py-1 rounded-full w-fit">
              Core Principles
            </span>
          </div>

          <MorphingCardStack
            cards={ministryPillarsCards}
            defaultLayout="stack"
            onCardClick={(card) => {
              if (card.id === 'pillar_word') onNavigate('home');
              else if (card.id === 'pillar_prayer') onNavigate('journal');
            }}
          />
        </div>

        {/* Mobile App Capabilities Card */}
        <div className="p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
            React Native Mobile Features
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-lime-500/10 text-[#84CC16] flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Offline Discipleship
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                  Read devotionals and write prayers anywhere, even without internet connection.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5E72E4]/10 text-[#5E72E4] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Cross-Platform Sync
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                  Your reading history and reflections stay safely saved across all your devices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Spiritual Pathways / Navigation */}
        <div className="p-6 rounded-[24px] border border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] text-neutral-950 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
            Quick Pathways
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <MotionButton
              size="md"
              variant="secondary"
              icon={<Compass className="w-4 h-4 text-[#5E72E4]" />}
              label="Today's Word"
              onClick={() => onNavigate('home')}
              className="w-full justify-start"
            />
            <MotionButton
              size="md"
              variant="secondary"
              icon={<BookOpen className="w-4 h-4 text-[#5E72E4]" />}
              label="Archive"
              onClick={() => onNavigate('devotionals')}
              className="w-full justify-start"
            />
            <MotionButton
              size="md"
              variant="secondary"
              icon={<BookHeart className="w-4 h-4 text-[#5E72E4]" />}
              label="Prayer Journal"
              onClick={() => onNavigate('journal')}
              className="w-full justify-start"
            />
            <MotionButton
              size="md"
              variant="secondary"
              icon={<ShieldCheck className="w-4 h-4 text-[#5E72E4]" />}
              label="Profile & Walk"
              onClick={() => onNavigate('profile')}
              className="w-full justify-start"
            />
          </div>
        </div>

        {/* Bottom Copyright & Builder Row */}
        <div className="py-8 text-center space-y-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            © {currentYear} The Master's Discipleship Ministries Int'l. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <span className="font-bold text-[#84CC16]">Discipling to Serve</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#5E72E4]">
              <Heart className="w-3 h-3 fill-red-500 text-red-500" /> In His Love
            </span>
          </div>

          <div className="pt-2 flex justify-center">
            <a
              href="https://www.linkedin.com/company/t-j-tech/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Built by T-J Tech on LinkedIn"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 transition-all hover:scale-[1.02] shadow-2xs group cursor-pointer"
            >
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                Built by
              </span>
              <TjTechLogo size={24} showText={false} />
              <span className="font-extrabold text-xs text-neutral-900 dark:text-white group-hover:text-black dark:group-hover:text-neutral-200 transition-colors">
                T-J Tech
              </span>
              <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-[#0066FF] transition-colors" />
            </a>
          </div>
        </div>
      </View>
    </ScrollView>
  );
};

export default AboutTab;
