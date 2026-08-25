import React, { useState, useEffect } from 'react';
import { User, CoupleSpace, Message, Presence } from '../types';
import {
  Heart,
  Sparkles,
  Image as ImageIcon,
  MessageCircle,
  Smile,
  Flame,
  Moon,
  MapPin,
  Send,
  CheckCircle2,
  Award,
  ChevronRight,
  HelpCircle,
  StickyNote,
  Clock,
  Activity,
  Zap,
  Shirt,
  Target,
  Mail,
  Users,
  UserPlus,
} from 'lucide-react';
// SpellAnimationOverlay removed for high-speed clean animations
import { ChibiCoupleMascot } from './ChibiCoupleMascot';
import { ChibiWardrobeConfig } from './ChibiWardrobeModal';
import { sounds } from '../lib/audio';

interface Props {
  currentUser: User;
  partner: User | null;
  coupleSpace: CoupleSpace;
  presence: Presence | undefined;
  messages: Message[];
  availableUsers?: User[];
  fetchAvailableUsers?: () => Promise<void>;
  onDirectConnect?: (targetUid: string) => Promise<boolean>;
  onConnectByEmail?: (email: string) => Promise<boolean>;
  onSendNudge: (type: string, emoji: string, message: string) => Promise<void>;
  onNavigateTab: (tab: 'home' | 'chat' | 'gallery' | 'map' | 'settings') => void;
  onUpdateStatus: (status: string, moodIcon?: string) => Promise<void>;
  onCheckInStreak?: () => Promise<void>;
  onOpenBucketList?: () => void;
  onOpenWardrobe?: () => void;
  onOpenLoveLetter?: () => void;
  wardrobeConfig?: ChibiWardrobeConfig;
}

export interface MoodPreset {
  id: string;
  emoji: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  auraColor: string;
  glowShadow: string;
  blushTint: string;
  facialMorphs?: {
    smile?: number;
    squint?: number;
    eyebrowLift?: number;
    eyebrowTilt?: number;
    blushOpacity?: number;
    mouthOpen?: number;
    winkLeft?: number;
    winkRight?: number;
    pout?: number;
  };
}

