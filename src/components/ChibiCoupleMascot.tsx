import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Smile, MessageCircle, Send, Volume2, Mic, Flame, RefreshCw, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { sounds } from '../lib/audio';
import { FullBodyHumanoidAvatar } from './FullBodyHumanoidAvatar';

// Import Generated 3D Chibi Assets
import boy3dAvatar from '../assets/images/boy_3d_avatar_1786549529866.jpg';
import girl3dAvatar from '../assets/images/girl_3d_avatar_1786549541210.jpg';
import couple3dMascot from '../assets/images/couple_3d_mascot_1786549552542.jpg';

import { MoodPreset } from './HomeScreen';
import { ChibiWardrobeConfig } from './ChibiWardrobeModal';

interface ChibiCoupleMascotProps {
  currentUser: User;
  partner: User;
  onSendNudge: (type: string, emoji: string, message: string) => Promise<void>;
  onTriggerSpell?: (label: string, emoji: string) => void;
  userMood?: MoodPreset;
  partnerMood?: MoodPreset;
  wardrobeConfig?: ChibiWardrobeConfig;
}

export type ChibiActionType =
  | 'idle'
  | 'kiss'
  | 'hug'
  | 'dance'
  | 'hold_hands'
  | 'give_rose'
  | 'pat_head'
  | 'flying_heart'
  | 'cuddle';

interface ActiveCommandState {
  type: ChibiActionType;
  actor: 'boy' | 'girl'; // Who initiated the command
  speechText: string;
  id: number;
}

