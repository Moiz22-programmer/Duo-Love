import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Message, CoupleSpace } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Search, 
  Calendar, 
  Heart, 
  Tag, 
  Edit3, 
  Image as ImageIcon, 
  MessageSquare, 
  Award, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  MapPin, 
  Smile, 
  Share2, 
  Volume2, 
  Filter,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { sounds } from '../lib/audio';

export interface ScrapbookMoment {
  id: string;
  type: 'photo' | 'chat' | 'milestone' | 'voice' | 'manual';
  title?: string;
  caption?: string;
  imageUrl?: string;
  messageText?: string;
  audioUrl?: string;
  audioDuration?: number;
  timestamp: number;
  senderId?: string;
  tags?: string[];
  location?: string;
  sticker?: string;
  isCustom?: boolean;
}

interface Props {
  currentUser: User;
  partner?: User | null;
  coupleSpace?: CoupleSpace | null;
  messages: Message[];
  onUploadPhotoMessage?: (text: string, type: 'image', url: string) => Promise<void>;
  onDeleteMoment?: (momentId: string) => Promise<void> | void;
}

const CUTEST_STICKERS = ['💖', '🌸', '✨', '☕', '🥐', '🧸', '💌', '📸', '🌙', '💍', '🥂', '🎉', '✈️', '🎨', '🐱', '⭐'];

