import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Memory database for Couple spaces, users, messages, presence, and call signaling
interface UserDoc {
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

interface LoveStreakDoc {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  userAInteractedToday: boolean;
  userBInteractedToday: boolean;
  lastInteractions: Record<string, string>; // uid -> YYYY-MM-DD
}

interface CoupleDoc {
  id: string;
  members: string[]; // [uid1, uid2]
  joinToken: string;
  createdAt: number;
  anniversaryDate?: string;
  loveStreak?: LoveStreakDoc;
}

interface MessageDoc {
  id: string;
  senderId: string;
  type: 'text' | 'image' | 'audio';
  text?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  reactions: Record<string, string>; // uid -> emoji
  readBy: string[]; // array of uids
  createdAt: number;
}

interface PresenceDoc {
  uid: string;
  online: boolean;
  typing: boolean;
  lastActive: number;
}

interface CallSignal {
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

const users = new Map<string, UserDoc>();
const usersByEmail = new Map<string, UserDoc>();
const couples = new Map<string, CoupleDoc>();
const couplesByToken = new Map<string, string>(); // joinToken -> coupleId
const messages = new Map<string, MessageDoc[]>(); // coupleId -> MessageDoc[]
const presence = new Map<string, Map<string, PresenceDoc>>(); // coupleId -> (uid -> PresenceDoc)
const activeCalls = new Map<string, CallSignal>(); // coupleId -> CallSignal

function ensureUserUpdated(uid: string, email: string, displayName?: string, photoUrl?: string): UserDoc {
  const cleanEmail = email.trim().toLowerCase();
  let existing = usersByEmail.get(cleanEmail) || users.get(uid);

  if (existing) {
    const oldUid = existing.uid;
    if (oldUid !== uid) {
      users.delete(oldUid);
      existing.uid = uid;
      couples.forEach((c) => {
        c.members = c.members.map((m) => (m === oldUid ? uid : m));
        if (c.loveStreak?.lastInteractions && c.loveStreak.lastInteractions[oldUid]) {
          c.loveStreak.lastInteractions[uid] = c.loveStreak.lastInteractions[oldUid];
          delete c.loveStreak.lastInteractions[oldUid];
        }
      });
    }
    if (displayName) existing.displayName = displayName;
    if (photoUrl) existing.photoUrl = photoUrl;
    existing.email = cleanEmail;
    users.set(uid, existing);
    usersByEmail.set(cleanEmail, existing);
    return existing;
  } else {
    const newUser: UserDoc = {
      uid,
      displayName: displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      photoUrl: photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      createdAt: Date.now(),
      statusMessage: 'In love 💕',
    };
    users.set(uid, newUser);
    usersByEmail.set(cleanEmail, newUser);
    return newUser;
  }
}

function registerStreakInteraction(couple: CoupleDoc, uid: string): LoveStreakDoc {
  const today = new Date().toISOString().split('T')[0];
  if (!couple.loveStreak) {
    couple.loveStreak = {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      userAInteractedToday: couple.members[0] === uid,
      userBInteractedToday: couple.members[1] === uid,
      lastInteractions: { [uid]: today },
    };
    return couple.loveStreak;
  }

  const streak = couple.loveStreak;
  if (!streak.lastInteractions) streak.lastInteractions = {};

  const prevActiveDate = streak.lastActiveDate;

  if (prevActiveDate !== today) {
    const prevDateObj = new Date(prevActiveDate);
    const todayDateObj = new Date(today);
    const dayDiff = Math.round((todayDateObj.getTime() - prevDateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff > 1) {
      // Streak reset
      streak.userAInteractedToday = false;
      streak.userBInteractedToday = false;
      streak.currentStreak = 1;
    } else if (dayDiff === 1) {
      // New consecutive day
      streak.userAInteractedToday = false;
      streak.userBInteractedToday = false;
    }
    streak.lastActiveDate = today;
  }

  const wasBothInteractedBefore = streak.userAInteractedToday && streak.userBInteractedToday;

  streak.lastInteractions[uid] = today;
  if (couple.members[0] === uid) streak.userAInteractedToday = true;
  if (couple.members[1] === uid) streak.userBInteractedToday = true;

  if (streak.userAInteractedToday && streak.userBInteractedToday) {
    if (!wasBothInteractedBefore) {
      streak.currentStreak += 1;
    }
    if (streak.currentStreak === 0) streak.currentStreak = 1;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
  }

  return streak;
}

// Helper to resolve or create a stable couple space + real partner for any user
function resolveCoupleAndPartner(user: UserDoc): { couple: CoupleDoc; partner: UserDoc | null } {
  let couple: CoupleDoc | undefined;
  if (user.coupleId) {
    couple = couples.get(user.coupleId);
  }

  // Check if member in any existing space
  if (!couple) {
    couple = Array.from(couples.values()).find((c) => c.members.includes(user.uid));
  }

  // If still no space, create an isolated private couple space for this user
  if (!couple) {
    const coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const joinToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    couple = {
      id: coupleId,
      members: [user.uid],
      joinToken,
      createdAt: Date.now(),
      anniversaryDate: new Date().toISOString().split('T')[0],
      loveStreak: {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        userAInteractedToday: true,
        userBInteractedToday: false,
        lastInteractions: { [user.uid]: new Date().toISOString().split('T')[0] },
      },
    };
    couples.set(coupleId, couple);
    couplesByToken.set(joinToken, coupleId);
    messages.set(coupleId, []);
    presence.set(coupleId, new Map());
  }

  user.coupleId = couple.id;

  let partner: UserDoc | null = null;
  const partnerId = couple.members.find((m) => m !== user.uid);
  if (partnerId) {
    const foundPartner = users.get(partnerId);
    if (foundPartner && foundPartner.uid !== user.uid && foundPartner.email.toLowerCase() !== user.email.toLowerCase()) {
      partner = foundPartner;
    }
  }

  return { couple, partner };
}

// SSE Client listeners: coupleId -> Set of express res objects
const sseClients = new Map<string, Set<express.Response>>();
const globalSseClients = new Set<express.Response>();

function broadcastToCouple(coupleId: string, event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const clients = sseClients.get(coupleId);
  if (clients) {
    clients.forEach((res) => {
      try {
        res.write(payload);
      } catch (e) {}
    });
  }
}

// ---------------- API ROUTES ----------------

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Create or update user profile
app.post('/api/users/sync', (req, res) => {
  const { uid, displayName, email, photoUrl } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required' });

  const cleanEmail = (email || `${uid}@example.com`).trim().toLowerCase();
  const user = ensureUserUpdated(uid, cleanEmail, displayName, photoUrl);

  res.json({ user });
});

// Create a Couple Space
app.post('/api/couples/create', (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required' });

  // Generate unique joinToken
  const joinToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const couple: CoupleDoc = {
    id: coupleId,
    members: [uid],
    joinToken,
    createdAt: Date.now(),
    anniversaryDate: new Date().toISOString().split('T')[0],
  };

  couples.set(coupleId, couple);
  couplesByToken.set(joinToken, coupleId);
  messages.set(coupleId, []);
  presence.set(coupleId, new Map());

  // Update user's coupleId
  const user = users.get(uid);
  if (user) {
    user.coupleId = coupleId;
  }

  res.json({ couple });
});

// Join Couple Space via Token
app.post('/api/couples/join', (req, res) => {
  const { uid, joinToken } = req.body;
  if (!uid || !joinToken) return res.status(400).json({ error: 'uid and joinToken required' });

  const coupleId = couplesByToken.get(joinToken);
  if (!coupleId) {
    return res.status(404).json({ error: 'Invalid or expired join link' });
  }

  const couple = couples.get(coupleId);
  if (!couple) {
    return res.status(404).json({ error: 'Couple space not found' });
  }

  if (!couple.members.includes(uid)) {
    if (couple.members.length >= 2) {
      return res.status(400).json({ error: 'This couple space already has 2 members' });
    }
    couple.members.push(uid);
  }

  // Update user's coupleId
  const user = users.get(uid);
  if (user) {
    user.coupleId = coupleId;
  }

  // Notify members via SSE
  broadcastToCouple(coupleId, 'couple_updated', { couple });

  res.json({ couple });
});

// Real Auth Register API
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName, photoUrl } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (usersByEmail.has(cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const user: UserDoc = {
    uid,
    displayName: displayName?.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    password,
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    statusMessage: 'In love 💕',
  };

  users.set(uid, user);
  usersByEmail.set(cleanEmail, user);

  // Resolve or pair couple space
  const { couple, partner } = resolveCoupleAndPartner(user);

  res.json({
    message: 'Account registered successfully',
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      statusMessage: user.statusMessage,
    },
    couple,
    partner,
  });
});

// Real Auth Login API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = usersByEmail.get(cleanEmail);

