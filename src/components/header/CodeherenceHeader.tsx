"use client";

import React from "react";
import {
  BookOpen,
  Compass,
  BookHeart,
  User,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { MdmiLogo } from "../ui/MdmiLogo";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { TabType } from "../../types";

export interface CodeherenceHeaderProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export function CodeherenceHeader({
  activeTab,
  onSelectTab,
}: CodeherenceHeaderProps) {
  const { user, isAdmin } = useAuthStore();
  const { unreadCount, openDrawer } = useNotificationStore();

  // Desktop navigation items
  const tabs = [
    { id: "home" as TabType, label: "Today", icon: Compass },
    { id: "devotionals" as TabType, label: "Library", icon: BookOpen },
    { id: "journal" as TabType, label: "Journal", icon: BookHeart },
    { id: "profile" as TabType, label: "Profile", icon: User },
    ...(isAdmin ? [{ id: "admin" as TabType, label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full select-none bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-b border-[#E9ECEF] dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Constant Brand Identity - Identical on all screens */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onSelectTab("home")}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
            aria-label="The Master's Discipleship Ministries"
          >
            <div className="relative flex-shrink-0">
              <MdmiLogo size={36} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#84CC16] border-2 border-white dark:border-neutral-950" />
            </div>

            <div className="flex flex-col min-w-0 justify-center">
              <h1 className="text-xs xs:text-sm sm:text-base md:text-lg font-extrabold text-[#172B4D] dark:text-white leading-tight break-words">
                The Master's Discipleship Ministries
              </h1>
            </div>
          </button>
        </div>

        {/* Right: Constant Header Controls - Identical on all screens */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Desktop Navigation Links (Pill layout) */}
          <div className="hidden lg:flex items-center gap-1 bg-[#F8F9FA] dark:bg-neutral-900 border border-[#CAD1D7]/60 dark:border-neutral-800 p-1 rounded-full">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#84CC16] to-[#65A30D] text-white shadow-sm"
                      : "text-[#525F7F] dark:text-neutral-400 hover:text-[#4D7C0F] dark:hover:text-[#84CC16]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Notification Bell with Unread Badge */}
          <button
            type="button"
            onClick={openDrawer}
            className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Link */}
          {user && (
            <button
              type="button"
              onClick={() => onSelectTab("profile")}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#84CC16]/50 transition-all cursor-pointer"
              aria-label="Your Disciple Profile"
              title={user.displayName || "Profile"}
            >
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.displayName || "Profile"}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white dark:border-neutral-900 shadow-xs"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#84CC16] to-[#65A30D] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "D"}
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default CodeherenceHeader;