export const ScrapbookScreen: React.FC<Props> = ({
  currentUser,
  partner,
  coupleSpace,
  messages,
  onUploadPhotoMessage,
  onDeleteMoment,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'chat' | 'milestone' | 'voice'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const spaceId = coupleSpace?.id || 'default';

  // Custom captions & manual moments store persisted in local storage
  const [customCaptions, setCustomCaptions] = useState<Record<string, { title?: string; caption?: string; tags?: string[]; sticker?: string; location?: string }>>(() => {
    try {
      const saved = localStorage.getItem(`duolove_scrapbook_captions_${spaceId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [manualMoments, setManualMoments] = useState<ScrapbookMoment[]>(() => {
    try {
      const saved = localStorage.getItem(`duolove_scrapbook_manual_${spaceId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track deleted moment IDs
  const [deletedMomentIds, setDeletedMomentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`duolove_scrapbook_deleted_${spaceId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Delete confirmation dialog
  const [momentToDelete, setMomentToDelete] = useState<ScrapbookMoment | null>(null);

  // Modal states
  const [editingMoment, setEditingMoment] = useState<ScrapbookMoment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editSticker, setEditSticker] = useState('💖');
  const [editLocation, setEditLocation] = useState('');

  // New moment creation modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDateStr, setNewDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [newLocation, setNewLocation] = useState('');
  const [newSticker, setNewSticker] = useState('📸');
  const [newTagsInput, setNewTagsInput] = useState('Memory, Special');

  // Slideshow Story mode state
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  // Save custom captions to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`duolove_scrapbook_captions_${spaceId}`, JSON.stringify(customCaptions));
    } catch (e) {
      console.warn("Error saving scrapbook captions:", e);
    }
  }, [customCaptions, spaceId]);

  // Save manual moments to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`duolove_scrapbook_manual_${spaceId}`, JSON.stringify(manualMoments));
    } catch (e) {
      console.warn("Error saving manual scrapbook moments:", e);
    }
  }, [manualMoments, spaceId]);

  // Save deleted moment IDs to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`duolove_scrapbook_deleted_${spaceId}`, JSON.stringify(deletedMomentIds));
    } catch (e) {
      console.warn("Error saving deleted scrapbook moments:", e);
    }
  }, [deletedMomentIds, spaceId]);

  // Automatically aggregate all shared photos, messages, voice notes & milestones into timeline moments
  const allMoments: ScrapbookMoment[] = useMemo(() => {
    const list: ScrapbookMoment[] = [];

    // 1. Anniversary & Space creation milestone
    if (coupleSpace.anniversaryDate) {
      const annTimestamp = new Date(coupleSpace.anniversaryDate).getTime();
      if (!isNaN(annTimestamp)) {
        const savedOverride = customCaptions['milestone_anniversary'];
        list.push({
          id: 'milestone_anniversary',
          type: 'milestone',
          title: savedOverride?.title || 'Love Space Founded 💕',
          caption: savedOverride?.caption || `Our magical journey officially started on ${new Date(coupleSpace.anniversaryDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}. The beginning of forever!`,
          timestamp: annTimestamp,
          sticker: savedOverride?.sticker || '💍',
          tags: savedOverride?.tags || ['Anniversary', 'SpaceFounded', 'Milestone', 'Forever'],
          location: savedOverride?.location,
        });
      }
    }

    // 2. Parse Chat Messages
    messages.forEach((msg) => {
      const savedOverride = customCaptions[msg.id];

      if (msg.type === 'image' && msg.imageUrl) {
        list.push({
          id: msg.id,
          type: 'photo',
          title: savedOverride?.title || 'Shared Memory Photo 📸',
          caption: savedOverride?.caption || msg.text || 'A beautiful snapshot saved in our space.',
          imageUrl: msg.imageUrl,
          timestamp: msg.createdAt,
          senderId: msg.senderId,
          tags: savedOverride?.tags || ['Photo', 'Snapshot'],
          sticker: savedOverride?.sticker || '🌸',
          location: savedOverride?.location,
        });
      } else if (msg.type === 'audio' && msg.audioUrl) {
        list.push({
          id: msg.id,
          type: 'voice',
          title: savedOverride?.title || 'Heartfelt Voice Note 🎙️',
          caption: savedOverride?.caption || 'A whispered voice note captured in our timeline.',
          audioUrl: msg.audioUrl,
          audioDuration: msg.audioDuration,
          timestamp: msg.createdAt,
          senderId: msg.senderId,
          tags: savedOverride?.tags || ['VoiceNote', 'Whisper'],
          sticker: savedOverride?.sticker || '🎧',
          location: savedOverride?.location,
        });
      } else if (msg.type === 'text' && msg.text && msg.text.trim().length > 0) {
        // Include text messages if they have custom captions OR are love quotes/longer messages
        if (savedOverride || msg.text.length > 20 || msg.text.includes('❤️') || msg.text.includes('love') || msg.text.includes('✨')) {
          list.push({
            id: msg.id,
            type: 'chat',
            title: savedOverride?.title || 'Love Message Highlight 💬',
            caption: savedOverride?.caption || 'A sweet moment from our chat history.',
            messageText: msg.text,
            timestamp: msg.createdAt,
            senderId: msg.senderId,
            tags: savedOverride?.tags || ['SweetText', 'ChatQuote'],
            sticker: savedOverride?.sticker || '💌',
            location: savedOverride?.location,
          });
        }
      }
    });

    // 3. Add Manual Custom Moments
    manualMoments.forEach((mm) => {
      const savedOverride = customCaptions[mm.id];
      list.push({
        ...mm,
        title: savedOverride?.title || mm.title,
        caption: savedOverride?.caption || mm.caption,
        tags: savedOverride?.tags || mm.tags,
        sticker: savedOverride?.sticker || mm.sticker,
        location: savedOverride?.location || mm.location,
      });
    });

    // Sort by timestamp and filter out deleted moments
    return list
      .filter((item) => !deletedMomentIds.includes(item.id))
      .sort((a, b) => (sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));
  }, [messages, coupleSpace.anniversaryDate, customCaptions, manualMoments, deletedMomentIds, sortOrder]);

  // Filter moments
  const filteredMoments = useMemo(() => {
    return allMoments.filter((m) => {
      if (filterType !== 'all' && m.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title?.toLowerCase().includes(q);
        const matchesCaption = m.caption?.toLowerCase().includes(q);
        const matchesText = m.messageText?.toLowerCase().includes(q);
        const matchesTag = m.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesLoc = m.location?.toLowerCase().includes(q);
        return matchesTitle || matchesCaption || matchesText || matchesTag || matchesLoc;
      }
      return true;
    });
  }, [allMoments, filterType, searchQuery]);

  // Group moments by Month & Year for a clean chapter timeline
  const groupedTimeline = useMemo(() => {
    const groups: { monthYear: string; items: ScrapbookMoment[] }[] = [];
    const map = new Map<string, ScrapbookMoment[]>();

    filteredMoments.forEach((item) => {
      const d = new Date(item.timestamp);
      const monthYear = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (!map.has(monthYear)) {
        map.set(monthYear, []);
      }
      map.get(monthYear)!.push(item);
    });

    map.forEach((items, monthYear) => {
      groups.push({ monthYear, items });
    });

    return groups;
  }, [filteredMoments]);

  // Handle Edit Moment Modal submit
  const handleSaveEdit = () => {
    if (!editingMoment) return;
    sounds.playPopSound();
    setCustomCaptions((prev) => ({
      ...prev,
      [editingMoment.id]: {
        title: editTitle,
        caption: editCaption,
        tags: editTags,
        sticker: editSticker,
        location: editLocation,
      },
    }));
    setEditingMoment(null);
  };

  // Open Edit Modal
  const openEditModal = (moment: ScrapbookMoment) => {
    setEditingMoment(moment);
    setEditTitle(moment.title || '');
    setEditCaption(moment.caption || '');
    setEditTags(moment.tags || []);
    setEditSticker(moment.sticker || '💖');
    setEditLocation(moment.location || '');
  };

  // Permanently delete a moment from the scrapbook and server
  const confirmDeleteMoment = async (moment: ScrapbookMoment) => {
    sounds.playPopSound();

    // 1. Remove from manual moments state if custom
    setManualMoments((prev) => prev.filter((m) => m.id !== moment.id));

    // 2. Add to deleted IDs list so it never appears in timeline
    setDeletedMomentIds((prev) => (prev.includes(moment.id) ? prev : [...prev, moment.id]));

    // 3. Remove custom caption override
    setCustomCaptions((prev) => {
      const next = { ...prev };
      delete next[moment.id];
      return next;
    });

    // 4. Call server/Firestore deletion if it has a message/database ID
    if (onDeleteMoment) {
      await onDeleteMoment(moment.id);
    }

    // 5. Cleanup active modal states
    if (editingMoment?.id === moment.id) {
      setEditingMoment(null);
    }

    if (isSlideshowOpen) {
      if (filteredMoments.length <= 1) {
        setIsSlideshowOpen(false);
      } else if (slideshowIndex >= filteredMoments.length - 1) {
        setSlideshowIndex((prev) => Math.max(0, prev - 1));
      }
    }

    setMomentToDelete(null);
  };

  // Create Manual Moment
  const handleCreateManualMoment = async () => {
    if (!newTitle.trim() && !newCaption.trim()) return;
    sounds.playSpellSound('chibi_spell');

    const newMoment: ScrapbookMoment = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: newImageUrl ? 'photo' : 'milestone',
      title: newTitle || 'Custom Memory',
      caption: newCaption || '',
      imageUrl: newImageUrl || undefined,
      timestamp: new Date(newDateStr).getTime() || Date.now(),
      senderId: currentUser.uid,
      tags: newTagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      sticker: newSticker,
      location: newLocation || undefined,
      isCustom: true,
    };

    setManualMoments((prev) => [newMoment, ...prev]);

    if (newImageUrl && onUploadPhotoMessage) {
      await onUploadPhotoMessage(newTitle || newCaption, 'image', newImageUrl);
    }

    // Reset
    setNewTitle('');
    setNewCaption('');
    setNewImageUrl('');
    setNewLocation('');
    setShowAddModal(false);
  };

  // Image Upload helper for manual moment modal
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        setNewImageUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 cosmos-grid-bg p-4 sm:p-6 overflow-y-auto text-slate-100 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP HEADER CARD */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="cosmic-card p-5 sm:p-6 rounded-3xl relative overflow-hidden border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f5a623]/10 border border-[#f5a623]/40 p-0.5 shadow-lg flex items-center justify-center text-[#f5a623]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-serif tracking-tight">
                  Our Digital Scrapbook <Sparkles className="w-4 h-4 text-[#f5a623] animate-pulse" />
                </h1>
                <p className="text-xs text-slate-400 font-serif">
                  Timeless album capturing memories, shared photos & chat quotes with {partner?.displayName?.split(' ')[0] || 'Partner'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 z-10 w-full sm:w-auto">
            {/* Story Slideshow Button */}
            <button
              onClick={() => {
                if (filteredMoments.length > 0) {
                  setSlideshowIndex(0);
                  setIsSlideshowOpen(true);
                  sounds.playSpellSound('send_hug');
                }
              }}
              className="flex-1 sm:flex-initial bg-white/5 hover:bg-white/10 text-[#f5a623] text-xs font-serif font-bold px-3.5 py-2.5 rounded-2xl border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-[#f5a623]" />
              <span>Slideshow</span>
            </button>

            {/* Add Memory Button */}
            <button
              onClick={() => {
                setShowAddModal(true);
                sounds.playPopSound();
              }}
              className="flex-1 sm:flex-initial amber-pill-btn text-black text-xs font-serif font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Memory Moment</span>
            </button>
          </div>
        </motion.div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="bg-[#110d24]/90 p-3 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scrapbook captions & tags..."
              className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 pl-9 pr-3 py-2 rounded-xl outline-none focus:border-[#f5a623]/80 placeholder-slate-500 font-serif"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-medium font-serif">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'amber-pill-btn text-black font-bold shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              All ({allMoments.length})
            </button>
            <button
              onClick={() => setFilterType('photo')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filterType === 'photo'
                  ? 'amber-pill-btn text-black font-bold shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photos
            </button>
            <button
              onClick={() => setFilterType('chat')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filterType === 'chat'
                  ? 'amber-pill-btn text-black font-bold shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat Quotes
            </button>
            <button
              onClick={() => setFilterType('voice')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filterType === 'voice'
                  ? 'amber-pill-btn text-black font-bold shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" /> Voice
            </button>
            <button
              onClick={() => setFilterType('milestone')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filterType === 'milestone'
                  ? 'amber-pill-btn text-black font-bold shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Milestones
            </button>
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="text-[11px] font-serif font-bold text-[#f5a623] hover:underline cursor-pointer shrink-0"
          >
            Sort: {sortOrder === 'newest' ? 'Newest First ⬇️' : 'Oldest First ⬆️'}
          </button>
        </div>

        {/* MAIN TIMELINE LIST */}
        {groupedTimeline.length > 0 ? (
          <div className="space-y-8 relative before:absolute before:left-4 sm:before:left-1/2 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#f5a623]/60 before:via-[#e08920]/40 before:to-transparent">
            {groupedTimeline.map((group) => (
              <div key={group.monthYear} className="space-y-6 relative">
                
                {/* Chapter Month Badge */}
                <div className="sticky top-16 z-10 flex justify-center">
                  <span className="bg-[#191338] border border-[#f5a623]/60 text-[#f5a623] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 font-serif">
                    <Calendar className="w-3.5 h-3.5" /> {group.monthYear}
                  </span>
                </div>

                {/* Moment Cards in Month */}
                <div className="space-y-6">
                  {group.items.map((item, itemIdx) => {
                    const isEven = itemIdx % 2 === 0;
                    const isMilestone = item.type === 'milestone';
                    const uploader = item.senderId
                      ? (item.senderId === currentUser.uid ? currentUser : partner)
                      : null;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className={`relative flex flex-col ${
                          isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                        } items-center gap-4 sm:gap-8`}
                      >
                        {/* Timeline Center Node Badge */}
                        <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0b0914] border-2 border-[#f5a623] flex items-center justify-center text-[#f5a623] z-10 shadow-lg font-bold text-sm">
                          {item.sticker || (isMilestone ? '💍' : '💖')}
                        </div>

                        {/* Card Content (Occupies 1/2 of width on desktop) */}
                        <div className={`w-full sm:w-[calc(50%-2rem)] pl-12 sm:pl-0 ${isEven ? 'sm:pr-4' : 'sm:pl-4'}`}>
                          
                          {isMilestone ? (
                            /* DEDICATED MILESTONE & LOVE SPACE FOUNDED CARD */
                            <div className="bg-gradient-to-br from-[#1b1238] via-[#150d2e] to-[#0e0a22] p-4 sm:p-5 rounded-3xl border-2 border-[#f5a623]/70 shadow-2xl space-y-3.5 relative overflow-hidden group hover:border-[#f5a623] transition-all duration-300">
                              
                              {/* Glowing Ambient Background Accent */}
                              <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#f5a623]/10 rounded-full blur-2xl pointer-events-none" />

                              {/* Card Header: Milestone Tag & Edit */}
                              <div className="flex items-center justify-between gap-2 border-b border-[#f5a623]/20 pb-2.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40 text-[10px] font-serif font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-[#f5a623]" />
                                    <span>Realm Milestone</span>
                                  </span>
                                  <span className="text-xs font-serif font-bold text-white flex items-center gap-1">
                                    <span>{item.sticker || '💍'}</span>
                                    <span>{item.title}</span>
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-[#f5a623]/90 font-mono font-semibold">
                                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#f5a623] transition-colors cursor-pointer"
                                    title="Edit Story Caption"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setMomentToDelete(item)}
                                    className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Delete Scrapbook Moment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Celebratory Couple Visual Banner */}
                              <div className="bg-black/30 rounded-2xl p-3 border border-[#f5a623]/20 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex -space-x-2">
                                    <img
                                      src={currentUser.photoUrl}
                                      alt={currentUser.displayName}
                                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#f5a623]"
                                    />
                                    <img
                                      src={partner?.photoUrl || ""}
                                      alt={partner?.displayName || "Partner"}
                                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#f5a623]"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-xs font-serif font-bold text-white block">
                                      {currentUser.displayName.split(' ')[0]} & {partner?.displayName?.split(' ')[0] || 'Partner'}
                                    </span>
                                    <span className="text-[10px] text-[#f5a623] font-serif">
                                      Two souls in one private universe ✨
                                    </span>
                                  </div>
                                </div>

                                <div className="text-2xl animate-bounce">💍</div>
                              </div>

                              {/* Caption Description */}
                              {item.caption && (
                                <p className="text-xs text-slate-200 font-serif leading-relaxed">
                                  {item.caption}
                                </p>
                              )}

                              {/* Milestone Tags & Footer */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f5a623]/20 text-[10px]">
                                <div className="flex items-center gap-1.5 flex-wrap font-serif">
                                  {item.location && (
                                    <span className="flex items-center gap-1 text-[#f5a623] font-semibold bg-[#f5a623]/15 px-2 py-0.5 rounded-lg border border-[#f5a623]/30">
                                      <MapPin className="w-3 h-3" /> {item.location}
                                    </span>
                                  )}
                                  {item.tags && item.tags.map((tg) => (
                                    <span key={tg} className="bg-white/5 px-2 py-0.5 rounded-lg text-amber-200/90 border border-[#f5a623]/20">
                                      #{tg}
                                    </span>
                                  ))}
                                </div>

                                <span className="text-[9px] text-[#f5a623] font-semibold font-serif flex items-center gap-1">
                                  <Heart className="w-3 h-3 fill-[#f5a623]" /> Our Shared Memory
                                </span>
                              </div>

                            </div>
                          ) : (
                            /* STANDARD SCRAPBOOK CARD (PHOTO, CHAT, VOICE, MANUAL) */
                            <div className="cosmic-card p-4 rounded-3xl border border-white/10 shadow-xl space-y-3 relative overflow-hidden group hover:border-[#f5a623]/60 transition-all duration-300">
                              
                              {/* Card Header: Title & Edit Action */}
                              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                                <span className="text-xs font-serif font-bold text-[#f5a623] flex items-center gap-1.5 min-w-0">
                                  <span>{item.sticker || '💖'}</span>
                                  <span className="truncate">{item.title}</span>
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#f5a623] transition-colors cursor-pointer"
                                    title="Add or Edit Story Caption"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setMomentToDelete(item)}
                                    className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Delete Scrapbook Moment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Photo Asset frame if available */}
                              {item.imageUrl && (
                                <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 aspect-video group-hover:scale-[1.01] transition-transform">
                                  <img
                                    src={item.imageUrl}
                                    alt="Scrapbook moment"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              {/* Voice Player if audio */}
                              {item.audioUrl && (
                                <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10">
                                  <VoiceMessagePlayer audioUrl={item.audioUrl} duration={item.audioDuration} />
                                </div>
                              )}

                              {/* Chat Quote Text if available */}
                              {item.messageText && (
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-xs italic font-serif text-slate-200 leading-relaxed">
                                  "{item.messageText}"
                                </div>
                              )}

                              {/* Story Caption Note */}
                              {item.caption && (
                                <p className="text-xs text-slate-200 font-medium leading-relaxed font-serif">
                                  {item.caption}
                                </p>
                              )}

                              {/* Location & Tags Footer */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 text-[10px] text-slate-400">
                                <div className="flex items-center gap-1.5 flex-wrap font-serif">
                                  {item.location && (
                                    <span className="flex items-center gap-1 text-[#f5a623] font-semibold bg-[#f5a623]/10 px-2 py-0.5 rounded-lg border border-[#f5a623]/30">
                                      <MapPin className="w-3 h-3" /> {item.location}
                                    </span>
                                  )}
                                  {item.tags && item.tags.map((tg) => (
                                    <span key={tg} className="bg-white/5 px-2 py-0.5 rounded-lg text-slate-300 border border-white/10">
                                      #{tg}
                                    </span>
                                  ))}
                                </div>

                                <span className="text-[9px] text-slate-400 font-medium font-serif">
                                  {uploader ? `Shared by ${uploader.displayName.split(' ')[0]}` : 'Memory Moment'}
                                </span>
                              </div>

                            </div>
                          )}

                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="cosmic-card rounded-3xl p-12 text-center border border-dashed border-white/15 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/40 flex items-center justify-center mx-auto text-[#f5a623]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-serif font-bold text-white">Scrapbook Timeline Ready</h3>
            <p className="text-xs text-purple-300 max-w-sm mx-auto">
              Share photos or chat messages in your space to populate this timeline automatically, or click below to add a manual moment!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="magical-btn text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Scrapbook Moment</span>
            </button>
          </div>
        )}

      </div>

      {/* EDIT CAPTION & STORY MODAL */}
      <AnimatePresence>
        {editingMoment && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-[#130F26] border border-purple-700 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-purple-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-300" />
                  Edit Scrapbook Story Caption
                </h3>
                <button
                  onClick={() => setEditingMoment(null)}
                  className="p-1 rounded-full text-purple-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Moment Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="E.g., Starry Date Night 🌟"
                    className="w-full bg-purple-950/80 border border-purple-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Story Caption Note</label>
                  <textarea
                    rows={3}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Write a sweet memory note or story about this moment..."
                    className="w-full bg-purple-950/80 border border-purple-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Location (Optional)</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="E.g., Paris, France 🇫🇷"
                    className="w-full bg-purple-950/80 border border-purple-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Select Sticker Icon</label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {CUTEST_STICKERS.map((stk) => (
                      <button
                        key={stk}
                        type="button"
                        onClick={() => setEditSticker(stk)}
                        className={`text-lg p-1.5 rounded-xl border transition-all cursor-pointer ${
                          editSticker === stk ? 'bg-amber-400/30 border-amber-400 scale-110' : 'bg-purple-950/60 border-purple-800'
                        }`}
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-purple-800/80 pt-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingMoment) {
                      setMomentToDelete(editingMoment);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-500/30 text-xs font-serif font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete</span>
                </button>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    onClick={() => setEditingMoment(null)}
                    className="bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs px-3 py-2 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="amber-pill-btn text-black text-xs px-4 py-2 rounded-xl font-serif font-bold cursor-pointer shadow-md"
                  >
                    Save Story Caption
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MANUAL MOMENT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="cosmic-card border border-white/15 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#f5a623]" />
                  Create Scrapbook Moment
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-serif">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Moment Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g., Our First Sunset Walk 🌅"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#f5a623]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={newDateStr}
                    onChange={(e) => setNewDateStr(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#f5a623]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Photo Upload (Optional)</label>
                  <label className="flex items-center justify-center gap-2 bg-black/40 border border-dashed border-white/20 hover:border-[#f5a623] p-3 rounded-xl cursor-pointer text-slate-400 hover:text-white transition-all">
                    <ImageIcon className="w-4 h-4 text-[#f5a623]" />
                    <span>{newImageUrl ? 'Change Selected Photo' : 'Upload Memory Photo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                  </label>
                  {newImageUrl && (
                    <div className="mt-2 relative rounded-xl overflow-hidden h-24 border border-white/15">
                      <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setNewImageUrl('')}
                        className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Story Caption</label>
                  <textarea
                    rows={2}
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="Describe what made this moment special..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#f5a623] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={newTagsInput}
                    onChange={(e) => setNewTagsInput(e.target.value)}
                    placeholder="Trip, DateNight, FirstTime"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#f5a623]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 font-serif">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateManualMoment}
                  className="flex-1 amber-pill-btn text-black text-xs py-2.5 rounded-xl font-bold cursor-pointer shadow-md"
                >
                  Add to Scrapbook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN STORY SLIDESHOW */}
      <AnimatePresence>
        {isSlideshowOpen && filteredMoments.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-between p-4 sm:p-8">
            {/* Top Toolbar */}
            <div className="w-full max-w-3xl flex items-center justify-between text-white z-10">
              <span className="text-xs font-serif font-bold text-[#f5a623] flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Memory Story Deck ({slideshowIndex + 1} / {filteredMoments.length})
              </span>
              <div className="flex items-center gap-2">
                {filteredMoments[slideshowIndex] && (
                  <button
                    onClick={() => setMomentToDelete(filteredMoments[slideshowIndex])}
                    className="w-9 h-9 rounded-full bg-red-950/60 hover:bg-red-600 border border-red-500/30 flex items-center justify-center text-red-200 hover:text-white cursor-pointer transition-colors"
                    title="Delete this moment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsSlideshowOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slideshow Card View */}
            <div className="relative w-full max-w-lg aspect-[3/4] sm:aspect-square my-auto flex items-center justify-center">
              {(() => {
                const current = filteredMoments[slideshowIndex];
                if (!current) return null;

                return (
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full cosmic-card border-2 border-[#f5a623]/80 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden text-center"
                  >
                    <div className="text-3xl mb-2">{current.sticker || '💖'}</div>
                    <h2 className="text-lg font-bold text-[#f5a623] font-serif">{current.title}</h2>

                    {current.imageUrl && (
                      <div className="my-auto rounded-2xl overflow-hidden border border-white/15 max-h-[50%] bg-black">
                        <img src={current.imageUrl} alt="Slide" className="w-full h-full object-contain" />
                      </div>
                    )}

                    {current.messageText && (
                      <div className="my-auto p-4 bg-white/5 rounded-2xl border border-white/10 text-sm italic font-serif text-slate-200">
                        "{current.messageText}"
                      </div>
                    )}

                    {current.caption && (
                      <p className="text-xs text-slate-200 my-2 font-serif font-medium">{current.caption}</p>
                    )}

                    <div className="text-[10px] text-slate-400 font-serif mt-auto">
                      {new Date(current.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </motion.div>
                );
              })()}
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-xs flex items-center justify-between text-white z-10 font-serif">
              <button
                onClick={() => setSlideshowIndex((prev) => (prev > 0 ? prev - 1 : filteredMoments.length - 1))}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-[#f5a623] cursor-pointer shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-xs text-slate-300 font-bold">
                {slideshowIndex + 1} of {filteredMoments.length}
              </span>
              <button
                onClick={() => setSlideshowIndex((prev) => (prev < filteredMoments.length - 1 ? prev + 1 : 0))}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-[#f5a623] cursor-pointer shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MOMENT CONFIRMATION MODAL */}
      {momentToDelete && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120e24] border border-red-500/50 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-base">Delete Scrapbook Memory?</h4>
              <p className="text-xs text-slate-400 mt-1 font-serif">
                "{momentToDelete.title || 'This memory'}" will be permanently removed from your scrapbook and memory vault.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 font-serif">
              <button
                onClick={() => setMomentToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteMoment(momentToDelete)}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-bold cursor-pointer transition-colors shadow-lg"
              >
                Delete Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
