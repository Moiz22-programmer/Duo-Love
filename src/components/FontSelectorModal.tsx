import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Type, Sparkles, Check, X, Heart } from 'lucide-react';
import { CUTE_FONTS } from './SettingsScreen';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FontSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeFont, setActiveFont] = useState<string>(() => {
    return localStorage.getItem('duolove_font') || 'jakarta';
  });
  const [previewCustomText, setPreviewCustomText] = useState('Forever & always in our starry sky ✨');

  useEffect(() => {
    const handleFontChange = (e: any) => {
      if (e.detail) {
        setActiveFont(e.detail);
      }
    };
    window.addEventListener('duolove-font-changed', handleFontChange);
    return () => window.removeEventListener('duolove-font-changed', handleFontChange);
  }, []);

  const handleSelectFont = (fontId: string) => {
    setActiveFont(fontId);
    localStorage.setItem('duolove_font', fontId);
    document.documentElement.setAttribute('data-font', fontId);
    document.body.setAttribute('data-font', fontId);
    window.dispatchEvent(new CustomEvent('duolove-font-changed', { detail: fontId }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="cosmic-card w-full max-w-2xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 flex items-center justify-center text-[#f5a623]">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  Cute Sanctuary Fonts
                  <Sparkles className="w-3.5 h-3.5 text-[#f5a623] animate-pulse" />
                </h3>
                <p className="text-xs text-slate-400 font-light">
                  Pick a cute font style to instantly change the entire website
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Custom preview text tester */}
          <div className="bg-black/40 p-3 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-[#f5a623]" />
                Live Preview Tester:
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPreviewCustomText('I love you to the moon and back 🌙')}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  Moon 🌙
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCustomText('Sweetest smiles with you 💕')}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  Smiles 💕
                </button>
              </div>
            </div>
            <input
              type="text"
              value={previewCustomText}
              onChange={(e) => setPreviewCustomText(e.target.value)}
              className="w-full p-2 bg-black/60 rounded-xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623]"
              placeholder="Type anything to preview in cute fonts..."
            />
          </div>

          {/* Fonts list */}
          <div className="overflow-y-auto pr-1 space-y-2.5 flex-1 max-h-[50vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CUTE_FONTS.map((font) => {
                const isSelected = activeFont === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => handleSelectFont(font.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white/10 border-[#f5a623] shadow-[0_0_16px_var(--theme-glow)] ring-2 ring-[#f5a623]/30'
                        : 'bg-black/30 border-white/10 hover:border-[#f5a623]/40 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-bold text-white"
                          style={{ fontFamily: font.fontFamily }}
                        >
                          {font.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {font.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30">
                              {font.badge}
                            </span>
                          )}
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#f5a623] text-black flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 font-bold" />
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2 font-light">
                        {font.vibe}
                      </p>
                    </div>

                    <div
                      className={`p-2 rounded-xl border text-xs leading-relaxed transition-all ${
                        isSelected
                          ? 'bg-[#f5a623]/10 border-[#f5a623]/30 text-white'
                          : 'bg-black/20 border-white/5 text-slate-300'
                      }`}
                      style={{ fontFamily: font.fontFamily }}
                    >
                      "{previewCustomText || font.sampleQuote}"
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Active font is saved automatically.
            </span>
            <button
              onClick={onClose}
              className="amber-pill-btn text-black px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Done ✨
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
