import React from 'react';

export interface SpellEffect {
  id: string;
  label: string;
  emoji: string;
  timestamp: number;
}

interface Props {
  spell: SpellEffect | null;
  onComplete?: () => void;
}

// Clean, zero-overhead component that prevents looping overlays
export const SpellAnimationOverlay: React.FC<Props> = () => {
  return null;
};
