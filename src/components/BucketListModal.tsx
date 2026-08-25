import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Sparkles, 
  X, 
  Calendar, 
  Camera, 
  Target, 
  Trash2, 
  Heart, 
  Award,
  Image as ImageIcon
} from 'lucide-react';
import { User, CoupleSpace } from '../types';
import { sounds } from '../lib/audio';

export interface BucketListItem {
  id: string;
  title: string;
  category: 'travel' | 'date' | 'milestone' | 'cozy' | 'adventure';
  targetDate?: string;
  completed: boolean;
  completedAt?: number;
  photoUrl?: string;
  note?: string;
  addedBy: string;
}

interface BucketListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  partner: User;
  coupleSpace: CoupleSpace;
}

const DEFAULT_BUCKET_ITEMS: BucketListItem[] = [
  {
    id: 'b1',
    title: 'Watch the sunset together on a beach',
    category: 'travel',
    targetDate: '2026-09-15',
    completed: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
    note: 'The golden hour sky was absolutely magical!',
    addedBy: 'partner',
  },
  {
    id: 'b2',
    title: 'Bake a cake from scratch together',
    category: 'cozy',
    targetDate: '2026-10-01',
    completed: false,
    addedBy: 'partner',
  },
  {
    id: 'b3',
    title: 'Stargaze under a clear night sky in the mountains',
    category: 'adventure',
    targetDate: '2026-11-20',
    completed: false,
    addedBy: 'partner',
  },
  {
    id: 'b4',
    title: 'Have a candlelit dinner together',
    category: 'date',
    targetDate: '2026-08-25',
    completed: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
    note: 'Delicious food with live acoustic music.',
    addedBy: 'partner',
  },
  {
    id: 'b5',
    title: 'Take a spontaneous road trip with no destination',
    category: 'adventure',
    targetDate: '2026-12-10',
    completed: false,
    addedBy: 'partner',
  },
  {
    id: 'b6',
    title: 'Create our annual scrapbook album',
    category: 'milestone',
    targetDate: '2026-12-31',
    completed: false,
    addedBy: 'partner',
  },
];

const CATEGORY_TAGS = [
  { id: 'all', label: 'All Goals', emoji: '🌟' },
  { id: 'date', label: 'Romantic Dates', emoji: '🌹' },
  { id: 'travel', label: 'Travel & Trips', emoji: '✈️' },
  { id: 'cozy', label: 'Cozy Home', emoji: '☕' },
  { id: 'adventure', label: 'Adventures', emoji: '🏕️' },
  { id: 'milestone', label: 'Life Milestones', emoji: '💍' },
];

