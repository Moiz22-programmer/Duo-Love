import { useState, useEffect, useCallback, useRef } from 'react';
import { User, CoupleSpace, Message, Presence, CallSignal } from '../types';
import { sounds } from './audio';
import { callEngine } from './webrtc';
import { 
  auth, 
  db,
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  onAuthStateChanged, 
  signInWithGoogleReal, 
  firebaseSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from './firebase';

const BROADCAST_KEY = 'duolove_realtime_broadcast';
const STORAGE_PREFIX = 'duolove_app_state_';

// Message deduplication and synchronization helper
function deduplicateMessages(list: Message[]): Message[] {
  const byId = new Map<string, Message>();
  list.forEach((m) => {
    if (!m || !m.id) return;
    if (byId.has(m.id)) {
      const existing = byId.get(m.id)!;
      byId.set(m.id, {
        ...existing,
        reactions: { ...(existing.reactions || {}), ...(m.reactions || {}) },
        readBy: Array.from(new Set([...(existing.readBy || []), ...(m.readBy || [])])),
      });
    } else {
      byId.set(m.id, {
        ...m,
        reactions: { ...(m.reactions || {}) },
        readBy: Array.from(new Set(m.readBy || [])),
      });
    }
  });

  const sorted = Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt);
  const result: Message[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    // Check if an identical message exists within 3 seconds
    const isDupe = result.some((prev) => {
      const isSameSender = prev.senderId === current.senderId;
      const isSameType = prev.type === current.type;
      const isSameText = (prev.text || '').trim() === (current.text || '').trim();
      const isSameMedia = prev.imageUrl === current.imageUrl && prev.audioUrl === current.audioUrl;
      const isTimeClose = Math.abs(prev.createdAt - current.createdAt) < 3000;
      if (isSameSender && isSameType && isSameText && isSameMedia && isTimeClose) {
        // Merge reactions & readBy
        prev.reactions = { ...(prev.reactions || {}), ...(current.reactions || {}) };
        prev.readBy = Array.from(new Set([...(prev.readBy || []), ...(current.readBy || [])]));
        return true;
      }
      return false;
    });

    if (!isDupe) {
      result.push(current);
    }
  }

  return result;
}