  if (!user) {
    return res.status(404).json({ error: 'No account found with this email. Please register a new account.' });
  }

  if (user.password && user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  // Resolve couple space & partner
  const { couple, partner } = resolveCoupleAndPartner(user);

  res.json({
    message: 'Signed in successfully',
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      statusMessage: user.statusMessage,
    },
    couple,
    partner,
  });
});

// Real Auth Google API
app.post('/api/auth/google', (req, res) => {
  const { email, displayName, photoUrl, uid: customUid } = req.body;
  const cleanEmail = (email || 'google_user@gmail.com').trim().toLowerCase();
  const uid = customUid || `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const user = ensureUserUpdated(uid, cleanEmail, displayName, photoUrl);
  const { couple, partner } = resolveCoupleAndPartner(user);

  res.json({
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      statusMessage: user.statusMessage,
    },
    couple,
    partner,
  });
});

// Legacy User Sync
app.post('/api/users/login', (req, res) => {
  const { uid, displayName, email, photoUrl, statusMessage } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required' });

  const cleanEmail = (email || `${uid}@duolove.app`).trim().toLowerCase();
  const user = ensureUserUpdated(uid, cleanEmail, displayName, photoUrl);
  if (statusMessage) user.statusMessage = statusMessage;

  res.json({ user });
});

// Get list of available users to connect with
app.get('/api/users/available', (req, res) => {
  const { currentUid } = req.query;
  const list = Array.from(users.values()).filter((u) => u.uid !== currentUid);
  res.json({ users: list });
});

// Direct 1-Click Connect two users into a couple space
app.post('/api/couples/direct-connect', (req, res) => {
  const { userA, userB } = req.body;
  if (!userA || !userB) return res.status(400).json({ error: 'userA and userB required' });

  let couple = Array.from(couples.values()).find(
    (c) => c.members.includes(userA) && c.members.includes(userB)
  );

  if (!couple) {
    const coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    couple = {
      id: coupleId,
      members: [userA, userB],
      joinToken: `direct_${Date.now()}`,
      createdAt: Date.now(),
      anniversaryDate: new Date().toISOString().split('T')[0],
      loveStreak: {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        userAInteractedToday: true,
        userBInteractedToday: true,
        lastInteractions: { [userA]: new Date().toISOString().split('T')[0], [userB]: new Date().toISOString().split('T')[0] },
      },
    };
    couples.set(coupleId, couple);
    messages.set(coupleId, []);
    presence.set(coupleId, new Map());
  } else {
    if (!couple.members.includes(userA)) couple.members.push(userA);
    if (!couple.members.includes(userB)) couple.members.push(userB);
  }

  const uA = users.get(userA as string);
  if (uA) uA.coupleId = couple.id;

  const uB = users.get(userB as string);
  if (uB) uB.coupleId = couple.id;

  broadcastToCouple(couple.id, 'couple_updated', { couple });

  const partnerDoc = uB || null;
  res.json({ couple, partner: partnerDoc });
});

// Connect by partner email (e.g. moiz88053@gmail.com)
app.post('/api/couples/connect-by-email', (req, res) => {
  const { currentUid, partnerEmail } = req.body;
  if (!currentUid || !partnerEmail) {
    return res.status(400).json({ error: 'currentUid and partnerEmail are required' });
  }

  const cleanEmail = partnerEmail.trim().toLowerCase();
  let partnerUser = usersByEmail.get(cleanEmail);

  // If partner hasn't logged in yet, create a registered profile placeholder
  if (!partnerUser) {
    const pUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    partnerUser = {
      uid: pUid,
      displayName: cleanEmail.split('@')[0],
      email: cleanEmail,
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      createdAt: Date.now(),
      statusMessage: 'Waiting for starlight 💕',
    };
    users.set(pUid, partnerUser);
    usersByEmail.set(cleanEmail, partnerUser);
  }

  // Find or create couple space for currentUid and partnerUser.uid
  let couple = Array.from(couples.values()).find(
    (c) => c.members.includes(currentUid) && c.members.includes(partnerUser!.uid)
  );

  if (!couple) {
    const coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    couple = {
      id: coupleId,
      members: [currentUid, partnerUser.uid],
      joinToken: `invite_${Date.now()}`,
      createdAt: Date.now(),
      anniversaryDate: new Date().toISOString().split('T')[0],
      loveStreak: {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        userAInteractedToday: true,
        userBInteractedToday: true,
        lastInteractions: { [currentUid]: new Date().toISOString().split('T')[0], [partnerUser.uid]: new Date().toISOString().split('T')[0] },
      },
    };
    couples.set(coupleId, couple);
    messages.set(coupleId, []);
    presence.set(coupleId, new Map());
  }

  const currUser = users.get(currentUid);
  if (currUser) currUser.coupleId = couple.id;
  partnerUser.coupleId = couple.id;

  broadcastToCouple(couple.id, 'couple_updated', { couple });

  res.json({
    couple,
    partner: partnerUser,
  });
});

// Get Couple Info & Members
app.get('/api/couples/:coupleId', (req, res) => {
  const { coupleId } = req.params;
  const couple = couples.get(coupleId);
  if (!couple) return res.status(404).json({ error: 'Couple not found' });

  const memberDocs = couple.members.map((mId) => users.get(mId)).filter(Boolean);
  res.json({ couple, members: memberDocs });
});

// Update Anniversary Date
app.post('/api/couples/:coupleId/anniversary', (req, res) => {
  const { coupleId } = req.params;
  const { date } = req.body;
  const couple = couples.get(coupleId);
  if (!couple) return res.status(404).json({ error: 'Couple not found' });

  couple.anniversaryDate = date;
  broadcastToCouple(coupleId, 'couple_updated', { couple });
  res.json({ couple });
});

// Daily Love Streak Check-in / Interaction
app.post('/api/couples/:coupleId/streak/interact', (req, res) => {
  const { coupleId } = req.params;
  const { uid } = req.body;

  const couple = couples.get(coupleId);
  if (!couple) return res.status(404).json({ error: 'Couple not found' });

  const streak = registerStreakInteraction(couple, uid);
  broadcastToCouple(coupleId, 'couple_updated', { couple });

  res.json({ streak, couple });
});

// Get Messages
app.get('/api/couples/:coupleId/messages', (req, res) => {
  const { coupleId } = req.params;
  const msgList = messages.get(coupleId) || [];
  res.json({ messages: msgList });
});

// Post Message
app.post('/api/couples/:coupleId/messages', (req, res) => {
  const { coupleId } = req.params;
  const { id, senderId, type, text, imageUrl, thumbnailUrl, audioUrl, audioDuration, reactions, readBy, createdAt } = req.body;

  if (!senderId) return res.status(400).json({ error: 'senderId required' });

  const msgId = id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const list = messages.get(coupleId) || [];

  const existingIndex = list.findIndex((m) => m.id === msgId);
  let newMsg: MessageDoc;

  if (existingIndex >= 0) {
    newMsg = {
      ...list[existingIndex],
      text: text !== undefined ? text : list[existingIndex].text,
      type: type || list[existingIndex].type,
      imageUrl: imageUrl !== undefined ? imageUrl : list[existingIndex].imageUrl,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : list[existingIndex].thumbnailUrl,
      audioUrl: audioUrl !== undefined ? audioUrl : list[existingIndex].audioUrl,
      audioDuration: audioDuration !== undefined ? audioDuration : list[existingIndex].audioDuration,
      reactions: reactions || list[existingIndex].reactions || {},
      readBy: readBy || list[existingIndex].readBy || [senderId],
    };
    list[existingIndex] = newMsg;
  } else {
    newMsg = {
      id: msgId,
      senderId,
      type: type || 'text',
      text: text || '',
      imageUrl,
      thumbnailUrl: thumbnailUrl || imageUrl,
      audioUrl,
      audioDuration,
      reactions: reactions || {},
      readBy: readBy || [senderId],
      createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
    };
    list.push(newMsg);
  }

  messages.set(coupleId, list);

  const couple = couples.get(coupleId);
  if (couple) {
    registerStreakInteraction(couple, senderId);
    broadcastToCouple(coupleId, 'couple_updated', { couple });
  }

  // Broadcast to all active tabs & listeners
  broadcastToCouple(coupleId, 'new_message', { message: newMsg });

  res.json({ message: newMsg });
});

// Mark messages read
app.post('/api/couples/:coupleId/messages/read', (req, res) => {
  const { coupleId } = req.params;
  const { uid } = req.body;
  const list = messages.get(coupleId) || [];

  let updated = false;
  list.forEach((msg) => {
    if (!msg.readBy.includes(uid)) {
      msg.readBy.push(uid);
      updated = true;
    }
  });

  if (updated) {
    broadcastToCouple(coupleId, 'messages_read', { readByUid: uid });
  }

  res.json({ success: true });
});

// React to message
app.post('/api/couples/:coupleId/messages/:messageId/react', (req, res) => {
  const { coupleId, messageId } = req.params;
  const { uid, emoji, reactions } = req.body;

  let list = messages.get(coupleId);
  if (!list) {
    list = [];
    messages.set(coupleId, list);
  }
  let msg = list.find((m) => m.id === messageId);
  if (!msg) {
    msg = {
      id: messageId,
      senderId: uid || 'unknown',
      type: 'text',
      text: '',
      reactions: {},
      readBy: [],
      createdAt: Date.now(),
    };
    list.push(msg);
  }

  if (reactions && typeof reactions === 'object') {
    msg.reactions = { ...reactions };
  } else if (uid) {
    if (!msg.reactions) msg.reactions = {};
    if (emoji) {
      msg.reactions[uid] = emoji;
    } else {
      delete msg.reactions[uid];
    }
  }

  broadcastToCouple(coupleId, 'message_reaction', {
    messageId,
    reactions: msg.reactions,
    uid,
    emoji: emoji || (uid ? msg.reactions[uid] || null : null),
  });

  res.json({ message: msg });
});

// Delete message
app.delete('/api/couples/:coupleId/messages/:messageId', (req, res) => {
  const { coupleId, messageId } = req.params;

  const list = messages.get(coupleId);
  if (list) {
    const nextList = list.filter((m) => m.id !== messageId);
    messages.set(coupleId, nextList);
  }

  broadcastToCouple(coupleId, 'message_deleted', { messageId });

  res.json({ success: true, messageId });
});

// Update presence
app.post('/api/couples/:coupleId/presence', (req, res) => {
  const { coupleId } = req.params;
  const { uid, online, typing } = req.body;

  let couplePresence = presence.get(coupleId);
  if (!couplePresence) {
    couplePresence = new Map();
    presence.set(coupleId, couplePresence);
  }

  const pDoc: PresenceDoc = {
    uid,
    online: online ?? true,
    typing: typing ?? false,
    lastActive: Date.now(),
  };

  couplePresence.set(uid, pDoc);

  const presenceObj: Record<string, PresenceDoc> = {};
  couplePresence.forEach((val, key) => {
    presenceObj[key] = val;
  });

  broadcastToCouple(coupleId, 'presence_updated', { presence: presenceObj });

  res.json({ presence: presenceObj });
});

// Call signaling
app.post('/api/couples/:coupleId/call', (req, res) => {
  const { coupleId } = req.params;
  const { action, callerId, receiverId, callType, sdpOffer, sdpAnswer, iceCandidate } = req.body;

  let currentCall = activeCalls.get(coupleId);

  if (action === 'offer') {
    currentCall = {
      id: `call_${Date.now()}`,
      callerId,
      receiverId,
      type: callType || 'video',
      status: 'offered',
      sdpOffer,
      iceCandidates: [],
      timestamp: Date.now(),
    };
    activeCalls.set(coupleId, currentCall);
    broadcastToCouple(coupleId, 'call_signal', { action: 'offer', call: currentCall });
  } else if (action === 'accept' && currentCall) {
    currentCall.status = 'accepted';
    if (sdpAnswer) currentCall.sdpAnswer = sdpAnswer;
    broadcastToCouple(coupleId, 'call_signal', { action: 'accept', call: currentCall });
  } else if (action === 'decline' && currentCall) {
    currentCall.status = 'declined';
    broadcastToCouple(coupleId, 'call_signal', { action: 'decline', call: currentCall });
    activeCalls.delete(coupleId);
  } else if (action === 'end' && currentCall) {
    currentCall.status = 'ended';
    broadcastToCouple(coupleId, 'call_signal', { action: 'end', call: currentCall });
    activeCalls.delete(coupleId);
  } else if (action === 'ice' && currentCall && iceCandidate) {
    if (!currentCall.iceCandidates) currentCall.iceCandidates = [];
    currentCall.iceCandidates.push(iceCandidate);
    broadcastToCouple(coupleId, 'call_signal', { action: 'ice', candidate: iceCandidate });
  }

  res.json({ call: currentCall || null });
});

// SSE Live Stream Endpoint
app.get('/api/couples/:coupleId/stream', (req, res) => {
  const { coupleId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(coupleId)) {
    sseClients.set(coupleId, new Set());
  }
  sseClients.get(coupleId)!.add(res);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);

  req.on('close', () => {
    const clients = sseClients.get(coupleId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(coupleId);
      }
    }
  });
});

// Global Live Stream Endpoint (Cross-tab & cross-user real-time stream)
app.get('/api/stream/global', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  globalSseClients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ time: Date.now(), type: 'global' })}\n\n`);

  req.on('close', () => {
    globalSseClients.delete(res);
  });
});