export const ChibiCoupleMascot: React.FC<ChibiCoupleMascotProps> = ({
  currentUser,
  partner,
  onSendNudge,
  onTriggerSpell,
  userMood,
  partnerMood,
  wardrobeConfig,
}) => {
  const [activeCommand, setActiveCommand] = useState<ActiveCommandState>({
    type: 'idle',
    actor: 'boy',
    speechText: 'Command us to kiss, hug, dance, or hold hands!',
    id: Date.now(),
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Setup Realtime BroadcastChannel for cross-window / cross-device syncing
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('duolove_chibi_stage');
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'CHIBI_COMMAND_SYNC') {
          triggerAnimationSequence(
            event.data.actionType,
            event.data.actor,
            event.data.speechText,
            false // Don't re-broadcast
          );
        }
      };
    } catch {
      // BroadcastChannel fallback
    }

    return () => {
      broadcastRef.current?.close();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Trigger Action Sequence with 3D Motion & Sound Effects
  const triggerAnimationSequence = async (
    actionType: ChibiActionType,
    actor: 'boy' | 'girl',
    customSpeech?: string,
    shouldBroadcast = true
  ) => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setIsExecuting(true);
    setIsWalking(true);
    setTimeout(() => setIsWalking(false), 400);

    sounds.playPopSound();

    // Default Speech Text per Action
    let defaultSpeech = '';
    const actorName = actor === 'boy' ? currentUser.displayName.split(' ')[0] : partner?.displayName?.split(' ')[0] || 'Partner';
    const targetName = actor === 'boy' ? partner?.displayName?.split(' ')[0] || 'Partner' : currentUser.displayName.split(' ')[0];

    switch (actionType) {
      case 'kiss':
        defaultSpeech = `Muah! ${actorName} gives ${targetName} a sweet smooch kiss! 💋💖`;
        break;
      case 'hug':
        defaultSpeech = `${actorName} wraps ${targetName} in a warm cozy bear hug! 🫂✨`;
        break;
      case 'dance':
        defaultSpeech = `${actorName} & ${targetName} are dancing under the starry sky! 💃🕺🎶`;
        break;
      case 'hold_hands':
        defaultSpeech = `${actorName} holds ${targetName}'s hand tenderly forever! 🤝💖`;
        break;
      case 'give_rose':
        defaultSpeech = `${actorName} presents a beautiful blooming red rose to ${targetName}! 🌹✨`;
        break;
      case 'pat_head':
        defaultSpeech = `${actorName} gently pats ${targetName}'s head with affection! 👑🥰`;
        break;
      case 'flying_heart':
        defaultSpeech = `${actorName} blows a flying 3D heart kiss to ${targetName}! 💖🚀`;
        break;
      case 'cuddle':
        defaultSpeech = `${actorName} & ${targetName} are snuggled up together on the heart rug! 🛋️🧸`;
        break;
      default:
        defaultSpeech = 'Ready for love commands!';
    }

    const finalSpeech = customSpeech || defaultSpeech;

    setActiveCommand({
      type: actionType,
      actor,
      speechText: finalSpeech,
      id: Date.now(),
    });

    // Spawn Floating Heart Particle Explosion (lightweight)
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 25 + Math.random() * 50,
      y: 35 + Math.random() * 30,
      emoji: ['💖', '💕', '💋', '🌹', '✨', '💓'][Math.floor(Math.random() * 6)],
    }));
    setFloatingHearts(newHearts);

    // Broadcast command to partner device/tab
    if (shouldBroadcast) {
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({
          type: 'CHIBI_COMMAND_SYNC',
          actionType,
          actor,
          speechText: finalSpeech,
        });
      }

      await onSendNudge(
        'chibi_command',
        actionType === 'kiss' ? '💋' : '💖',
        `${actorName} commanded 3D Chibis: "${finalSpeech}"`
      );
    }

    // Return to idle smoothly after 2.5 seconds
    resetTimerRef.current = setTimeout(() => {
      setActiveCommand({
        type: 'idle',
        actor: 'boy',
        speechText: 'Ready for more fun! 💕',
        id: Date.now(),
      });
      setIsExecuting(false);
      setFloatingHearts([]);
      resetTimerRef.current = null;
    }, 2500);
  };

  return (
    <div className="bg-gradient-to-br from-[#1d0a38] via-[#120829] to-[#2a0b42] rounded-3xl p-5 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden space-y-4">
      
      {/* Background Ambient Aura & Grid Stage */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <img
          src={couple3dMascot}
          alt="3D Chibi Background"
          className="w-full h-full object-cover blur-md"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-500/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#120829] rounded-[14px] flex items-center justify-center text-pink-400">
              <Wand2 className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>3D Interactive Animated Chibis</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Live 3D Commands 🎬
              </span>
            </h3>
            <p className="text-[11px] text-purple-300 font-medium">
              Command your 3D avatars to kiss, hug, dance & hold hands in real-time!
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-700/60 text-xs font-bold text-amber-300 shadow-inner">
          <span className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span>{isExecuting ? 'Performing Command...' : '3D Stage Ready'}</span>
        </div>
      </div>

      {/* 3D INTERACTIVE ANIMATED STAGE */}
      <div className="relative z-10 w-full h-[320px] sm:h-[360px] rounded-2xl bg-gradient-to-b from-[#180d38] to-[#0c051a] border border-purple-800/60 shadow-xl overflow-hidden flex flex-col justify-between p-4">
        
        {/* Subtle Stage Lighting Atmosphere (Reduced glow) */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.06)_0%,transparent_70%)]" />

        {/* Top Active Speech Bubble Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCommand.id}
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            className="self-center z-20 bg-purple-950/90 border border-pink-500/50 px-4 py-1.5 rounded-2xl shadow-md flex items-center gap-2 max-w-md text-center"
          >
            <MessageCircle className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white drop-shadow-sm">
              "{activeCommand.speechText}"
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Floating Heart Particle Explosion */}
        <AnimatePresence>
          {floatingHearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 1, scale: 0.5, x: `${h.x}%`, y: `${h.y}%` }}
              animate={{
                opacity: 0,
                scale: [0.8, 1.4, 0],
                y: `${h.y - 35}%`,
                x: `${h.x + (Math.random() * 16 - 8)}%`,
              }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute z-30 text-xl sm:text-2xl pointer-events-none drop-shadow-sm"
            >
              {h.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 3D CANVAS STAGE FLOOR & ANIMATED CHARACTERS */}
        <div className="relative w-full h-full flex items-end justify-center pb-4">
          
          {/* 3D Stage Floor Platform - Subtle & Grounded */}
          <div className="absolute bottom-2 w-4/5 h-14 rounded-[100%] bg-purple-950/50 border border-purple-700/30 shadow-sm pointer-events-none" />

          {/* 1. BOY HUMANOID CHARACTER (Abdul - Blue/Purple) - Draggable Physics Avatar */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -140, right: 140 }}
            dragElastic={0.2}
            dragSnapToOrigin
            whileDrag={{ scale: 1.18, cursor: 'grabbing' }}
            className="absolute bottom-2 z-20 flex flex-col items-center cursor-grab active:cursor-grabbing"
            animate={
              activeCommand.type === 'kiss'
                ? { x: -28, scale: 1.12, y: [0, -2, 0] }
                : activeCommand.type === 'hug'
                ? { x: -20, scale: 1.12, y: [0, -2, 0] }
                : activeCommand.type === 'dance'
                ? { x: [-70, -20, 20, -70], y: [0, -14, 0, -14, 0], rotate: [-6, 6, -6] }
                : activeCommand.type === 'hold_hands'
                ? { x: -36, scale: 1.08, y: [0, -2, 0] }
                : activeCommand.type === 'give_rose'
                ? { x: -48, scale: 1.1, y: 0 }
                : activeCommand.type === 'pat_head'
                ? { x: -30, scale: 1.1, y: 0 }
                : activeCommand.type === 'flying_heart'
                ? { x: -75, scale: 1.05, y: 0 }
                : activeCommand.type === 'cuddle'
                ? { x: -22, scale: 1.1, y: 0 }
                : { x: -110, scale: 1, y: 0 } // Default Idle Position
            }
            transition={{
              x: activeCommand.type === 'dance'
                ? { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 150, damping: 14, mass: 0.85 },
              scale: { type: 'spring', stiffness: 150, damping: 14 },
              rotate: activeCommand.type === 'dance'
                ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 150, damping: 14 },
              y: activeCommand.type === 'dance'
                ? { repeat: Infinity, duration: 0.7, ease: 'easeInOut' }
                : (activeCommand.type === 'kiss' || activeCommand.type === 'hug' || activeCommand.type === 'hold_hands')
                ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 150, damping: 14 },
            }}
          >
            <FullBodyHumanoidAvatar
              gender="boy"
              name={currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Abdul'}
              actionType={activeCommand.type}
              actor={activeCommand.actor}
              isMoving={isWalking}
              isCloseProximity={activeCommand.type !== 'idle'}
              moodAura={userMood}
              wardrobeConfig={wardrobeConfig}
              onTapAvatar={() => triggerAnimationSequence('give_rose', 'boy')}
            />
          </motion.div>

          {/* PET COMPANION MASCOT ON STAGE */}
          {wardrobeConfig?.pet && wardrobeConfig.pet !== 'none' && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="absolute bottom-3 z-25 flex flex-col items-center pointer-events-auto cursor-pointer group"
              onClick={() => {
                sounds.playPopSound();
                triggerAnimationSequence('cuddle', 'boy', `${wardrobeConfig.petName || 'Pet'} is happily snuggling with the couple! 🐾✨`);
              }}
            >
              <motion.div
                animate={{
                  y: [0, -4, 0],
                  rotate: activeCommand.type === 'dance' ? [-8, 8, -8] : [0, 2, -2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: 'easeInOut',
                }}
                className="relative flex flex-col items-center"
              >
                {/* Pet Icon Bubble */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-purple-600/40 border border-amber-400/50 backdrop-blur-md flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                  <span>
                    {wardrobeConfig.pet === 'kitten' ? '🐱' : wardrobeConfig.pet === 'puppy' ? '🐶' : '🐰'}
                  </span>
                </div>
                {/* Pet Name Tag */}
                <span className="text-[9px] font-extrabold text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400/40 shadow-sm mt-0.5 whitespace-nowrap">
                  {wardrobeConfig.petName || 'Companion'} 🐾
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* REAL HUMAN LIP-LOCK OVERLAY */}
          {activeCommand.type === 'kiss' && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute bottom-24 z-30 pointer-events-none flex flex-col items-center justify-center drop-shadow-md"
            >
              <span className="text-3xl">💋</span>
              <span className="text-xs font-bold text-amber-300 bg-pink-950/90 px-2.5 py-0.5 rounded-full border border-pink-400/50 shadow-md">
                MUAH! Sweet Kiss! 💖
              </span>
            </motion.div>
          )}

          {/* REALISTIC HUG BADGE OVERLAY */}
          {activeCommand.type === 'hug' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute bottom-32 z-30 pointer-events-none flex flex-col items-center justify-center drop-shadow-md"
            >
              <span className="text-3xl">🫂</span>
              <span className="text-[10px] font-bold text-pink-200 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-purple-400/50 shadow-md whitespace-nowrap">
                Warm Loving Embrace! ✨
              </span>
            </motion.div>
          )}

          {/* GIVE ROSE OVERLAY */}
          {activeCommand.type === 'give_rose' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-24 z-30 pointer-events-none flex flex-col items-center justify-center drop-shadow-md"
            >
              <motion.span
                animate={{ x: [-16, 16], scale: [0.9, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="text-3xl"
              >
                🌹
              </motion.span>
              <span className="text-[10px] font-bold text-rose-200 bg-rose-950/90 px-2.5 py-0.5 rounded-full border border-rose-400/50 shadow-md whitespace-nowrap">
                Gentleman Rose Proposal! ✨
              </span>
            </motion.div>
          )}

          {/* FLYING HEART OVERLAY */}
          {activeCommand.type === 'flying_heart' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-28 z-30 pointer-events-none flex flex-col items-center justify-center drop-shadow-md"
            >
              <motion.span
                animate={{ x: activeCommand.actor === 'boy' ? [-40, 40] : [40, -40], y: [0, -12, 0], scale: [0.85, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                className="text-3xl"
              >
                💘
              </motion.span>
              <span className="text-[10px] font-bold text-pink-200 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-pink-400/50 shadow-md whitespace-nowrap">
                Flying Love Heart Kisses! 🚀
              </span>
            </motion.div>
          )}

          {/* PAT HEAD OVERLAY */}
          {activeCommand.type === 'pat_head' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-36 z-30 pointer-events-none flex flex-col items-center justify-center drop-shadow-md"
            >
              <motion.span
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="text-3xl"
              >
                🥰
              </motion.span>
              <span className="text-[10px] font-bold text-amber-200 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-md whitespace-nowrap">
                Affectionate Head Pats! 👑
              </span>
            </motion.div>
          )}

          {/* HOLD HANDS OVERLAY */}
          {activeCommand.type === 'hold_hands' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute bottom-20 z-30 pointer-events-none flex flex-col items-center justify-center text-3xl drop-shadow-md"
            >
              <span>💖</span>
              <span className="text-[10px] font-black text-amber-200 bg-purple-950/90 px-2 py-0.5 rounded-full border border-amber-400/80 shadow-lg whitespace-nowrap">
                Locked Hands Forever! 🤝
              </span>
            </motion.div>
          )}

          {/* 2. GIRL HUMANOID CHARACTER (Waiting Partner - Pink) - Draggable Physics Avatar */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -140, right: 140 }}
            dragElastic={0.2}
            dragSnapToOrigin
            whileDrag={{ scale: 1.18, cursor: 'grabbing' }}
            className="absolute bottom-2 z-20 flex flex-col items-center cursor-grab active:cursor-grabbing"
            animate={
              activeCommand.type === 'kiss'
                ? { x: 28, scale: 1.12, y: [0, -2, 0] }
                : activeCommand.type === 'hug'
                ? { x: 20, scale: 1.12, y: [0, -2, 0] }
                : activeCommand.type === 'dance'
                ? { x: [70, 20, -20, 70], y: [0, -14, 0, -14, 0], rotate: [6, -6, 6] }
                : activeCommand.type === 'hold_hands'
                ? { x: 36, scale: 1.08, y: [0, -2, 0] }
                : activeCommand.type === 'give_rose'
                ? { x: 28, scale: 1.1, y: 0 }
                : activeCommand.type === 'pat_head'
                ? { x: 18, scale: 1.1, y: 0 }
                : activeCommand.type === 'flying_heart'
                ? { x: 75, scale: 1.05, y: 0 }
                : activeCommand.type === 'cuddle'
                ? { x: 22, scale: 1.1, y: 0 }
                : { x: 110, scale: 1, y: 0 } // Default Idle Position
            }
            transition={{
              x: activeCommand.type === 'dance'
                ? { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 150, damping: 14, mass: 0.85 },
              scale: { type: 'spring', stiffness: 150, damping: 14 },
              rotate: activeCommand.type === 'dance'
                ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 150, damping: 14 },
              y: activeCommand.type === 'dance'
                ? { repeat: Infinity, duration: 0.7, ease: 'easeInOut' }
                : (activeCommand.type === 'kiss' || activeCommand.type === 'hug' || activeCommand.type === 'hold_hands')
                ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 150, damping: 14 },
            }}
          >
            <FullBodyHumanoidAvatar
              gender="girl"
              name={partner?.displayName ? partner?.displayName?.split(' ')[0] || 'Partner' : 'Waiting Partner'}
              actionType={activeCommand.type}
              actor={activeCommand.actor}
              isMoving={isWalking}
              isCloseProximity={activeCommand.type !== 'idle'}
              moodAura={partnerMood}
              wardrobeConfig={wardrobeConfig}
              onTapAvatar={() => triggerAnimationSequence('flying_heart', 'girl')}
            />
          </motion.div>

        </div>

      </div>

      {/* QUICK ACTION COMMAND BUTTONS */}
      <div className="relative z-10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Click to Command 3D Chibis:</span>
          </span>
          <span className="text-[10px] text-purple-300 font-medium">Both devices sync in real-time!</span>
        </div>

        {/* Grid of Action Commands */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          {/* 1. Kiss Command */}
          <button
            onClick={() => triggerAnimationSequence('kiss', 'boy')}
            disabled={isExecuting}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-xs py-2 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">💋</span>
            <span>Kiss Her 💖</span>
          </button>

          {/* 2. Hug Command */}
          <button
            onClick={() => triggerAnimationSequence('hug', 'boy')}
            disabled={isExecuting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-xs py-2 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">🫂</span>
            <span>Big Hug ✨</span>
          </button>

          {/* 3. Dance Command */}
          <button
            onClick={() => triggerAnimationSequence('dance', 'boy')}
            disabled={isExecuting}
            className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-purple-950 font-black text-xs py-2 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">💃</span>
            <span>Couple Dance 🎶</span>
          </button>

          {/* 4. Hold Hands Command */}
          <button
            onClick={() => triggerAnimationSequence('hold_hands', 'boy')}
            disabled={isExecuting}
            className="bg-purple-900/80 hover:bg-purple-800 text-amber-200 border border-purple-500/60 font-bold text-xs py-2 px-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">🤝</span>
            <span>Hold Hands</span>
          </button>

          {/* 5. Give Rose Command */}
          <button
            onClick={() => triggerAnimationSequence('give_rose', 'boy')}
            disabled={isExecuting}
            className="bg-purple-900/80 hover:bg-purple-800 text-pink-200 border border-purple-500/60 font-bold text-xs py-2 px-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">🌹</span>
            <span>Give Rose</span>
          </button>

          {/* 6. Pat Head Command */}
          <button
            onClick={() => triggerAnimationSequence('pat_head', 'boy')}
            disabled={isExecuting}
            className="bg-purple-900/80 hover:bg-purple-800 text-amber-200 border border-purple-500/60 font-bold text-xs py-2 px-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">👑</span>
            <span>Pat Head</span>
          </button>

          {/* 7. Blow Flying Heart */}
          <button
            onClick={() => triggerAnimationSequence('flying_heart', 'boy')}
            disabled={isExecuting}
            className="bg-purple-900/80 hover:bg-purple-800 text-rose-200 border border-purple-500/60 font-bold text-xs py-2 px-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">💖</span>
            <span>Blow Flying Heart</span>
          </button>

          {/* 8. Command Her Chibi Girl to Kiss Him */}
          <button
            onClick={() => triggerAnimationSequence('kiss', 'girl')}
            disabled={isExecuting}
            className="bg-gradient-to-r from-rose-500 to-amber-500 text-purple-950 font-black text-xs py-2 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm">😘</span>
            <span>Her Chibi Kisses Him</span>
          </button>

        </div>
      </div>

    </div>
  );
};