export const CUTE_MOODS: MoodPreset[] = [
  {
    id: 'happy',
    emoji: '😊',
    label: 'Happy & Cozy',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/50',
    auraColor: '#f59e0b',
    glowShadow: 'rgba(245, 158, 11, 0.65)',
    blushTint: '#f59e0b',
    facialMorphs: { smile: 0.9, squint: 0.3, blushOpacity: 0.8, mouthOpen: 0.2 },
  },
  {
    id: 'in_love',
    emoji: '💖',
    label: 'Deeply in Love',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-400/50',
    auraColor: '#f43f5e',
    glowShadow: 'rgba(244, 63, 94, 0.75)',
    blushTint: '#f43f5e',
    facialMorphs: { smile: 0.95, squint: 0.5, blushOpacity: 1.0, eyebrowTilt: 0.6 },
  },
  {
    id: 'excited',
    emoji: '✨',
    label: 'Excited & Sparkly',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-400/50',
    auraColor: '#a855f7',
    glowShadow: 'rgba(168, 85, 247, 0.75)',
    blushTint: '#c084fc',
    facialMorphs: { smile: 0.9, eyebrowLift: 0.4, mouthOpen: 0.5, blushOpacity: 0.75 },
  },
  {
    id: 'cozy',
    emoji: '☕',
    label: 'Need Coffee',
    badgeBg: 'bg-amber-700/20',
    badgeText: 'text-amber-200',
    badgeBorder: 'border-amber-600/50',
    auraColor: '#d97706',
    glowShadow: 'rgba(217, 119, 6, 0.65)',
    blushTint: '#fb923c',
    facialMorphs: { smile: 0.6, squint: 0.2, blushOpacity: 0.55 },
  },
  {
    id: 'rest',
    emoji: '😴',
    label: 'Rest Mode',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-400/50',
    auraColor: '#6366f1',
    glowShadow: 'rgba(99, 102, 241, 0.65)',
    blushTint: '#818cf8',
    facialMorphs: { smile: 0.4, blushOpacity: 0.4, eyebrowLift: -0.2 },
  },
  {
    id: 'blooming',
    emoji: '🌸',
    label: 'Sweet & Peaceful',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    badgeBorder: 'border-pink-400/50',
    auraColor: '#ec4899',
    glowShadow: 'rgba(236, 72, 153, 0.65)',
    blushTint: '#f472b6',
    facialMorphs: { smile: 0.85, squint: 0.4, blushOpacity: 0.85, eyebrowTilt: 0.5 },
  },
  {
    id: 'playful',
    emoji: '🎮',
    label: 'Playful & Chill',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-400/50',
    auraColor: '#14b8a6',
    glowShadow: 'rgba(20, 184, 166, 0.65)',
    blushTint: '#2dd4bf',
    facialMorphs: { smile: 0.95, winkLeft: 1.0, blushOpacity: 0.7 },
  },
  {
    id: 'snack',
    emoji: '🍕',
    label: 'Snack Time',
    badgeBg: 'bg-yellow-500/20',
    badgeText: 'text-yellow-300',
    badgeBorder: 'border-yellow-400/50',
    auraColor: '#eab308',
    glowShadow: 'rgba(234, 179, 8, 0.65)',
    blushTint: '#fde047',
    facialMorphs: { smile: 0.8, mouthOpen: 0.6, eyebrowLift: 0.3, blushOpacity: 0.6 },
  },
  {
    id: 'night',
    emoji: '🌙',
    label: 'Night Owl',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-400/50',
    auraColor: '#0ea5e9',
    glowShadow: 'rgba(14, 165, 233, 0.65)',
    blushTint: '#38bdf8',
    facialMorphs: { smile: 0.7, squint: 0.2, blushOpacity: 0.6 },
  },
  {
    id: 'angelic',
    emoji: '😇',
    label: 'Angelic & Pure',
    badgeBg: 'bg-slate-200/20',
    badgeText: 'text-slate-200',
    badgeBorder: 'border-slate-300/50',
    auraColor: '#f8fafc',
    glowShadow: 'rgba(248, 250, 252, 0.75)',
    blushTint: '#e2e8f0',
    facialMorphs: { smile: 0.85, eyebrowLift: 0.4, blushOpacity: 0.7 },
  },
  {
    id: 'silly',
    emoji: '🤪',
    label: 'Silly & Goofy',
    badgeBg: 'bg-lime-500/20',
    badgeText: 'text-lime-300',
    badgeBorder: 'border-lime-400/50',
    auraColor: '#84cc16',
    glowShadow: 'rgba(132, 204, 22, 0.65)',
    blushTint: '#a3e635',
    facialMorphs: { smile: 1.0, mouthOpen: 0.7, winkRight: 1.0, blushOpacity: 0.8 },
  },
  {
    id: 'fire',
    emoji: '🔥',
    label: 'Passionate',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-400/50',
    auraColor: '#ef4444',
    glowShadow: 'rgba(239, 68, 68, 0.75)',
    blushTint: '#f87171',
    facialMorphs: { smile: 0.85, squint: 0.5, blushOpacity: 1.0, eyebrowTilt: 0.7 },
  },
];

export function resolveUserMood(user: User): MoodPreset {
  if (user.moodIcon) {
    const found = CUTE_MOODS.find((m) => m.emoji === user.moodIcon || m.id === user.moodIcon);
    if (found) return found;
  }
  if (user.statusMessage) {
    const found = CUTE_MOODS.find((m) => user.statusMessage?.includes(m.emoji));
    if (found) return found;
  }
  return CUTE_MOODS[0];
}

const CELESTIAL_QUOTES = [
  "In all the universe, there is no soul for me like yours. — Maya Angelou",
  "I look into your eyes and see a million constellations shining for us.",
  "You are my starlight in the vast cosmic infinity.",
  "Whatever our souls are woven of, yours and mine are carved from the same star.",
  "To love and be loved is to feel the magic of the cosmos on both sides.",
];

const NUDGES = [
  { id: 'send_hug', label: 'Warm Hug', emoji: '💖', msg: 'Sending you a warm & tight hug!' },
  { id: 'send_kiss', label: 'Sweet Kiss', emoji: '💋', msg: 'Sending you a sweet kiss!' },
  { id: 'miss_you', label: 'Miss You', emoji: '🌌', msg: 'Thinking of you right now!' },
  { id: 'thinking', label: 'Telepathy', emoji: '🔮', msg: 'Felt our hearts connect!' },
  { id: 'flower_bloom', label: 'Flowers', emoji: '🌸', msg: 'Blooming flowers for you!' },
];

