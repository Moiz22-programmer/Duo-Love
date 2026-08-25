import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChibiActionType } from './ChibiCoupleMascot';
import { ChibiWardrobeConfig } from './ChibiWardrobeModal';

export interface FacialMorphTargets {
  blink: number;          // 0 (open) to 1 (closed)
  smile: number;          // 0 (neutral) to 1 (full sweet smile)
  squint: number;         // 0 to 1 (joyful crinkle ^_^)
  eyebrowLift: number;    // -1 to 1
  eyebrowTilt: number;    // -1 to 1
  blushOpacity: number;   // 0 to 1
  mouthOpen: number;      // 0 to 1
  pout: number;           // 0 to 1
  winkLeft: number;       // 0 to 1
  winkRight: number;      // 0 to 1
  gazeX: number;          // -1 (left) to +1 (right)
  gazeY: number;          // -1 (up) to +1 (down)
}

export interface MoodAuraSettings {
  id?: string;
  emoji?: string;
  label?: string;
  auraColor?: string;
  glowShadow?: string;
  blushTint?: string;
  facialMorphs?: Partial<FacialMorphTargets>;
}

export type HandGestureType = 
  | 'relaxed' 
  | 'wave' 
  | 'point' 
  | 'hold' 
  | 'pat' 
  | 'blow_kiss' 
  | 'clasp'
  | 'fist';

interface FullBodyHumanoidAvatarProps {
  gender: 'boy' | 'girl'; // 'boy' = Character 1 (Abdul), 'girl' = Character 2 (Waiting)
  name: string;
  actionType: ChibiActionType;
  actor: 'boy' | 'girl';
  isMoving?: boolean;
  isCloseProximity?: boolean;
  customMorphOverride?: Partial<FacialMorphTargets>;
  moodAura?: MoodAuraSettings;
  wardrobeConfig?: ChibiWardrobeConfig;
  onTapAvatar?: () => void;
}

/**
 * 5-Fingered Anime Chibi Hand (tapered fingers, rounded thumb, fingernails & soft palm blush)
 */
const AnimeChibiHand: React.FC<{
  gender: 'boy' | 'girl';
  gesture: HandGestureType;
  facingRight: boolean;
}> = ({ gender, gesture, facingRight }) => {
  const isBoy = gender === 'boy';
  const skinFill = isBoy ? 'url(#anime-skin-boy)' : 'url(#anime-skin-girl)';
  const strokeColor = isBoy ? '#6b2d18' : '#881337';
  const blushColor = isBoy ? 'rgba(249, 115, 22, 0.45)' : 'rgba(244, 63, 94, 0.45)';
  const nailColor = isBoy ? '#fff7ed' : '#fff1f2';
  const flip = facingRight ? 1 : -1;

  if (gesture === 'wave') {
    return (
      <g transform={`scale(${flip * 0.95}, 0.95)`}>
        {/* Palm */}
        <path d="M -5 3 C -6 6, -3 8, 1 8 C 5 8, 6 5, 5 2 C 4 -1, -4 -1, -5 3 Z" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        {/* Thumb */}
        <path d="M -4 2 Q -8 3 -7 6.5 Q -4.5 8 -2 5.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <ellipse cx="-6.2" cy="5.2" rx="0.7" ry="1" fill={nailColor} />
        {/* Index */}
        <path d="M -3 0 L -4.2 -7 C -4.2 -9, -1.8 -9, -1.8 -7 L -1 0" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <ellipse cx="-3" cy="-7.5" rx="0.7" ry="1" fill={nailColor} />
        {/* Middle */}
        <path d="M -1 0 L -0.5 -9.5 C -0.5 -11.5, 2 -11.5, 2 -9.5 L 1.5 0" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <ellipse cx="0.8" cy="-10" rx="0.7" ry="1" fill={nailColor} />
        {/* Ring */}
        <path d="M 1.5 0 L 2.5 -8 C 2.5 -10, 4.8 -10, 4.8 -8 L 3.8 0" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <ellipse cx="3.6" cy="-8.5" rx="0.7" ry="1" fill={nailColor} />
        {/* Pinky */}
        <path d="M 3.8 1.5 L 5.5 -5 C 6 -7, 8 -6.5, 7.5 -4.5 L 5.2 2.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
        <ellipse cx="6.5" cy="-5.2" rx="0.6" ry="0.9" fill={nailColor} />
        <circle cx="0.5" cy="4" r="2.5" fill={blushColor} />
      </g>
    );
  }

  if (gesture === 'point') {
    return (
      <g transform={`scale(${flip * 0.95}, 0.95)`}>
        <path d="M -4 2 C -5 6, -2 8, 1 8 C 4.5 8, 5.5 5, 4.5 2 Z" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <path d="M 0.5 1.5 Q 4.5 2.5 2 5.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
        <path d="M 1.5 4 Q 5.5 5 2.5 7.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
        <path d="M -2.5 1.5 Q -6 2.5 -4.5 5.5 Q -2.5 6 -1 4.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <path d="M -2 0 L -2.2 -10 C -2.2 -12, 1 -12, 1 -10 L 1 0" fill={skinFill} stroke={strokeColor} strokeWidth="1.3" />
        <ellipse cx="-0.6" cy="-10.5" rx="0.9" ry="1.1" fill={nailColor} />
        <circle cx="-0.5" cy="-9" r="1.3" fill={blushColor} />
      </g>
    );
  }

  if (gesture === 'hold' || gesture === 'clasp' || gesture === 'fist') {
    return (
      <g transform={`scale(${flip * 0.95}, 0.95)`}>
        <path d="M -4.5 1 C -5.5 4, -2 6.5, 0.5 6.5 C 3.5 6.5, 5 4, 4 1 Z" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <path d="M -3 0.5 Q -5.5 2 -4 4" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
        <path d="M -2.8 1 Q -3.5 5 -1 5.5" stroke={strokeColor} strokeWidth="1.1" fill={skinFill} />
        <path d="M -0.8 0.5 Q -1 5.5 1.2 6" stroke={strokeColor} strokeWidth="1.1" fill={skinFill} />
        <path d="M 1.2 0.5 Q 1 5.5 3.2 5.5" stroke={strokeColor} strokeWidth="1.1" fill={skinFill} />
        <circle cx="0.2" cy="3" r="2" fill={blushColor} />
      </g>
    );
  }

  if (gesture === 'pat' || gesture === 'blow_kiss') {
    return (
      <g transform={`scale(${flip * 0.95}, 0.95)`}>
        <path d="M -4.5 1 C -5.5 4, -2 6, 0.5 6 C 3.5 6, 5 4, 4 1 Z" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
        <path d="M -4 0.5 Q -6 2 -4.8 4" stroke={strokeColor} strokeWidth="1" fill={skinFill} />
        <path d="M -2.5 0.5 Q -3 5.5 -1.2 6.5" stroke={strokeColor} strokeWidth="1.1" fill={skinFill} />
        <path d="M -0.5 0.5 Q -0.5 6.5 1.2 7.5" stroke={strokeColor} strokeWidth="1.1" fill={skinFill} />
        <path d="M 1.5 0.5 Q 2.2 5.5 3.2 6.5" stroke={strokeColor} strokeWidth="1.1" fill={skinFill} />
        <circle cx="0.2" cy="3" r="2" fill={blushColor} />
      </g>
    );
  }

  // Default: 'relaxed' 5-fingered anime chibi hand
  return (
    <g transform={`scale(${flip * 0.95}, 0.95)`}>
      <path d="M -4 0 C -5 3, -2 5.5, 0.5 5.5 C 3.5 5.5, 4.8 3, 4 0 Z" fill={skinFill} stroke={strokeColor} strokeWidth="1.2" />
      <path d="M -3 0.5 Q -5.5 2 -4.5 4 Q -3.2 5.2 -1.8 4" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
      <ellipse cx="-4" cy="3.5" rx="0.6" ry="0.8" fill={nailColor} />
      <path d="M -2 1.5 L -2.4 6.8 C -2.4 8.2, -0.8 8.2, -0.8 6.8 L -0.6 1.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
      <ellipse cx="-1.6" cy="6.8" rx="0.6" ry="0.8" fill={nailColor} />
      <path d="M -0.6 1.5 L -0.6 8 C -0.6 9.4, 1.2 9.4, 1.2 8 L 1.2 1.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
      <ellipse cx="0.3" cy="8" rx="0.6" ry="0.8" fill={nailColor} />
      <path d="M 1.2 1.5 L 1.5 7.2 C 1.5 8.5, 3 8.5, 3 7.2 L 2.8 1.5" fill={skinFill} stroke={strokeColor} strokeWidth="1.1" />
      <ellipse cx="2.2" cy="7.2" rx="0.5" ry="0.7" fill={nailColor} />
      <path d="M 2.8 1 L 3.5 5.2 C 3.5 6.4, 4.8 6.4, 4.8 5.2 L 4.2 1" fill={skinFill} stroke={strokeColor} strokeWidth="1" />
      <ellipse cx="4.1" cy="5.2" rx="0.4" ry="0.6" fill={nailColor} />
      <circle cx="0.2" cy="3" r="2.2" fill={blushColor} />
    </g>
  );
};

