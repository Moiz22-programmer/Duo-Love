export interface User {
  uid: string;
  displayName: string;
  email: string;
  password?: string;
  photoUrl: string;
  coupleId?: string;
  createdAt: number;
  statusMessage?: string;
  moodIcon?: string;
}

export interface LoveStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  userAInteractedToday: boolean;
  userBInteractedToday: boolean;
  lastInteractions: Record<string, string>; // uid -> YYYY-MM-DD
}

export interface CoupleSpace {
  id: string;
  members: string[]; // [uid1, uid2]
  joinToken: string;
  createdAt: number;
  anniversaryDate: string; // YYYY-MM-DD
  loveStreak?: LoveStreak;
}

export interface ReactionMap {
  [uid: string]: string; // uid -> emoji
}

export interface Message {
  id: string;
  senderId: string;
  type: 'text' | 'image' | 'audio';
  text?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  reactions: ReactionMap;
  readBy: string[]; // [uid1, uid2]
  createdAt: number;
}

export interface Presence {
  uid: string;
  online: boolean;
  typing: boolean;
  lastActive: number;
}

export interface CallSignal {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'voice' | 'video';
  status: 'offered' | 'accepted' | 'declined' | 'ended';
  sdpOffer?: any;
  sdpAnswer?: any;
  iceCandidates?: any[];
  timestamp: number;
}
