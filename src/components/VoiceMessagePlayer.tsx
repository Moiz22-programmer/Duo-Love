import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';

interface Props {
  audioUrl?: string;
  duration?: number;
  isSender?: boolean;
}

export const VoiceMessagePlayer: React.FC<Props> = ({ audioUrl, duration = 6, isSender = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          // updated duration
        }
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current && !audioUrl) {
      // Demo voice playback simulation
      if (isPlaying) {
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setIsPlaying(true);
        intervalRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            if (prev >= duration) {
              setIsPlaying(false);
              clearInterval(intervalRef.current);
              return 0;
            }
            return prev + 1;
          });
        }, 1000);
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        audioRef.current.play().catch(() => {
          // Fallback if browser blocks media playback
        });
        setIsPlaying(true);
        intervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }, 200);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = Math.min(100, ((currentTime || 0) / (duration || 1)) * 100);

  // Frequency wave bar heights
  const bars = [12, 24, 18, 32, 14, 28, 38, 20, 16, 26, 30, 18, 22, 12, 28, 16];

  return (
    <div className={`p-3 rounded-2xl flex items-center gap-3 w-64 sm:w-72 shadow-md ${
      isSender ? 'bg-[#f5a623] text-black' : 'bg-black/60 text-slate-100 border border-white/10'
    }`}>
      {/* Play / Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105 cursor-pointer ${
          isSender
            ? 'bg-black text-[#f5a623] font-bold'
            : 'bg-[#f5a623] text-black font-bold'
        }`}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Progress */}
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center gap-1">
          <Mic className={`w-3.5 h-3.5 ${isSender ? 'text-black/80' : 'text-[#f5a623]'}`} />
          <span className={`text-[10px] font-bold tracking-wider uppercase font-serif ${isSender ? 'text-black/90' : 'text-[#f5a623]'}`}>
            Celestial Voice Note
          </span>
        </div>

        {/* Waveform Visualizer Bars */}
        <div className="flex items-center gap-0.5 h-7 w-full overflow-hidden">
          {bars.map((height, i) => {
            const barActive = (i / bars.length) * 100 <= progressPct;
            return (
              <div
                key={i}
                style={{
                  height: isPlaying ? `${Math.max(8, Math.sin(currentTime * 5 + i) * 16 + height)}px` : `${height}px`,
                }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  barActive
                    ? isSender
                      ? 'bg-black'
                      : 'bg-[#f5a623]'
                    : isSender
                    ? 'bg-black/25'
                    : 'bg-white/15'
                }`}
              />
            );
          })}
        </div>

        {/* Time counter */}
        <div className={`flex items-center justify-between text-[10px] font-mono ${isSender ? 'text-black/80' : 'text-slate-400'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