const DAILY_QUESTIONS = [
  "What is one small thing I did recently that made you smile?",
  "If we could take a trip anywhere together tomorrow, where would we go?",
  "What song always reminds you of us?",
  "What was your favorite memory from our last date?",
  "What is a goal or bucket list dream you want us to achieve together?",
  "What is your favorite pet name for me?",
];

export const HomeScreen: React.FC<Props> = ({
  currentUser,
  partner,
  coupleSpace,
  presence,
  messages,
  availableUsers = [],
  fetchAvailableUsers,
  onDirectConnect,
  onConnectByEmail,
  onSendNudge,
  onNavigateTab,
  onUpdateStatus,
  onCheckInStreak,
  onOpenBucketList,
  onOpenWardrobe,
  onOpenLoveLetter,
  wardrobeConfig,
}) => {
  const [nudgeSent, setNudgeSent] = useState<string | null>(null);
  const [customStatus, setCustomStatus] = useState(currentUser.statusMessage || '');
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState(
    currentUser.moodIcon || resolveUserMood(currentUser).emoji
  );
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [partnerEmailInput, setPartnerEmailInput] = useState('');
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  const [connectSuccessMsg, setConnectSuccessMsg] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);

  const handleDirectConnectUser = async (targetUid: string) => {
    if (!onDirectConnect) return;
    setConnectingUid(targetUid);
    sounds.playPopSound();
    const ok = await onDirectConnect(targetUid);
    setConnectingUid(null);
    if (ok) {
      setConnectSuccessMsg('Partner paired successfully! ✨');
      setTimeout(() => setConnectSuccessMsg(''), 3500);
    }
  };

  const handleEmailConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmailInput.trim() || !onConnectByEmail) return;
    setIsConnectingEmail(true);
    sounds.playPopSound();
    const ok = await onConnectByEmail(partnerEmailInput.trim());
    setIsConnectingEmail(false);
    if (ok) {
      setPartnerEmailInput('');
      setConnectSuccessMsg('Connected with partner email! 💕');
      setTimeout(() => setConnectSuccessMsg(''), 3500);
    }
  };

  // Active expanded stack (accordion style for minimal, organized UX)
  const [expandedStacks, setExpandedStacks] = useState<Record<string, boolean>>({
    streak: true,
    mascot: true,
    nudges: false,
    notes: false,
    feed: false,
  });

  const toggleStack = (key: string) => {
    setExpandedStacks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    sounds.playPopSound();
  };

  // Daily Question & Note States
  const [dailyAnswer, setDailyAnswer] = useState('');
  const [savedAnswer, setSavedAnswer] = useState<string | null>(null);

  const [loveNote, setLoveNote] = useState('');
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Resolve moods for User & Partner
  const isRealPartner = Boolean(
    partner &&
    partner.uid !== currentUser.uid &&
    partner.email?.toLowerCase() !== currentUser.email?.toLowerCase() &&
    partner.displayName !== 'Waiting for Partner...'
  );

  const effectivePartner: User = (isRealPartner && partner) ? partner : {
    uid: 'partner_pending',
    email: '',
    displayName: 'Waiting for Partner...',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    statusMessage: 'Ready to connect ✨',
    moodIcon: '💖',
    createdAt: Date.now(),
  };

  const userMood = resolveUserMood(currentUser);
  const partnerMood = resolveUserMood(effectivePartner);

  useEffect(() => {
    const localAns = localStorage.getItem(`duolove_q_ans_${coupleSpace.id}_${currentUser.uid}`);
    if (localAns) setSavedAnswer(localAns);

    const localNote = localStorage.getItem(`duolove_note_${coupleSpace.id}`);
    if (localNote) {
      setSavedNote(localNote);
      setLoveNote(localNote);
    }
  }, [coupleSpace.id, currentUser.uid]);

  // Love Streak States & Calculations
  const [pingSending, setPingSending] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const streakData = coupleSpace.loveStreak || {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: todayStr,
    userAInteractedToday: true,
    userBInteractedToday: isRealPartner,
    lastInteractions: { [currentUser.uid]: todayStr },
  };

  const isUserA = coupleSpace.members[0] === currentUser.uid;

  const userCheckedInToday = Boolean(
    (streakData.lastInteractions && currentUser.uid && streakData.lastInteractions[currentUser.uid] === todayStr) ||
    (isUserA ? streakData.userAInteractedToday : streakData.userBInteractedToday)
  );

  const partnerCheckedInToday = Boolean(
    isRealPartner && (
      (partner && streakData.lastInteractions && streakData.lastInteractions[partner.uid] === todayStr) ||
      (isUserA ? streakData.userBInteractedToday : streakData.userAInteractedToday)
    )
  );

  const currentStreakVal = streakData.currentStreak ?? 1;
  const longestStreakVal = Math.max(streakData.longestStreak ?? 1, currentStreakVal);

  const STREAK_MILESTONES = [
    { target: 3, label: '3 Days', badge: '🐣', title: 'Cozy Sparkle' },
    { target: 7, label: '7 Days', badge: '💖', title: 'Heart Lock' },
    { target: 14, label: '14 Days', badge: '🔥', title: 'Flame Bond' },
    { target: 30, label: '30 Days', badge: '👑', title: 'Love Royalty' },
    { target: 50, label: '50 Days', badge: '💎', title: 'Diamond Souls' },
    { target: 100, label: '100 Days', badge: '🌌', title: 'Cosmic Eternity' },
  ];

  const currentMilestone = STREAK_MILESTONES.find((m) => currentStreakVal < m.target) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const prevMilestoneTarget = STREAK_MILESTONES.filter((m) => currentStreakVal >= m.target).pop()?.target || 0;
  const milestoneRange = Math.max(1, currentMilestone.target - prevMilestoneTarget);
  const milestoneProgress = Math.min(100, Math.max(10, Math.round(((currentStreakVal - prevMilestoneTarget) / milestoneRange) * 100)));

  const handleLovePingCheckIn = async () => {
    setPingSending(true);
    sounds.playPopSound();

    if (onCheckInStreak) {
      await onCheckInStreak();
    }
    await onSendNudge('love_ping', '❤️🔥', `${currentUser.displayName.split(' ')[0]} sent you a Daily Love Streak Ping!`);

    setPingSending(false);
    setPingSuccess(true);
    setTimeout(() => setPingSuccess(false), 2500);
  };

  // Calculate Days Together
  const calculateDays = () => {
    if (!coupleSpace.anniversaryDate) return 1;
    const start = new Date(coupleSpace.anniversaryDate).getTime();
    const now = new Date().getTime();
    return Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  };

  const daysCount = calculateDays();
  const isOnline = presence?.online ?? true;

  // Filter photos & recent chat
  const sharedPhotos = messages.filter((m) => m.type === 'image' && m.imageUrl);
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  const handleNudgeClick = async (n: typeof NUDGES[0]) => {
    setNudgeSent(n.id);
    sounds.playPopSound();
    await onSendNudge(n.id, n.emoji, n.msg);
    setTimeout(() => setNudgeSent(null), 1800);
  };

  const handleSaveStatus = async (status: string, moodEmoji?: string) => {
    const chosenMood = moodEmoji || selectedMoodEmoji;
    setSelectedMoodEmoji(chosenMood);
    setCustomStatus(status);
    await onUpdateStatus(status, chosenMood);
    setIsEditingStatus(false);
    sounds.playPopSound();
  };

  const handleSaveQuestionAnswer = () => {
    if (!dailyAnswer.trim()) return;
    localStorage.setItem(`duolove_q_ans_${coupleSpace.id}_${currentUser.uid}`, dailyAnswer.trim());
    setSavedAnswer(dailyAnswer.trim());
    setDailyAnswer('');
    sounds.playSendSound();
  };

  const handleSaveNote = () => {
    if (!loveNote.trim()) return;
    localStorage.setItem(`duolove_note_${coupleSpace.id}`, loveNote.trim());
    setSavedNote(loveNote.trim());
    setIsEditingNote(false);
    sounds.playSendSound();
  };

  // Milestone Math
  const nextMilestoneDays = Math.ceil(daysCount / 50) * 50 || 50;
  const daysToMilestone = Math.max(1, nextMilestoneDays - daysCount);

  return (
    <div className="flex-1 cosmos-grid-bg text-slate-100 p-3 sm:p-5 md:p-6 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Active Discovered Users on DuoLove & 1-Click Connect (Live Real Users Only) */}
        {connectSuccessMsg && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-200 shadow-lg animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{connectSuccessMsg}</span>
          </div>
        )}

        {/* If user doesn't have a paired partner, prominently show live online users waiting to connect */}
        {!isRealPartner && (
          <div className="cosmic-card rounded-3xl p-5 border border-[#f5a623]/50 shadow-xl space-y-4 relative overflow-hidden bg-gradient-to-br from-[#1b1538]/90 via-[#0e0b1c]/90 to-[#18112e]/90">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#f5a623]/20 border border-[#f5a623]/60 flex items-center justify-center text-[#f5a623] shadow-md">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                    <span>Connect with People Using DuoLove</span>
                    <span className="text-[10px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Connect with anyone currently on the platform or enter your partner's email.
                  </p>
                </div>
              </div>

              {fetchAvailableUsers && (
                <button
                  onClick={() => {
                    fetchAvailableUsers();
                    sounds.playPopSound();
                  }}
                  className="text-xs text-[#f5a623] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Refresh Users ↺</span>
                </button>
              )}
            </div>

            {/* List of active real users currently on the site */}
            {availableUsers.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-slate-300">Active users waiting to connect:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="p-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-2xl flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.photoUrl}
                          alt={u.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-[#f5a623] shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{u.displayName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDirectConnectUser(u.uid)}
                        disabled={connectingUid === u.uid}
                        className="amber-pill-btn text-black font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md cursor-pointer hover:scale-105 transition-all shrink-0 flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{connectingUid === u.uid ? 'Pairing...' : 'Connect'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 text-center">
                <p className="text-xs text-slate-300">
                  No other users are currently on this instance. Open DuoLove in a second browser window or tab to connect right away!
                </p>
              </div>
            )}

            {/* Connect by Email input */}
            <form onSubmit={handleEmailConnect} className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                placeholder="Enter partner email (e.g. partner@gmail.com)..."
                value={partnerEmailInput}
                onChange={(e) => setPartnerEmailInput(e.target.value)}
                className="w-full flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#f5a623]"
              />
              <button
                type="submit"
                disabled={isConnectingEmail || !partnerEmailInput.trim()}
                className="w-full sm:w-auto amber-pill-btn text-black font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer disabled:opacity-50 hover:scale-105 transition-all shrink-0"
              >
                {isConnectingEmail ? 'Connecting...' : 'Connect by Email'}
              </button>
            </form>
          </div>
        )}

        {/* HERO SECTION: Couple Connection & Days Header (Minimal & Elegant) */}
        <div className="cosmic-card rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-xl border border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Avatars */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative text-center">
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.displayName}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-[#f5a623] shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120D2B]" />
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${userMood.badgeBg} ${userMood.badgeBorder} border flex items-center justify-center text-[10px]`}>
                  {userMood.emoji}
                </div>
                <span className="text-[11px] font-bold text-slate-200 mt-1 block truncate max-w-[65px]">
                  {currentUser.displayName.split(' ')[0]}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center px-1">
                <div className="w-7 h-7 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/50 flex items-center justify-center text-[#f5a623]">
                  <Heart className="w-3.5 h-3.5 fill-[#f5a623]" />
                </div>
                <span className="text-[8px] font-bold text-[#f5a623] tracking-widest uppercase mt-0.5">Bound</span>
              </div>

              <div className="relative text-center">
                <img
                  src={effectivePartner.photoUrl}
                  alt={effectivePartner.displayName}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-purple-400 shadow-md"
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#120D2B] ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${partnerMood.badgeBg} ${partnerMood.badgeBorder} border flex items-center justify-center text-[10px]`}>
                  {partnerMood.emoji}
                </div>
                <span className="text-[11px] font-bold text-slate-200 mt-1 block truncate max-w-[65px]">
                  {effectivePartner.displayName.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Days Together Counter */}
            <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-2.5 px-4">
              <Sparkles className="w-4 h-4 text-[#f5a623]" />
              <div>
                <p className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                  {daysCount} <span className="text-xs font-sans font-semibold text-slate-400">Days Together</span>
                </p>
                <p className="text-[10px] text-slate-400">Since {coupleSpace.anniversaryDate || 'our special day'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            LABELED STACK 1: LOVE STREAK & DAILY CHECK-IN
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-[#f5a623]/30 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('streak')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#f5a623]/20 border border-[#f5a623]/50 flex items-center justify-center text-[#f5a623]">
                <Flame className="w-4 h-4 fill-[#f5a623]" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <span>Daily Love Streak</span>
                  <span className="text-[10px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/40 text-[#f5a623]">
                    {currentStreakVal} Days 🔥
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Interact daily to keep your flame glowing (Record: {longestStreakVal}d)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {expandedStacks.streak ? 'Collapse Stack ▲' : 'Open Options ▼'}
            </span>
          </button>

          {expandedStacks.streak && (
            <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-white/10 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* User Check-In Status */}
                <div className={`p-3 rounded-2xl border ${userCheckedInToday ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-black/40 border-[#f5a623]/40'} flex items-center justify-between`}>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{currentUser.displayName.split(' ')[0]} (You)</span>
                    <span className={`text-[10px] font-semibold ${userCheckedInToday ? 'text-emerald-300' : 'text-[#f5a623]'}`}>
                      {userCheckedInToday ? 'Checked in today ✨' : 'Needs daily interaction!'}
                    </span>
                  </div>
                  {!userCheckedInToday && (
                    <button
                      onClick={handleLovePingCheckIn}
                      disabled={pingSending}
                      className="amber-pill-btn text-black text-xs font-bold px-3 py-1 rounded-full cursor-pointer shadow-sm"
                    >
                      Ping
                    </button>
                  )}
                </div>

                {/* Partner Check-In Status */}
                <div className={`p-3 rounded-2xl border ${partnerCheckedInToday ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-black/40 border-white/10'} flex items-center justify-between`}>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">{effectivePartner.displayName.split(' ')[0]}</span>
                    <span className={`text-[10px] font-semibold ${partnerCheckedInToday ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {partnerCheckedInToday ? 'Checked in today 💖' : 'Waiting for ping...'}
                    </span>
                  </div>
                  {!partnerCheckedInToday && (
                    <button
                      onClick={handleLovePingCheckIn}
                      disabled={pingSending}
                      className="bg-white/10 hover:bg-white/20 text-xs font-bold px-3 py-1 rounded-full text-slate-200 cursor-pointer"
                    >
                      Nudge
                    </button>
                  )}
                </div>

                {/* Send Ping Action */}
                <button
                  onClick={handleLovePingCheckIn}
                  disabled={pingSending}
                  className="amber-pill-btn text-black font-bold text-xs py-2.5 px-3 rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-4 h-4 fill-black" />
                  <span>{pingSuccess ? 'Ping Sent! ❤️🔥' : 'Send Daily Love Ping 💌'}</span>
                </button>
              </div>

              {/* Milestone Progress */}
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-1">
                    <span>{currentMilestone.badge}</span>
                    <span>Next Milestone: <strong className="text-[#f5a623]">{currentMilestone.title} ({currentMilestone.target}d)</strong></span>
                  </span>
                  <span className="text-[10px] text-slate-400">{milestoneProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-[#f5a623] rounded-full" style={{ width: `${milestoneProgress}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 2: 3D CHIBI MASCOTS & MOOD MATRIX
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('mascot')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <span>3D Couple Mascots & Mood Glow</span>
                  <span className="text-[10px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    {userMood.emoji} {userMood.label.split(' ')[0]}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Interactive 3D avatars, live mood aura & wardrobe styling</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {expandedStacks.mascot ? 'Collapse Stack ▲' : 'Open Options ▼'}
            </span>
          </button>

          {expandedStacks.mascot && (
            <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-white/10 mt-1">
              {/* 3D Chibi Mascot Interactive Stage */}
              <ChibiCoupleMascot
                currentUser={currentUser}
                partner={effectivePartner}
                onSendNudge={onSendNudge}
                userMood={userMood}
                partnerMood={partnerMood}
                wardrobeConfig={wardrobeConfig}
              />

              {/* Mood Emojis Matrix Grid */}
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#f5a623]" /> Choose Your Mood Glow:
                  </span>
                  <button
                    onClick={() => setIsEditingStatus(!isEditingStatus)}
                    className="text-[10px] font-bold text-[#f5a623] hover:underline cursor-pointer"
                  >
                    {isEditingStatus ? 'Done' : '✏️ Edit Status Text'}
                  </button>
                </div>

                {isEditingStatus && (
                  <div className="flex items-center gap-2 pb-1">
                    <input
                      type="text"
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="Type custom mood status..."
                      className="flex-1 text-xs p-2 bg-black/60 rounded-xl border border-white/20 outline-none text-white focus:border-[#f5a623]"
                    />
                    <button
                      onClick={() => handleSaveStatus(customStatus, selectedMoodEmoji)}
                      className="amber-pill-btn text-black text-xs px-3 py-2 rounded-xl font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {CUTE_MOODS.map((m) => {
                    const isSelected = selectedMoodEmoji === m.emoji || userMood.emoji === m.emoji;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMoodEmoji(m.emoji);
                          handleSaveStatus(m.label, m.emoji);
                          sounds.playPopSound();
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? `${m.badgeBg} border-[#f5a623] scale-105 text-white font-bold shadow-md`
                            : 'bg-black/40 hover:bg-white/5 border-white/10 text-slate-300'
                        }`}
                      >
                        <span className="text-base">{m.emoji}</span>
                        <span className="text-[9px] font-semibold truncate w-full">{m.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Wardrobe & Pet Mascot Studio Action */}
                {onOpenWardrobe && (
                  <div className="pt-2 border-t border-white/10 flex justify-end">
                    <button
                      onClick={onOpenWardrobe}
                      className="w-full sm:w-auto bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                    >
                      <Shirt className="w-4 h-4 text-purple-300" />
                      <span>3D Avatar Wardrobe & Pet Mascot Studio ✨</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 3: 1-TAP TOUCH GESTURES & NUDGES
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('nudges')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-[#f5a623]">
                <Zap className="w-4 h-4 fill-[#f5a623]" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <span>Quick Touch Gestures & Magic Spells</span>
                </h3>
                <p className="text-[11px] text-slate-400">Send 1-tap kisses, hugs, telepathy vibrations & sound spells</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {expandedStacks.nudges ? 'Collapse Stack ▲' : 'Open Options ▼'}
            </span>
          </button>

          {expandedStacks.nudges && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-white/10 mt-1">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {NUDGES.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNudgeClick(n)}
                    disabled={nudgeSent === n.id}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      nudgeSent === n.id
                        ? 'bg-[#f5a623] text-black border-[#f5a623] font-bold shadow-md'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <span className="text-2xl">{n.emoji}</span>
                    <span className="text-[11px] font-bold">{nudgeSent === n.id ? 'Sent! ✨' : n.label}</span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[100px]">{n.msg}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 4: DAILY CONNECTIONS & SHARED NOTES
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('notes')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-300">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <span>Daily Question & Shared Love Notes</span>
                </h3>
                <p className="text-[11px] text-slate-400">Sweet surprise notes, couple prompts & cosmic quotes</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {expandedStacks.notes ? 'Collapse Stack ▲' : 'Open Options ▼'}
            </span>
          </button>

          {expandedStacks.notes && (
            <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-white/10 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Question of the Day */}
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#f5a623] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Question of the Day
                    </span>
                    <button
                      onClick={() => setQuestionIndex((prev) => (prev + 1) % DAILY_QUESTIONS.length)}
                      className="text-[10px] text-slate-400 hover:text-white hover:underline cursor-pointer"
                    >
                      Next Prompt ↺
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 italic font-serif">"{DAILY_QUESTIONS[questionIndex]}"</p>

                  {savedAnswer ? (
                    <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-300 italic truncate">"{savedAnswer}"</span>
                      <button onClick={() => setSavedAnswer(null)} className="text-[10px] text-slate-400 hover:underline">Edit</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={dailyAnswer}
                        onChange={(e) => setDailyAnswer(e.target.value)}
                        placeholder="Your answer..."
                        className="flex-1 text-xs p-2 bg-black/60 rounded-xl border border-white/10 text-white outline-none focus:border-[#f5a623]"
                      />
                      <button onClick={handleSaveQuestionAnswer} className="amber-pill-btn text-black p-2 rounded-xl text-xs font-bold cursor-pointer">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Shared Love Note Pad */}
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                      <StickyNote className="w-3.5 h-3.5" /> Shared Love Note
                    </span>
                    <button
                      onClick={() => setIsEditingNote(!isEditingNote)}
                      className="text-[10px] font-bold text-rose-300 hover:underline cursor-pointer"
                    >
                      {isEditingNote ? 'Cancel' : 'Edit Note'}
                    </button>
                  </div>

                  {isEditingNote ? (
                    <div className="space-y-1.5">
                      <textarea
                        rows={2}
                        value={loveNote}
                        onChange={(e) => setLoveNote(e.target.value)}
                        placeholder="Write a sweet note..."
                        className="w-full text-xs p-2 bg-black/60 rounded-xl border border-white/10 text-white outline-none resize-none focus:border-rose-400"
                      />
                      <button onClick={handleSaveNote} className="w-full bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer">
                        Save Note
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-200 italic font-serif bg-black/20 p-2.5 rounded-xl border border-white/5">
                      "{savedNote || 'Tap Edit Note to write a surprise note for your partner 💕'}"
                    </p>
                  )}
                </div>
              </div>

              {/* Wax-Sealed Love Letter & Vintage Studio Action */}
              {onOpenLoveLetter && (
                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    onClick={onOpenLoveLetter}
                    className="w-full sm:w-auto bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  >
                    <Mail className="w-4 h-4 text-rose-300" />
                    <span>Write Wax-Sealed Love Letter 💌</span>
                  </button>
                </div>
              )}

              {/* Daily Quote Banner */}
              <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5 text-center flex items-center justify-between text-xs">
                <p className="text-slate-300 italic font-serif truncate flex-1 px-2">"{CELESTIAL_QUOTES[quoteIndex]}"</p>
                <button
                  onClick={() => setQuoteIndex((prev) => (prev + 1) % CELESTIAL_QUOTES.length)}
                  className="text-[10px] text-[#f5a623] hover:underline cursor-pointer shrink-0 font-bold"
                >
                  Next Quote ↺
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            LABELED STACK 5: COUPLE BUCKET LIST & SHARED DREAMS
            ============================================================ */}
        {onOpenBucketList && (
          <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
            <button
              onClick={() => toggleStack('bucketList')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-[#f5a623]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                    <span>Couple Bucket List & 100 Shared Dreams</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Goals, romantic adventures, stargazing trips & life memories to conquer</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {expandedStacks.bucketList ? 'Collapse Stack ▲' : 'Open Options ▼'}
              </span>
            </button>

            {expandedStacks.bucketList && (
              <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-white/10 mt-1">
                <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#f5a623]" /> 100 Curated Couple Adventures
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Browse categories: Romantic Dates, Travel & Wanderlust, Cozy Staycations, Big Milestones.
                    </p>
                  </div>
                  <button
                    onClick={onOpenBucketList}
                    className="w-full sm:w-auto amber-pill-btn text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-105 transition-all"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Open Bucket List Studio</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            LABELED STACK 6: REALM SHORTCUTS & LIVE FEED
            ============================================================ */}
        <div className="cosmic-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => toggleStack('feed')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <span>Sanctuary Feed & Shortcuts</span>
                </h3>
                <p className="text-[11px] text-slate-400">Quick jump to whisper chat, memory gallery & 3D love map</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#f5a623] px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {expandedStacks.feed ? 'Collapse Stack ▲' : 'Open Options ▼'}
            </span>
          </button>

          {expandedStacks.feed && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 border-t border-white/10 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div
                  onClick={() => onNavigateTab('chat')}
                  className="p-3 bg-black/40 hover:bg-white/5 rounded-2xl border border-white/10 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#f5a623] uppercase flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> Latest Chat
                    </span>
                    <p className="text-xs text-slate-200 truncate mt-0.5">
                      {lastMessage ? lastMessage.text || 'Shared image' : 'Start chatting'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>

                <div
                  onClick={() => onNavigateTab('gallery')}
                  className="p-3 bg-black/40 hover:bg-white/5 rounded-2xl border border-white/10 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-purple-300 uppercase flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Photos ({sharedPhotos.length})
                    </span>
                    <p className="text-xs text-slate-200 truncate mt-0.5">Open memory gallery</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>

                <div
                  onClick={() => onNavigateTab('map')}
                  className="p-3 bg-black/40 hover:bg-white/5 rounded-2xl border border-white/10 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-teal-300 uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> 3D Love Earth
                    </span>
                    <p className="text-xs text-slate-200 truncate mt-0.5">Explore memory pins</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
