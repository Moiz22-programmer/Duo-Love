import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Message, Presence, CallSignal } from '../types';
import { THEME } from '../lib/theme';
import { sounds } from '../lib/audio';
import { callEngine } from '../lib/webrtc';
import {
  Send,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
  X,
  Download,
  Sparkles,
  Maximize2,
  Minimize2,
  Heart,
  Mic,
  MicOff,
  Trash2,
  Phone,
  PhoneOff,
  Video,
  Zap,
  BookOpen,
  UploadCloud,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface Props {
  currentUser: User;
  partner: User | null;
  messages: Message[];
  presence: Presence | undefined;
  availableUsers?: User[];
  fetchAvailableUsers?: () => void;
  onDirectConnect?: (targetUid: string) => Promise<boolean>;
  onConnectByEmail?: (email: string) => Promise<boolean>;
  onSendMessage: (text: string, type?: 'text' | 'image' | 'audio', imageUrl?: string, audioUrl?: string, audioDuration?: number) => Promise<void>;
  onMarkRead: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onSetTyping: (isTyping: boolean) => void;
  onStartCall?: (type: 'voice' | 'video') => void;
  activeCall?: CallSignal | null;
  isCallMinimized?: boolean;
  onExpandCall?: () => void;
  onToggleMinimizeCall?: (min: boolean) => void;
  onEndCall?: () => void;
}

interface FloatingParticle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  driftX: number;
  floatY: number;
  size: number;
  duration: number;
}

const QUICK_REPLIES = [
  { label: 'Love you', text: 'Love you ❤️', icon: '❤️' },
  { label: 'Miss you', text: 'Miss you 🥺', icon: '🥺' },
  { label: 'Omw', text: 'Omw! 🚗💨', icon: '🚗' },
  { label: 'Thinking of you', text: 'Thinking of you ✨', icon: '✨' },
  { label: 'Call me?', text: 'Can we call? 📞', icon: '📞' },
  { label: 'Hug me', text: 'Sending you a big warm hug 🫂', icon: '🫂' },
  { label: 'Good morning', text: 'Good morning my love! ☀️', icon: '☀️' },
  { label: 'Good night', text: 'Good night, sweet dreams! 🌙', icon: '🌙' },
  { label: 'Food time?', text: 'Are you hungry? Food time? 🍕', icon: '🍕' },
  { label: 'Almost there', text: 'Almost there! ⏱️', icon: '⏱️' },
  { label: 'So proud of you', text: 'So proud of you! 💖', icon: '💖' },
];

const EXTENDED_LOVE_EMOJIS = [
  '❤️', '💖', '🔥', '🥰', '😍', '😘', '🥺', '😭',
  '✨', '💕', '💋', '🌸', '🌹', '💍', '💌', '🧸',
  '😂', '🤤', '😈', '👀', '💯', '👏', '🙏', '🎉',
  '⭐', '💫', '🌌', '🦋', '🍯', '🍫', '🥂', '👑'
];

const EMOJI_CATEGORIES = [
  { name: 'Love', icon: '❤️', emojis: ['❤️', '💖', '💕', '💘', '💗', '💓', '💞', '💍', '💌', '💋', '🌹', '🌸'] },
  { name: 'Faces', icon: '🥰', emojis: ['🥰', '😍', '😘', '😋', '🥺', '😭', '🤤', '😈', '😂', '🤣', '🤩', '😎'] },
  { name: 'Sparks', icon: '✨', emojis: ['✨', '🔥', '💫', '⭐', '🌟', '🌌', '🦋', '🧸', '🍯', '🍫', '🥂', '👑'] },
  { name: 'Vibes', icon: '💯', emojis: ['💯', '👏', '🙌', '🙏', '🎉', '👀', '🤝', '💎', '🕊️', '💐', '🌙', '☀️'] }
];

