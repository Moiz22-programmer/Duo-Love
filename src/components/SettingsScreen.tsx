import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, CoupleSpace } from '../types';
import { 
  UserCheck, 
  Calendar, 
  LogOut, 
  Link as LinkIcon, 
  Check, 
  Copy, 
  Shield, 
  Sparkles, 
  UserX, 
  AlertTriangle, 
  Palette, 
  Type, 
  Heart,
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface Props {
  currentUser: User;
  partner: User | null;
  coupleSpace: CoupleSpace | null;
  onUpdateProfile: (name: string, photo: string, status?: string, moodIcon?: string) => Promise<void>;
  onUpdateAnniversary: (dateStr: string) => Promise<void>;
  onDisconnectCouple: () => Promise<void>;
  onSignOut: () => void;
}

export const CUTE_AVATAR_PRESETS = [
  {
    id: 'anime_boy_1',
    label: 'Cosmic Boy',
    category: 'Boyfriend',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'anime_girl_1',
    label: 'Starlight Girl',
    category: 'Girlfriend',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cute_boy_2',
    label: 'Soft Smile',
    category: 'Boyfriend',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cute_girl_2',
    label: 'Angel Halo',
    category: 'Girlfriend',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'aesthetic_boy_3',
    label: 'Coffee Lover',
    category: 'Boyfriend',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'aesthetic_girl_3',
    label: 'Petal Dreamer',
    category: 'Girlfriend',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'chibi_cat_1',
    label: 'Stardust Kitten',
    category: 'Cute Mascot',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'chibi_puppy_1',
    label: 'Golden Pup',
    category: 'Cute Mascot',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'chibi_bunny_1',
    label: 'Moon Bunny',
    category: 'Cute Mascot',
    url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'galaxy_art_1',
    label: 'Constellation Pair',
    category: 'Celestial',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'sunset_pair_2',
    label: 'Golden Duo',
    category: 'Celestial',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'warm_couple_3',
    label: 'Heart Silhouette',
    category: 'Celestial',
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&auto=format&fit=crop&q=80',
  },
];

export interface CuteFontOption {
  id: string;
  name: string;
  category: string;
  vibe: string;
  sampleQuote: string;
  fontFamily: string;
  badge?: string;
}

export const CUTE_FONTS: CuteFontOption[] = [
  {
    id: 'quicksand',
    name: 'Quicksand Soft',
    category: 'Rounded Modern',
    vibe: 'Sweet, bubbly, rounded & super gentle',
    sampleQuote: 'Every little moment with you is magic ✨',
    fontFamily: "'Quicksand', sans-serif",
    badge: 'Popular',
  },
  {
    id: 'caveat',
    name: 'Caveat Handwritten',
    category: 'Romantic Pen',
    vibe: 'Playful love letters & secret diary notes',
    sampleQuote: 'Lost in your eyes forever & always 💕',
    fontFamily: "'Caveat', cursive",
    badge: 'Romantic',
  },
  {
    id: 'comfortaa',
    name: 'Comfortaa Cozy',
    category: 'Soft Bubbly',
    vibe: 'Smooth geometric curves with warm coziness',
    sampleQuote: 'Counting shooting stars in our private sky 🌙',
    fontFamily: "'Comfortaa', cursive",
    badge: 'Aesthetic',
  },
  {
    id: 'fredoka',
    name: 'Fredoka Marshmallow',
    category: 'Playful Chunky',
    vibe: 'Adorable, plump & bouncy lettering',
    sampleQuote: 'Warm tea, soft hugs & happy giggles 🧸',
    fontFamily: "'Fredoka', sans-serif",
    badge: 'Super Cute',
  },
  {
    id: 'sniglet',
    name: 'Sniglet Whimsical',
    category: 'Cute Playful',
    vibe: 'Fairy-tale charm and innocent joy',
    sampleQuote: 'Sweet kisses, pink clouds and whispered dreams 🌸',
    fontFamily: "'Sniglet', cursive",
  },
  {
    id: 'patrick-hand',
    name: 'Patrick Hand Journal',
    category: 'Scrapbook Pen',
    vibe: 'Neat, heartfelt journal penmanship',
    sampleQuote: 'Our love story written in eternal starlight 📖',
    fontFamily: "'Patrick Hand', cursive",
  },
  {
    id: 'itim',
    name: 'Itim Gentle Note',
    category: 'Delicate Whimsy',
    vibe: 'Soft, graceful hand-lettered touch',
    sampleQuote: 'You make my whole heart flutter softly 🍓',
    fontFamily: "'Itim', cursive",
  },
  {
    id: 'celestial-serif',
    name: 'Playfair Fairy Tale',
    category: 'Celestial Romance',
    vibe: 'Royal vintage storybook elegance',
    sampleQuote: 'Destined across galaxies and lifetimes 👑',
    fontFamily: "'Playfair Display', serif",
  },
  {
    id: 'jakarta',
    name: 'Jakarta Minimalist',
    category: 'Clean Luxury',
    vibe: 'Crisp, contemporary sanctuary design',
    sampleQuote: 'Pure connection, endless devotion 💫',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
];

export const PALETTES = [
  {
    id: 'celestial',
    name: 'Celestial Starlight',
    desc: 'Deep cosmic violet & stardust amber',
    colors: ['#9333EA', '#F5A623', '#FCD34D'],
    bg: '#090714',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    desc: 'Shimmering emerald & polar cyan',
    colors: ['#059669', '#06B6D4', '#34D399'],
    bg: '#031514',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour Sunset',
    desc: 'Warm sunset amber, crimson & rose',
    colors: ['#E11D48', '#F59E0B', '#FDE047'],
    bg: '#18070B',
  },
  {
    id: 'midnight-forest',
    name: 'Midnight Forest',
    desc: 'Enchanted nocturnal pine & mint',
    colors: ['#047857', '#0D9488', '#6EE7B7'],
    bg: '#05140C',
  },
  {
    id: 'rose-nebula',
    name: 'Rose Nebula',
    desc: 'Dreamy magenta nebula & blush pink',
    colors: ['#DB2777', '#7C3AED', '#F472B6'],
    bg: '#150510',
  },
  {
    id: 'ocean-abyss',
    name: 'Ocean Deep Abyss',
    desc: 'Royal sapphire blue & aquamarine wave',
    colors: ['#2563EB', '#0284C7', '#38BDF8'],
    bg: '#040E1B',
  },
];

export const SettingsScreen: React.FC<Props> = ({
  currentUser,
  partner,
  coupleSpace,
  onUpdateProfile,
  onUpdateAnniversary,
  onDisconnectCouple,
  onSignOut,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl);
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || '');
  const [moodIcon, setMoodIcon] = useState(currentUser.moodIcon || '🥰');
  const [anniversaryDate, setAnniversaryDate] = useState(coupleSpace?.anniversaryDate || '');
  
  // Avatar Studio state
  const [avatarTab, setAvatarTab] = useState<'upload' | 'preset' | 'url'>('preset');
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('All');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activePalette, setActivePalette] = useState<string>(() => {
    return localStorage.getItem('duolove_palette') || 'celestial';
  });

  const [activeFont, setActiveFont] = useState<string>(() => {
    return localStorage.getItem('duolove_font') || 'quicksand';
  });

  const [previewCustomText, setPreviewCustomText] = useState('Forever & always, in every universe ✨');

  const [savedProfile, setSavedProfile] = useState(false);
  const [savedAnniversary, setSavedAnniversary] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  // Labeled Stacks expansion state (Accordion for minimal, organized UX)
  const [expandedStacks, setExpandedStacks] = useState<Record<string, boolean>>({
    profile: true,
    anniversary: false,
    theme: false,
    testing: false,
    account: false,
  });

  const toggleStack = (key: string) => {
    setExpandedStacks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('duolove_palette') || 'celestial';
    document.documentElement.setAttribute('data-theme', storedTheme);

    const storedFont = localStorage.getItem('duolove_font') || 'quicksand';
    document.documentElement.setAttribute('data-font', storedFont);
  }, []);

  const handleSelectPalette = (paletteId: string) => {
    setActivePalette(paletteId);
    localStorage.setItem('duolove_palette', paletteId);
    document.documentElement.setAttribute('data-theme', paletteId);
    document.body.setAttribute('data-theme', paletteId);
    window.dispatchEvent(new CustomEvent('duolove-theme-changed', { detail: paletteId }));
  };

  const handleSelectFont = (fontId: string) => {
    setActiveFont(fontId);
    localStorage.setItem('duolove_font', fontId);
    document.documentElement.setAttribute('data-font', fontId);
    document.body.setAttribute('data-font', fontId);
    window.dispatchEvent(new CustomEvent('duolove-font-changed', { detail: fontId }));
  };

  // Profile Image Compression and File Picker Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressedDataUrl);
        }
        setIsProcessingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile(displayName, photoUrl, statusMessage, moodIcon);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  const handleSaveAnniversary = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateAnniversary(anniversaryDate);
    setSavedAnniversary(true);
    setTimeout(() => setSavedAnniversary(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const filteredPresets = selectedPresetCategory === 'All'
    ? CUTE_AVATAR_PRESETS
    : CUTE_AVATAR_PRESETS.filter((p) => p.category === selectedPresetCategory);

  return (
    <div className="flex-1 cosmos-grid-bg p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-100 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Title Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="cosmic-card p-5 rounded-3xl flex items-center justify-between border border-white/10"
        >
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Settings & Sanctuary Preferences
              <Sparkles className="w-4 h-4 text-[#f5a623] animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Click any labeled stack below to expand and view options</p>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-[#f5a623]/20 border border-[#f5a623]/40 flex items-center justify-center text-[#f5a623]">
            <Sparkles className="w-4 h-4" />
          </div>
        </motion.div>

        {/* ============================================================
            LABELED STACK 1: PROFILE & IDENTITY (WITH AVATAR CHANGER)
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('profile')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Profile Photo & Identity</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {currentUser.displayName}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Change your avatar photo, upload custom picture, display name & status</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
              <span>{expandedStacks.profile ? 'Collapse' : 'Open Options'}</span>
              {expandedStacks.profile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {expandedStacks.profile && (
            <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-white/10 mt-1">
              
              {/* Profile Photo Studio Section */}
              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-3.5 mt-2">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  
                  {/* Avatar Preview with Camera Overlay */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-[#f5a623]/60 shadow-[0_0_15px_rgba(245,166,35,0.3)] bg-black/60">
                      <img
                        src={photoUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#f5a623] text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title="Upload New Photo from Device"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Change Info & Tab Switchers */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <span>Change Profile Picture</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#f5a623]" />
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Upload from your phone/computer, pick a cute couple preset, or enter an image link.
                      </p>
                    </div>

                    {/* Photo Source Selector Pills */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setAvatarTab('preset')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          avatarTab === 'preset'
                            ? 'bg-[#f5a623] text-black font-bold shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Cute Presets</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAvatarTab('upload');
                          fileInputRef.current?.click();
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          avatarTab === 'upload'
                            ? 'bg-[#f5a623] text-black font-bold shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAvatarTab('url')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          avatarTab === 'url'
                            ? 'bg-[#f5a623] text-black font-bold shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Image Link</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hidden File Input for Device Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* TAB 1: CUTE PRESETS GALLERY */}
                {avatarTab === 'preset' && (
                  <div className="pt-2 border-t border-white/10 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#f5a623]" /> Choose Cute Avatar Preset:
                      </span>
                      
                      {/* Categories filter */}
                      <div className="flex items-center gap-1 text-[10px] overflow-x-auto no-scrollbar">
                        {['All', 'Boyfriend', 'Girlfriend', 'Cute Mascot', 'Celestial'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedPresetCategory(cat)}
                            className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                              selectedPresetCategory === cat
                                ? 'bg-[#f5a623]/30 text-[#f5a623] font-bold border border-[#f5a623]/50'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                      {filteredPresets.map((preset) => {
                        const isSelected = photoUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setPhotoUrl(preset.url)}
                            className={`group relative rounded-2xl overflow-hidden aspect-square border transition-all cursor-pointer p-0.5 ${
                              isSelected
                                ? 'ring-2 ring-[#f5a623] border-transparent scale-105 shadow-[0_0_12px_rgba(245,166,35,0.4)]'
                                : 'border-white/10 hover:border-white/30 hover:scale-102'
                            }`}
                            title={preset.label}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-[#f5a623]" />
                              </div>
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 text-center font-medium truncate px-1">
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: UPLOAD FILE STATUS & DRAG DROP */}
                {avatarTab === 'upload' && (
                  <div className="pt-2 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#f5a623]/40 hover:border-[#f5a623] bg-white/[0.02] hover:bg-[#f5a623]/5 rounded-2xl p-4 text-center cursor-pointer transition-all space-y-1.5"
                    >
                      <Upload className="w-6 h-6 text-[#f5a623] mx-auto animate-bounce" />
                      <p className="text-xs font-bold text-white">
                        {isProcessingPhoto ? 'Compressing & Loading Photo...' : 'Click to Browse Device Photo'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Supports PNG, JPG, WEBP • Automatically optimized for quick sync
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: CUSTOM URL INPUT */}
                {avatarTab === 'url' && (
                  <div className="pt-2 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
                    <label className="text-[11px] font-bold text-slate-300 block">Paste Image URL Link:</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://example.com/my-photo.jpg"
                        className="flex-1 p-2 bg-black/60 rounded-xl border border-white/10 text-white outline-none focus:border-[#f5a623] text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Display Name, Status Message & Mood Icon Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-2.5 bg-black/40 rounded-xl border border-white/10 text-white outline-none focus:border-[#f5a623]"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Current Mood / Whisper</label>
                    <input
                      type="text"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      placeholder="e.g. Lost in your stardust ✨"
                      className="w-full p-2.5 bg-black/40 rounded-xl border border-white/10 text-white outline-none focus:border-[#f5a623]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Select Mood Icon</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['😊', '💖', '✨', '☕', '😴', '🌸', '🎮', '🍕', '🌙', '🥰', '🧸'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMoodIcon(m)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border cursor-pointer transition-all ${
                          moodIcon === m
                            ? 'bg-[#f5a623]/20 border-[#f5a623] scale-110 shadow-sm'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="amber-pill-btn text-black font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 hover:scale-105"
                  >
                    {savedProfile ? <Check className="w-4 h-4" /> : null}
                    <span>{savedProfile ? 'Profile & Photo Saved! ✨' : 'Save Profile & Photo Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 2: RELATIONSHIP & ANNIVERSARY
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('anniversary')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-[#f5a623]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Special Anniversary Date</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623]">
                    {coupleSpace.anniversaryDate || 'Set Date'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Date when your stars aligned and love journey began</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
              <span>{expandedStacks.anniversary ? 'Collapse' : 'Open Options'}</span>
              {expandedStacks.anniversary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {expandedStacks.anniversary && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-white/10 mt-1">
              <form onSubmit={handleSaveAnniversary} className="flex flex-col sm:flex-row items-end gap-3 text-xs pt-2">
                <div className="flex-1 w-full">
                  <label className="font-bold text-slate-300 block mb-1">When did your stars align?</label>
                  <input
                    type="date"
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                    className="w-full p-2.5 bg-black/40 rounded-xl border border-white/10 outline-none focus:border-[#f5a623] text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto amber-pill-btn text-black font-bold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 justify-center"
                >
                  {savedAnniversary ? <Check className="w-4 h-4" /> : null}
                  <span>{savedAnniversary ? 'Updated!' : 'Update Date'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 3: CUTE FONTS & ATMOSPHERE PALETTES
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('theme')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-pink-300">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Typography Studio & Atmospheric Themes</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
                    {CUTE_FONTS.find(f => f.id === activeFont)?.name || activeFont}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">9 handwritten & bubbly fonts applied whole-site</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
              <span>{expandedStacks.theme ? 'Collapse' : 'Open Options'}</span>
              {expandedStacks.theme ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {expandedStacks.theme && (
            <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-white/10 mt-1">
              {/* Live phrase previewer input */}
              <div className="bg-black/40 p-3 rounded-2xl border border-white/10 space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#f5a623]" /> Live Font Testing Previewer:
                  </label>
                  <button
                    onClick={() => setPreviewCustomText('Forever & always, in every universe ✨')}
                    className="text-[10px] text-[#f5a623] hover:underline"
                  >
                    Sample Quote
                  </button>
                </div>
                <input
                  type="text"
                  value={previewCustomText}
                  onChange={(e) => setPreviewCustomText(e.target.value)}
                  placeholder="Type any phrase to test fonts live..."
                  className="w-full p-2 bg-black/60 rounded-xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623]"
                />
              </div>

              {/* Fonts Grid */}
              <div>
                <span className="text-xs font-bold text-slate-200 block mb-2">Select Cute Typography (Applies across all screens):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CUTE_FONTS.map((font) => {
                    const isSelected = activeFont === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => handleSelectFont(font.id)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white/10 border-[#f5a623] shadow-md ring-1 ring-[#f5a623]'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white" style={{ fontFamily: font.fontFamily }}>
                            {font.name}
                          </span>
                          {isSelected && <span className="text-[10px] text-[#f5a623] font-bold">✓ Active</span>}
                        </div>
                        <p className="text-[11px] text-slate-300 italic p-1.5 rounded-lg bg-black/30 truncate" style={{ fontFamily: font.fontFamily }}>
                          "{previewCustomText || font.sampleQuote}"
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Palettes Grid */}
              <div className="border-t border-white/10 pt-3">
                <span className="text-xs font-bold text-slate-200 block mb-2">Select Color Atmosphere:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PALETTES.map((pal) => {
                    const isSelected = activePalette === pal.id;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => handleSelectPalette(pal.id)}
                        className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white/10 border-[#f5a623] shadow-md'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-bold text-white block truncate mb-1">{pal.name}</span>
                        <div className="flex items-center gap-1">
                          {pal.colors.map((c, i) => (
                            <span key={i} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 4: SANCTUARY SHARING & PAIRING LINK
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('testing')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-300">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Sanctuary Sharing & Pairing Link</span>
                </h3>
                <p className="text-[11px] text-slate-400">Copy direct sanctuary link to invite or connect with your partner</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
              <span>{expandedStacks.testing ? 'Collapse' : 'Open Options'}</span>
              {expandedStacks.testing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {expandedStacks.testing && (
            <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-white/10 mt-1">
              <div className="pt-2.5 space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">Share Sanctuary Link with Partner:</span>
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="w-full font-mono text-slate-300 bg-transparent outline-none truncate text-xs"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="amber-pill-btn text-black px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 5: ACCOUNT & PRIVACY CONTROLS
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('account')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-300">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Account & Privacy Controls</span>
                </h3>
                <p className="text-[11px] text-slate-400">Disconnect space or sign out of account</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
              <span>{expandedStacks.account ? 'Collapse' : 'Open Options'}</span>
              {expandedStacks.account ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {expandedStacks.account && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-white/10 mt-1">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmDisconnect(true)}
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#f5a623] text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 cursor-pointer flex items-center gap-2 justify-center"
                >
                  <UserX className="w-4 h-4" />
                  <span>Disconnect Space</span>
                </button>

                <button
                  onClick={onSignOut}
                  className="w-full sm:w-auto amber-pill-btn text-black text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 justify-center shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Disconnect Modal */}
      {showConfirmDisconnect && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cosmic-card rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-white/15 text-slate-100">
            <div className="w-12 h-12 bg-[#f5a623]/10 border border-[#f5a623]/40 rounded-full flex items-center justify-center mx-auto text-[#f5a623]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Disconnect Realm?</h3>
            <p className="text-xs text-slate-400">
              This will unpair you from {partner?.displayName || 'Partner'}. You can reconnect anytime by sharing your link.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDisconnect(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirmDisconnect(false);
                  await onDisconnectCouple();
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold amber-pill-btn text-black cursor-pointer shadow-md"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
