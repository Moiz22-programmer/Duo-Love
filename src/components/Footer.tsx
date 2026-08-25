import React from 'react';
import { Heart, ShieldCheck, Sparkles, Lock, Stars } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b0914] border-t border-white/10 py-4 px-4 text-xs text-slate-400 relative z-20">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#f5a623]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-200 tracking-tight text-xs flex items-center gap-1 font-serif">
            DuoLove <span className="text-[10px] font-sans text-[#f5a623] font-semibold">Celestial Sanctuary</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#f5a623]" /> End-to-End Encrypted Space
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Status: 100% Operational
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-[#f5a623] fill-[#f5a623]" /> Private Couple Sanctuary
          </span>
        </div>
      </div>
    </footer>
  );
};
