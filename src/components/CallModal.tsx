import React, { useEffect, useRef, useState } from 'react';
import { User, CallSignal } from '../types';
import { callEngine } from '../lib/webrtc';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Heart,
  Volume2,
  Maximize2,
  Minimize2,
  Gamepad2,
  Palette,
  Sparkles,
  X,
  Check,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { sounds } from '../lib/audio';

interface Props {
  currentUser: User;
  partner: User | null;
  activeCall: CallSignal | null;
  incomingCall: CallSignal | null;
  isMinimized?: boolean;
  onToggleMinimize?: (minimized: boolean) => void;
  onAcceptCall: () => void;
  onDeclineCall: () => void;
  onEndCall: () => void;
}

const TRIVIA_QUESTIONS = [
  {
    q: 'What is my favorite comfort food on a rainy day?',
    options: ['Hot Chocolate & Cookies', 'Warm Ramen Bowl', 'Spicy Biryani', 'Fresh Pizza'],
    correct: 1,
  },
  {
    q: 'Where was our ideal dream vacation spot?',
    options: ['Hunza Valley Mountains', 'Kyoto Sakura Gardens', 'Santorini Beach House', 'Paris Eiffel Tower'],
    correct: 0,
  },
  {
    q: 'What is my favorite late-night activity together?',
    options: ['Stargazing on roof', 'Watching romantic movies', 'Baking sweet desserts', 'Deep late night talks'],
    correct: 3,
  },
];

const LOVE_PROMPTS = [
  'What was your very first impression of me when we first met?',
  'What is one small thing I do that always makes you smile secretly?',
  'If we could teleport anywhere in the world right now for 1 hour, where would we go?',
  'What is your favorite memory of us from this past month?',
  'Describe our relationship in three sweet words.',
];