export const FullBodyHumanoidAvatar: React.FC<FullBodyHumanoidAvatarProps> = ({
  gender,
  name,
  actionType,
  actor,
  isMoving = false,
  isCloseProximity = false,
  customMorphOverride,
  moodAura,
  wardrobeConfig,
  onTapAvatar,
}) => {
  const isBoy = gender === 'boy';
  const isActor = actor === gender;

  // Active Wardrobe Selections
  const currentOutfit = wardrobeConfig?.outfit || 'hoodie';
  const currentHat = wardrobeConfig?.hat || 'none';
  const currentProp = wardrobeConfig?.prop || 'none';

  // --- ANIMATION CLOCK (Only active during non-idle actions, tap pulses or movement) ---
  const [time, setTime] = useState<number>(0);
  const [blink, setBlink] = useState<boolean>(false);
  const [tapPulse, setTapPulse] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [reactionText, setReactionText] = useState<string | null>(null);

  useEffect(() => {
    if (actionType === 'idle' && !isMoving && !tapPulse) {
      setTime(0);
      return;
    }

    let animationFrame: number;
    const start = performance.now();
    const tick = (now: number) => {
      setTime((now - start) / 1000);
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [actionType, isMoving, tapPulse]);

  // Gentle Occasional Natural Blink
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      timer = setTimeout(loop, 4000 + Math.random() * 4000);
    };
    timer = setTimeout(loop, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTapPulse(true);
    const reactions = isBoy 
      ? ['✨ Hehe!', '💙 Love ya!', '⭐ Super Happy!', '🚀 Muah!'] 
      : ['💖 Yay!', '🌸 Sweetheart!', '💕 Cutie!', '✨ Loving it!'];
    setReactionText(reactions[Math.floor(Math.random() * reactions.length)]);

    setTimeout(() => setTapPulse(false), 650);
    setTimeout(() => setReactionText(null), 1200);
    if (onTapAvatar) onTapAvatar();
  };

  // --- FACIAL MORPHS & EXPRESSIONS ---
  let morphs: FacialMorphTargets = {
    blink: blink ? 1 : 0,
    smile: isHovered ? 1.0 : 0.9,
    squint: isHovered ? 0.2 : 0,
    eyebrowLift: isHovered ? 0.35 : 0.1,
    eyebrowTilt: isHovered ? 0.3 : 0.2,
    blushOpacity: isHovered ? 0.85 : (isCloseProximity ? 0.85 : 0.6),
    mouthOpen: 0,
    pout: 0,
    winkLeft: 0,
    winkRight: 0,
    gazeX: isBoy ? 0.65 : -0.65,
    gazeY: isHovered ? -0.2 : 0,
  };

  if (tapPulse) {
    morphs = { ...morphs, smile: 1, mouthOpen: 0.5, eyebrowLift: 0.6, blushOpacity: 0.95 };
  } else if (actionType === 'kiss') {
    morphs = { ...morphs, blink: 1, pout: 1, blushOpacity: 0.95, eyebrowTilt: 0.8 };
  } else if (actionType === 'hug') {
    morphs = { ...morphs, squint: 1, smile: 1, blushOpacity: 0.95, eyebrowTilt: 0.7 };
  } else if (actionType === 'dance') {
    morphs = { ...morphs, smile: 1, mouthOpen: 0.6, squint: 0.4, eyebrowLift: 0.5, blushOpacity: 0.8 };
  } else if (actionType === 'hold_hands') {
    morphs = { ...morphs, smile: 0.95, squint: 0.3, eyebrowTilt: 0.6, blushOpacity: 0.85 };
  } else if (actionType === 'give_rose') {
    if (isActor) {
      morphs = { ...morphs, smile: 0.95, eyebrowLift: 0.4, blushOpacity: 0.85, winkLeft: isBoy ? 1 : 0 };
    } else {
      morphs = { ...morphs, smile: 1, mouthOpen: 0.7, eyebrowLift: 0.7, blushOpacity: 0.95 };
    }
  } else if (actionType === 'pat_head') {
    if (isActor) {
      morphs = { ...morphs, smile: 0.9, winkLeft: isBoy ? 1 : 0, blushOpacity: 0.8 };
    } else {
      morphs = { ...morphs, squint: 1, smile: 1, blushOpacity: 0.95, eyebrowTilt: 0.9 };
    }
  } else if (actionType === 'flying_heart') {
    if (isActor) {
      morphs = { ...morphs, pout: 0.9, winkLeft: isBoy ? 1 : 0, blushOpacity: 0.9 };
    } else {
      morphs = { ...morphs, smile: 1, mouthOpen: 0.6, eyebrowLift: 0.7, blushOpacity: 0.9 };
    }
  } else if (actionType === 'cuddle') {
    morphs = { ...morphs, blink: 0.9, smile: 0.9, squint: 0.6, blushOpacity: 0.9 };
  }

  morphs = { ...morphs, ...(moodAura?.facialMorphs || {}), ...customMorphOverride };

  // --- PROCEDURAL SPRING-PHYSICS MOTION ---
  const breatheY = Math.sin(time * 2.2) * 1.5 + Math.sin(time * 4.4) * 0.2;
  const idleSway = Math.sin(time * 1.5) * 1.8 + Math.sin(time * 3.0) * 0.3;
  const headSpringTilt = Math.sin(time * 1.5 - 0.45) * 2.2 + Math.sin(time * 3.0 - 0.9) * 0.4;
  const hairSecondarySway = Math.sin(time * 2.2 - 0.6) * 3.5;
  const waveCycle = Math.sin(time * 4.8);

  let torsoAngle = isBoy ? idleSway : -idleSway;
  let headAngle = isBoy ? -headSpringTilt : headSpringTilt;

  let leftShoulderAngle = 10;
  let leftElbowAngle = 10;
  let leftHandGesture: HandGestureType = 'relaxed';

  let rightShoulderAngle = -10;
  let rightElbowAngle = -10;
  let rightHandGesture: HandGestureType = 'relaxed';

  let leftHipAngle = 0;
  let leftKneeAngle = 0;
  let rightHipAngle = 0;
  let rightKneeAngle = 0;

  if (isMoving) {
    const walk = Math.sin(time * 8);
    leftHipAngle = walk * 22;
    leftKneeAngle = Math.max(0, -walk * 28);
    rightHipAngle = -walk * 22;
    rightKneeAngle = Math.max(0, walk * 28);
    leftShoulderAngle = -walk * 24;
    rightShoulderAngle = walk * 24;
  } else if (actionType === 'idle') {
    torsoAngle = 0;
    headAngle = 0;
    if (isBoy) {
      rightShoulderAngle = -12;
      rightElbowAngle = -8;
      rightHandGesture = 'relaxed';

      leftShoulderAngle = 12;
      leftElbowAngle = 8;
      leftHandGesture = 'relaxed';
    } else {
      leftShoulderAngle = 12;
      leftElbowAngle = 8;
      leftHandGesture = 'relaxed';

      rightShoulderAngle = -12;
      rightElbowAngle = -8;
      rightHandGesture = 'relaxed';
    }
  } else if (actionType === 'kiss') {
    torsoAngle = isBoy ? 14 : -14;
    headAngle = isBoy ? 8 : -8;
    if (isBoy) {
      rightShoulderAngle = -55;
      rightElbowAngle = 30;
      rightHandGesture = 'hold';
    } else {
      leftShoulderAngle = 55;
      leftElbowAngle = -30;
      leftHandGesture = 'hold';
    }
  } else if (actionType === 'hug') {
    torsoAngle = isBoy ? 10 : -10;
    leftShoulderAngle = 50;
    leftElbowAngle = -35;
    leftHandGesture = 'hold';
    rightShoulderAngle = -50;
    rightElbowAngle = 35;
    rightHandGesture = 'hold';
  } else if (actionType === 'dance') {
    const danceStep = Math.sin(time * 6);
    torsoAngle = danceStep * 10;
    headAngle = -danceStep * 8;
    leftShoulderAngle = 90 + danceStep * 30;
    leftElbowAngle = -30 + danceStep * 20;
    leftHandGesture = 'wave';
    rightShoulderAngle = -90 - danceStep * 30;
    rightElbowAngle = 30 - danceStep * 20;
    rightHandGesture = 'wave';
    leftHipAngle = danceStep * 15;
    rightHipAngle = -danceStep * 15;
  } else if (actionType === 'hold_hands') {
    torsoAngle = isBoy ? 6 : -6;
    if (isBoy) {
      rightShoulderAngle = -45;
      rightElbowAngle = 20;
      rightHandGesture = 'hold';
    } else {
      leftShoulderAngle = 45;
      leftElbowAngle = -20;
      leftHandGesture = 'hold';
    }
  } else if (actionType === 'give_rose') {
    if (isActor) {
      torsoAngle = isBoy ? 10 : -10;
      if (isBoy) {
        rightShoulderAngle = -65;
        rightElbowAngle = 40;
        rightHandGesture = 'hold';
      } else {
        leftShoulderAngle = 65;
        leftElbowAngle = -40;
        leftHandGesture = 'hold';
      }
    } else {
      leftShoulderAngle = 45;
      leftElbowAngle = -55;
      leftHandGesture = 'clasp';
      rightShoulderAngle = -45;
      rightElbowAngle = 55;
      rightHandGesture = 'clasp';
    }
  } else if (actionType === 'pat_head') {
    if (isActor) {
      if (isBoy) {
        rightShoulderAngle = -135 + Math.sin(time * 6) * 10;
        rightElbowAngle = 55;
        rightHandGesture = 'pat';
      } else {
        leftShoulderAngle = 135 - Math.sin(time * 6) * 10;
        leftElbowAngle = -55;
        leftHandGesture = 'pat';
      }
    } else {
      torsoAngle = isBoy ? -4 : 4;
      headAngle = isBoy ? -6 : 6;
      leftShoulderAngle = 20;
      rightShoulderAngle = -20;
    }
  } else if (actionType === 'flying_heart') {
    if (isActor) {
      if (isBoy) {
        rightShoulderAngle = -85;
        rightElbowAngle = 65;
        rightHandGesture = 'blow_kiss';
      } else {
        leftShoulderAngle = 85;
        leftElbowAngle = -65;
        leftHandGesture = 'blow_kiss';
      }
    } else {
      leftShoulderAngle = 45;
      leftElbowAngle = -50;
      leftHandGesture = 'clasp';
      rightShoulderAngle = -45;
      rightElbowAngle = 50;
      rightHandGesture = 'clasp';
    }
  } else if (actionType === 'cuddle') {
    torsoAngle = isBoy ? 12 : -12;
    headAngle = isBoy ? 6 : -6;
    if (isBoy) {
      rightShoulderAngle = -40;
      rightElbowAngle = 25;
      leftShoulderAngle = 20;
    } else {
      leftShoulderAngle = 40;
      leftElbowAngle = -25;
      rightShoulderAngle = -20;
    }
  }

  // --- PALETTE CONSTANTS BASED ON WARDROBE ---
  let jacketMain = isBoy ? 'url(#anime-jacket-boy)' : 'url(#anime-dress-girl)';
  let jacketStroke = isBoy ? '#1e1b4b' : '#700c32';
  let pantsFill = isBoy ? 'url(#anime-pants-boy)' : 'url(#anime-tights-girl)';
  let pantsStroke = isBoy ? '#090d16' : '#4c0519';

  if (currentOutfit === 'sweater') {
    jacketMain = isBoy ? 'url(#anime-sweater-boy)' : 'url(#anime-sweater-girl)';
    jacketStroke = isBoy ? '#064e3b' : '#701a75';
    pantsFill = isBoy ? '#1e293b' : '#4a044e';
    pantsStroke = isBoy ? '#0f172a' : '#2e0234';
  } else if (currentOutfit === 'overalls') {
    jacketMain = isBoy ? 'url(#anime-denim-boy)' : 'url(#anime-denim-girl)';
    jacketStroke = isBoy ? '#1e3a8a' : '#831843';
    pantsFill = isBoy ? 'url(#anime-denim-boy)' : 'url(#anime-denim-girl)';
    pantsStroke = isBoy ? '#172554' : '#500724';
  } else if (currentOutfit === 'blazer') {
    jacketMain = isBoy ? 'url(#anime-blazer-boy)' : 'url(#anime-blazer-girl)';
    jacketStroke = isBoy ? '#020617' : '#4c0519';
    pantsFill = isBoy ? '#0f172a' : '#881337';
    pantsStroke = isBoy ? '#020617' : '#4c0519';
  } else if (currentOutfit === 'kimono') {
    jacketMain = isBoy ? 'url(#anime-kimono-boy)' : 'url(#anime-kimono-girl)';
    jacketStroke = isBoy ? '#0f172a' : '#4c0519';
    pantsFill = isBoy ? '#172554' : '#be123c';
    pantsStroke = isBoy ? '#0f172a' : '#4c0519';
  }

  const containerGlowStyle: React.CSSProperties = {
    filter: isBoy
      ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.35)) drop-shadow(0 0 10px rgba(168, 85, 247, 0.22))'
      : 'drop-shadow(0 6px 14px rgba(0,0,0,0.35)) drop-shadow(0 0 10px rgba(244, 63, 94, 0.22))',
  };

  // --- RENDER HAT HELPER ---
  const renderHat = () => {
    if (currentHat === 'beret') {
      return (
        <g id="hat-beret" transform={`translate(80, 22) rotate(${isBoy ? -10 : 10}) translate(-80, -22)`}>
          <path
            d="M 44 26 C 42 6, 118 6, 116 26 C 104 18, 56 18, 44 26 Z"
            fill={isBoy ? "#1e1b4b" : "#9f1239"}
            stroke="#0f172a"
            strokeWidth="1.6"
          />
          <path d="M 80 8 L 80 3" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="80" cy="3" r="1.5" fill={isBoy ? "#38bdf8" : "#fda4af"} />
        </g>
      );
    }
    if (currentHat === 'cat_ears') {
      return (
        <g id="hat-cat-ears">
          {/* Left Cat Ear */}
          <path d="M 48 26 L 56 2 L 68 22 Z" fill={isBoy ? "#312e81" : "#e11d48"} stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 52 22 L 57 8 L 64 20 Z" fill="#fda4af" />
          {/* Right Cat Ear */}
          <path d="M 92 22 L 104 2 L 112 26 Z" fill={isBoy ? "#312e81" : "#e11d48"} stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 96 20 L 103 8 L 108 22 Z" fill="#fda4af" />
        </g>
      );
    }
    if (currentHat === 'crown') {
      return (
        <g id="hat-crown" transform="translate(80, 10) scale(1.05) translate(-80, -10)">
          <path d="M 62 20 L 59 4 L 69 12 L 80 0 L 91 12 L 101 4 L 98 20 Z" fill="url(#anime-gold-grad)" stroke="#92400e" strokeWidth="1.4" />
          <circle cx="80" cy="12" r="2.4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.6" />
          <circle cx="69" cy="14" r="1.8" fill="#10b981" />
          <circle cx="91" cy="14" r="1.8" fill="#3b82f6" />
          <circle cx="80" cy="0" r="1.8" fill="#ffffff" />
          <circle cx="59" cy="4" r="1.2" fill="#ffffff" />
          <circle cx="101" cy="4" r="1.2" fill="#ffffff" />
        </g>
      );
    }
    if (currentHat === 'beanie') {
      return (
        <g id="hat-beanie">
          <path d="M 46 32 C 44 6, 116 6, 114 32 C 104 22, 56 22, 46 32 Z" fill={isBoy ? "#0284c7" : "#db2777"} stroke="#0f172a" strokeWidth="1.5" />
          <rect x="46" y="23" width="68" height="9" rx="3" fill={isBoy ? "#0369a1" : "#be185d"} stroke="#0f172a" strokeWidth="1.2" />
          {/* Knit stitches */}
          <path d="M 54 24 L 54 31 M 64 24 L 64 31 M 74 24 L 74 31 M 84 24 L 84 31 M 94 24 L 94 31 M 104 24 L 104 31" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
          {/* Pompom */}
          <circle cx="80" cy="4" r="5.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
          <circle cx="78" cy="3" r="1.2" fill="#cbd5e1" />
        </g>
      );
    }
    if (currentHat === 'star_clip') {
      return (
        <g id="hat-star-clip" transform={`translate(${isBoy ? 52 : 108}, 36) scale(0.95)`}>
          <polygon points="0,-9 2.7,-2.7 9.2,-2.7 4.1,1.6 6.1,8.1 0,4.1 -6.1,8.1 -4.1,1.6 -9.2,-2.7 -2.7,-2.7" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
        </g>
      );
    }
    return null;
  };

  // --- RENDER PROP HELPER ---
  const renderProp = () => {
    if (currentProp === 'boba') {
      return (
        <g id="prop-boba" transform="translate(8, 12) scale(0.85)">
          <rect x="-8" y="-12" width="16" height="22" rx="4" fill="#fef3c7" stroke="#78350f" strokeWidth="1.3" />
          <rect x="-7" y="-3" width="14" height="12" rx="2" fill="#d97706" opacity="0.4" />
          <path d="M -8 -12 Q 0 -16 8 -12" stroke="#78350f" strokeWidth="1.5" fill="none" />
          <line x1="0" y1="-18" x2="3" y2="-10" stroke="#a855f7" strokeWidth="2.8" strokeLinecap="round" />
          {/* Tapioca pearls */}
          <circle cx="-4" cy="4" r="1.8" fill="#451a03" />
          <circle cx="0" cy="6" r="1.8" fill="#451a03" />
          <circle cx="4" cy="5" r="1.8" fill="#451a03" />
          <circle cx="-2" cy="1" r="1.8" fill="#451a03" />
          <circle cx="3" cy="2" r="1.8" fill="#451a03" />
          <text x="0" y="-3" textAnchor="middle" fontSize="6" fill="#ec4899">❤️</text>
        </g>
      );
    }
    if (currentProp === 'rose') {
      return (
        <g id="prop-rose" transform="translate(6, 4) scale(0.9)">
          <path d="M 0 0 Q -5 14 0 26" stroke="#15803d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M -2 12 Q -8 10 -6 16 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
          <path d="M 1 18 Q 7 16 5 22 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
          <circle cx="0" cy="-2" r="7.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
          <path d="M -4 -4 Q 0 -8 4 -4 Q 6 0 0 2 Q -6 0 -4 -4" fill="#ef4444" />
          <circle cx="0" cy="-2" r="2.5" fill="#f87171" />
        </g>
      );
    }
    if (currentProp === 'guitar') {
      return (
        <g id="prop-guitar" transform={`translate(${isBoy ? 2 : -2}, -6) rotate(${isBoy ? -25 : 25}) scale(0.85)`}>
          <ellipse cx="0" cy="18" rx="16" ry="20" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
          <ellipse cx="0" cy="4" rx="11" ry="12" fill="#d97706" stroke="#78350f" strokeWidth="1.2" />
          <circle cx="0" cy="14" r="5" fill="#1e1b4b" />
          <rect x="-3" y="-28" width="6" height="30" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          <rect x="-4.5" y="-36" width="9" height="10" rx="1.5" fill="#b45309" stroke="#451a03" strokeWidth="1" />
          <line x1="-1.5" y1="-32" x2="-1.5" y2="24" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
          <line x1="1.5" y1="-32" x2="1.5" y2="24" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
        </g>
      );
    }
    if (currentProp === 'heart_wand') {
      return (
        <g id="prop-heart-wand" transform="translate(6, 2) scale(0.9)">
          <line x1="0" y1="24" x2="0" y2="-6" stroke="url(#anime-gold-grad)" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M 0 -8 C -6 -16 -16 -8 -8 0 L 0 8 L 8 0 C 16 -8 6 -16 0 -8 Z" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="1.6" />
          <circle cx="0" cy="-4" r="2.5" fill="#ffffff" />
          <polygon points="0,-14 1.5,-10 6,-10 2.5,-7.5 4,-3.5 0,-6 -4,-3.5 -2.5,-7.5 -6,-10 -1.5,-10" fill="#fef08a" />
        </g>
      );
    }
    if (currentProp === 'teddy') {
      return (
        <g id="prop-teddy" transform={`translate(${isBoy ? 10 : -10}, 8) scale(0.85)`}>
          <circle cx="0" cy="0" r="9" fill="#a16207" stroke="#713f12" strokeWidth="1.2" />
          <circle cx="-7" cy="-7" r="3.5" fill="#a16207" stroke="#713f12" strokeWidth="1" />
          <circle cx="7" cy="-7" r="3.5" fill="#a16207" stroke="#713f12" strokeWidth="1" />
          <ellipse cx="0" cy="2" rx="4.5" ry="3.5" fill="#fef08a" />
          <circle cx="-3" cy="-1.5" r="1.2" fill="#000000" />
          <circle cx="3" cy="-1.5" r="1.2" fill="#000000" />
          <circle cx="0" cy="1" r="1.4" fill="#000000" />
          <ellipse cx="0" cy="14" rx="10" ry="12" fill="#a16207" stroke="#713f12" strokeWidth="1.2" />
          <rect x="-4" y="6" width="8" height="3" rx="1.5" fill="#ef4444" />
        </g>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="relative flex flex-col items-center select-none group cursor-pointer"
      onClick={handleTap}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        y: -6, 
        scale: 1.05,
        rotate: isBoy ? 1.5 : -1.5,
        transition: { type: "spring", stiffness: 400, damping: 15, mass: 0.6 }
      }}
      whileTap={{ 
        scale: 0.93, 
        y: 3,
        transition: { type: "spring", stiffness: 600, damping: 20 }
      }}
      animate={tapPulse ? {
        y: [0, -14, 2, -5, 0],
        scale: [1, 1.12, 0.95, 1.04, 1],
      } : {}}
      transition={tapPulse ? {
        duration: 0.65,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: "easeOut"
      } : undefined}
      title={isBoy ? "Abdul (Tap or Hover!)" : "Waiting (Tap or Hover!)"}
    >
      {/* Dynamic Pop Reaction Bubble on Tap */}
      {reactionText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: 1, y: -26, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className={`absolute -top-7 z-40 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide shadow-lg whitespace-nowrap border pointer-events-none ${
            isBoy 
              ? 'bg-purple-900 text-amber-300 border-amber-400' 
              : 'bg-rose-900 text-rose-100 border-rose-400'
          }`}
        >
          {reactionText}
        </motion.div>
      )}

      {/* Name / Mood Badge */}
      <div className={`mb-1 px-3 py-0.5 rounded-full text-[11px] font-black tracking-wide shadow-md whitespace-nowrap z-30 flex items-center gap-1.5 border transition-all ${
        isHovered
          ? (isBoy ? 'bg-purple-900 text-amber-200 border-amber-300 shadow-purple-500/30' : 'bg-pink-900 text-pink-100 border-pink-300 shadow-pink-500/30')
          : (isBoy ? 'bg-purple-950 text-amber-300 border-amber-400/40' : 'bg-pink-950 text-pink-200 border-pink-400/40')
      }`}>
        <span className="text-xs">{isBoy ? '✨' : '💖'}</span>
        <span>{isBoy ? (name.includes('Abdul') ? name : `${name} (Abdul)`) : (name.includes('Waiting') ? name : `${name}`)}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${isBoy ? 'bg-amber-400' : 'bg-pink-400'} animate-pulse`} />
      </div>

      {/* SVG ANIME CHIBI RIG WITH LOW-INTENSITY AMBIENT GLOW FILTER */}
      <motion.div 
        className="relative w-36 h-56 sm:w-40 sm:h-60 flex flex-col items-center transition-all duration-300"
        style={containerGlowStyle}
        animate={isHovered ? { filter: isBoy 
          ? 'drop-shadow(0 8px 18px rgba(0,0,0,0.4)) drop-shadow(0 0 14px rgba(168, 85, 247, 0.35))'
          : 'drop-shadow(0 8px 18px rgba(0,0,0,0.4)) drop-shadow(0 0 14px rgba(244, 63, 94, 0.35))'
        } : {}}
      >
        <svg
          viewBox="0 0 160 230"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Soft Organic Anime Skin Gradients */}
            <radialGradient id="anime-skin-boy" cx="42%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#fffaf5" />
              <stop offset="50%" stopColor="#ffedd5" />
              <stop offset="85%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fba364" />
            </radialGradient>

            <radialGradient id="anime-skin-girl" cx="42%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#fff5f6" />
              <stop offset="50%" stopColor="#ffe4e6" />
              <stop offset="85%" stopColor="#fecdd3" />
              <stop offset="100%" stopColor="#fb7185" />
            </radialGradient>

            {/* Anime Hair Gradients with Lustrous Depth */}
            <linearGradient id="anime-hair-boy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="35%" stopColor="#3730a3" />
              <stop offset="70%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="anime-hair-girl" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="35%" stopColor="#e11d48" />
              <stop offset="75%" stopColor="#881337" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            {/* Clothing Gradients */}
            <linearGradient id="anime-jacket-boy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>

            <linearGradient id="anime-pants-boy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="anime-dress-girl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="45%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>

            <linearGradient id="anime-tights-girl" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            {/* Wardrobe Variations Gradients */}
            <linearGradient id="anime-sweater-boy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>

            <linearGradient id="anime-sweater-girl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#86198f" />
            </linearGradient>

            <linearGradient id="anime-denim-boy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            <linearGradient id="anime-denim-girl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#db2777" />
              <stop offset="100%" stopColor="#9d174d" />
            </linearGradient>

            <linearGradient id="anime-blazer-boy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="anime-blazer-girl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="50%" stopColor="#881337" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            <linearGradient id="anime-kimono-boy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#172554" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="anime-kimono-girl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>

            {/* Gold / Royal Metallic Gradient */}
            <linearGradient id="anime-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Sparkling Anime Eyes Gradients */}
            <radialGradient id="anime-iris-boy" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="30%" stopColor="#38bdf8" />
              <stop offset="65%" stopColor="#0284c7" />
              <stop offset="90%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            <radialGradient id="anime-iris-girl" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fdf2f8" />
              <stop offset="30%" stopColor="#f472b6" />
              <stop offset="65%" stopColor="#db2777" />
              <stop offset="90%" stopColor="#831843" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* High-Top Sneaker Sole Texture */}
            <linearGradient id="anime-sole-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>

          {/* ============================================================
              1. CONTACT FLOOR SHADOW
              ============================================================ */}
          <ellipse
            cx="80"
            cy="214"
            rx={isMoving ? 35 : 38}
            ry="7"
            fill="#090d16"
            opacity="0.4"
          />

          {/* ============================================================
              2. SKELETAL LEGS & GROUNDED SNEAKERS
              Left Hip: (66, 134) | Right Hip: (94, 134)
              ============================================================ */}
          {/* --- LEFT LEG --- */}
          <g transform={`translate(66, 134) rotate(${leftHipAngle})`}>
            {/* Organic Tapered Thigh (0 to 28) */}
            <path
              d="M -6 0 C -7 9, -5 20, -5 28 C -5 28, 5 28, 5 28 C 5 20, 7 9, 6 0 Z"
              fill={pantsFill}
              stroke={pantsStroke}
              strokeWidth="1.5"
            />
            {/* Knee Joint at (0, 28) */}
            <g transform={`translate(0, 28) rotate(${leftKneeAngle})`}>
              {/* Organic Tapered Shin & Calf (0 to 26) */}
              <path
                d="M -5 0 C -5.5 8, -4.5 18, -4.5 26 C -4.5 26, 4.5 26, 4.5 26 C 4.5 18, 5.5 8, 5 0 Z"
                fill={pantsFill}
                stroke={pantsStroke}
                strokeWidth="1.5"
              />
              {/* Sneaker attached at Ankle (0, 26) */}
              <g transform="translate(-11, 23)">
                <path
                  d="M 2 4 C 2 -1, 8 -1, 10 2 L 23 6 C 26 8, 26 15, 23 16 L 2 16 C -1 16, -1 9, 2 4 Z"
                  fill={isBoy ? "#1e293b" : "#be185d"}
                  stroke={pantsStroke}
                  strokeWidth="1.5"
                />
                <path d="M 7 4 L 12 9 M 11 4 L 16 9" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
                {isBoy ? (
                  <path d="M 4 9.5 Q 12 7 19 11" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                ) : (
                  <circle cx="10" cy="5" r="2.5" fill="#ffe4e6" stroke="#fda4af" strokeWidth="1" />
                )}
                <rect x="0" y="12" width="25" height="6" rx="3" fill="url(#anime-sole-grad)" stroke={pantsStroke} strokeWidth="1.4" />
                <path d="M 3 15.5 L 22 15.5" stroke="#94a3b8" strokeWidth="1.2" />
              </g>
            </g>
          </g>

          {/* --- RIGHT LEG --- */}
          <g transform={`translate(94, 134) rotate(${rightHipAngle})`}>
            <path
              d="M -6 0 C -7 9, -5 20, -5 28 C -5 28, 5 28, 5 28 C 5 20, 7 9, 6 0 Z"
              fill={pantsFill}
              stroke={pantsStroke}
              strokeWidth="1.5"
            />
            <g transform={`translate(0, 28) rotate(${rightKneeAngle})`}>
              <path
                d="M -5 0 C -5.5 8, -4.5 18, -4.5 26 C -4.5 26, 4.5 26, 4.5 26 C 4.5 18, 5.5 8, 5 0 Z"
                fill={pantsFill}
                stroke={pantsStroke}
                strokeWidth="1.5"
              />
              <g transform="translate(-11, 23)">
                <path
                  d="M 2 4 C 2 -1, 8 -1, 10 2 L 23 6 C 26 8, 26 15, 23 16 L 2 16 C -1 16, -1 9, 2 4 Z"
                  fill={isBoy ? "#334155" : "#f43f5e"}
                  stroke={pantsStroke}
                  strokeWidth="1.5"
                />
                <path d="M 7 4 L 12 9 M 11 4 L 16 9" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
                {isBoy ? (
                  <path d="M 4 9.5 Q 12 7 19 11" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                ) : (
                  <circle cx="10" cy="5" r="2.5" fill="#ffe4e6" stroke="#fda4af" strokeWidth="1" />
                )}
                <rect x="0" y="12" width="25" height="6" rx="3" fill="url(#anime-sole-grad)" stroke={pantsStroke} strokeWidth="1.4" />
                <path d="M 3 15.5 L 22 15.5" stroke="#94a3b8" strokeWidth="1.2" />
              </g>
            </g>
          </g>

          {/* ============================================================
              3. UPPER BODY RIG (Organic Anime Torso, Arms, Head)
              Pivots at Pelvis/Waist (80, 134) with natural breathing bob
              ============================================================ */}
          <g transform={`translate(80, ${134 + breatheY}) rotate(${torsoAngle}) translate(-80, -134)`}>

            {/* --- LEFT ARM (Hierarchical Skeleton from Shoulder at (58, 86)) --- */}
            <g transform={`translate(58, 86) rotate(${leftShoulderAngle})`}>
              {/* Organic Sleeve Upper Arm (0 to 26) */}
              <path
                d={currentOutfit === 'kimono' 
                  ? "M -8 0 C -12 10, -14 20, -12 28 C -12 28, 6 28, 6 28 C 6 18, 7 8, 6 0 Z"
                  : "M -6 0 C -7 8, -5.5 18, -5 26 C -5 26, 5 26, 5 26 C 5.5 18, 7 8, 6 0 Z"}
                fill={jacketMain}
                stroke={jacketStroke}
                strokeWidth="1.5"
              />
              {/* Elbow Joint at (0, 26) */}
              <g transform={`translate(0, 26) rotate(${leftElbowAngle})`}>
                <path
                  d={currentOutfit === 'kimono'
                    ? "M -12 0 C -14 10, -16 22, -14 28 L 6 26 C 6 16, 5.5 8, 5 0 Z"
                    : "M -5 0 C -5.5 8, -4.5 16, -4.5 24 C -4.5 24, 4.5 24, 4.5 24 C 4.5 16, 5.5 8, 5 0 Z"}
                  fill={jacketMain}
                  stroke={jacketStroke}
                  strokeWidth="1.5"
                />
                {currentOutfit !== 'kimono' && (
                  <rect x="-5.5" y="20" width="11" height="4" rx="2" fill={isBoy ? "#38bdf8" : "#fbcfe8"} stroke={jacketStroke} strokeWidth="1" />
                )}
                <g transform="translate(0, 24)">
                  <AnimeChibiHand gender={gender} gesture={leftHandGesture} facingRight={isBoy} />
                </g>
              </g>
            </g>

            {/* --- ORGANIC ANIME TORSO & CLOTHING BASE --- */}
            <g id="anime-torso">
              {currentOutfit === 'sweater' ? (
                /* Cable Knit Cozy Sweater */
                <>
                  <path
                    d="M 54 74 C 52 90, 53 115, 55 130 C 65 133, 95 133, 105 130 C 107 115, 108 90, 106 74 C 95 72, 65 72, 54 74 Z"
                    fill={jacketMain}
                    stroke={jacketStroke}
                    strokeWidth="1.6"
                  />
                  {/* Ribbed Fold-over Turtleneck Collar */}
                  <path d="M 64 64 Q 80 72 96 64 L 96 74 Q 80 82 64 74 Z" fill={jacketMain} stroke={jacketStroke} strokeWidth="1.4" />
                  <path d="M 70 66 L 70 77 M 76 68 L 76 79 M 84 68 L 84 79 M 90 66 L 90 77" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
                  {/* Cable Stitch Textures */}
                  <path d="M 68 76 L 68 128 M 76 78 L 76 128 M 84 78 L 84 128 M 92 76 L 92 128" stroke={isBoy ? "#047857" : "#a21caf"} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
                  {/* Girl Heart Knitted Brooch or Boy Emblem */}
                  {!isBoy ? (
                    <path d="M 80 92 C 76 88, 68 91, 71 97 C 74 102, 80 106, 80 106 C 80 106, 86 102, 89 97 C 92 91, 84 88, 80 92 Z" fill="#ffffff" stroke="#c026d3" strokeWidth="1.2" />
                  ) : (
                    <circle cx="80" cy="98" r="4.5" fill="#fef08a" stroke="#065f46" strokeWidth="1" />
                  )}
                  {/* Ribbed Bottom Band */}
                  <path d="M 54 126 C 65 129, 95 129, 106 126 L 105 133 C 95 136, 65 136, 55 133 Z" fill={isBoy ? "#065f46" : "#86198f"} stroke={jacketStroke} strokeWidth="1.2" />
                </>
              ) : currentOutfit === 'overalls' ? (
                /* Denim Bib Overalls */
                <>
                  {/* Inner T-Shirt Base */}
                  <path
                    d="M 54 74 C 52 90, 53 115, 55 130 C 65 133, 95 133, 105 130 C 107 115, 108 90, 106 74 C 95 72, 65 72, 54 74 Z"
                    fill="#ffffff"
                    stroke={jacketStroke}
                    strokeWidth="1.5"
                  />
                  {/* T-Shirt Stripes */}
                  <path d="M 54 80 L 106 80 M 54 90 L 106 90" stroke={isBoy ? "#38bdf8" : "#f472b6"} strokeWidth="3" />
                  {/* Denim Bib */}
                  <path d="M 62 84 L 98 84 L 98 131 L 62 131 Z" fill={jacketMain} stroke={jacketStroke} strokeWidth="1.5" />
                  {/* Suspenders */}
                  <path d="M 64 74 L 64 88 M 96 74 L 96 88" stroke={isBoy ? "#1d4ed8" : "#db2777"} strokeWidth="4.5" strokeLinecap="round" />
                  {/* Brass Buckle Pins */}
                  <circle cx="64" cy="87" r="2.8" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
                  <circle cx="96" cy="87" r="2.8" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
                  {/* Front Patch Pocket */}
                  <path d="M 70 94 L 90 94 L 88 114 L 72 114 Z" fill={jacketMain} stroke={jacketStroke} strokeWidth="1.2" />
                  <path d="M 70 94 L 80 102 L 90 94" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.7" />
                </>
              ) : currentOutfit === 'blazer' ? (
                /* Formal Uniform Blazer */
                <>
                  <path
                    d="M 54 74 C 52 90, 53 115, 55 130 C 65 133, 95 133, 105 130 C 107 115, 108 90, 106 74 C 95 72, 65 72, 54 74 Z"
                    fill={jacketMain}
                    stroke={jacketStroke}
                    strokeWidth="1.6"
                  />
                  {/* Crisp White Shirt & Collar */}
                  <path d="M 68 73 L 80 94 L 92 73 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <path d="M 66 73 L 74 81 M 94 73 L 86 81" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Boy Tie or Girl Ribbon Bowtie */}
                  {isBoy ? (
                    <path d="M 78 74 L 82 74 L 84 96 L 80 106 L 76 96 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                  ) : (
                    <g transform="translate(80, 78)">
                      <path d="M 0 0 L -6 6 L 0 5 L 6 6 Z" fill="#f43f5e" stroke="#9f1239" strokeWidth="0.8" />
                      <circle cx="0" cy="1" r="1.8" fill="#fda4af" />
                    </g>
                  )}
                  {/* Sharp Notched Lapels */}
                  <path d="M 54 74 L 68 96 L 62 116 L 55 130 Z" fill={jacketMain} stroke={jacketStroke} strokeWidth="1.3" />
                  <path d="M 106 74 L 92 96 L 98 116 L 105 130 Z" fill={jacketMain} stroke={jacketStroke} strokeWidth="1.3" />
                  {/* Gold Buttons */}
                  <circle cx="76" cy="106" r="2.2" fill="#fbbf24" stroke="#b45309" strokeWidth="0.7" />
                  <circle cx="76" cy="118" r="2.2" fill="#fbbf24" stroke="#b45309" strokeWidth="0.7" />
                  {/* Pocket Square */}
                  <path d="M 62 92 L 67 92 L 67 96 L 62 96 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                  {!isBoy && (
                    /* Girl Tartan Plaid Skirt */
                    <path
                      d="M 50 122 C 60 120, 100 120, 110 122 C 118 135, 122 148, 124 150 C 104 155, 56 155, 36 150 C 38 148, 42 135, 50 122 Z"
                      fill="#881337"
                      stroke={jacketStroke}
                      strokeWidth="1.6"
                    />
                  )}
                </>
              ) : currentOutfit === 'kimono' ? (
                /* Traditional Yukata / Kimono */
                <>
                  <path
                    d="M 54 74 C 50 90, 52 115, 54 130 C 65 133, 95 133, 106 130 C 108 115, 110 90, 106 74 C 95 72, 65 72, 54 74 Z"
                    fill={jacketMain}
                    stroke={jacketStroke}
                    strokeWidth="1.6"
                  />
                  {/* Overlapping Wrap Collar */}
                  <path d="M 56 74 L 80 106 L 104 74" stroke="#ffffff" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                  <path d="M 58 74 L 80 104 L 102 74" stroke={jacketStroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  {/* Gold Contrast Obi Sash */}
                  <path d="M 52 106 L 108 106 L 108 130 L 52 130 Z" fill="url(#anime-gold-grad)" stroke="#92400e" strokeWidth="1.4" />
                  {/* Obijime Cord & Musubi Knot */}
                  <path d="M 52 118 L 108 118" stroke="#dc2626" strokeWidth="2" />
                  <circle cx="80" cy="118" r="3.2" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
                  <circle cx="80" cy="118" r="1.5" fill="#fef08a" />
                  {/* Sakura / Cloud Motifs */}
                  <text x="64" y="96" fontSize="8" opacity="0.6">🌸</text>
                  <text x="92" y="96" fontSize="8" opacity="0.6">🌸</text>
                </>
              ) : isBoy ? (
                /* Abdul: Contoured Bomber Jacket with Ribbed Trim (Default Hoodie) */
                <>
                  <path
                    d="M 54 74 C 52 90, 53 115, 55 130 C 65 133, 95 133, 105 130 C 107 115, 108 90, 106 74 C 95 72, 65 72, 54 74 Z"
                    fill="url(#anime-jacket-boy)"
                    stroke={jacketStroke}
                    strokeWidth="1.6"
                  />
                  {/* Fitted inner tee */}
                  <path d="M 68 73 L 80 102 L 92 73 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                  {/* Collar Lapel */}
                  <path d="M 66 73 Q 80 84 94 73" stroke="#38bdf8" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  {/* Jacket Flaps */}
                  <path d="M 54 74 L 68 73 L 80 102 L 80 131 L 55 130 Z" fill="url(#anime-jacket-boy)" stroke={jacketStroke} strokeWidth="1.2" />
                  <path d="M 106 74 L 92 73 L 80 102 L 80 131 L 105 130 Z" fill="url(#anime-jacket-boy)" stroke={jacketStroke} strokeWidth="1.2" />
                  {/* Zipper & Slider */}
                  <path d="M 80 102 L 80 131" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  <rect x="78" y="104" width="4" height="5" rx="1" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
                  {/* Kangaroo Drawstrings */}
                  <path d="M 72 75 Q 70 88 73 95" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 88 75 Q 90 88 87 95" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                  {/* Ribbed Bottom Band */}
                  <path d="M 54 128 C 65 131, 95 131, 106 128 L 105 135 C 95 138, 65 138, 55 135 Z" fill="#0284c7" stroke={jacketStroke} strokeWidth="1.1" />
                  {/* Star Crest */}
                  <g transform="translate(60, 84) scale(0.85)">
                    <circle cx="10" cy="10" r="6.5" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
                    <path d="M 7 10 L 10 6.5 L 13 10 L 11 10 L 11 13.5 L 9 13.5 L 9 10 Z" fill="#1e1b4b" />
                  </g>
                </>
              ) : (
                /* Waiting: Contoured Sweetheart Dress with Pleated Skirt (Default) */
                <>
                  <path
                    d="M 56 74 C 54 88, 56 110, 58 124 C 68 126, 92 126, 102 124 C 104 110, 106 88, 104 74 C 94 72, 66 72, 56 74 Z"
                    fill="url(#anime-dress-girl)"
                    stroke={jacketStroke}
                    strokeWidth="1.6"
                  />
                  {/* Sweetheart Neckline with Frills */}
                  <path d="M 64 73 Q 74 83 80 81 Q 86 83 96 73" stroke="#ffe4e6" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  {/* Heart Brooch */}
                  <g transform="translate(68, 83) scale(0.85)">
                    <path
                      d="M 12 4 C 8 0, 0 4, 3 12 C 6 18, 12 22, 12 22 C 12 22, 18 18, 21 12 C 24 4, 16 0, 12 4 Z"
                      fill="#ffffff"
                      stroke="#831843"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M 12 6 C 9 3, 3 6, 5 12 C 7 16, 12 19, 12 19 C 12 19, 17 16, 19 12 C 21 6, 15 3, 12 6 Z"
                      fill="#fda4af"
                    />
                  </g>
                  {/* Pleated Skirt with Organic Hem */}
                  <path
                    d="M 50 122 C 60 120, 100 120, 110 122 C 118 135, 122 148, 124 150 C 104 155, 56 155, 36 150 C 38 148, 42 135, 50 122 Z"
                    fill="#f43f5e"
                    stroke={jacketStroke}
                    strokeWidth="1.6"
                  />
                  {/* Pleat Creases */}
                  <path d="M 62 122 L 54 151 M 74 122 L 72 153 M 86 122 L 88 153 M 98 122 L 106 151" stroke="#be123c" strokeWidth="1.2" opacity="0.6" />
                  {/* Lace Scallops */}
                  <path
                    d="M 36 149 Q 44 154 52 149 Q 60 154 68 149 Q 76 154 84 149 Q 92 154 100 149 Q 108 154 116 149 Q 120 152 124 149"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    fill="none"
                  />
                </>
              )}
            </g>

            {/* --- RIGHT ARM (Hierarchical Skeleton from Shoulder at (102, 86)) --- */}
            <g transform={`translate(102, 86) rotate(${rightShoulderAngle})`}>
              <path
                d={currentOutfit === 'kimono'
                  ? "M -6 0 C -7 8, -6 18, -6 28 L 12 28 C 14 18, 12 8, 6 0 Z"
                  : "M -6 0 C -7 8, -5.5 18, -5 26 C -5 26, 5 26, 5 26 C 5.5 18, 7 8, 6 0 Z"}
                fill={jacketMain}
                stroke={jacketStroke}
                strokeWidth="1.5"
              />
              <g transform={`translate(0, 26) rotate(${rightElbowAngle})`}>
                <path
                  d={currentOutfit === 'kimono'
                    ? "M -5 0 C -5.5 8, -6 16, -6 26 L 14 28 C 16 16, 5.5 8, 5 0 Z"
                    : "M -5 0 C -5.5 8, -4.5 16, -4.5 24 C -4.5 24, 4.5 24, 4.5 24 C 4.5 16, 5.5 8, 5 0 Z"}
                  fill={jacketMain}
                  stroke={jacketStroke}
                  strokeWidth="1.5"
                />
                {currentOutfit !== 'kimono' && (
                  <rect x="-5.5" y="20" width="11" height="4" rx="2" fill={isBoy ? "#38bdf8" : "#fbcfe8"} stroke={jacketStroke} strokeWidth="1" />
                )}
                <g transform="translate(0, 24)">
                  <AnimeChibiHand gender={gender} gesture={rightHandGesture} facingRight={isBoy} />
                  {/* Handheld Prop Attached to Main Hand */}
                  {renderProp()}
                </g>
              </g>
            </g>

            {/* --- HEAD & EXPRESSIVE ANIME CHIBI FACE (Pivots at Neck: 80, 72) --- */}
            <g transform={`translate(80, 72) rotate(${headAngle}) translate(-80, -72)`}>
              {/* Girl Ponytail with Secondary Sway Physics */}
              {!isBoy && (
                <g transform={`translate(108, 34) rotate(${hairSecondarySway}) translate(-108, -34)`}>
                  <path
                    d="M 108 34 C 132 44, 142 68, 134 94 C 122 98, 116 75, 112 56 C 108 44, 106 38, 108 34 Z"
                    fill="url(#anime-hair-girl)"
                    stroke="#4c0519"
                    strokeWidth="1.5"
                  />
                  <path d="M 112 42 C 124 58, 126 78, 122 88" stroke="#fb7185" strokeWidth="1.5" fill="none" opacity="0.6" />
                </g>
              )}

              {/* Neck */}
              <path
                d="M 74 63 C 74 63, 73 73, 73 73 C 76 74, 84 74, 87 73 C 87 73, 86 63, 86 63 Z"
                fill={isBoy ? "url(#anime-skin-boy)" : "url(#anime-skin-girl)"}
                stroke={jacketStroke}
                strokeWidth="1.2"
              />

              {/* Contoured Anime Chibi Face (Soft Cheek Contour & Chin) */}
              <path
                d="M 50 42 C 48 20, 112 20, 110 42 C 112 56, 106 68, 80 70 C 54 68, 48 56, 50 42 Z"
                fill={isBoy ? "url(#anime-skin-boy)" : "url(#anime-skin-girl)"}
                stroke={isBoy ? "#9a3412" : "#9f1239"}
                strokeWidth="1.7"
              />

              {/* Cute Stylized Anime Ears */}
              <path d="M 49 43 C 44 43, 44 51, 49 53 Z" fill={isBoy ? "url(#anime-skin-boy)" : "url(#anime-skin-girl)"} stroke={isBoy ? "#9a3412" : "#9f1239"} strokeWidth="1.2" />
              <path d="M 111 43 C 116 43, 116 51, 111 53 Z" fill={isBoy ? "url(#anime-skin-boy)" : "url(#anime-skin-girl)"} stroke={isBoy ? "#9a3412" : "#9f1239"} strokeWidth="1.2" />

              {/* Tiny Chibi Nose */}
              <circle cx="80" cy="50.5" r="1.4" fill={isBoy ? "#ea580c" : "#f43f5e"} opacity="0.8" />

              {/* Layered Hair Styles */}
              {isBoy ? (
                /* Abdul: Textured Anime Locks + Dynamic Spring Ahoge */
                <g id="anime-hair-boy-group">
                  {/* Bouncing Spring Ahoge */}
                  <g transform={`translate(74, 16) rotate(${hairSecondarySway * 1.5}) translate(-74, -16)`}>
                    <path
                      d="M 74 16 Q 66 0 82 4 Q 78 12 74 16 Z"
                      fill="url(#anime-hair-boy)"
                      stroke="#0f172a"
                      strokeWidth="1.2"
                    />
                  </g>
                  {/* Main Hair Crown */}
                  <path
                    d="M 46 44 C 44 14, 116 14, 114 44 C 104 28, 92 32, 80 32 C 68 32, 56 28, 46 44 Z"
                    fill="url(#anime-hair-boy)"
                    stroke="#0f172a"
                    strokeWidth="1.6"
                  />
                  {/* Layered Anime Bangs with Tapered Strands */}
                  <path d="M 46 44 Q 56 36 65 48 Q 60 35 74 46 Q 72 34 86 46 Q 84 34 96 48 Q 104 36 114 44 C 110 32, 100 24, 80 24 C 60 24, 50 32, 46 44 Z" fill="url(#anime-hair-boy)" stroke="#0f172a" strokeWidth="1.3" />
                  {/* Side Sideburn Strands */}
                  <path d="M 46 44 Q 40 56 45 66 Q 49 60 49 46 Z" fill="url(#anime-hair-boy)" stroke="#0f172a" strokeWidth="1.1" />
                  <path d="M 114 44 Q 120 56 115 66 Q 111 60 111 46 Z" fill="url(#anime-hair-boy)" stroke="#0f172a" strokeWidth="1.1" />
                  {/* Angel Ring Hair Sheen */}
                  <path d="M 54 26 Q 80 18 106 26" stroke="#ffffff" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.45" />
                </g>
              ) : (
                /* Waiting: Layered Anime Bangs + Rose Scrunchie */
                <g id="anime-hair-girl-group">
                  <path
                    d="M 46 44 C 44 14, 116 14, 114 40 C 104 24, 92 28, 80 28 C 68 28, 56 24, 46 44 Z"
                    fill="url(#anime-hair-girl)"
                    stroke="#4c0519"
                    strokeWidth="1.6"
                  />
                  <path d="M 46 40 Q 56 34 65 46 Q 62 33 76 44 Q 74 33 86 44 Q 84 33 96 46 Q 104 34 114 40 C 110 28, 100 22, 80 22 C 60 22, 50 28, 46 40 Z" fill="url(#anime-hair-girl)" stroke="#4c0519" strokeWidth="1.3" />
                  <path d="M 46 40 Q 40 56 45 66 Q 49 60 49 44 Z" fill="url(#anime-hair-girl)" stroke="#4c0519" strokeWidth="1.1" />
                  <path d="M 114 40 Q 120 56 115 66 Q 111 60 111 44 Z" fill="url(#anime-hair-girl)" stroke="#4c0519" strokeWidth="1.1" />
                  {/* Rose Scrunchie */}
                  <ellipse cx="108" cy="34" rx="5.5" ry="7.5" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="1.2" />
                  <circle cx="108" cy="34" r="2.2" fill="#ffffff" />
                  {/* Hair Sheen */}
                  <path d="M 54 24 Q 80 16 106 24" stroke="#ffffff" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.45" />
                </g>
              )}

              {/* Wardrobe Hat / Hair Accessory */}
              {renderHat()}

              {/* EYEBROWS */}
              <g stroke={isBoy ? "#1e1b4b" : "#4c0519"} strokeWidth="2.2" strokeLinecap="round">
                <path d={`M 57 ${33 - morphs.eyebrowLift * 4} Q 66 ${29 - morphs.eyebrowTilt * 4} 73 ${33 - morphs.eyebrowLift * 2}`} />
                <path d={`M 87 ${33 - morphs.eyebrowLift * 2} Q 94 ${29 - morphs.eyebrowTilt * 4} 103 ${33 - morphs.eyebrowLift * 4}`} />
              </g>

              {/* SOFT CHEEK BLUSH with Sparkle Glints */}
              <g opacity={morphs.blushOpacity}>
                <ellipse cx="58" cy="54" rx="8" ry="4.5" fill={isBoy ? "#f97316" : "#f43f5e"} opacity="0.55" />
                <ellipse cx="102" cy="54" rx="8" ry="4.5" fill={isBoy ? "#f97316" : "#f43f5e"} opacity="0.55" />
                <circle cx="56" cy="53" r="1.1" fill="#ffffff" />
                <circle cx="104" cy="53" r="1.1" fill="#ffffff" />
              </g>

              {/* CRYSTAL ANIME EYES */}
              {/* Left Eye */}
              <g id="left-eye" transform="translate(63, 46)">
                {morphs.blink > 0.5 || morphs.squint > 0.5 || morphs.winkLeft > 0.5 ? (
                  <path d="M -7 0 Q 0 -6 7 0" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="2.8" fill="none" strokeLinecap="round" />
                ) : (
                  <>
                    <ellipse cx="0" cy="0" rx="6.5" ry="8" fill="#ffffff" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="1.6" />
                    <ellipse
                      cx={morphs.gazeX * 2}
                      cy={morphs.gazeY * 2}
                      rx="4.8"
                      ry="6.5"
                      fill={isBoy ? "url(#anime-iris-boy)" : "url(#anime-iris-girl)"}
                    />
                    <circle cx={morphs.gazeX * 2} cy={morphs.gazeY * 2} r="2.2" fill="#020617" />
                    {/* Multi-tier Specular Highlights */}
                    <circle cx={morphs.gazeX * 2 - 1.8} cy={morphs.gazeY * 2 - 2.5} r="2" fill="#ffffff" />
                    <circle cx={morphs.gazeX * 2 + 1.8} cy={morphs.gazeY * 2 + 2} r="1" fill="#ffffff" />
                    {/* Anime Upper Eyelash Line */}
                    <path d="M -7.5 -4 Q 0 -10 7.5 -4" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="2.4" fill="none" strokeLinecap="round" />
                    <path d="M 5.5 -4 L 8 -6" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </g>

              {/* Right Eye */}
              <g id="right-eye" transform="translate(97, 46)">
                {morphs.blink > 0.5 || morphs.squint > 0.5 || morphs.winkRight > 0.5 ? (
                  <path d="M -7 0 Q 0 -6 7 0" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="2.8" fill="none" strokeLinecap="round" />
                ) : (
                  <>
                    <ellipse cx="0" cy="0" rx="6.5" ry="8" fill="#ffffff" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="1.6" />
                    <ellipse
                      cx={morphs.gazeX * 2}
                      cy={morphs.gazeY * 2}
                      rx="4.8"
                      ry="6.5"
                      fill={isBoy ? "url(#anime-iris-boy)" : "url(#anime-iris-girl)"}
                    />
                    <circle cx={morphs.gazeX * 2} cy={morphs.gazeY * 2} r="2.2" fill="#020617" />
                    <circle cx={morphs.gazeX * 2 - 1.8} cy={morphs.gazeY * 2 - 2.5} r="2" fill="#ffffff" />
                    <circle cx={morphs.gazeX * 2 + 1.8} cy={morphs.gazeY * 2 + 2} r="1" fill="#ffffff" />
                    <path d="M -7.5 -4 Q 0 -10 7.5 -4" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="2.4" fill="none" strokeLinecap="round" />
                    <path d="M -5.5 -4 L -8 -6" stroke={isBoy ? "#0f172a" : "#4c0519"} strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </g>

              {/* ANIME MOUTH */}
              {morphs.pout > 0.5 ? (
                <circle cx="80" cy="60" r="3.2" fill="#f43f5e" stroke={isBoy ? "#9a3412" : "#9f1239"} strokeWidth="1.4" />
              ) : morphs.mouthOpen > 0.3 ? (
                <g transform="translate(80, 58)">
                  <path d="M -6 0 Q 0 8 6 0 Z" fill="#be123c" stroke={isBoy ? "#9a3412" : "#9f1239"} strokeWidth="1.4" />
                  <path d="M -4 0 Q 0 2.5 4 0 Z" fill="#ffffff" />
                  <circle cx="0" cy="5" r="3" fill="#fb7185" />
                </g>
              ) : (
                <path
                  d={`M 74 58 Q 80 ${59 + morphs.smile * 4} 86 58`}
                  stroke={isBoy ? "#9a3412" : "#9f1239"}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </g>
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
};