// User State Endpoint: returns latest user, active couple, partner and messages
app.get('/api/users/:uid/state', (req, res) => {
  const { uid } = req.params;
  const user = users.get(uid);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { couple, partner } = resolveCoupleAndPartner(user);
  const msgList = couple ? (messages.get(couple.id) || []) : [];

  res.json({
    user,
    couple,
    partner,
    messages: msgList,
  });
});

// Image Upload Endpoint (base64 or binary data)
app.post('/api/upload', (req, res) => {
  const { imageBase64, fileName } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 required' });
  }
  // Return the base64 URL directly or store in memory
  res.json({ url: imageBase64 });
});

// Update User Profile (displayName, photoUrl, statusMessage)
app.post('/api/users/:uid/update', (req, res) => {
  const { uid } = req.params;
  const { displayName, photoUrl, statusMessage, moodIcon } = req.body;

  const user = users.get(uid);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (displayName) user.displayName = displayName;
  if (photoUrl) user.photoUrl = photoUrl;
  if (statusMessage !== undefined) user.statusMessage = statusMessage;
  if (moodIcon !== undefined) user.moodIcon = moodIcon;

  if (user.coupleId) {
    broadcastToCouple(user.coupleId, 'user_updated', { user });
  }

  res.json({ user });
});

// Send Love Nudge (I miss you, Kiss, Hug, Thinking of you)
app.post('/api/couples/:coupleId/nudge', (req, res) => {
  const { coupleId } = req.params;
  const { senderId, nudgeType, emoji, message } = req.body;

  const nudgeMsg: MessageDoc = {
    id: `nudge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId,
    type: 'text',
    text: `${emoji || '💖'} ${message || 'sent you a love nudge!'}`,
    reactions: {},
    readBy: [senderId],
    createdAt: Date.now(),
  };

  const list = messages.get(coupleId) || [];
  list.push(nudgeMsg);
  messages.set(coupleId, list);

  const couple = couples.get(coupleId);
  if (couple) {
    registerStreakInteraction(couple, senderId);
    broadcastToCouple(coupleId, 'couple_updated', { couple });
  }

  broadcastToCouple(coupleId, 'new_message', { message: nudgeMsg });
  broadcastToCouple(coupleId, 'love_nudge', { senderId, nudgeType, emoji, message });

  res.json({ success: true, message: nudgeMsg });
});

// Disconnect Couple Space
app.post('/api/couples/:coupleId/disconnect', (req, res) => {
  const { coupleId } = req.params;
  const { uid } = req.body;

  const couple = couples.get(coupleId);
  if (couple) {
    couple.members = couple.members.filter((m) => m !== uid);
  }

  const user = users.get(uid);
  if (user) {
    delete user.coupleId;
  }

  if (couple) {
    broadcastToCouple(coupleId, 'couple_updated', { couple });
  }

  res.json({ success: true });
});

// ---------------- VITE & STATIC FILES ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DuoLove server running on http://localhost:${PORT}`);
  });
}

// Start standalone server only if not in serverless environment (Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
