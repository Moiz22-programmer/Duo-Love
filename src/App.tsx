import React, { useState, useEffect } from 'react';
import { useDuoLoveStore } from './lib/store';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { SignInScreen } from './components/SignInScreen';
import { PairingScreen } from './components/PairingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { ScrapbookScreen } from './components/ScrapbookScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { LoveMapScreen } from './components/LoveMapScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CallModal } from './components/CallModal';
import { MemoriesModal } from './components/MemoriesModal';
import { DaysTogetherWidget } from './components/DaysTogetherWidget';
import { BucketListModal } from './components/BucketListModal';
import { ChibiWardrobeModal, ChibiWardrobeConfig } from './components/ChibiWardrobeModal';
import { WaxSealedLetterModal, LoveLetter } from './components/WaxSealedLetterModal';
import { FontSelectorModal } from './components/FontSelectorModal';
import { Footer } from './components/Footer';
import { Target, Shirt, Mail } from 'lucide-react';

export default function App() {
  useEffect(() => {
    const storedPalette = localStorage.getItem('duolove_palette') || 'celestial';
    document.documentElement.setAttribute('data-theme', storedPalette);
    document.body.setAttribute('data-theme', storedPalette);

    const storedFont = localStorage.getItem('duolove_font') || 'jakarta';
    document.documentElement.setAttribute('data-font', storedFont);
    document.body.setAttribute('data-font', storedFont);

    const handleThemeChange = (e: any) => {
      if (e.detail) {
        document.documentElement.setAttribute('data-theme', e.detail);
        document.body.setAttribute('data-theme', e.detail);
      }
    };

    const handleFontChange = (e: any) => {
      if (e.detail) {
        document.documentElement.setAttribute('data-font', e.detail);
        document.body.setAttribute('data-font', e.detail);
      }
    };

    window.addEventListener('duolove-theme-changed', handleThemeChange);
    window.addEventListener('duolove-font-changed', handleFontChange);
    return () => {
      window.removeEventListener('duolove-theme-changed', handleThemeChange);
      window.removeEventListener('duolove-font-changed', handleFontChange);
    };
  }, []);

  const {
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
  } = useDuoLoveStore();

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showMemories, setShowMemories] = useState(false);
  const [showDaysTogether, setShowDaysTogether] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isCallMinimized, setIsCallMinimized] = useState<boolean>(false);

  // New Feature Modal States
  const [showBucketList, setShowBucketList] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showLoveLetter, setShowLoveLetter] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [activeLetter, setActiveLetter] = useState<LoveLetter | null>(null);

  // Avatar wardrobe config state stored in localStorage
  const [wardrobeConfig, setWardrobeConfig] = useState<ChibiWardrobeConfig>(() => {
    try {
      const saved = localStorage.getItem('duolove_wardrobe_config');
      return saved ? JSON.parse(saved) : { outfit: 'hoodie', hat: 'none', prop: 'boba', pet: 'kitten', petName: 'Whiskers' };
    } catch {
      return { outfit: 'hoodie', hat: 'none', prop: 'boba', pet: 'kitten', petName: 'Whiskers' };
    }
  });

  const handleSaveWardrobe = (newConfig: ChibiWardrobeConfig) => {
    setWardrobeConfig(newConfig);
    try {
      localStorage.setItem('duolove_wardrobe_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendLetter = (letter: LoveLetter) => {
    sendMessage(`💌 [Wax-Sealed Love Letter] ${letter.title}`, 'text');
  };

  const handleSignIn = async (selectedUser?: any) => {
    await loginWithGoogle(selectedUser);
    setShowLandingPage(false);
  };

  const handleCredentials = async (email: string, pass: string) => {
    const res = await loginWithCredentials(email, pass);
    setShowLandingPage(false);
    return res;
  };

  const handleRegister = async (email: string, pass: string, name: string, photo?: string) => {
    const res = await registerUser(email, pass, name, photo);
    setShowLandingPage(false);
    return res;
  };

  // 1. Unauthenticated view or landing page view -> Magical Landing Page
  if (!currentUser || showLandingPage) {
    return (
      <LandingPage
        onSignInWithGoogle={handleSignIn}
        onLoginCredentials={handleCredentials}
        onRegisterUser={handleRegister}
      />
    );
  }

  // Real Partner & Couple Space
  const effectivePartner = partner;
  const effectiveCoupleSpace = coupleSpace || {
    id: `couple_${currentUser.uid}`,
    members: effectivePartner ? [currentUser.uid, effectivePartner.uid] : [currentUser.uid],
    joinToken: 'love_token',
    createdAt: Date.now(),
    anniversaryDate: new Date().toISOString().split('T')[0],
  };

  // Partner presence doc
  const partnerPresence = effectivePartner ? presenceMap[effectivePartner.uid] : undefined;

  // Calculate unread count for badge
  const unreadCount = messages.filter(
    (m) => m.senderId !== currentUser.uid && !m.readBy?.includes(currentUser.uid)
  ).length;

  return (
    <div className="min-h-screen bg-[#0E0B1F] text-slate-100 flex flex-col font-sans antialiased selection:bg-purple-600 selection:text-white bg-magical-radial relative">
      
      {/* Main App Bar Header with Clean Layout */}
      <Header
        currentUser={currentUser}
        partner={effectivePartner}
        coupleSpace={effectiveCoupleSpace}
        presence={partnerPresence}
        onOpenDaysTogether={() => setShowDaysTogether(true)}
        onNavigateSettings={() => setActiveTab('settings')}
        onSignOut={() => {
          signOut();
          setShowLandingPage(true);
        }}
      />

      {/* Top Celestial Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* Primary Content View with 100% Unhindered Screen Visibility */}
      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        {activeTab === 'home' ? (
          <HomeScreen
            currentUser={currentUser}
            partner={effectivePartner}
            coupleSpace={effectiveCoupleSpace}
            presence={partnerPresence}
            messages={messages}
            availableUsers={availableUsers}
            fetchAvailableUsers={fetchAvailableUsers}
            onDirectConnect={directConnectUsers}
            onConnectByEmail={connectPartnerByEmail}
            onSendNudge={sendLoveNudge}
            onNavigateTab={setActiveTab}
            onUpdateStatus={(st, mood) => updateUserProfile(currentUser.displayName, currentUser.photoUrl, st, mood)}
            onCheckInStreak={checkInLoveStreak}
            onOpenBucketList={() => setShowBucketList(true)}
            onOpenWardrobe={() => setShowWardrobe(true)}
            wardrobeConfig={wardrobeConfig}
            onOpenLoveLetter={() => {
              setActiveLetter(null);
              setShowLoveLetter(true);
            }}
          />
        ) : activeTab === 'chat' ? (
          <ChatScreen
            currentUser={currentUser}
            partner={effectivePartner}
            messages={messages}
            presence={partnerPresence}
            availableUsers={availableUsers}
            fetchAvailableUsers={fetchAvailableUsers}
            onDirectConnect={directConnectUsers}
            onConnectByEmail={connectPartnerByEmail}
            onSendMessage={sendMessage}
            onMarkRead={markMessagesRead}
            onToggleReaction={toggleReaction}
            onSetTyping={setTypingStatus}
            onStartCall={(type) => {
              setIsCallMinimized(false);
              startCall(type);
            }}
            activeCall={activeCall}
            isCallMinimized={isCallMinimized}
            onExpandCall={() => setIsCallMinimized(false)}
            onToggleMinimizeCall={setIsCallMinimized}
            onEndCall={endCall}
          />
        ) : activeTab === 'scrapbook' ? (
          <ScrapbookScreen
            currentUser={currentUser}
            partner={effectivePartner}
            coupleSpace={effectiveCoupleSpace}
            messages={messages}
            onUploadPhotoMessage={(txt, type, url) => sendMessage(txt, type, url)}
            onDeleteMoment={deleteMessage}
          />
        ) : activeTab === 'gallery' ? (
          <GalleryScreen
            messages={messages}
            currentUser={currentUser}
            partner={effectivePartner}
            onUploadPhoto={(txt, type, url) => sendMessage(txt, type, url)}
            onDeletePhoto={deleteMessage}
          />
        ) : activeTab === 'map' ? (
          <LoveMapScreen
            currentUser={currentUser}
            partner={effectivePartner}
            coupleSpace={effectiveCoupleSpace}
          />
        ) : (
          <SettingsScreen
            currentUser={currentUser}
            partner={effectivePartner}
            coupleSpace={effectiveCoupleSpace}
            onUpdateProfile={updateUserProfile}
            onUpdateAnniversary={updateAnniversaryDate}
            onDisconnectCouple={disconnectCouple}
            onSignOut={signOut}
          />
        )}
      </main>

      {/* Clean Production App Footer */}
      <Footer />

      {/* Voice & Video Call Overlay / Ring Modal */}
      <CallModal
        currentUser={currentUser}
        partner={partner}
        activeCall={activeCall}
        incomingCall={incomingCall}
        isMinimized={isCallMinimized}
        onToggleMinimize={setIsCallMinimized}
        onAcceptCall={() => {
          setIsCallMinimized(false);
          acceptCall();
        }}
        onDeclineCall={declineCall}
        onEndCall={endCall}
      />

      {/* Shared Memories Photo Album Modal */}
      {showMemories && (
        <MemoriesModal
          messages={messages}
          currentUser={currentUser}
          partner={partner}
          onDeleteMemory={deleteMessage}
          onClose={() => setShowMemories(false)}
        />
      )}

      {/* Days Together Counter Modal */}
      {showDaysTogether && (
        <DaysTogetherWidget
          coupleSpace={coupleSpace}
          onUpdateAnniversary={updateAnniversaryDate}
          onClose={() => setShowDaysTogether(false)}
        />
      )}

      {/* Feature Modal 1: Bucket List & Milestones */}
      {showBucketList && (
        <BucketListModal
          isOpen={showBucketList}
          onClose={() => setShowBucketList(false)}
          currentUser={currentUser}
          partner={effectivePartner}
          coupleSpace={effectiveCoupleSpace}
        />
      )}

      {/* Feature Modal 2: Chibi Wardrobe & Pet Mascot Customization */}
      {showWardrobe && (
        <ChibiWardrobeModal
          isOpen={showWardrobe}
          onClose={() => setShowWardrobe(false)}
          currentConfig={wardrobeConfig}
          onSaveConfig={handleSaveWardrobe}
          userName={currentUser.displayName}
        />
      )}

      {/* Feature Modal 3: Wax-Sealed Envelope & Audio Voice Letters */}
      {showLoveLetter && (
        <WaxSealedLetterModal
          isOpen={showLoveLetter}
          onClose={() => setShowLoveLetter(false)}
          currentUser={currentUser}
          partner={effectivePartner}
          onSendLetter={handleSendLetter}
          existingLetter={activeLetter}
        />
      )}

      {/* Feature Modal 4: Cute Sanctuary Font Selector Studio */}
      <FontSelectorModal
        isOpen={showFontSelector}
        onClose={() => setShowFontSelector(false)}
      />

    </div>
  );
}


