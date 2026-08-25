import React from 'react';
import { User, CoupleSpace, Presence } from '../types';
import {
  Sparkles,
  Wand2,
  Stars,
  LogOut,
} from 'lucide-react';

interface Props {
  currentUser: User;
  partner: User | null;
  coupleSpace: CoupleSpace | null;
  presence: Presence | undefined;
  onOpenDaysTogether: () => void;
  onNavigateSettings?: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<Props> = ({
  currentUser,
  partner,
  coupleSpace,
  presence,
  onOpenDaysTogether,
  onNavigateSettings,
  onSignOut,
}) => {
  // Calculate days together
  const calculateDaysTogether = () => {
    if (!coupleSpace?.anniversaryDate) return 1;
    const start = new Date(coupleSpace.anniversaryDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const daysCount = calculateDaysTogether();
  const isOnline = presence?.online ?? true;
  const isTyping = presence?.typing ?? false;

  return (
    <header className="bg-[#0b0914]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-2.5 sticky top-0 z-30 shadow-xl transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Brand Monogram & Partner Info Capsule */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#f5a623] text-[#0b0914] flex items-center justify-center font-serif font-black text-lg shadow-[0_0_12px_var(--theme-glow)]">
              D
            </div>
            <span className="hidden sm:inline font-serif font-bold text-white text-base tracking-tight">
              DuoLove
            </span>
          </div>

          {/* Partner Avatar & Status */}
          <div className="flex items-center gap-2.5">
            {partner ? (
              <div className="relative">
                <img
                  src={partner.photoUrl}
                  alt={partner.displayName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-[#f5a623]/60 shadow-md"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0b0914] ${
                    isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'
                  }`}
                  title={isOnline ? 'Online now' : 'Offline'}
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-300 border border-white/10">
                <Sparkles className="w-4 h-4 text-[#f5a623] animate-pulse" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-serif font-bold text-white text-xs sm:text-sm leading-tight flex items-center gap-1">
                  {partner ? partner.displayName : 'Waiting for Partner...'}
                  <Stars className="w-3 h-3 text-[#f5a623] animate-pulse" />
                </h2>
              </div>

              <div className="text-[11px] font-medium h-3.5 flex items-center gap-1 mt-0.5">
                {partner ? (
                  isTyping ? (
                    <span className="flex items-center gap-1 text-[#f5a623] font-semibold animate-pulse text-[10px]">
                      <Wand2 className="w-2.5 h-2.5 text-[#f5a623]" />
                      whispering... ✨
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">
                      {isOnline ? 'Active in Space' : 'Offline'}
                    </span>
                  )
                ) : (
                  <span className="text-slate-500 text-[10px]">Share link to connect</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Days counter & Current User Profile Capsule & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Days Counter Pill */}
          {coupleSpace && (
            <button
              onClick={onOpenDaysTogether}
              className="flex items-center gap-1.5 bg-[#f5a623]/10 hover:bg-[#f5a623]/20 text-[#f5a623] px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-[#f5a623]/30 cursor-pointer shadow-sm hover:scale-105"
              title="View Days Together & Special Milestones"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#f5a623] text-[#f5a623]" />
              <span className="font-serif hidden sm:inline">{daysCount} Celestial Days</span>
              <span className="font-serif sm:hidden">{daysCount}d</span>
            </button>
          )}

          {/* Current User Quick Avatar & Settings shortcut */}
          <button
            onClick={onNavigateSettings}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-1 pr-2.5 rounded-full border border-white/10 transition-all cursor-pointer group"
            title="Profile & Settings (Change Photo, Font, Themes)"
          >
            <div className="relative">
              <img
                src={currentUser.photoUrl}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-[#f5a623]"
              />
              <span className="absolute -bottom-0.5 -right-0.5 text-[9px]">{currentUser.moodIcon || '🥰'}</span>
            </div>
            <span className="text-xs font-serif font-bold text-slate-200 group-hover:text-[#f5a623] hidden md:inline truncate max-w-[90px]">
              {currentUser.displayName.split(' ')[0]}
            </span>
          </button>

          {/* Clean Sign Out Button */}
          <button
            onClick={onSignOut}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