export const CallModal: React.FC<Props> = ({
  currentUser,
  partner,
  activeCall,
  incomingCall,
  isMinimized: controlledMinimized,
  onToggleMinimize,
  onAcceptCall,
  onDeclineCall,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [internalMinimized, setInternalMinimized] = useState(false);
  
  const isMinimized = controlledMinimized !== undefined ? controlledMinimized : internalMinimized;
  const setMinimizeState = (val: boolean) => {
    setInternalMinimized(val);
    if (onToggleMinimize) {
      onToggleMinimize(val);
    }
  };

  const [swappedView, setSwappedView] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // In-call activities overlay state
  const [showActivities, setShowActivities] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'trivia' | 'doodle' | 'prompts'>('trivia');

  // Trivia Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);

  // Love Prompt index state
  const [promptIndex, setPromptIndex] = useState(0);

  // Shared Doodle Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#f5a623');

  // In-call duration timer
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

  // Attach WebRTC Streams to Video Elements & Listen for stream arrivals
  useEffect(() => {
    if (!activeCall) {
      setHasRemoteVideo(false);
      return;
    }

    const bindLocalStream = () => {
      if (callEngine.localStream && localVideoRef.current) {
        if (localVideoRef.current.srcObject !== callEngine.localStream) {
          localVideoRef.current.srcObject = callEngine.localStream;
          localVideoRef.current.play().catch(() => {});
        }
      }
    };

    const bindRemoteStream = (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
        }
        remoteVideoRef.current.play().catch(() => {});
      }
      const videoTracks = stream.getVideoTracks();
      setHasRemoteVideo(videoTracks.length > 0 && videoTracks.some((t) => t.enabled));
    };

    bindLocalStream();
    if (callEngine.remoteStream && callEngine.remoteStream.getTracks().length > 0) {
      bindRemoteStream(callEngine.remoteStream);
    }

    // Subscribe to remote stream listener from callEngine
    const unsubStream = callEngine.onRemoteStream((stream) => {
      bindRemoteStream(stream);
    });

    const interval = setInterval(() => {
      bindLocalStream();
      if (callEngine.remoteStream) {
        bindRemoteStream(callEngine.remoteStream);
      }
    }, 1000);

    return () => {
      unsubStream();
      clearInterval(interval);
    };
  }, [activeCall, activeCall?.status, swappedView]);

  // Format Timer SS or MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const muted = callEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoOff = callEngine.toggleVideo();
    setIsVideoOff(videoOff);
  };

  const handleToggleScreenShare = async () => {
    const sharing = await callEngine.toggleScreenShare();
    setIsScreenSharing(sharing);
  };

  const handleSelectOption = (qIdx: number, optionIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
    if (optionIdx === TRIVIA_QUESTIONS[qIdx].correct) {
      setScore((prev) => prev + 10);
      sounds.playSpellSound('hearts_burst');
    } else {
      sounds.playSpellSound('pop');
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    sounds.playSpellSound('pop');
  };

  // 1. INCOMING CALL RINGING DIALOG
  if (incomingCall) {
    const isVideo = incomingCall.type === 'video';
    return (
      <div id="incoming-call-modal" className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-slate-900/95 border border-[#f5a623]/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden text-slate-100">
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-[#f5a623]/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-rose-500/15 rounded-full blur-3xl animate-pulse" />

          <div className="relative z-10">
            <div className="relative w-28 h-28 mx-auto mb-5">
              <div className="absolute inset-0 bg-[#f5a623]/40 rounded-full animate-ping opacity-40" />
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#f5a623] to-rose-500 rounded-full opacity-60 blur-sm animate-pulse" />
              <img
                src={partner?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={partner?.displayName || 'Partner'}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-[#f5a623] relative z-10 shadow-2xl"
              />
            </div>

            <h3 className="text-2xl font-serif font-black text-white">{partner?.displayName || 'Your Love'}</h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5a623]/15 border border-[#f5a623]/30 text-xs text-[#f5a623] font-bold mt-2">
              <Heart className="w-3.5 h-3.5 fill-[#f5a623]" />
              <span>Incoming WhatsApp-Style {isVideo ? 'Video' : 'Voice'} Call</span>
            </div>

            {/* Answer & Decline Buttons */}
            <div className="flex items-center justify-center gap-8 mt-9">
              <div className="flex flex-col items-center gap-2">
                <button
                  id="decline-call-btn"
                  onClick={onDeclineCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-xl shadow-red-600/40 cursor-pointer"
                  title="Decline Call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-xs text-slate-300 font-semibold">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  id="accept-call-btn"
                  onClick={onAcceptCall}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-xl shadow-emerald-500/40 animate-bounce cursor-pointer"
                  title="Accept Call"
                >
                  {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
                </button>
                <span className="text-xs text-emerald-400 font-bold">Answer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE CALL OVERLAY / FULLSCREEN WHATSAPP-STYLE INTERFACE
  if (activeCall) {
    const isVideo = activeCall.type === 'video';
    const isRinging = activeCall.status === 'offered';

    // Minimized Floating Widget Mode
    if (isMinimized) {
      return (
        <div id="minimized-call-widget" className="fixed bottom-4 right-4 bg-slate-900/95 border border-[#f5a623]/60 text-white p-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="relative">
            <img
              src={partner?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt="Partner"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#f5a623]"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-serif font-bold text-white">{partner?.displayName}</p>
            <p className="text-[10px] text-[#f5a623] font-mono font-semibold">
              {isRinging ? 'Ringing...' : formatTimer(callDuration)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => setMinimizeState(false)}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-200 hover:text-white cursor-pointer"
              title="Expand Call"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onEndCall}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer shadow-md shadow-red-600/30"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Full WhatsApp-Style Call Interface
    return (
      <div id="active-call-modal" className="fixed inset-0 bg-[#08070d] z-50 flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200 overflow-hidden">
        {/* Top Floating Glass Header */}
        <div className="flex items-center justify-between text-white relative z-30 px-2 sm:px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={partner?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={partner?.displayName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#f5a623]"
              />
              {!isRinging && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-black" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif font-black text-sm text-white">{partner?.displayName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {isVideo ? 'HD Video' : 'HD Voice'}
                </span>
              </div>
              <p className="text-xs text-[#f5a623] font-mono font-semibold flex items-center gap-1 mt-0.5">
                {isRinging ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#f5a623] animate-ping" />
                    <span>Ringing partner...</span>
                  </>
                ) : (
                  <span>Connected • {formatTimer(callDuration)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="in-call-activities-btn"
              onClick={() => setShowActivities(!showActivities)}
              className="px-3.5 py-1.5 amber-pill-btn text-black text-xs font-black rounded-full flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">In-Call Activities</span>
            </button>

            <button
              id="minimize-to-chat-btn"
              onClick={() => setMinimizeState(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Chat in Background while on call"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#f5a623]" />
              <span className="hidden sm:inline">Chat While Calling</span>
              <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Center Stage: WhatsApp Full Video Container */}
        <div className="flex-1 my-3 relative rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl flex items-center justify-center">
          {/* Main Full-Screen Video (Remote Partner by default, or Local if swapped) */}
          <video
            ref={swappedView ? localVideoRef : remoteVideoRef}
            autoPlay
            playsInline
            muted={swappedView}
            className={`w-full h-full object-cover absolute inset-0 ${
              isVideo && (!swappedView ? hasRemoteVideo : true) && !isRinging ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } transition-opacity duration-300`}
          />

          {/* Ringing or Audio Fallback / Video Connecting Screen */}
          {(!isVideo || isRinging || (!swappedView && !hasRemoteVideo)) && (
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#f5a623]/25 rounded-full animate-ping opacity-60" />
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#f5a623]/30 via-rose-500/20 to-purple-500/30 rounded-full blur-xl animate-pulse" />
                <img
                  src={partner?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                  alt={partner?.displayName}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover ring-4 ring-[#f5a623] relative z-10 shadow-2xl"
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">{partner?.displayName}</h2>
              <p className="text-sm font-semibold text-amber-300 mt-2 flex items-center gap-2">
                {isRinging ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Calling {partner?.displayName}... Ringing</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#f5a623]" />
                    <span>WhatsApp-Style HD Encrypted Video Call</span>
                  </>
                )}
              </p>
              {!isRinging && !hasRemoteVideo && isVideo && (
                <p className="text-xs text-slate-400 mt-2">Connecting camera stream securely...</p>
              )}
            </div>
          )}

          {/* Local / Swapped Floating Picture-in-Picture (PiP) Window */}
          {isVideo && (
            <div
              id="pip-video-container"
              onClick={() => setSwappedView(!swappedView)}
              className="absolute bottom-4 right-4 w-32 sm:w-48 h-44 sm:h-64 rounded-2xl overflow-hidden border-2 border-[#f5a623]/80 shadow-2xl bg-black z-20 cursor-pointer group hover:scale-105 transition-all"
              title="Click to swap main view"
            >
              <video
                ref={swappedView ? remoteVideoRef : localVideoRef}
                autoPlay
                playsInline
                muted={!swappedView}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1 backdrop-blur-xs">
                <RotateCcw className="w-4 h-4 text-[#f5a623]" />
                <span>Swap View</span>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-bold">
                {swappedView ? partner?.displayName : 'You'}
              </div>
            </div>
          )}

          {/* IN-CALL ACTIVITIES DRAWER OVERLAY */}
          {showActivities && (
            <div className="absolute inset-2 sm:inset-6 bg-slate-900/95 border border-[#f5a623]/60 rounded-3xl p-4 sm:p-6 z-30 flex flex-col justify-between text-slate-100 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#f5a623]" />
                  <h4 className="text-base font-bold text-[#f5a623] font-serif">In-Call Celestial Activities</h4>
                </div>
                <button
                  onClick={() => setShowActivities(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Activity Sub-Tabs */}
              <div className="flex items-center justify-center gap-2 my-2">
                <button
                  onClick={() => setActiveActivityTab('trivia')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeActivityTab === 'trivia'
                      ? 'amber-pill-btn text-black font-black'
                      : 'bg-black/40 text-slate-300 border border-white/10'
                  }`}
                >
                  🎯 Trivia Quiz
                </button>

                <button
                  onClick={() => setActiveActivityTab('doodle')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeActivityTab === 'doodle'
                      ? 'amber-pill-btn text-black font-black'
                      : 'bg-black/40 text-slate-300 border border-white/10'
                  }`}
                >
                  🎨 Shared Canvas
                </button>

                <button
                  onClick={() => setActiveActivityTab('prompts')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeActivityTab === 'prompts'
                      ? 'amber-pill-btn text-black font-black'
                      : 'bg-black/40 text-slate-300 border border-white/10'
                  }`}
                >
                  💬 Love Prompts
                </button>
              </div>

              {/* Activity 1: Trivia Quiz */}
              {activeActivityTab === 'trivia' && (
                <div className="flex-1 flex flex-col justify-center space-y-4 my-2 max-w-md mx-auto w-full text-center">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Question {currentQuestionIndex + 1} of {TRIVIA_QUESTIONS.length}</span>
                    <span className="text-[#f5a623] font-bold">Couple Score: {score} pts</span>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-white font-serif">
                    {TRIVIA_QUESTIONS[currentQuestionIndex].q}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {TRIVIA_QUESTIONS[currentQuestionIndex].options.map((opt, oIdx) => {
                      const isSelected = userAnswers[currentQuestionIndex] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(currentQuestionIndex, oIdx)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'amber-pill-btn text-black border-[#f5a623] font-black scale-105'
                              : 'bg-black/40 border-white/10 text-slate-200 hover:border-[#f5a623]/50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-white/5 text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentQuestionIndex === TRIVIA_QUESTIONS.length - 1}
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-4 py-1 rounded-lg text-xs font-bold amber-pill-btn text-black disabled:opacity-40 cursor-pointer"
                    >
                      Next Question
                    </button>
                  </div>
                </div>
              )}

              {/* Activity 2: Shared Doodle Canvas */}
              {activeActivityTab === 'doodle' && (
                <div className="flex-1 flex flex-col items-center justify-center my-2 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    {['#f5a623', '#f43f5e', '#10b981', '#38bdf8', '#c084fc'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDrawColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                          drawColor === c ? 'border-white scale-125' : 'border-transparent'
                        }`}
                      />
                    ))}
                    <button
                      onClick={clearCanvas}
                      className="p-1 rounded bg-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1 ml-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear
                    </button>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="bg-black/60 border border-[#f5a623]/40 rounded-xl cursor-crosshair shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400 italic">Draw a heart or love message live together!</p>
                </div>
              )}

              {/* Activity 3: Love Affirmation Prompts */}
              {activeActivityTab === 'prompts' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4 max-w-md mx-auto">
                  <MessageSquare className="w-8 h-8 text-[#f5a623]" />
                  <p className="text-base font-bold text-amber-200 font-serif leading-relaxed italic">
                    "{LOVE_PROMPTS[promptIndex]}"
                  </p>
                  <button
                    onClick={() => {
                      setPromptIndex((prev) => (prev + 1) % LOVE_PROMPTS.length);
                      sounds.playSpellSound('pop');
                    }}
                    className="px-4 py-2 rounded-xl amber-pill-btn text-black text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Get Another Prompt ✨
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom WhatsApp-Style Control Dock */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 py-3 px-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 max-w-md mx-auto w-full shadow-2xl relative z-30">
          {/* Mute Mic */}
          <button
            id="toggle-mute-btn"
            onClick={handleToggleMute}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
              isMuted
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Camera On/Off */}
          {isVideo && (
            <button
              id="toggle-video-btn"
              onClick={handleToggleVideo}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                isVideoOff
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          {/* Screen Share / Flip Camera */}
          {isVideo && (
            <button
              id="toggle-screenshare-btn"
              onClick={handleToggleScreenShare}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                isScreenSharing
                  ? 'amber-pill-btn text-black shadow-lg shadow-amber-500/40'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Share Screen"
            >
              <Monitor className="w-6 h-6" />
            </button>
          )}

          {/* Hang Up End Call Button */}
          <button
            id="end-call-btn"
            onClick={onEndCall}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white flex items-center justify-center transition-all shadow-xl shadow-red-600/50 hover:scale-105 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

