import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Stars, Moon, Wand2 } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  fullScreen?: boolean;
}

export const MagicalLoader: React.FC<Props> = ({ size = 'md', label, fullScreen = false }) => {
  const sizeMap = {
    sm: { container: 'w-10 h-10', petal: 'w-3 h-3', center: 'w-4 h-4', icon: 'w-3 h-3', radius: 14 },
    md: { container: 'w-20 h-20', petal: 'w-6 h-6', center: 'w-8 h-8', icon: 'w-4 h-4', radius: 28 },
    lg: { container: 'w-32 h-32', petal: 'w-9 h-9', center: 'w-12 h-12', icon: 'w-6 h-6', radius: 44 },
    xl: { container: 'w-44 h-44', petal: 'w-12 h-12', center: 'w-16 h-16', icon: 'w-8 h-8', radius: 60 },
  };

  const config = sizeMap[size];
  const petals = [0, 60, 120, 180, 240, 300]; // 6 blooming petals for a sacred flower

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      <div className={`relative ${config.container} flex items-center justify-center`}>
        {/* Background Ambient Glowing Ring */}
        <motion.div
          animate={{
            scale: [0.9, 1.25, 0.9],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#f5a623]/20 via-amber-600/20 to-yellow-500/20 blur-xl pointer-events-none"
        />

        {/* Orbiting Stardust Constellation Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-15%] rounded-full border border-dashed border-[#f5a623]/40 pointer-events-none flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1.5 bg-[#f5a623] rounded-full w-2 h-2 shadow-[0_0_10px_#f5a623]"
          />
          <motion.div
            animate={{ scale: [1.2, 0.8, 1.2] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -bottom-1.5 bg-yellow-200 rounded-full w-2 h-2 shadow-[0_0_10px_#fef08a]"
          />
        </motion.div>

        {/* Blooming Celestial Flower Petals */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {petals.map((deg, idx) => (
            <motion.div
              key={deg}
              animate={{
                scale: [0.75, 1.15, 0.75],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: idx * 0.3,
                ease: 'easeInOut',
              }}
              style={{
                transform: `rotate(${deg}deg) translateY(-${config.radius}px)`,
              }}
              className={`absolute ${config.petal} rounded-full bg-gradient-to-t from-[#f5a623] via-amber-400 to-yellow-200 shadow-[0_0_15px_rgba(245,166,35,0.5)] backdrop-blur-sm opacity-80 border border-white/20`}
            />
          ))}
        </motion.div>

        {/* Core Glowing Orb with Magic Crest */}
        <motion.div
          animate={{
            scale: [0.95, 1.1, 0.95],
            boxShadow: [
              '0 0 20px rgba(245,166,35,0.4)',
              '0 0 35px rgba(245,166,35,0.7)',
              '0 0 20px rgba(245,166,35,0.4)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute ${config.center} rounded-full bg-[#f5a623] text-black font-bold flex items-center justify-center shadow-lg border-2 border-white/40 z-10`}
        >
          <Sparkles className={`${config.icon} text-black animate-spin`} style={{ animationDuration: '8s' }} />
        </motion.div>
      </div>

      {/* Optional Label */}
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1"
        >
          <p className="text-xs font-serif font-bold uppercase tracking-widest text-[#f5a623] flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]">
            <Sparkles className="w-3.5 h-3.5 text-[#f5a623] animate-pulse" />
            {label}
          </p>
        </motion.div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0b0914]/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
        {content}
      </div>
    );
  }

  return content;
};