export function useDuoLoveStore() {
  // Tab-isolated session storage: Each browser tab maintains its own active user and space
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const sessionSaved = sessionStorage.getItem('duolove_current_user');
      if (sessionSaved) return JSON.parse(sessionSaved);
      return null;
    } catch {
      return null;
    }
  });

  const [coupleSpace, setCoupleSpace] = useState<CoupleSpace | null>(() => {
    try {
      const sessionSaved = sessionStorage.getItem('duolove_couple_space');
      if (sessionSaved) return JSON.parse(sessionSaved);
      return null;
    } catch {
      return null;
    }
  });

  const [partner, setPartner] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Fetch registered users on DuoLove
  const fetchAvailableUsers = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { getDocs, query, collection } = await import('firebase/firestore');
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      
      const list = snap.docs.map(doc => doc.data() as User).filter(u => u.uid !== currentUser.uid);
      setAvailableUsers(list);
    } catch (e) {
      console.warn("Failed to fetch available users:", e);
    }
  }, [currentUser]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, Presence>>({});
  const [activeCall, setActiveCall] = useState<CallSignal | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSignal | null>(null);

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const typingTimerRef = useRef<any>(null);

  // Parse join token from URL search query (?join=XYZ)
  const getJoinTokenFromURL = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('join');
  }, []);

  // Sync user profile to backend & tab-scoped sessionStorage
  const saveUser = useCallback((user: User | null) => {
    setCurrentUser(user);
    if (user) {
      sessionStorage.setItem('duolove_current_user', JSON.stringify(user));
      setDoc(doc(db, 'users', user.uid), user, { merge: true }).catch(e => console.warn("Firestore user sync:", e));
    } else {
      sessionStorage.removeItem('duolove_current_user');
    }
  }, []);

  // Sync Couple space to tab-scoped sessionStorage
  const saveCoupleSpace = useCallback((space: CoupleSpace | null) => {
    setCoupleSpace(space);
    if (space) {
      sessionStorage.setItem('duolove_couple_space', JSON.stringify(space));
    } else {
      sessionStorage.removeItem('duolove_couple_space');
    }
  }, []);

  // Fetch couple info & partner profile
  const refreshCoupleInfo = useCallback(async (cId: string) => {
    try {
      const { getDoc } = await import('firebase/firestore');
      const coupleSnap = await getDoc(doc(db, 'couples', cId));
      if (coupleSnap.exists()) {
        const coupleData = coupleSnap.data() as CoupleSpace;
        saveCoupleSpace(coupleData);
        if (currentUser) {
           const partnerId = coupleData.members.find(id => id !== currentUser.uid);
           if (partnerId) {
             const partnerSnap = await getDoc(doc(db, 'users', partnerId));
             if (partnerSnap.exists()) setPartner(partnerSnap.data() as User);
           }
        }
      }
    } catch (e) {
      console.warn("Failed to refresh couple info from Firestore:", e);
    }
  }, [currentUser, saveCoupleSpace]);

  // 1-Click Direct Connect with a discovered user
  const directConnectUsers = useCallback(async (targetUid: string) => {
    if (!currentUser) return false;
    try {
      const { getDoc } = await import('firebase/firestore');
      
      const [userSnap, targetSnap] = await Promise.all([
        getDoc(doc(db, 'users', currentUser.uid)),
        getDoc(doc(db, 'users', targetUid))
      ]);
      
      if (!userSnap.exists() || !targetSnap.exists()) return false;
      const targetUser = targetSnap.data() as User;
      
      let coupleId = targetUser.coupleId || userSnap.data().coupleId;
      let coupleSpaceData: CoupleSpace;
      
      if (coupleId) {
        const coupleSnap = await getDoc(doc(db, 'couples', coupleId));
        coupleSpaceData = coupleSnap.data() as CoupleSpace;
        if (!coupleSpaceData.members.includes(currentUser.uid)) {
          coupleSpaceData.members.push(currentUser.uid);
          await updateDoc(doc(db, 'couples', coupleId), { members: coupleSpaceData.members });
        }
      } else {
        coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        coupleSpaceData = {
          id: coupleId,
          members: [currentUser.uid, targetUid],
          joinToken: Math.random().toString(36).substring(2, 10),
          createdAt: Date.now(),
          anniversaryDate: new Date().toISOString().split('T')[0]
        };
        await setDoc(doc(db, 'couples', coupleId), coupleSpaceData);
      }
      
      const updatedUser = { ...currentUser, coupleId };
      await updateDoc(doc(db, 'users', currentUser.uid), { coupleId });
      await updateDoc(doc(db, 'users', targetUid), { coupleId });
      
      saveUser(updatedUser);
      saveCoupleSpace(coupleSpaceData);
      setPartner(targetUser);
      return true;
    } catch (e) {
      console.error("Direct connect failed:", e);
    }
    return false;
  }, [currentUser, saveUser, saveCoupleSpace]);

  // Connect directly with a partner by Email (e.g. moiz88053@gmail.com)
  const connectPartnerByEmail = useCallback(async (partnerEmail: string) => {
    if (!currentUser || !partnerEmail) return false;
    try {
      const { getDocs, query, where, collection, getDoc } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('email', '==', partnerEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) return false;
      
      const targetUser = snap.docs[0].data() as User;
      const targetUid = targetUser.uid;
      
      let coupleId = targetUser.coupleId || currentUser.coupleId;
      let coupleSpaceData: CoupleSpace;
      
      if (coupleId) {
        const coupleSnap = await getDoc(doc(db, 'couples', coupleId));
        coupleSpaceData = coupleSnap.data() as CoupleSpace;
        if (!coupleSpaceData.members.includes(currentUser.uid)) {
          coupleSpaceData.members.push(currentUser.uid);
          await updateDoc(doc(db, 'couples', coupleId), { members: coupleSpaceData.members });
        }
      } else {
        coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        coupleSpaceData = {
          id: coupleId,
          members: [currentUser.uid, targetUid],
          joinToken: Math.random().toString(36).substring(2, 10),
          createdAt: Date.now(),
          anniversaryDate: new Date().toISOString().split('T')[0]
        };
        await setDoc(doc(db, 'couples', coupleId), coupleSpaceData);
      }
      
      const updatedUser = { ...currentUser, coupleId };
      await updateDoc(doc(db, 'users', currentUser.uid), { coupleId });
      await updateDoc(doc(db, 'users', targetUid), { coupleId });
      
      saveUser(updatedUser);
      saveCoupleSpace(coupleSpaceData);
      setPartner(targetUser);
      return true;
    } catch (e) {
      console.error("Connect by email failed:", e);
    }
    return false;
  }, [currentUser, saveUser, saveCoupleSpace]);

  // Fetch messages from Firestore & backend API with intelligent merge
  const fetchMessages = useCallback(async (cId: string) => {
    const msgMap = new Map<string, Message>();

    // 1. Fetch from Firestore
    try {
      const messagesRef = collection(db, 'couples', cId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          msgMap.set(docSnap.id, {
            id: docSnap.id,
            senderId: data.senderId,
            type: data.type || 'text',
            text: data.text || '',
            imageUrl: data.imageUrl,
            thumbnailUrl: data.thumbnailUrl,
            audioUrl: data.audioUrl,
            audioDuration: data.audioDuration,
            reactions: data.reactions || {},
            readBy: data.readBy || [],
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          } as Message);
        });
      }
    } catch (err) {
      console.warn("Firestore fetch messages notice:", err);
    }

    // 2. Fetch from Backend API
    try {
      const res = await fetch(`/api/couples/${cId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          data.messages.forEach((m: Message) => {
            if (msgMap.has(m.id)) {
              const existing = msgMap.get(m.id)!;
              msgMap.set(m.id, {
                ...existing,
                ...m,
                reactions: { ...(existing.reactions || {}), ...(m.reactions || {}) },
                readBy: Array.from(new Set([...(existing.readBy || []), ...(m.readBy || [])])),
              });
            } else {
              msgMap.set(m.id, m);
            }
          });
        }
      }
    } catch (err) {
      console.warn("Error fetching API messages:", err);
    }

    const merged = deduplicateMessages(Array.from(msgMap.values()));
    if (merged.length > 0) {
      setMessages((prev) => {
        // Keep any recent optimistic messages that haven't synced yet
        const existingIds = new Set(merged.map((m) => m.id));
        const pending = prev.filter((m) => !existingIds.has(m.id) && Date.now() - m.createdAt < 30000);
        const result = deduplicateMessages([...merged, ...pending]);
        
        // Fast equality check to avoid triggering unnecessary component re-renders
        if (
          prev.length === result.length &&
          prev.every((msg, i) => {
            const r = result[i];
            return (
              r &&
              msg.id === r.id &&
              msg.text === r.text &&
              msg.type === r.type &&
              (msg.readBy?.length || 0) === (r.readBy?.length || 0) &&
              Object.keys(msg.reactions || {}).length === Object.keys(r.reactions || {}).length
            );
          })
        ) {
          return prev;
        }

        return result;
      });
    }
  }, []);

  const loginWithGoogle = useCallback(async (selectedUser?: User) => {
    if (selectedUser) {
      // Mock login using pre-selected user
      saveUser(selectedUser);
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', selectedUser.uid), selectedUser, { merge: true });
      } catch (e) {
        console.warn("Backend Firebase user auth sync failed:", e);
      }
      return { user: selectedUser };
    }
    
    // Actual Google Auth login
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      
      const { getDoc, setDoc, doc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userCred.user.uid);
      const userSnap = await getDoc(userRef);
      
      let userData: User;
      if (userSnap.exists()) {
         userData = userSnap.data() as User;
      } else {
         userData = {
           uid: userCred.user.uid,
           email: userCred.user.email || '',
           displayName: userCred.user.displayName || 'Space Explorer',
           photoUrl: userCred.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
           createdAt: Date.now(),
         };
         await setDoc(userRef, userData);
      }
      saveUser(userData);
      
      let coupleData: CoupleSpace | null = null;
      let partnerData: User | null = null;
      
      if (userData.coupleId) {
        const coupleSnap = await getDoc(doc(db, 'couples', userData.coupleId));
        if (coupleSnap.exists()) {
          coupleData = coupleSnap.data() as CoupleSpace;
          saveCoupleSpace(coupleData);
          
          const partnerId = coupleData.members.find(id => id !== userData!.uid);
          if (partnerId) {
            const partnerSnap = await getDoc(doc(db, 'users', partnerId));
            if (partnerSnap.exists()) partnerData = partnerSnap.data() as User;
          }
        }
      }
      
      return { user: userData, couple: coupleData, partner: partnerData };
    } catch (err: any) {
      console.error("Firebase Google login failed:", err?.message || err);
      throw err;
    }
  }, [saveUser, saveCoupleSpace]);

  // Real-time Firestore message collection listener (couples/{coupleId}/messages)
  useEffect(() => {
    if (!coupleSpace?.id) {
      return;
    }

    const messagesCollection = collection(db, 'couples', coupleSpace.id, 'messages');
    const q = query(messagesCollection, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched: Message[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              senderId: data.senderId,
              type: data.type || 'text',
              text: data.text || '',
              imageUrl: data.imageUrl,
              thumbnailUrl: data.thumbnailUrl,
              audioUrl: data.audioUrl,
              reactions: data.reactions || {},
              readBy: data.readBy || [],
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            } as Message;
          });
          fetched.sort((a, b) => a.createdAt - b.createdAt);
          setMessages(fetched);
        } else {
          fetchMessages(coupleSpace.id);
        }
      },
      (error) => {
        console.warn("Firestore message collection listener notice:", error);
        fetchMessages(coupleSpace.id);
      }
    );

    return () => unsubscribe();
  }, [coupleSpace?.id, fetchMessages]);

  // Register new account with email & password
  const registerUser = useCallback(async (email: string, pass: string, name: string, photo?: string) => {
    let finalUser: User;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name, photoURL: photo });
      
      finalUser = {
        uid: user.uid,
        email: user.email || email,
        displayName: name,
        photoUrl: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        createdAt: Date.now(),
      };
    } catch (fbErr: any) {
      console.warn("Firebase Auth registration failed (fallback active):", fbErr?.message || fbErr);
      // Fallback: Create mock user in Firestore directly
      const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      finalUser = {
        uid,
        email: email.trim().toLowerCase(),
        password: pass, // Store password for fallback login
        displayName: name,
        photoUrl: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        createdAt: Date.now(),
      };
    }
    
    // Always save to Firestore
    const { getDoc, setDoc, doc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', finalUser.uid), finalUser);
    saveUser(finalUser);
    return { user: finalUser };
  }, [saveUser]);

  // Login with existing account email & password
  const loginWithCredentials = useCallback(async (email: string, pass: string) => {
    let uid: string | null = null;
    let fallbackEmail = email.trim().toLowerCase();
    
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      uid = userCred.user.uid;
    } catch (err: any) {
      console.warn("Firebase Auth login failed (fallback active):", err?.message);
    }
    
    const { getDocs, getDoc, setDoc, doc, collection, query, where } = await import('firebase/firestore');
    let userData: User | null = null;
    
    // If Firebase Auth succeeded, load by UID
    if (uid) {
       const userSnap = await getDoc(doc(db, 'users', uid));
       if (userSnap.exists()) userData = userSnap.data() as User;
    } else {
       // Fallback: search by email
       const q = query(collection(db, 'users'), where('email', '==', fallbackEmail));
       const snap = await getDocs(q);
       if (!snap.empty) {
         const docData = snap.docs[0].data() as User;
         // In a real app we'd hash, but this is a fallback
         if (docData.password === pass || !docData.password) {
           userData = docData;
           uid = docData.uid;
         } else {
           throw new Error("Invalid password.");
         }
       } else {
        
         // Auto-register on login failure (Hybrid Auth Fallback)
         uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
         
         const isMoiz1 = fallbackEmail === 'moiz77053@gmail.com';
         const isMoiz2 = fallbackEmail === 'moiz88053@gmail.com';
         if (isMoiz1 || isMoiz2) uid = fallbackEmail.includes('770') ? 'usr_moiz' : 'usr_moiz_alt';

         const name = isMoiz1 || isMoiz2 ? 'Abdul Moiz' : fallbackEmail.split('@')[0].charAt(0).toUpperCase() + fallbackEmail.split('@')[0].slice(1);
         
         userData = {
           uid,
           email: fallbackEmail,
           password: pass,
           displayName: name,
           photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
           createdAt: Date.now(),
         };
         await setDoc(doc(db, 'users', uid), userData);
       }
    }
    
    if (!userData) throw new Error("Authentication failed");
    
    saveUser(userData);
    let coupleData: CoupleSpace | null = null;
    let partnerData: User | null = null;
    
    if (userData.coupleId) {
      const coupleSnap = await getDoc(doc(db, 'couples', userData.coupleId));
      if (coupleSnap.exists()) {
        coupleData = coupleSnap.data() as CoupleSpace;
        saveCoupleSpace(coupleData);
        
        const partnerId = coupleData.members.find(id => id !== userData!.uid);
        if (partnerId) {
          const partnerSnap = await getDoc(doc(db, 'users', partnerId));
          if (partnerSnap.exists()) partnerData = partnerSnap.data() as User;
        }
      }
    }
    
    return { user: userData, couple: coupleData, partner: partnerData };
  }, [saveUser, saveCoupleSpace]);

  // Sign in with Google Account helper
  const signInWithGoogleAccount = useCallback(async (selectedUser?: User) => {
    return loginWithGoogle(selectedUser);
  }, [loginWithGoogle]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut();
    } catch (e) {
      console.warn("Sign out notice:", e);
    }
    saveUser(null);
    saveCoupleSpace(null);
    setPartner(null);
    setMessages([]);
    sessionStorage.removeItem('duolove_current_user');
    sessionStorage.removeItem('duolove_couple_space');
  }, [saveUser, saveCoupleSpace]);

  // Create Couple Space
  const createCoupleSpace = useCallback(async () => {
    if (!currentUser) return null;
    try {
      const coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const joinToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      
      const newCouple: CoupleSpace = {
        id: coupleId,
        members: [currentUser.uid],
        joinToken,
        createdAt: Date.now(),
        anniversaryDate: new Date().toISOString().split('T')[0]
      };
      
      await setDoc(doc(db, 'couples', coupleId), newCouple);
      
      const updatedUser = { ...currentUser, coupleId };
      await updateDoc(doc(db, 'users', currentUser.uid), { coupleId });
      
      saveUser(updatedUser);
      saveCoupleSpace(newCouple);
      return newCouple;
    } catch (e) {
      console.error("Failed to create couple space:", e);
    }
    return null;
  }, [currentUser, saveUser, saveCoupleSpace]);

  // Join Couple Space by token
  const joinCoupleSpaceByToken = useCallback(async (token: string) => {
    if (!currentUser) return false;
    try {
      const { getDocs, query, where, collection, getDoc } = await import('firebase/firestore');
      const q = query(collection(db, 'couples'), where('joinToken', '==', token));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const coupleDoc = snap.docs[0];
        const coupleData = coupleDoc.data() as CoupleSpace;
        
        if (!coupleData.members.includes(currentUser.uid)) {
          coupleData.members.push(currentUser.uid);
          await updateDoc(doc(db, 'couples', coupleData.id), { members: coupleData.members });
        }
        
        const updatedUser = { ...currentUser, coupleId: coupleData.id };
        await updateDoc(doc(db, 'users', currentUser.uid), { coupleId: coupleData.id });
        
        saveUser(updatedUser);
        saveCoupleSpace(coupleData);
        fetchMessages(coupleData.id);
        
        const partnerId = coupleData.members.find(id => id !== currentUser.uid);
        if (partnerId) {
          const partnerSnap = await getDoc(doc(db, 'users', partnerId));
          if (partnerSnap.exists()) setPartner(partnerSnap.data() as User);
        }
        return true;
      }
    } catch (e) {
      console.error("Failed to join couple space:", e);
    }
    return false;
  }, [currentUser, saveUser, saveCoupleSpace, fetchMessages]);

  // Update Anniversary
  const updateAnniversaryDate = useCallback(async (dateStr: string) => {
    if (!coupleSpace) return;
    const updated = { ...coupleSpace, anniversaryDate: dateStr };
    saveCoupleSpace(updated);
    try {
      await updateDoc(doc(db, 'couples', coupleSpace.id), { anniversaryDate: dateStr });
    } catch (e) {
      console.warn("Failed to update anniversary:", e);
    }
  }, [coupleSpace, saveCoupleSpace]);

  // Update User Profile
  const updateUserProfile = useCallback(async (displayName: string, photoUrl: string, statusMessage?: string, moodIcon?: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, displayName, photoUrl, statusMessage: statusMessage || currentUser.statusMessage, moodIcon: moodIcon || currentUser.moodIcon };
    saveUser(updated);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { displayName, photoUrl, statusMessage, moodIcon });
    } catch (e) {
      console.warn("Failed to update profile:", e);
    }
  }, [currentUser, saveUser]);

  // Send Love Nudge
  const sendLoveNudge = useCallback(async (nudgeType: string, emoji: string, messageText: string) => {
    if (!currentUser || !coupleSpace) return;
    try {
      sounds.playSendSound();
      await fetch(`/api/couples/${coupleSpace.id}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.uid, nudgeType, emoji, message: messageText }),
      });
    } catch (e) {
      console.error("Failed to send love nudge:", e);
    }
  }, [currentUser, coupleSpace]);

  // Disconnect Couple Space
  const disconnectCouple = useCallback(async () => {
    if (!currentUser || !coupleSpace) return;
    try {
      await fetch(`/api/couples/${coupleSpace.id}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid }),
      });
      saveCoupleSpace(null);
      setPartner(null);
      const updatedUser = { ...currentUser };
      delete updatedUser.coupleId;
      saveUser(updatedUser);
    } catch (e) {
      console.error("Failed to disconnect couple space:", e);
    }
  }, [currentUser, coupleSpace, saveCoupleSpace, saveUser]);

  // Daily Love Streak Check-in / Interaction
  const checkInLoveStreak = useCallback(async () => {
    if (!currentUser || !coupleSpace) return;
    try {
      sounds.playPopSound();
      const { getDoc } = await import('firebase/firestore');
      const coupleSnap = await getDoc(doc(db, 'couples', coupleSpace.id));
      if (!coupleSnap.exists()) return;
      
      let data = coupleSnap.data() as CoupleSpace;
      let streak = data.loveStreak || { currentStreak: 0, longestStreak: 0, lastActiveDate: '', userAInteractedToday: false, userBInteractedToday: false, lastInteractions: {} };
      
      const todayStr = new Date().toISOString().split('T')[0];
      const lastInt = streak.lastInteractions || {};
      lastInt[currentUser.uid] = todayStr;
      streak.lastInteractions = lastInt;
      
      const uids = data.members || [];
      const uidA = uids[0] || currentUser.uid;
      const uidB = uids[1];
      
      const activeA = lastInt[uidA] === todayStr;
      const activeB = uidB ? lastInt[uidB] === todayStr : false;
      
      streak.userAInteractedToday = activeA;
      streak.userBInteractedToday = activeB;
      
      if (activeA && (activeB || !uidB)) {
         if (streak.lastActiveDate !== todayStr) {
           streak.currentStreak += 1;
           streak.lastActiveDate = todayStr;
           if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
         }
      } else if (streak.lastActiveDate) {
         const lastDate = new Date(streak.lastActiveDate);
         const diff = new Date().getTime() - lastDate.getTime();
         if (diff > 86400000 * 2) {
            streak.currentStreak = 0;
         }
      }
      
      data.loveStreak = streak;
      await updateDoc(doc(db, 'couples', coupleSpace.id), { loveStreak: streak });
      saveCoupleSpace(data);
    } catch (e) {
      console.warn("Streak checkin failed:", e);
    }
  }, [currentUser, coupleSpace, saveCoupleSpace]);

  // Broadcast event across tabs & windows via BroadcastChannel & localStorage
  const notifyRealtime = useCallback((event: string, payload: any) => {
    try {
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({ event, payload });
      }
    } catch (e) {}

    try {
      // Cross-tab fallback via storage event
      localStorage.setItem('duolove_rt_sync', JSON.stringify({
        event,
        payload,
        senderUid: currentUser?.uid,
        time: Date.now(),
      }));
    } catch (e) {}
  }, [currentUser]);

  // Send Message (Text, Photo, or Voice Note) with multi-layer Firestore, API & real-time sync
  const sendMessage = useCallback(async (
    text: string,
    type: 'text' | 'image' | 'audio' = 'text',
    imageUrl?: string,
    audioUrl?: string,
    audioDuration?: number
  ) => {
    if (!currentUser || !coupleSpace) return;

    sounds.playSendSound();

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tempMsg: Message = {
      id: msgId,
      senderId: currentUser.uid,
      type,
      text: text.trim(),
      imageUrl: imageUrl || undefined,
      thumbnailUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      audioDuration: audioDuration || undefined,
      reactions: {},
      readBy: [currentUser.uid],
      createdAt: Date.now(),
    };

    // 1. Optimistic UI update
    setMessages((prev) => {
      if (prev.some((m) => m.id === tempMsg.id)) return prev;
      return deduplicateMessages([...prev, tempMsg]);
    });

    // 2. Instant local cross-tab broadcast
    notifyRealtime('new_message', tempMsg);

    // 3. Post to Backend API Server (which broadcasts via SSE to all connected tabs/clients)
    fetch(`/api/couples/${coupleSpace.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tempMsg),
    }).catch((err) => {
      console.warn("API server message post notice:", err);
    });

    // 4. Save to Firestore collection couples/{coupleId}/messages in background
    try {
      const docRef = doc(db, 'couples', coupleSpace.id, 'messages', msgId);
      setDoc(docRef, tempMsg).catch((e) => {
        console.warn("Firestore setDoc subcollection notice:", e);
      });

      // Also persist to top-level messages collection for global queries
      const topDocRef = doc(db, 'messages', msgId);
      setDoc(topDocRef, { ...tempMsg, coupleId: coupleSpace.id }).catch(() => {});
    } catch (e) {
      console.warn("Firestore message dispatch notice:", e);
    }
  }, [currentUser, coupleSpace, notifyRealtime]);

  // Mark Messages as Read
  const markMessagesRead = useCallback(async () => {
    if (!currentUser || !coupleSpace) return;
    try {
      const unread = messages.filter((m) => !m.readBy?.includes(currentUser.uid));
      if (unread.length === 0) return;

      for (const msg of unread) {
        const docRef = doc(db, 'couples', coupleSpace.id, 'messages', msg.id);
        await updateDoc(docRef, { readBy: arrayUnion(currentUser.uid) }).catch((err) => {
          console.warn("Firestore mark read update error:", err);
        });
      }

      await fetch(`/api/couples/${coupleSpace.id}/messages/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid }),
      });
      setMessages((prev) =>
        prev.map((m) => (!m.readBy?.includes(currentUser.uid) ? { ...m, readBy: [...(m.readBy || []), currentUser.uid] } : m))
      );
      notifyRealtime('messages_read', { uid: currentUser.uid });
    } catch (e) {
      // ignore
    }
  }, [currentUser, coupleSpace, messages, notifyRealtime]);

  // Toggle Emoji Reaction
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUser || !coupleSpace) return;

    sounds.playPopSound();

    let computedReactions: Record<string, string> = {};
    let activeEmoji: string | null = emoji;

    // Use current messages state or functional update to compute exact next reactions
    setMessages((prev) => {
      const target = prev.find((m) => m.id === messageId);
      const currentReactions = { ...(target?.reactions || {}) };
      if (currentReactions[currentUser.uid] === emoji) {
        delete currentReactions[currentUser.uid];
        activeEmoji = null;
      } else {
        currentReactions[currentUser.uid] = emoji;
        activeEmoji = emoji;
      }
      computedReactions = { ...currentReactions };

      return prev.map((m) => {
        if (m.id === messageId) {
          return { ...m, reactions: computedReactions };
        }
        return m;
      });
    });

    // Fallback: If computedReactions was empty on delayed state execution, use standard fallback
    const targetInState = messages.find((m) => m.id === messageId);
    const fallbackReactions = { ...(targetInState?.reactions || {}) };
    if (fallbackReactions[currentUser.uid] === emoji) {
      delete fallbackReactions[currentUser.uid];
    } else {
      fallbackReactions[currentUser.uid] = emoji;
    }
    const finalReactions = Object.keys(computedReactions).length > 0 || activeEmoji === null
      ? computedReactions 
      : fallbackReactions;

    // Instant local cross-tab notification
    notifyRealtime('message_reaction', {
      messageId,
      reactions: finalReactions,
      uid: currentUser.uid,
      emoji: activeEmoji,
    });

    try {
      // 1. Update Firestore subcollection and root message docs
      const docRef = doc(db, 'couples', coupleSpace.id, 'messages', messageId);
      updateDoc(docRef, { reactions: finalReactions }).catch(() => {});
      const topDocRef = doc(db, 'messages', messageId);
      updateDoc(topDocRef, { reactions: finalReactions }).catch(() => {});

      // 2. Notify API server & broadcast to couple and global SSE
      await fetch(`/api/couples/${coupleSpace.id}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          emoji: activeEmoji,
          reactions: finalReactions,
        }),
      });
    } catch (e) {
      console.warn("Failed reaction sync:", e);
    }
  }, [currentUser, coupleSpace, messages, notifyRealtime]);

  // Delete a Message (photo, voice, or text)
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!coupleSpace) return;

    sounds.playPopSound();

    // 1. Optimistic local update
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    // 2. Cross-tab & broadcast
    notifyRealtime('message_deleted', { messageId });

    // 3. Backend API call
    fetch(`/api/couples/${coupleSpace.id}/messages/${messageId}`, {
      method: 'DELETE',
    }).catch((err) => {
      console.warn("API server message delete notice:", err);
    });

    // 4. Firestore deletion in background
    try {
      const docRef = doc(db, 'couples', coupleSpace.id, 'messages', messageId);
      deleteDoc(docRef).catch((e) => {
        console.warn("Firestore deleteDoc subcollection notice:", e);
      });

      const topDocRef = doc(db, 'messages', messageId);
      deleteDoc(topDocRef).catch(() => {});
    } catch (e) {
      console.warn("Firestore message delete dispatch notice:", e);
    }
  }, [coupleSpace, notifyRealtime]);

  // Update Typing Presence
  const setTypingStatus = useCallback((isTyping: boolean) => {
    if (!currentUser || !coupleSpace) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    fetch(`/api/couples/${coupleSpace.id}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: currentUser.uid, online: true, typing: isTyping }),
    }).catch(() => {});

    notifyRealtime('presence', { uid: currentUser.uid, typing: isTyping });

    if (isTyping) {
      typingTimerRef.current = setTimeout(() => {
        setTypingStatus(false);
      }, 3000);
    }
  }, [currentUser, coupleSpace, notifyRealtime]);

  // Initiate Voice/Video Call
  const startCall = useCallback(async (callType: 'voice' | 'video') => {
    if (!currentUser || !coupleSpace || !partner) return;

    // Start camera/mic or fallback synthetic media stream
    await callEngine.startLocalMedia(callType);

    // Register ICE candidate broadcaster
    const unsubIce = callEngine.onIceCandidate((candidate) => {
      fetch(`/api/couples/${coupleSpace.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ice',
          iceCandidate: candidate,
        }),
      }).catch(() => {});
      notifyRealtime('call_signal', { action: 'ice', candidate });
    });

    const offer = await callEngine.createOffer();

    const signal: CallSignal = {
      id: `call_${Date.now()}`,
      callerId: currentUser.uid,
      receiverId: partner.uid,
      type: callType,
      status: 'offered',
      sdpOffer: offer,
      timestamp: Date.now(),
    };

    setActiveCall(signal);
    sounds.startRingtone();

    try {
      await fetch(`/api/couples/${coupleSpace.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'offer',
          callerId: currentUser.uid,
          receiverId: partner.uid,
          callType,
          sdpOffer: offer,
        }),
      });
      notifyRealtime('call_signal', { action: 'offer', signal });
    } catch (e) {
      console.error("Error sending call offer:", e);
    }
  }, [currentUser, coupleSpace, partner, notifyRealtime]);

  // Accept Incoming Call
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !currentUser || !coupleSpace) return;

    sounds.stopRingtone();

    // Start camera/mic or fallback synthetic media stream for receiver
    await callEngine.startLocalMedia(incomingCall.type);

    // Register ICE candidate broadcaster
    const unsubIce = callEngine.onIceCandidate((candidate) => {
      fetch(`/api/couples/${coupleSpace.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ice',
          iceCandidate: candidate,
        }),
      }).catch(() => {});
      notifyRealtime('call_signal', { action: 'ice', candidate });
    });

    const answer = await callEngine.handleOfferAndCreateAnswer(incomingCall.sdpOffer);

    const updatedSignal: CallSignal = {
      ...incomingCall,
      status: 'accepted',
      sdpAnswer: answer,
    };

    setActiveCall(updatedSignal);
    setIncomingCall(null);

    try {
      await fetch(`/api/couples/${coupleSpace.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          sdpAnswer: answer,
        }),
      });
      notifyRealtime('call_signal', { action: 'accept', signal: updatedSignal });
    } catch (e) {
      console.error("Error accepting call:", e);
    }
  }, [incomingCall, currentUser, coupleSpace, notifyRealtime]);

  // Decline Call
  const declineCall = useCallback(async () => {
    sounds.stopRingtone();
    if (incomingCall && coupleSpace) {
      try {
        await fetch(`/api/couples/${coupleSpace.id}/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decline' }),
        });
        notifyRealtime('call_signal', { action: 'decline' });
      } catch (e) {}
    }
    setIncomingCall(null);
  }, [incomingCall, coupleSpace, notifyRealtime]);

  // End Current Call
  const endCall = useCallback(async () => {
    sounds.stopRingtone();
    callEngine.stopCall();

    if (coupleSpace) {
      try {
        await fetch(`/api/couples/${coupleSpace.id}/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end' }),
        });
        notifyRealtime('call_signal', { action: 'end' });
      } catch (e) {}
    }

    setActiveCall(null);
    setIncomingCall(null);
  }, [coupleSpace, notifyRealtime]);

  // Broadcast Channel & Storage event setup for instant cross-tab real-time sync
  useEffect(() => {
    // 1. Storage Event listener for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'duolove_rt_sync' && e.newValue) {
        try {
          const { event, payload, senderUid } = JSON.parse(e.newValue);
          if (event === 'new_message' && payload) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              if (senderUid !== currentUser?.uid) {
                sounds.playReceiveSound();
              }
              return deduplicateMessages([...prev, payload]);
            });
          } else if (event === 'message_reaction' && payload) {
            const { messageId, reactions, uid } = payload;
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === messageId) {
                  return { ...m, reactions: reactions ? { ...reactions } : m.reactions };
                }
                return m;
              })
            );
            if (uid && currentUser && uid !== currentUser.uid) {
              sounds.playPopSound();
            }
          } else if (event === 'messages_read' && payload) {
            const readerId = payload.readByUid || payload.uid;
            if (readerId) {
              setMessages((prev) =>
                prev.map((m) => {
                  const readList = m.readBy || [];
                  if (!readList.includes(readerId)) {
                    return { ...m, readBy: [...readList, readerId] };
                  }
                  return m;
                })
              );
            }
          } else if (event === 'message_deleted' && payload) {
            const { messageId } = payload;
            if (messageId) {
              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            }
          } else if (event === 'couple_updated' && payload?.couple) {
            if (!coupleSpace || payload.couple.id === coupleSpace.id || payload.couple.members?.includes(currentUser?.uid)) {
              saveCoupleSpace(payload.couple);
              if (payload.couple.id) {
                refreshCoupleInfo(payload.couple.id);
              }
            }
          } else if (event === 'call_signal' && payload) {
            const { action, signal, candidate } = payload;
            if (action === 'offer' && currentUser && signal?.receiverId === currentUser.uid) {
              setIncomingCall(signal);
              sounds.startRingtone();
            } else if (action === 'accept' && activeCall) {
              sounds.stopRingtone();
              if (signal?.sdpAnswer) callEngine.handleAnswer(signal.sdpAnswer);
              setActiveCall((prev) => (prev ? { ...prev, status: 'accepted' } : null));
            } else if (action === 'ice' && candidate) {
              callEngine.addIceCandidate(candidate);
            } else if (action === 'decline' || action === 'end') {
              sounds.stopRingtone();
              callEngine.stopCall();
              setActiveCall(null);
              setIncomingCall(null);
            }
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. BroadcastChannel setup
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(BROADCAST_KEY);
      broadcastRef.current = bc;

      bc.onmessage = (msg) => {
        const { event, payload } = msg.data || {};
        if (event === 'new_message' && payload) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            if (payload.senderId !== currentUser?.uid) {
              sounds.playReceiveSound();
            }
            return deduplicateMessages([...prev, payload]);
          });
        } else if (event === 'message_reaction' && payload) {
          const { messageId, reactions, uid } = payload;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === messageId) {
                return { ...m, reactions: reactions ? { ...reactions } : m.reactions };
              }
              return m;
            })
          );
          if (uid && currentUser && uid !== currentUser.uid) {
            sounds.playPopSound();
          }
        } else if (event === 'messages_read' && payload) {
          const readerId = payload.readByUid || payload.uid;
          if (readerId) {
            setMessages((prev) =>
              prev.map((m) => {
                const readList = m.readBy || [];
                if (!readList.includes(readerId)) {
                  return { ...m, readBy: [...readList, readerId] };
                }
                return m;
              })
            );
          }
        } else if (event === 'message_deleted' && payload) {
          const { messageId } = payload;
          if (messageId) {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
        } else if (event === 'couple_updated' && payload?.couple) {
          if (!coupleSpace || payload.couple.id === coupleSpace.id || payload.couple.members?.includes(currentUser?.uid)) {
            saveCoupleSpace(payload.couple);
            if (payload.couple.id) {
              refreshCoupleInfo(payload.couple.id);
            }
          }
        } else if (event === 'call_signal' && payload) {
          const { action, signal, candidate } = payload;
          if (action === 'offer' && currentUser && signal?.receiverId === currentUser.uid) {
            setIncomingCall(signal);
            sounds.startRingtone();
          } else if (action === 'accept' && activeCall) {
            sounds.stopRingtone();
            if (signal?.sdpAnswer) {
              callEngine.handleAnswer(signal.sdpAnswer);
            }
            setActiveCall((prev) => (prev ? { ...prev, status: 'accepted' } : null));
          } else if (action === 'ice' && candidate) {
            callEngine.addIceCandidate(candidate);
          } else if (action === 'decline' || action === 'end') {
            sounds.stopRingtone();
            callEngine.stopCall();
            setActiveCall(null);
            setIncomingCall(null);
          }
        } else if (event === 'presence' && payload) {
          setPresenceMap((prev) => ({
            ...prev,
            [payload.uid]: {
              uid: payload.uid,
              online: true,
              typing: payload.typing,
              lastActive: Date.now(),
            },
          }));
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, [currentUser, activeCall, saveCoupleSpace]);

  // Initial load & SSE EventStream effect
  useEffect(() => {
    if (coupleSpace?.id) {
      refreshCoupleInfo(coupleSpace.id);
      fetchMessages(coupleSpace.id);

      // Connect Couple SSE stream
      const es = new EventSource(`/api/couples/${coupleSpace.id}/stream`);
      sseRef.current = es;

      const handleNewMessage = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              if (data.message.senderId !== currentUser?.uid) {
                sounds.playReceiveSound();
              }
              return deduplicateMessages([...prev, data.message]);
            });
          }
        } catch (err) {}
      };

      const handleReaction = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.messageId) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === data.messageId) {
                  return { ...m, reactions: data.reactions ? { ...data.reactions } : m.reactions };
                }
                return m;
              })
            );
            if (data.uid && currentUser && data.uid !== currentUser.uid) {
              sounds.playPopSound();
            }
          }
        } catch (err) {}
      };

      const handleRead = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          const readerId = data.readByUid || data.uid;
          if (readerId) {
            setMessages((prev) =>
              prev.map((m) => {
                const readList = m.readBy || [];
                if (!readList.includes(readerId)) {
                  return { ...m, readBy: [...readList, readerId] };
                }
                return m;
              })
            );
          }
        } catch (err) {}
      };

      const handleCoupleUpdated = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.couple) {
            if (!coupleSpace || data.couple.id === coupleSpace.id || data.couple.members?.includes(currentUser?.uid)) {
              saveCoupleSpace(data.couple);
            }
          }
        } catch (err) {}
      };

      const handleMessageDeleted = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.messageId) {
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
          }
        } catch (err) {}
      };

      const handlePresence = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.presence) {
            setPresenceMap(data.presence);
          }
        } catch (err) {}
      };

      const handleCallSignal = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.action === 'ice' && data.candidate) {
            callEngine.addIceCandidate(data.candidate);
          } else if (data.call && currentUser) {
            const signal = data.call;
            if (signal.status === 'offered' && signal.receiverId === currentUser.uid) {
              setIncomingCall(signal);
              sounds.startRingtone();
            } else if (signal.status === 'accepted' && signal.callerId === currentUser.uid) {
              sounds.stopRingtone();
              if (signal.sdpAnswer) {
                callEngine.handleAnswer(signal.sdpAnswer);
              }
              setActiveCall(signal);
            } else if (signal.status === 'declined' || signal.status === 'ended') {
              sounds.stopRingtone();
              callEngine.stopCall();
              setActiveCall(null);
              setIncomingCall(null);
            }
          }
        } catch (err) {}
      };

      es.addEventListener('new_message', handleNewMessage);
      es.addEventListener('message_reaction', handleReaction);
      es.addEventListener('messages_read', handleRead);
      es.addEventListener('message_deleted', handleMessageDeleted);
      es.addEventListener('couple_updated', handleCoupleUpdated);
      es.addEventListener('presence_updated', handlePresence);
      es.addEventListener('call_signal', handleCallSignal);

      return () => {
        es.close();
      };
    }
  }, [coupleSpace?.id, refreshCoupleInfo, fetchMessages, currentUser, saveCoupleSpace]);

  // Periodic partner & user state auto-sync fallback (gentle background sync)
  useEffect(() => {
    if (!currentUser) return;

    const syncUserState = async () => {
      try {
        fetchAvailableUsers();
        const res = await fetch(`/api/users/${currentUser.uid}/state`);
        if (res.ok) {
          const data = await res.json();
          if (data.couple && (!coupleSpace || coupleSpace.id !== data.couple.id || JSON.stringify(coupleSpace.loveStreak) !== JSON.stringify(data.couple.loveStreak))) {
            saveCoupleSpace(data.couple);
          }
          if (data.partner) {
            const validPartner = (data.partner.uid !== currentUser.uid && data.partner.email?.toLowerCase() !== currentUser.email?.toLowerCase())
              ? data.partner
              : null;
            if (validPartner) {
              setPartner((prev) => {
                if (
                  prev &&
                  prev.uid === validPartner.uid &&
                  prev.displayName === validPartner.displayName &&
                  prev.photoUrl === validPartner.photoUrl &&
                  prev.statusMessage === validPartner.statusMessage &&
                  prev.moodIcon === validPartner.moodIcon
                ) {
                  return prev;
                }
                return validPartner;
              });
            } else {
              setPartner((prev) => (prev && (prev.uid === currentUser.uid || prev.email?.toLowerCase() === currentUser.email?.toLowerCase()) ? null : prev));
            }
          }
          if (data.couple?.id) {
            fetchMessages(data.couple.id);
          }
        } else if (coupleSpace?.id) {
          refreshCoupleInfo(coupleSpace.id);
          fetchMessages(coupleSpace.id);
        }
      } catch (err) {}
    };

    // Run immediately on mount or user change
    syncUserState();

    const interval = setInterval(syncUserState, 15000);
    return () => clearInterval(interval);
  }, [currentUser, coupleSpace?.id, fetchAvailableUsers, refreshCoupleInfo, fetchMessages, saveCoupleSpace]);

  return {
    currentUser,
    coupleSpace,
    partner,
    availableUsers,
    fetchAvailableUsers,
    directConnectUsers,
    connectPartnerByEmail,
    messages,
    presenceMap,
    activeCall,
    incomingCall,
    signInWithGoogleAccount,
    loginWithGoogle,
    
    registerUser,
    loginWithCredentials,
    signOut,
    createCoupleSpace,
    joinCoupleSpaceByToken,
    updateAnniversaryDate,
    updateUserProfile,
    checkInLoveStreak,
    sendLoveNudge,
    disconnectCouple,
    sendMessage,
    markMessagesRead,
    toggleReaction,
    deleteMessage,
    setTypingStatus,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };
}