export const BucketListModal: React.FC<BucketListModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  partner,
  coupleSpace,
}) => {
  const [items, setItems] = useState<BucketListItem[]>(() => {
    try {
      const saved = localStorage.getItem(`duolove_bucket_list_${coupleSpace.id}`);
      return saved ? JSON.parse(saved) : DEFAULT_BUCKET_ITEMS;
    } catch {
      return DEFAULT_BUCKET_ITEMS;
    }
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New item state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'travel' | 'date' | 'milestone' | 'cozy' | 'adventure'>('date');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Editing completion photo state
  const [completingItemId, setCompletingItemId] = useState<string | null>(null);
  const [proofPhotoUrl, setProofPhotoUrl] = useState('');
  const [proofNote, setProofNote] = useState('');

  const saveItemsToStorage = (updated: BucketListItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(`duolove_bucket_list_${coupleSpace.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleComplete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (!item.completed) {
      // Opening completion proof modal first
      setCompletingItemId(id);
      setProofPhotoUrl('');
      setProofNote('');
      sounds.playSpellSound('chibi_spell');
    } else {
      // Uncheck
      const updated = items.map((i) =>
        i.id === id ? { ...i, completed: false, completedAt: undefined } : i
      );
      saveItemsToStorage(updated);
      sounds.playSpellSound('pop');
    }
  };

  const handleConfirmCompletion = () => {
    if (!completingItemId) return;
    const updated = items.map((i) =>
      i.id === completingItemId
        ? {
            ...i,
            completed: true,
            completedAt: Date.now(),
            photoUrl: proofPhotoUrl.trim() || i.photoUrl,
            note: proofNote.trim() || i.note,
          }
        : i
    );
    saveItemsToStorage(updated);
    setCompletingItemId(null);
    sounds.playSpellSound('hearts_burst');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: BucketListItem = {
      id: `b_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetDate: newTargetDate || undefined,
      completed: false,
      photoUrl: newPhotoUrl.trim() || undefined,
      addedBy: currentUser.uid,
    };

    saveItemsToStorage([newItem, ...items]);
    setNewTitle('');
    setNewTargetDate('');
    setNewPhotoUrl('');
    setShowAddForm(false);
    sounds.playSpellSound('chibi_spell');
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    saveItemsToStorage(updated);
    sounds.playSpellSound('pop');
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = items.filter((i) => {
    if (activeCategory === 'all') return true;
    return i.category === activeCategory;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="cosmic-card border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative text-slate-100 font-serif"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f5a623]/20 border border-[#f5a623]/40 flex items-center justify-center shadow-lg text-[#f5a623]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  Couple Bucket List & Dreams
                </h3>
                <p className="text-xs text-slate-400 font-serif">
                  Shared goals, romantic adventures & milestones with {partner.displayName}
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

          {/* Progress Tracker Bar */}
          <div className="p-4 sm:p-5 bg-black/30 border-b border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold font-serif">
              <span className="text-[#f5a623] flex items-center gap-1.5 font-serif">
                <Award className="w-4 h-4 text-[#f5a623]" />
                Goals Achieved: {completedCount} / {totalCount}
              </span>
              <span className="text-slate-400 font-mono">{progressPercent}% Completed</span>
            </div>
            <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#f5a623] to-amber-200 rounded-full shadow-md"
              />
            </div>
          </div>

          {/* Category Selector Tabs */}
          <div className="px-4 py-3 bg-black/20 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar font-serif">
            {CATEGORY_TAGS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'amber-pill-btn text-black shadow-md font-bold scale-105'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Body Content - Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 font-serif">
            {/* Add New Dream Trigger Button */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-[#f5a623]/50 text-[#f5a623] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add a New Shared Goal or Dream
              </button>
            ) : (
              <form onSubmit={handleAddItem} className="cosmic-card border border-[#f5a623]/50 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-[#f5a623] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#f5a623]" />
                    New Bucket List Goal
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Visit Hunza Valley together..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5a623]"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5a623]"
                    >
                      <option value="date" className="bg-[#0b0914] text-white">🌹 Romantic Date</option>
                      <option value="travel" className="bg-[#0b0914] text-white">✈️ Travel & Trip</option>
                      <option value="cozy" className="bg-[#0b0914] text-white">☕ Cozy Home</option>
                      <option value="adventure" className="bg-[#0b0914] text-white">🏕️ Adventure</option>
                      <option value="milestone" className="bg-[#0b0914] text-white">💍 Life Milestone</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Target Date (Optional)</label>
                    <input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5a623]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Inspiration Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5a623]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl amber-pill-btn text-black text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Save Goal ✨
                  </button>
                </div>
              </form>
            )}

            {/* List of Bucket Items */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-white/5 rounded-2xl border border-white/10 p-4">
                  No bucket list goals in this category yet. Tap 'Add a New Shared Goal' above to create one!
                </div>
              ) : (
                filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
                      item.completed
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-white/5 border-white/10 hover:border-[#f5a623]/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox Toggle */}
                      <button
                        onClick={() => handleToggleComplete(item.id)}
                        className="mt-0.5 text-emerald-400 hover:scale-110 transition-all cursor-pointer flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 hover:text-[#f5a623]" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <p className={`text-xs sm:text-sm font-serif font-bold ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                          {item.title}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400">
                          <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/10 font-semibold uppercase tracking-wider text-[9px] text-[#f5a623]">
                            {item.category}
                          </span>

                          {item.targetDate && (
                            <span className="flex items-center gap-1 font-mono text-slate-400">
                              <Calendar className="w-3 h-3 text-[#f5a623]" />
                              {item.targetDate}
                            </span>
                          )}

                          {item.completed && item.completedAt && (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Achieved {new Date(item.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {item.note && (
                          <p className="text-[11px] text-[#f5a623]/90 italic pt-1 font-serif">
                            "{item.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Photo Proof or Delete Action */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {item.photoUrl && (
                        <a
                          href={item.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-10 h-10 rounded-xl overflow-hidden border border-[#f5a623]/50 shadow-md flex-shrink-0 hover:scale-105 transition-all"
                        >
                          <img src={item.photoUrl} alt="Goal memory" className="w-full h-full object-cover" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Completion Proof Modal Backdrop Overlay */}
          {completingItemId && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="cosmic-card border border-[#f5a623]/70 rounded-3xl p-5 max-w-sm w-full space-y-4 text-center shadow-2xl font-serif">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f5a623]/20 border border-[#f5a623]/40 flex items-center justify-center text-[#f5a623] shadow-lg">
                  <Award className="w-6 h-6 stroke-[2.5]" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-white font-serif">Goal Achieved! 🎉</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Add a photo proof or romantic memory note to celebrate this achievement.
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Photo Proof URL (Optional)</label>
                    <input
                      type="url"
                      value={proofPhotoUrl}
                      onChange={(e) => setProofPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5a623]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Memory Note (Optional)</label>
                    <textarea
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="How was this experience together?..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5a623] h-20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 font-serif">
                  <button
                    onClick={() => setCompletingItemId(null)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Skip & Mark Done
                  </button>
                  <button
                    onClick={handleConfirmCompletion}
                    className="flex-1 py-2 rounded-xl amber-pill-btn text-black text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Save Memory 💖
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
