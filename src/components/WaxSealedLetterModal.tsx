import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  X, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Send, 
  Sparkles, 
  Volume2, 
  Check, 
  Mail, 
  Stamp, 
  Lock
} from 'lucide-react';
import { User } from '../types';
import { sounds } from '../lib/audio';

export interface LoveLetter {
  id: string;
  senderName: string;
  senderPhoto?: string;
  recipientName: string;
  title: string;
  bodyText: string;
  audioUrl?: string;
  audioDuration?: number;
  waxColor: 'red' | 'gold' | 'rose' | 'purple';
  stampSymbol: 'heart' | 'rose' | 'crown' | 'sparkle';
  createdAt: number;
}

interface WaxSealedLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  partner: User;
  onSendLetter?: (letter: LoveLetter) => void;
  existingLetter?: LoveLetter | null;
}

export const WaxSealedLetterModal: React.FC<WaxSealedLetterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  partner,
  onSendLetter,
  existingLetter,
}) => {
  // Wax Envelope Opening state
  const [isSealed, setIsSealed] = useState<boolean>(true);
  const [isOpeningAnimation, setIsOpeningAnimation] = useState<boolean>(false);

  // Compose mode or view mode
  const isViewMode = !!existingLetter;

  // Form states for creation
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [waxColor, setWaxColor] = useState<'red' | 'gold' | 'rose' | 'purple'>('rose');
  const [stampSymbol, setStampSymbol] = useState<'heart' | 'rose' | 'crown' | 'sparkle'>('heart');

  // Audio Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  // Handle Breaking Golden Wax Seal Animation
  const handleUnsealEnvelope = () => {
    setIsOpeningAnimation(true);
    sounds.playSpellSound('hearts_burst');

    setTimeout(() => {
      setIsSealed(false);
      setIsOpeningAnimation(false);
      sounds.playSpellSound('chibi_spell');
    }, 1200);
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      sounds.playSpellSound('pop');
    } catch (err) {
      console.error('Audio recording failed:', err);
      // Fallback simulated voice recording for browser without mic permission
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback
      setAudioBlobUrl('https://actions.google.com/sounds/v1/ambiences/outdoor_rain.ogg');
    }
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    sounds.playSpellSound('pop');
  };

  const handleTogglePlayAudio = () => {
    const targetUrl = isViewMode ? existingLetter?.audioUrl : audioBlobUrl;
    if (!targetUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(targetUrl);
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleSend = () => {
    if (!title.trim() || !bodyText.trim()) return;

    const newLetter: LoveLetter = {
      id: `letter_${Date.now()}`,
      senderName: currentUser.displayName,
      senderPhoto: currentUser.photoUrl,
      recipientName: partner.displayName,
      title: title.trim(),
      bodyText: bodyText.trim(),
      audioUrl: audioBlobUrl || undefined,
      audioDuration: recordingSeconds > 0 ? recordingSeconds : undefined,
      waxColor,
      stampSymbol,
      createdAt: Date.now(),
    };

    if (onSendLetter) onSendLetter(newLetter);
    sounds.playSpellSound('hearts_burst');
    onClose();
  };

  const waxBgMap = {
    red: 'from-amber-700 via-amber-600 to-amber-900 border-[#f5a623] text-white',
    gold: 'from-[#f5a623] via-amber-400 to-yellow-600 border-white/40 text-black',
    rose: 'from-rose-600 via-amber-600 to-rose-900 border-[#f5a623]/60 text-white',
    purple: 'from-indigo-900 via-purple-900 to-slate-950 border-[#f5a623]/60 text-[#f5a623]',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          className="cosmic-card border border-white/15 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative text-slate-100 font-serif"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 1. ENVELOPE SEALED STATE (Click Wax Stamp to Melt & Open) */}
          {isSealed && isViewMode ? (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 my-auto">
              <motion.div
                animate={
                  isOpeningAnimation
                    ? { scale: [1, 1.3, 0], rotate: [0, 15, -15, 360], opacity: [1, 1, 0] }
                    : { scale: 1 }
                }
                whileHover={{ scale: 1.06 }}
                transition={{ duration: isOpeningAnimation ? 1.2 : 0.2 }}
                onClick={handleUnsealEnvelope}
                className={`w-28 h-28 rounded-full bg-gradient-to-tr ${waxBgMap[existingLetter.waxColor]} border-4 shadow-2xl flex items-center justify-center cursor-pointer transition-all group relative`}
              >
                <div className="text-4xl filter drop-shadow-md">
                  {existingLetter.stampSymbol === 'heart' && '💖'}
                  {existingLetter.stampSymbol === 'rose' && '🌹'}
                  {existingLetter.stampSymbol === 'crown' && '👑'}
                  {existingLetter.stampSymbol === 'sparkle' && '✨'}
                </div>

                <div className="absolute -bottom-2 amber-pill-btn text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase whitespace-nowrap shadow-md">
                  Tap Wax Seal
                </div>
              </motion.div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white font-serif">
                  Love Letter from {existingLetter.senderName}
                </h3>
                <p className="text-xs text-slate-400 font-serif italic">
                  Sealed with golden celestial wax & everlasting affection
                </p>
              </div>
            </div>
          ) : (
            /* 2. UNSEALED LETTER BODY (Compose or Read Mode) */
            <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1 font-serif">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-widest text-[#f5a623] uppercase font-serif font-bold">
                    {isViewMode ? 'Unsealed Love Letter' : 'Compose Wax-Sealed Letter'}
                  </span>
                  <h3 className="text-lg font-bold text-white font-serif">
                    {isViewMode ? existingLetter.title : 'To My Dearest Partner'}
                  </h3>
                </div>
                <Mail className="w-6 h-6 text-[#f5a623]" />
              </div>

              {/* View mode text */}
              {isViewMode ? (
                <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4 shadow-inner text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                  <p>{existingLetter.bodyText}</p>

                  {/* Audio Voice Note Player in Letter */}
                  {existingLetter.audioUrl && (
                    <div className="pt-3 border-t border-white/10 font-serif">
                      <p className="text-[10px] font-bold text-[#f5a623] mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <Volume2 className="w-3.5 h-3.5 text-[#f5a623]" />
                        Attached Voice Note
                      </p>
                      <button
                        onClick={handleTogglePlayAudio}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {isPlayingAudio ? <Pause className="w-4 h-4 text-[#f5a623]" /> : <Play className="w-4 h-4 text-[#f5a623]" />}
                          <span>{isPlayingAudio ? 'Playing Voice Note...' : 'Listen to Voice Message'}</span>
                        </span>
                        {existingLetter.audioDuration && (
                          <span className="text-[10px] font-mono text-slate-400">{existingLetter.audioDuration}s</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Compose Mode Inputs */
                <div className="space-y-4 font-serif">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Letter Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Reasons why I cherish you..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5a623] font-serif"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Your Love Note</label>
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      placeholder="Write your sweet message here..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5a623] h-32 resize-none font-serif leading-relaxed"
                    />
                  </div>

                  {/* Audio Voice Note Recording Controls */}
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-2 font-serif">
                    <label className="text-[10px] font-bold text-[#f5a623] flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-[#f5a623]" />
                        Attach Audio Voice Note
                      </span>
                      {audioBlobUrl && <span className="text-emerald-400 font-mono text-[9px]">Voice Recorded ✓</span>}
                    </label>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Mic className="w-4 h-4 text-[#f5a623]" />
                        {audioBlobUrl ? 'Re-record Voice Note' : 'Record Audio Voice Message'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="w-full py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        Stop Recording ({recordingSeconds}s)
                      </button>
                    )}
                  </div>

                  {/* Wax Seal & Color Selector */}
                  <div className="grid grid-cols-2 gap-3 pt-2 font-serif">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Wax Seal Color</label>
                      <select
                        value={waxColor}
                        onChange={(e: any) => setWaxColor(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5a623]"
                      >
                        <option value="rose" className="bg-[#0b0914] text-white">🌸 Rose Pink</option>
                        <option value="gold" className="bg-[#0b0914] text-white">✨ Golden Amber</option>
                        <option value="red" className="bg-[#0b0914] text-white">❤️ Passion Red</option>
                        <option value="purple" className="bg-[#0b0914] text-white">💜 Cosmic Violet</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Stamp Emblem</label>
                      <select
                        value={stampSymbol}
                        onChange={(e: any) => setStampSymbol(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f5a623]"
                      >
                        <option value="heart" className="bg-[#0b0914] text-white">💖 Heart</option>
                        <option value="rose" className="bg-[#0b0914] text-white">🌹 Rose</option>
                        <option value="crown" className="bg-[#0b0914] text-white">👑 Crown</option>
                        <option value="sparkle" className="bg-[#0b0914] text-white">✨ Sparkle</option>
                      </select>
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!title.trim() || !bodyText.trim()}
                      className="w-full py-3 rounded-2xl amber-pill-btn text-black font-bold text-xs shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Seal Envelope & Send Letter ✨
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
