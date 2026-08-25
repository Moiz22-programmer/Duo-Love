import React, { useState, useEffect } from 'react';
import { CoupleSpace } from '../types';
import confetti from 'canvas-confetti';
import { Sparkles, Calendar, X, Edit3, Save, Moon, Wand2, Stars } from 'lucide-react';

interface Props {
  coupleSpace: CoupleSpace | null;
  onUpdateAnniversary: (date: string) => void;
  onClose: () => void;
}

export const DaysTogetherWidget: React.FC<Props> = ({
  coupleSpace,
  onUpdateAnniversary,
  onClose,
}) => {
  const currentDate = coupleSpace?.anniversaryDate || new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [isEditing, setIsEditing] = useState(false);

  // Trigger celebration confetti on launch
  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#F59E0B', '#14B8A6', '#C084FC'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const calculateDays = () => {
    const start = new Date(selectedDate).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const daysCount = calculateDays();

  const handleSave = () => {
    onUpdateAnniversary(selectedDate);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="cosmic-card border border-[#f5a623]/60 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden text-slate-100">
        {/* Soft background glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#f5a623]/15 rounded-full blur-2xl" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#f5a623] rounded-full hover:bg-white/10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Stardust Counter Icon */}
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-4 mt-2 bg-[#f5a623] text-black">
          <Sparkles className="w-10 h-10 text-black fill-black" />
        </div>

        <h3 className="text-4xl font-serif font-extrabold text-[#f5a623] tracking-tight">
          {daysCount}
        </h3>
        <p className="text-slate-300 font-serif font-bold text-sm mt-0.5 flex items-center justify-center gap-1">
          <Stars className="w-4 h-4 text-[#f5a623]" />
          Celestial Days Together
        </p>

        {/* Date Selector */}
        <div className="my-6 bg-black/40 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
              Anniversary Date:
            </span>
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="text-[#f5a623] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5" /> Save
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" /> Change
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-black text-xs border border-white/20 rounded-xl px-3 py-2 outline-none text-slate-100 font-semibold text-center mt-1 focus:border-[#f5a623]"
            />
          ) : (
            <p className="text-sm font-serif font-bold text-white mt-1">
              {new Date(selectedDate).toLocaleDateString([], {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Milestones cards */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-left">
            <p className="text-slate-400 text-[10px]">Next Celestial Goal</p>
            <p className="font-serif font-bold text-[#f5a623] mt-0.5">
              {daysCount < 100 ? '100 Days ✨' : daysCount < 365 ? '1 Year 🌙' : '1,000 Days 👑'}
            </p>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-left">
            <p className="text-slate-400 text-[10px]">Bond Status</p>
            <p className="font-serif font-bold text-emerald-400 mt-0.5">Written in the Stars ✨</p>
          </div>
        </div>

      </div>
    </div>
  );
};