export const ChatScreen: React.FC<Props> = ({
  currentUser,
  partner,
  messages,
  presence,
  availableUsers = [],
  fetchAvailableUsers,
  onDirectConnect,
  onConnectByEmail,
  onSendMessage,
  onMarkRead,
  onToggleReaction,
  onSetTyping,
  onStartCall,
  activeCall,
  isCallMinimized,
  onExpandCall,
  onToggleMinimizeCall,
  onEndCall,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showLoveNotes, setShowLoveNotes] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerEmailInput, setPartnerEmailInput] = useState('');
  const [connectingEmail, setConnectingEmail] = useState(false);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>('Love');
  const [showFullEmojiPalette, setShowFullEmojiPalette] = useState(false);
  const [showComposerEmojiPicker, setShowComposerEmojiPicker] = useState(false);

  // In-Chat Floating Call Duration Timer & Mute Status
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isCallMuted, setIsCallMuted] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (activeCall && activeCall.status === 'accepted') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  const handleToggleCallMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = callEngine.toggleMute();
    setIsCallMuted(muted);
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (fetchAvailableUsers) {
      fetchAvailableUsers();
    }
  }, [fetchAvailableUsers]);

  const handleConnectEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmailInput.trim() || !onConnectByEmail) return;
    setConnectingEmail(true);
    try {
      await onConnectByEmail(partnerEmailInput.trim());
      setShowPartnerModal(false);
      setPartnerEmailInput('');
    } finally {
      setConnectingEmail(false);
    }
  };

  const handleDirectUserConnect = async (uid: string) => {
    if (!onDirectConnect) return;
    setConnectingUid(uid);
    try {
      await onDirectConnect(uid);
      setShowPartnerModal(false);
    } finally {
      setConnectingUid(null);
    }
  };

  // Lightweight GPU-accelerated Floating Reaction Particles
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [reactionNotification, setReactionNotification] = useState<{ text: string; emoji: string } | null>(null);
  const msgRefs = useRef<{ [msgId: string]: HTMLDivElement | null }>({});
  const prevReactionsRef = useRef<Record<string, Record<string, string>>>({});
  const isFirstMountRef = useRef(true);

  // Trigger smooth, lightweight burst of floating emojis
  const triggerFloatingEmojiBurst = (startX: number, startY: number, chosenEmoji: string) => {
    const complementaries = ['❤️', '💖', '✨', '🥰', '💕', '💫', '🌟'];
    const newParticles: FloatingParticle[] = [];

    // Compact particle count (4) ensures silky 60fps with zero frame lag
    const totalCount = 4;
    for (let i = 0; i < totalCount; i++) {
      const emoji = i < 2 ? chosenEmoji : complementaries[Math.floor(Math.random() * complementaries.length)];
      const pId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${i}`;
      
      const spreadX = (Math.random() - 0.5) * 40;
      const spreadY = (Math.random() - 0.5) * 15;

      newParticles.push({
        id: pId,
        emoji,
        x: startX + spreadX,
        y: startY + spreadY,
        driftX: (Math.random() - 0.5) * 50,
        floatY: -(100 + Math.random() * 60),
        size: 18 + Math.floor(Math.random() * 6),
        duration: 1.0 + Math.random() * 0.3,
      });
    }

    setFloatingParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      const expiredIds = new Set(newParticles.map((p) => p.id));
      setFloatingParticles((prev) => prev.filter((p) => !expiredIds.has(p.id)));
    }, 1400);
  };

  // Detect reaction updates from partner across tabs/devices
  useEffect(() => {
    if (isFirstMountRef.current) {
      messages.forEach((msg) => {
        prevReactionsRef.current[msg.id] = { ...(msg.reactions || {}) };
      });
      isFirstMountRef.current = false;
      return;
    }

    messages.forEach((msg) => {
      const prev = prevReactionsRef.current[msg.id] || {};
      const curr = msg.reactions || {};

      Object.entries(curr).forEach(([reactorUid, emojiVal]) => {
        const emoji = String(emojiVal);
        if (reactorUid !== currentUser.uid && emoji && emoji !== prev[reactorUid]) {
          const el = msgRefs.current[msg.id];
          let bx = window.innerWidth / 2;
          let by = window.innerHeight / 2;
          if (el) {
            const rect = el.getBoundingClientRect();
            bx = rect.left + rect.width / 2;
            by = rect.top + rect.height / 2;
          }
          triggerFloatingEmojiBurst(bx, by, emoji);
          sounds.playPopSound();

          const reactorName = partner?.displayName || 'Your Partner';
          setReactionNotification({
            text: `${reactorName} reacted ${emoji}`,
            emoji,
          });

          setTimeout(() => {
            setReactionNotification(null);
          }, 2500);
        }
      });

      prevReactionsRef.current[msg.id] = { ...curr };
    });
  }, [messages, partner, currentUser.uid]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages and mark unread messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const hasUnread = messages.some(
      (m) => m.senderId !== currentUser.uid && !m.readBy?.includes(currentUser.uid)
    );
    if (hasUnread) {
      onMarkRead();
    }
  }, [messages, onMarkRead, currentUser.uid]);

  // Voice Recording Start
  const startVoiceRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingTime(0);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start();
        setIsRecording(true);

        recordTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        // Fallback simulation
        setIsRecording(true);
        recordTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.warn("Microphone access fallback enabled:", err);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // Cancel recording
  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  // Finish & Send Voice Message
  const finishAndSendVoiceNote = async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const duration = recordingTime || 4;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setTimeout(async () => {
        let dataUrl = '';
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
        await onSendMessage('Voice Note', 'audio', undefined, dataUrl || undefined, duration);
        setIsRecording(false);
        setRecordingTime(0);
      }, 200);
    } else {
      await onSendMessage('Voice Note', 'audio', undefined, undefined, duration);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Handle typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onSetTyping(e.target.value.length > 0);
  };

  // Handle send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && !selectedImage) return;

    if (selectedImage) {
      await onSendMessage(textToSend, 'image', selectedImage);
      setSelectedImage(null);
    } else {
      await onSendMessage(textToSend, 'text');
    }

    setInputText('');
    onSetTyping(false);
  };

  // Image Upload handler - triggers rich preview modal
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = event.target.result as string;
          setPreviewImage(res);
          setImageCaption(inputText.trim());
          setShowImagePreviewModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
    // Clear the file input value so user can pick the same image file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cancel local image preview
  const handleCancelImagePreview = () => {
    setShowImagePreviewModal(false);
    setPreviewImage(null);
    setImageCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Finalize and upload image to scrapbook & chat
  const handleConfirmUploadImage = async () => {
    if (!previewImage || isUploadingImage) return;
    setIsUploadingImage(true);
    sounds.playSendSound();

    try {
      const captionText = imageCaption.trim() || inputText.trim() || 'Celestial Memory';
      await onSendMessage(captionText, 'image', previewImage);
      setShowImagePreviewModal(false);
      setPreviewImage(null);
      setImageCaption('');
      setInputText('');
      setSelectedImage(null);
      onSetTyping(false);
    } catch (err) {
      console.error("Failed to upload memory image:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Send quick love note
  const handleSendLoveNote = (note: string) => {
    onSendMessage(note, 'text');
    setShowLoveNotes(false);
  };

  // Send quick predefined reply chip
  const handleSendQuickReply = async (text: string) => {
    sounds.playSendSound();
    await onSendMessage(text, 'text');
  };

  // Format message time
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    let date: Date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date header
  const formatDateHeader = (timestamp: any) => {
    let date: Date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'Today';

    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateStr = formatDateHeader(msg.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.msgs.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, msgs: [msg] });
    }
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 h-[calc(100vh-150px)] md:h-[calc(100vh-115px)] cosmos-grid-bg relative overflow-hidden text-slate-100">
      
      {/* Background watermark stars */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
        <Sparkles className="w-96 h-96 text-[#f5a623] fill-[#f5a623]" />
      </div>

      {/* Real-World Connected Partner Status & Switcher Header Bar */}
      <div className="bg-[#0b0914] px-3 sm:px-4 py-2 border-b border-white/10 flex items-center justify-between gap-3 relative z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={partner ? partner.photoUrl : (currentUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=partner`)}
              alt="Partner Avatar"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-[#f5a623] shadow-md"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${
                partner ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-serif font-bold text-white truncate">
                {partner ? partner.displayName : 'Connect Your Partner'}
              </h3>
              {partner && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  Live
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {presence?.typing ? (
                <span className="text-[#f5a623] font-medium animate-pulse">Typing a message...</span>
              ) : partner ? (
                <span>{partner.email}</span>
              ) : (
                <span className="text-amber-300">Tap 'Link Partner' to pair accounts</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              if (fetchAvailableUsers) fetchAvailableUsers();
              setShowPartnerModal(true);
            }}
            className="bg-white/[0.06] hover:bg-[#f5a623]/20 border border-white/15 hover:border-[#f5a623]/60 text-slate-200 hover:text-[#f5a623] text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            title="Connect or Switch Partner Account"
          >
            <span>👥</span>
            <span className="text-[11px] font-medium">{partner ? 'Switch Partner' : 'Link Partner'}</span>
          </button>
        </div>
      </div>

      {/* Labeled Quick Love Notes & Call Triggers Drawer */}
      <div className="bg-[#0b0914]/95 backdrop-blur-md px-3 sm:px-4 py-1.5 border-b border-white/10 flex items-center justify-between gap-2 relative z-20 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoveNotes(!showLoveNotes)}
            className={`px-3 py-1 rounded-full text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showLoveNotes
                ? 'bg-[#f5a623] text-black border-[#f5a623]'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-[#f5a623] border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ Quick Love Notes</span>
            <span className="text-[10px] opacity-75">{showLoveNotes ? '▲' : '▼'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Voice & Video Call Triggers in Chat */}
          {onStartCall && partner && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onStartCall('voice')}
                className="bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                title="Start Voice Call with Partner"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] hidden sm:inline">Voice Call</span>
              </button>

              <button
                onClick={() => onStartCall('video')}
                className="amber-pill-btn text-black px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                title="Start Video Call with Partner"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Video Call</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Quick Love Notes Drawer */}
      {showLoveNotes && (
        <div className="bg-[#0e0b1c] border-b border-white/10 p-3 sm:p-4 space-y-3 relative z-20 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-[#f5a623] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 💌 1-Tap Celestial Whispers:
            </span>
            <button
              onClick={() => setShowLoveNotes(false)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 text-xs"
            >
              Close ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {THEME.defaultLoveNotes.map((note, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleSendLoveNote(note);
                  setShowLoveNotes(false);
                }}
                className="bg-white/[0.04] hover:bg-[#f5a623]/20 text-slate-200 hover:text-[#f5a623] text-xs font-serif px-3 py-1.5 rounded-full border border-white/10 hover:border-[#f5a623]/40 transition-all cursor-pointer"
              >
                {note}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Active Call Status Indicator (duration, status & quick call controls) */}
      <AnimatePresence>
        {activeCall && (activeCall.status === 'accepted' || activeCall.status === 'offered') && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            id="chat-active-call-indicator"
            className="px-3 sm:px-4 pt-2.5 pb-1 relative z-30 shrink-0"
          >
            <div
              onClick={() => onExpandCall && onExpandCall()}
              className="max-w-xl mx-auto bg-[#100d24]/95 hover:bg-[#15112e] backdrop-blur-xl border border-emerald-500/50 hover:border-emerald-400/80 shadow-[0_4px_25px_rgba(16,185,129,0.22)] rounded-2xl sm:rounded-full px-3.5 py-2 flex items-center justify-between gap-3 text-white transition-all cursor-pointer group select-none"
              title="Ongoing Call • Click to expand full call overlay"
            >
              {/* Left: Live pulsing status & Partner avatar */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={partner?.photoUrl || (currentUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=partner`)}
                    alt={partner?.displayName || 'Partner'}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500 shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#100d24] animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-serif font-bold text-white truncate max-w-[110px] sm:max-w-[160px]">
                      {partner?.displayName || 'Your Partner'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      {activeCall.type === 'video' ? <Video className="w-3 h-3 text-emerald-400" /> : <Phone className="w-3 h-3 text-emerald-400" />}
                      <span>{activeCall.type === 'video' ? 'Video Call' : 'Voice Call'}</span>
                    </span>
                  </div>

                  {/* Duration + Soundwave visualizer */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      {activeCall.status === 'offered' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span className="text-amber-300 font-sans text-[10px]">Ringing partner...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="tracking-wider">{formatCallDuration(callDuration)}</span>
                        </>
                      )}
                    </div>

                    {/* Animated live audio equalizer waves */}
                    {activeCall.status === 'accepted' && (
                      <div className="flex items-end gap-0.5 h-3 px-1" title="Call audio connected">
                        <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-0.5 h-3 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.45s]" />
                        <span className="w-0.5 h-2.5 bg-emerald-300 rounded-full animate-bounce" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons (Mute, Return/Expand, End Call) */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Mute Mic Shortcut */}
                <button
                  id="chat-toggle-call-mute-btn"
                  onClick={handleToggleCallMute}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isCallMuted
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/30 ring-1 ring-red-400'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
                  }`}
                  title={isCallMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isCallMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                {/* Return / Expand Call Overlay */}
                <button
                  id="chat-expand-call-btn"
                  onClick={() => onExpandCall && onExpandCall()}
                  className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 border border-white/15 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Expand to Fullscreen Call Overlay"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] hidden sm:inline">Return to Call</span>
                </button>

                {/* End Call Button */}
                {onEndCall && (
                  <button
                    id="chat-end-call-btn"
                    onClick={onEndCall}
                    className="p-2 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all cursor-pointer shadow-md shadow-red-600/40 hover:scale-105"
                    title="End Call"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Partner Reaction Toast Notification Alert */}
      {reactionNotification && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-[#15102a]/95 backdrop-blur-md border border-[#f5a623]/60 shadow-[0_0_25px_rgba(245,166,35,0.35)] rounded-full px-4 py-2 flex items-center gap-2.5 animate-in slide-in-from-top-4 fade-in duration-200">
          <span className="text-xl animate-bounce">{reactionNotification.emoji}</span>
          <span className="text-xs font-serif font-bold text-amber-200">{reactionNotification.text}</span>
          <Sparkles className="w-3.5 h-3.5 text-[#f5a623] animate-pulse" />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 pb-20 md:pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
            <div className="w-16 h-16 bg-[#f5a623]/10 border border-[#f5a623]/40 rounded-full flex items-center justify-center mb-3 text-[#f5a623] shadow-[0_0_20px_rgba(245,166,35,0.2)]">
              <Sparkles className="w-8 h-8 fill-[#f5a623] animate-pulse" />
            </div>
            <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
              Your Celestial Space is Ready ✨
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-xs">
              Whisper a sweet thought across the stars, send a photo, or start a video call.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-md">
              {THEME.defaultLoveNotes.slice(0, 3).map((note, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendLoveNote(note)}
                  className="bg-white/[0.05] hover:bg-[#f5a623]/20 text-slate-200 hover:text-[#f5a623] text-xs font-medium px-4 py-2 rounded-full border border-white/10 hover:border-[#f5a623]/40 shadow-md transition-all hover:scale-105 cursor-pointer font-serif"
                >
                  {note}
                </button>
              ))}
            </div>
          </div>
        ) : (
          groupedMessages.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              {/* Date Header Badge */}
              <div className="flex justify-center my-2">
                <span className="bg-[#0b0914] text-[#f5a623] text-[10px] font-serif font-bold px-3.5 py-0.5 rounded-full border border-[#f5a623]/30 shadow-md">
                  {group.date}
                </span>
              </div>

              {group.msgs.map((msg) => {
                const isSender = msg.senderId === currentUser.uid;
                const isRead = partner
                  ? (msg.readBy || []).includes(partner.uid)
                  : (msg.readBy || []).some((uid) => uid !== currentUser.uid);
                const timeStr = formatMessageTime(msg.createdAt);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} group relative`}
                  >
                    {/* Message Bubble Container */}
                    <div
                      ref={(el) => {
                        msgRefs.current[msg.id] = el;
                      }}
                      className="relative max-w-[80%] sm:max-w-[70%]"
                    >
                      <div
                        className={`p-3 rounded-2xl shadow-md relative transition-all ${
                          isSender
                            ? 'amber-pill-btn !rounded-2xl text-black font-medium rounded-br-xs shadow-[0_0_15px_rgba(245,166,35,0.2)]'
                            : 'bg-[#151229] text-slate-100 border border-white/10 rounded-bl-xs'
                        }`}
                      >
                        {/* Image Attachment */}
                        {msg.type === 'image' && msg.imageUrl && (
                          <div className="mb-2 relative rounded-xl overflow-hidden group/img cursor-pointer bg-black/20">
                            <img
                              src={msg.imageUrl}
                              alt="Shared photo"
                              className="max-h-64 w-full object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-103"
                              onClick={() => setExpandedImage(msg.imageUrl!)}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="p-2 bg-purple-950/80 rounded-full text-amber-300 shadow-md">
                                <Maximize2 className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Audio Voice Note */}
                        {msg.type === 'audio' && (
                          <div className="my-1">
                            <VoiceMessagePlayer audioUrl={msg.audioUrl} duration={msg.audioDuration || 6} isSender={isSender} />
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.text && (
                          <div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          </div>
                        )}

                        {/* Message Footer: Time + Visual Read Receipt Checkmarks */}
                        <div
                          className={`flex items-center justify-end gap-1.5 mt-1 text-[11px] select-none ${
                            isSender ? 'text-black/65 font-medium' : 'text-slate-400'
                          }`}
                        >
                          <span className="tabular-nums">{timeStr}</span>
                          {isSender && (
                            <span
                              className="inline-flex items-center ml-0.5 transition-all duration-300"
                              title={
                                isRead
                                  ? `Read by ${partner?.displayName || 'partner'}`
                                  : 'Sent • Delivered'
                              }
                            >
                              {isRead ? (
                                <CheckCheck
                                  className="w-3.5 h-3.5 text-sky-600 drop-shadow-[0_0_2px_rgba(2,132,199,0.3)] stroke-[2.5]"
                                  aria-label="Read"
                                />
                              ) : (
                                <CheckCheck
                                  className="w-3.5 h-3.5 text-black/35 stroke-[2]"
                                  aria-label="Delivered"
                                />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Emoji Reactions Bar underneath bubble */}
                      {Object.keys(msg.reactions || {}).length > 0 && (
                        <div
                          className={`flex flex-wrap gap-1.5 mt-1.5 ${
                            isSender ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {Object.entries(msg.reactions || {}).map(([reactorUid, emoji]) => {
                            const isMyReaction = reactorUid === currentUser.uid;
                            return (
                              <button
                                key={reactorUid}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  triggerFloatingEmojiBurst(rect.left + rect.width / 2, rect.top, emoji);
                                  sounds.playPopSound();
                                  onToggleReaction(msg.id, emoji);
                                }}
                                className={`text-xs px-2.5 py-1 rounded-full border shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-115 active:scale-95 font-bold ${
                                  isMyReaction
                                    ? 'bg-[#f5a623]/25 border-[#f5a623] text-amber-200 ring-1 ring-[#f5a623]/50'
                                    : 'bg-[#191338] border-purple-500/70 text-purple-100 hover:bg-purple-900'
                                }`}
                                title={isMyReaction ? "Your reaction (click to toggle)" : `${partner?.displayName || 'Partner'} reacted (click to react back)`}
                              >
                                <span className="text-sm leading-none">{emoji}</span>
                                {isMyReaction && <span className="text-[10px] text-[#f5a623] font-bold">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick Reaction Selector trigger on hover/click */}
                      <button
                        onClick={() => {
                          if (activeReactionPickerMsgId === msg.id) {
                            setActiveReactionPickerMsgId(null);
                            setShowFullEmojiPalette(false);
                          } else {
                            setActiveReactionPickerMsgId(msg.id);
                            setShowFullEmojiPalette(false);
                          }
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 bg-[#191338] hover:bg-purple-800 text-purple-300 hover:text-amber-300 rounded-full border border-purple-700/50 shadow-md cursor-pointer z-20 ${
                          isSender ? '-left-9' : '-right-9'
                        }`}
                        title="React to message"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      {/* Popup Reaction Palette - Horizontal, Clear, Fully Visible */}
                      {activeReactionPickerMsgId === msg.id && (
                        <div
                          className={`absolute bottom-full mb-2 z-40 bg-[#120e29]/95 backdrop-blur-xl border border-amber-500/40 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] p-2 animate-in fade-in zoom-in-95 duration-150 ${
                            isSender ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'
                          }`}
                          style={{ minWidth: '280px', maxWidth: '340px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Quick Top Horizontal Reaction Bar */}
                          <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-white/10">
                            {['❤️', '💖', '🔥', '🥰', '😍', '😘', '🥺', '😂'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  triggerFloatingEmojiBurst(rect.left + rect.width / 2, rect.top, emoji);
                                  sounds.playPopSound();
                                  onToggleReaction(msg.id, emoji);
                                  setActiveReactionPickerMsgId(null);
                                  setShowFullEmojiPalette(false);
                                }}
                                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-lg transition-transform hover:scale-130 active:scale-95 cursor-pointer"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              onClick={() => setShowFullEmojiPalette(!showFullEmojiPalette)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border ${
                                showFullEmojiPalette
                                  ? 'bg-[#f5a623] text-black border-[#f5a623]'
                                  : 'bg-white/5 hover:bg-white/15 text-amber-300 border-white/15'
                              }`}
                              title="More emojis"
                            >
                              {showFullEmojiPalette ? '✕' : '+'}
                            </button>
                          </div>

                          {/* Expanded Categorized Emoji Tray */}
                          {showFullEmojiPalette && (
                            <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                              {/* Category Tabs */}
                              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                                {EMOJI_CATEGORIES.map((cat) => (
                                  <button
                                    key={cat.name}
                                    onClick={() => setActiveEmojiCategory(cat.name)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                                      activeEmojiCategory === cat.name
                                        ? 'bg-[#f5a623]/25 text-[#f5a623] border border-[#f5a623]/60'
                                        : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                                    }`}
                                  >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Emoji Grid (Horizontal 6-columns, all visible and clickable) */}
                              <div className="grid grid-cols-6 gap-1.5 p-1 max-h-36 overflow-y-auto">
                                {(EMOJI_CATEGORIES.find((c) => c.name === activeEmojiCategory)?.emojis || EXTENDED_LOVE_EMOJIS).map(
                                  (emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        triggerFloatingEmojiBurst(rect.left + rect.width / 2, rect.top, emoji);
                                        sounds.playPopSound();
                                        onToggleReaction(msg.id, emoji);
                                        setActiveReactionPickerMsgId(null);
                                        setShowFullEmojiPalette(false);
                                      }}
                                      className="h-8 rounded-xl hover:bg-white/15 flex items-center justify-center text-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Love Notes Drawer Modal */}
      {showLoveNotes && (
        <div className="bg-[#0b0914]/95 backdrop-blur-xl border-t border-white/10 p-3.5 shadow-2xl relative z-20 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-serif font-bold text-[#f5a623] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#f5a623]" />
              Celestial Whispers:
            </span>
            <button
              onClick={() => setShowLoveNotes(false)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {THEME.defaultLoveNotes.map((note, idx) => (
              <button
                key={idx}
                onClick={() => handleSendLoveNote(note)}
                className="bg-white/[0.04] hover:bg-[#f5a623]/20 text-slate-200 hover:text-[#f5a623] text-xs font-serif px-3.5 py-1.5 rounded-full border border-white/10 hover:border-[#f5a623]/40 transition-all cursor-pointer hover:scale-102"
              >
                {note}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Image Preview Bar */}
      {selectedImage && (
        <div className="bg-[#0b0914] border-t border-white/10 p-2.5 flex items-center justify-between gap-2 relative z-20">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={selectedImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-[#f5a623]/60" />
            <p className="text-xs text-slate-300 font-medium truncate">Cosmic photo ready to send</p>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 text-slate-400 hover:text-[#f5a623] hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Composer Input Bar */}
      <div className="p-2.5 sm:p-3 bg-[#0b0914]/95 backdrop-blur-md border-t border-white/10 sticky bottom-0 z-20 space-y-2">
        {/* Quick Reply Chips Row */}
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pt-0.5">
          <div className="flex items-center gap-1 shrink-0 text-[11px] font-serif font-bold text-[#f5a623] pl-1 pr-1 select-none">
            <Zap className="w-3 h-3 text-[#f5a623]" />
            <span>Quick:</span>
          </div>
          {QUICK_REPLIES.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuickReply(reply.text)}
              className="shrink-0 bg-white/[0.04] hover:bg-[#f5a623]/20 active:scale-95 text-slate-200 hover:text-amber-200 border border-white/10 hover:border-[#f5a623]/50 text-xs font-serif font-medium px-3 py-1 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer shadow-sm flex items-center gap-1.5 group"
              title={`Send "${reply.text}"`}
            >
              <span className="text-xs group-hover:scale-110 transition-transform">{reply.icon}</span>
              <span>{reply.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="max-w-5xl mx-auto flex items-center gap-2">
          {/* File input for photos */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImagePick}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-[#f5a623] flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-white/10"
            title="Attach Photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowLoveNotes(!showLoveNotes)}
            className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#f5a623] flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-white/10"
            title="Quick Celestial Notes"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {isRecording ? (
            <div className="flex-1 bg-rose-950/80 border border-rose-500/60 rounded-full px-4 py-1.5 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-rose-200">Recording Voice...</span>
                <span className="text-xs font-mono text-amber-300 font-bold ml-1">
                  0:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-900/50 rounded-full cursor-pointer transition-colors"
                  title="Cancel Recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={finishAndSendVoiceNote}
                  className="amber-pill-btn text-black font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 shadow-md"
                  title="Send Voice Note"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={startVoiceRecording}
                className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-rose-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-white/10"
                title="Record Voice Message"
              >
                <Mic className="w-5 h-5" />
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={partner ? `Whisper to ${partner.displayName.split(' ')[0]}...` : "Type a message..."}
                  className="w-full bg-white/[0.05] border border-white/10 focus:border-[#f5a623] text-slate-100 placeholder-slate-400 text-sm rounded-full pl-4 pr-10 py-2.5 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowComposerEmojiPicker(!showComposerEmojiPicker)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Composer Floating Emoji Drawer */}
                {showComposerEmojiPicker && (
                  <div
                    className="absolute bottom-full right-0 mb-3 z-40 bg-[#120e29]/95 backdrop-blur-xl border border-amber-500/40 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] p-3 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {EMOJI_CATEGORIES.map((cat) => (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => setActiveEmojiCategory(cat.name)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                              activeEmojiCategory === cat.name
                                ? 'bg-[#f5a623]/25 text-[#f5a623] border border-[#f5a623]/60'
                                : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowComposerEmojiPicker(false)}
                        className="text-slate-400 hover:text-white p-1 ml-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5 pt-2 max-h-48 overflow-y-auto">
                      {(EMOJI_CATEGORIES.find((c) => c.name === activeEmojiCategory)?.emojis || EXTENDED_LOVE_EMOJIS).map(
                        (emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + emoji);
                              sounds.playPopSound();
                            }}
                            className="h-9 rounded-xl hover:bg-white/15 flex items-center justify-center text-xl transition-transform hover:scale-130 active:scale-95 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() && !selectedImage}
                className="w-10 h-10 rounded-full amber-pill-btn disabled:opacity-30 text-black flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-lg hover:scale-105"
                title="Send Whispers"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          )}
        </form>
      </div>

      {/* Floating Animated Emojis Burst Overlay (Hardware Accelerated 60 FPS) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                opacity: 0,
                scale: 0.5,
                x: p.x,
                y: p.y,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8],
                x: p.x + p.driftX,
                y: p.y + p.floatY,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                ease: [0.25, 0.1, 0.25, 1],
                times: [0, 0.2, 0.75, 1],
              }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                fontSize: `${p.size}px`,
                pointerEvents: 'none',
                userSelect: 'none',
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
              }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Expanded Lightbox Modal for Photo viewing */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="absolute top-0 right-0 p-4 flex items-center gap-3 z-10">
              <a
                href={expandedImage}
                download="celestial-memory.jpg"
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-xs transition-colors"
                title="Download Photo"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setExpandedImage(null)}
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-xs transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img
              src={expandedImage}
              alt="Expanded Memory"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Partner Link & Multi-Account Switcher Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e0b1c] border border-[#f5a623]/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => setShowPartnerModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#f5a623]" />
              <h3 className="text-lg font-serif font-bold text-white">Connect Partner Space</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Currently logged in as <span className="text-[#f5a623] font-bold">{currentUser.email || currentUser.displayName}</span>
            </p>

            {/* Email Direct Link Form */}
            <form onSubmit={handleConnectEmailSubmit} className="mb-5 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Link with Partner Email:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="e.g. partner@gmail.com"
                  value={partnerEmailInput}
                  onChange={(e) => setPartnerEmailInput(e.target.value)}
                  className="flex-1 bg-white/[0.05] border border-white/15 focus:border-[#f5a623] text-sm text-white px-3.5 py-2 rounded-xl outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={connectingEmail || !partnerEmailInput.trim()}
                  className="amber-pill-btn text-black text-xs font-bold px-4 py-2 rounded-xl shadow-md disabled:opacity-50 hover:scale-105 cursor-pointer shrink-0"
                >
                  {connectingEmail ? 'Linking...' : 'Connect'}
                </button>
              </div>
            </form>

            {/* Discovered Users on DuoLove */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Active Users in Sanctuary:
                </span>
                {fetchAvailableUsers && (
                  <button
                    type="button"
                    onClick={fetchAvailableUsers}
                    className="text-[11px] text-[#f5a623] hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                )}
              </div>

              {availableUsers.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between p-2.5 bg-black/40 border border-white/10 rounded-2xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.photoUrl}
                          alt={u.displayName}
                          className="w-8 h-8 rounded-full border border-[#f5a623] object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{u.displayName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDirectUserConnect(u.uid)}
                        disabled={connectingUid === u.uid}
                        className="amber-pill-btn text-black text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm hover:scale-105 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {connectingUid === u.uid ? 'Linking...' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-black/30 border border-white/10 rounded-2xl text-center text-xs text-slate-400">
                  Open another Google account in a second tab to connect automatically!
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* LOCAL IMAGE PREVIEW MODAL FOR SCRAPBOOK UPLOAD */}
      {showImagePreviewModal && previewImage && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-60 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="cosmic-card border border-[#f5a623]/60 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/50 flex items-center justify-center text-[#f5a623]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-sm flex items-center gap-1.5">
                    <span>Scrapbook Photo Preview</span>
                    <span className="text-[10px] text-amber-300 font-sans px-2 py-0.5 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/40">
                      Local Preview
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-serif">
                    Review and caption your photo before finalizing upload
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelImagePreview}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Discard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Photo Display Card */}
              <div className="relative group rounded-2xl overflow-hidden bg-black/80 border border-white/15 shadow-inner flex items-center justify-center min-h-[200px] max-h-[300px]">
                <img
                  src={previewImage}
                  alt="Scrapbook Memory Preview"
                  className="max-h-[300px] w-full object-contain rounded-2xl"
                />

                {/* Top overlay badge & action */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-black/75 backdrop-blur-md border border-white/15 text-[10px] text-amber-200 font-serif font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Camera className="w-3 h-3 text-[#f5a623]" />
                    <span>Memory Snapshot</span>
                  </span>
                </div>

                {/* Change photo button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-[#f5a623] hover:text-black text-slate-200 text-xs font-serif font-semibold px-2.5 py-1 rounded-full border border-white/15 hover:border-transparent flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Pick a different photo"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change Photo</span>
                </button>
              </div>

              {/* Caption Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-serif font-bold text-slate-200 flex items-center justify-between">
                  <span>Story Caption or Love Note</span>
                  <span className="text-[10px] font-sans text-slate-400">Optional</span>
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Add a loving thought or story for your scrapbook..."
                  className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#f5a623] transition-colors"
                  maxLength={150}
                  autoFocus
                />

                {/* Quick Emoji Buttons for Caption */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-slate-400 font-serif shrink-0">Stickers:</span>
                  {['❤️', '✨', '🌸', '💍', '🥂', '🧸', '💌', '📸', '🌙', '🌟'].map((em, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImageCaption((prev) => prev ? `${prev} ${em}` : em)}
                      className="text-xs hover:scale-125 transition-transform p-1 rounded hover:bg-white/10 cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrapbook & Sync Info Box */}
              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-2xl flex items-start gap-2.5 text-slate-300">
                <BookOpen className="w-4 h-4 text-[#f5a623] shrink-0 mt-0.5" />
                <p className="text-[11px] font-serif leading-relaxed text-purple-200/90">
                  This photo will instantly be added to your shared <strong className="text-amber-200">Scrapbook Timeline</strong>, <strong className="text-amber-200">Celestial Gallery</strong>, and chat vault.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-white/10 bg-black/50 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleCancelImagePreview}
                disabled={isUploadingImage}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-serif font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmUploadImage}
                disabled={isUploadingImage}
                className="flex-1 amber-pill-btn text-black text-xs font-serif font-bold py-2 px-4 rounded-xl shadow-lg hover:scale-102 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isUploadingImage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading to Scrapbook...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload to Scrapbook & Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

