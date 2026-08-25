import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Shirt, Glasses, Crown, Smile, Dog, Cat, Check } from 'lucide-react';
import { sounds } from '../lib/audio';

export interface ChibiWardrobeConfig {
  outfit: 'hoodie' | 'sweater' | 'overalls' | 'blazer' | 'kimono';
  hat: 'none' | 'beret' | 'cat_ears' | 'crown' | 'beanie' | 'star_clip';
  prop: 'none' | 'boba' | 'rose' | 'guitar' | 'heart_wand' | 'teddy';
  pet: 'none' | 'kitten' | 'puppy' | 'bunny';
  petName?: string;
}

interface ChibiWardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ChibiWardrobeConfig;
  onSaveConfig: (newConfig: ChibiWardrobeConfig) => void;
  userName: string;
}

const OUTFITS = [
  { id: 'hoodie', name: 'Cozy Hoodie', emoji: '🧥' },
  { id: 'sweater', name: 'Knit Sweater', emoji: '🧶' },
  { id: 'overalls', name: 'Cute Overalls', emoji: '👖' },
  { id: 'blazer', name: 'Chic Blazer', emoji: '👔' },
  { id: 'kimono', name: 'Festive Kimono', emoji: '👘' },
];

const HATS = [
  { id: 'none', name: 'No Hat', emoji: '🚫' },
  { id: 'beret', name: 'French Beret', emoji: '🎨' },
  { id: 'cat_ears', name: 'Cute Cat Ears', emoji: '🐱' },
  { id: 'crown', name: 'Golden Crown', emoji: '👑' },
  { id: 'beanie', name: 'Warm Beanie', emoji: '🧢' },
  { id: 'star_clip', name: 'Sparkle Clip', emoji: '⭐' },
];

const PROPS = [
  { id: 'none', name: 'No Prop', emoji: '🚫' },
  { id: 'boba', name: 'Boba Milk Tea', emoji: '🧋' },
  { id: 'rose', name: 'Fresh Red Rose', emoji: '🌹' },
  { id: 'guitar', name: 'Acoustic Guitar', emoji: '🎸' },
  { id: 'heart_wand', name: 'Magic Heart Wand', emoji: '🪄' },
  { id: 'teddy', name: 'Teddy Bear', emoji: '🧸' },
];

const PETS = [
  { id: 'none', name: 'No Pet Mascot', emoji: '🚫', desc: 'No mascot on stage' },
  { id: 'kitten', name: 'Whiskers the Kitten', emoji: '🐱', desc: 'Sits cheerfully & purrs' },
  { id: 'puppy', name: 'Mochi the Puppy', emoji: '🐶', desc: 'Wags tail near couple' },
  { id: 'bunny', name: 'Fluffy the Bunny', emoji: '🐰', desc: 'Hops with joy' },
];

export const ChibiWardrobeModal: React.FC<ChibiWardrobeModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  userName,
}) => {
  const [outfit, setOutfit] = useState<ChibiWardrobeConfig['outfit']>(currentConfig?.outfit || 'hoodie');
  const [hat, setHat] = useState<ChibiWardrobeConfig['hat']>(currentConfig?.hat || 'none');
  const [prop, setProp] = useState<ChibiWardrobeConfig['prop']>(currentConfig?.prop || 'none');
  const [pet, setPet] = useState<ChibiWardrobeConfig['pet']>(currentConfig?.pet || 'kitten');
  const [petName, setPetName] = useState<string>(currentConfig?.petName || 'Whiskers');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      outfit,
      hat,
      prop,
      pet,
      petName,
    });
    sounds.playSpellSound('chibi_spell');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="cosmic-card border border-white/15 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-slate-100 font-serif"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f5a623]/20 border border-[#f5a623]/40 flex items-center justify-center text-[#f5a623] shadow-lg font-black">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  Chibi Wardrobe & Pet Companion
                </h3>
                <p className="text-xs text-slate-400 font-serif">
                  Customize {userName}'s avatar outfit, accessories & celestial companion
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Options - Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 font-serif">
            {/* 1. Outfits */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#f5a623] flex items-center gap-1.5 uppercase tracking-wider">
                <Shirt className="w-4 h-4 text-[#f5a623]" />
                Outfit Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OUTFITS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setOutfit(o.id as any);
                      sounds.playSpellSound('pop');
                    }}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      outfit === o.id
                        ? 'amber-pill-btn text-black shadow-md scale-105 font-bold'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{o.emoji}</span>
                      <span>{o.name}</span>
                    </span>
                    {outfit === o.id && <Check className="w-4 h-4 text-black" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Hats & Head Accessories */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#f5a623] flex items-center gap-1.5 uppercase tracking-wider">
                <Crown className="w-4 h-4 text-[#f5a623]" />
                Hat & Hair Accessories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HATS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setHat(h.id as any);
                      sounds.playSpellSound('pop');
                    }}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      hat === h.id
                        ? 'amber-pill-btn text-black shadow-md scale-105 font-bold'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{h.emoji}</span>
                      <span>{h.name}</span>
                    </span>
                    {hat === h.id && <Check className="w-4 h-4 text-black" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Held Props */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#f5a623] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#f5a623]" />
                Handheld Props
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROPS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProp(p.id as any);
                      sounds.playSpellSound('pop');
                    }}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      prop === p.id
                        ? 'amber-pill-btn text-black shadow-md scale-105 font-bold'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{p.emoji}</span>
                      <span>{p.name}</span>
                    </span>
                    {prop === p.id && <Check className="w-4 h-4 text-black" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Couple Pet Mascot */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-[#f5a623] flex items-center gap-1.5 uppercase tracking-wider">
                <Cat className="w-4 h-4 text-[#f5a623]" />
                Couple Stage Pet Mascot
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPet(p.id as any);
                      if (p.id !== 'none' && !petName) {
                        setPetName(p.id === 'kitten' ? 'Whiskers' : p.id === 'puppy' ? 'Mochi' : 'Fluffy');
                      }
                      sounds.playSpellSound('chibi_spell');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-start gap-2.5 transition-all cursor-pointer text-left ${
                      pet === p.id
                        ? 'amber-pill-btn text-black shadow-md scale-[1.02]'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl p-1 bg-black/20 rounded-xl">{p.emoji}</span>
                    <div className="space-y-0.5">
                      <p className="font-extrabold">{p.name}</p>
                      <p className={`text-[10px] ${pet === p.id ? 'text-black/80' : 'text-slate-400'}`}>{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {pet !== 'none' && (
                <div className="pt-2">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Give your Pet a Name</label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Pet Name..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#f5a623] font-bold placeholder-slate-500 focus:outline-none focus:border-[#f5a623]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Save */}
          <div className="p-4 bg-black/30 border-t border-white/10 flex items-center justify-end gap-3 font-serif">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-2xl amber-pill-btn text-black text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-black" />
              Save Outfit & Pet ✨
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
