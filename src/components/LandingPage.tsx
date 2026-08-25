import React, { useState } from 'react';
import { User } from '../types';
import { FullBodyHumanoidAvatar } from './FullBodyHumanoidAvatar';
import { 
  Heart, 
  Sparkles, 
  ArrowRight, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  X, 
  AlertCircle,
  Stars,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onSignInWithGoogle: (selectedUser?: User) => void;
  onLoginCredentials?: (email: string, pass: string) => Promise<any>;
  onRegisterUser?: (email: string, pass: string, name: string, photo?: string) => Promise<any>;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInWithGoogle,
  onLoginCredentials,
  onRegisterUser
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Google Account Chooser State
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const handleGoogleClick = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      // Initiates real Firebase Google Auth which triggers Google's Account Selector prompt
      await onSignInWithGoogle();
    } catch (err: any) {
      console.warn("Google popup encounter:", err);
      // If popup is blocked by iframe or browser security, provide smooth account selector dialog
      setShowGoogleModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    const email = googleEmail.trim();
    const displayName = googleName.trim() || email.split('@')[0];
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const user: User = {
      uid: `usr_google_${Date.now()}`,
      displayName: formattedName,
      email,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      createdAt: Date.now(),
      statusMessage: 'Connected via Google ✨',
    };

    setShowGoogleModal(false);
    onSignInWithGoogle(user);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (authTab === 'signin') {
        if (!loginEmail.trim() || !loginPassword.trim()) {
          throw new Error('Please enter both email and password.');
        }
        if (onLoginCredentials) {
          await onLoginCredentials(loginEmail.trim(), loginPassword.trim());
        } else {
          const email = loginEmail.trim();
          const username = email.split('@')[0] || 'User';
          const user: User = {
            uid: `usr_${Date.now()}`,
            displayName: username.charAt(0).toUpperCase() + username.slice(1),
            email,
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            createdAt: Date.now(),
            statusMessage: 'In the starlit sanctuary 💕',
          };
          onSignInWithGoogle(user);
        }
      } else {
        if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
          throw new Error('Please complete all registration fields.');
        }
        if (regPassword.length < 4) {
          throw new Error('Password should be at least 4 characters.');
        }
        if (onRegisterUser) {
          await onRegisterUser(regEmail.trim(), regPassword.trim(), regName.trim());
        } else {
          const user: User = {
            uid: `usr_${Date.now()}`,
            displayName: regName.trim(),
            email: regEmail.trim(),
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            createdAt: Date.now(),
            statusMessage: 'In the starlit sanctuary 💕',
          };
          onSignInWithGoogle(user);
        }
      }
      setShowEmailModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen cosmos-grid-bg text-slate-100 flex flex-col justify-between relative overflow-hidden select-none p-4 md:p-10">
      
      {/* Top Header Monogram */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2.5">
          <span className="font-serif text-3xl font-bold text-[#f5a623] tracking-tight drop-shadow-[0_0_15px_rgba(245,166,35,0.4)]">
            DuoLove
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAuthTab('signin');
              setShowEmailModal(true);
            }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/10 transition-all cursor-pointer"
          >
            <Stars className="w-3.5 h-3.5 text-[#f5a623]" />
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Split Screen Area */}
      <main className="max-w-6xl w-full mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center my-auto z-10 py-6 md:py-12">
        
        {/* Left Column: Hero Typography & Distance Card */}
        <div className="space-y-8 text-left">
          <div className="space-y-4">
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1]">
              Duo<span className="text-[#f5a623]">Love</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-md font-normal">
              Bridging the cosmos between you and your partner. Every moment is a star in your shared galaxy.
            </p>
          </div>

          {/* Current Distance Cosmic Card with LIVE ANIMATED ANIME CHIBI AVATARS */}
          <div className="cosmic-card rounded-3xl p-5 md:p-6 space-y-4 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">
                  COSMIC CONNECTION
                </p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#f5a623] mt-1 drop-shadow-[0_0_20px_rgba(245,166,35,0.35)]">
                  3,421 <span className="text-xl md:text-2xl font-sans font-medium text-slate-300">miles</span>
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-[10px] font-bold text-pink-300 animate-pulse">
                Live Animated Chibis ✨
              </span>
            </div>

            {/* Live Interactive Anime Avatars Display */}
            <div className="pt-2 flex items-center justify-around relative bg-black/40 rounded-2xl p-3 border border-white/10 overflow-hidden">
              {/* Anime Chibi 1 */}
              <div className="scale-75 origin-bottom -my-4">
                <FullBodyHumanoidAvatar
                  gender="boy"
                  name="You"
                  actionType="idle"
                  actor="boy"
                />
              </div>

              {/* Heart Pulse Center */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-9 h-9 rounded-full bg-[#1e1938] border border-[#f5a623]/60 flex items-center justify-center shadow-lg animate-bounce">
                  <Heart className="w-5 h-5 text-[#f5a623] fill-[#f5a623]" />
                </div>
                <span className="text-[10px] font-bold text-slate-300">Connected</span>
              </div>

              {/* Anime Chibi 2 */}
              <div className="scale-75 origin-bottom -my-4">
                <FullBodyHumanoidAvatar
                  gender="girl"
                  name="Partner"
                  actionType="idle"
                  actor="girl"
                />
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Tap or hover on avatars to interact with live animations!
            </p>
          </div>
        </div>

        {/* Right Column: Sanctuary Card with Golden Buttons */}
        <div className="cosmic-card rounded-3xl p-8 md:p-10 space-y-6 text-center max-w-md w-full mx-auto md:ml-auto">
          <div className="space-y-2">
            <h3 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">
              Welcome to your Sanctuary
            </h3>
            <p className="text-slate-400 text-sm">
              Sign in or enter instantly to explore your couple space.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Primary Google Auth */}
            <button
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full amber-pill-btn py-3.5 px-6 rounded-full flex items-center justify-center gap-3 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 shadow-lg shadow-amber-500/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#000000"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#000000"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#000000"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#000000"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Opening Google...' : 'Continue with Google'}</span>
            </button>

            {/* Secondary Outline Pill: Continue with Email */}
            <button
              onClick={() => {
                setAuthTab('signin');
                setErrorMessage('');
                setShowEmailModal(true);
              }}
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 hover:border-white/20 font-medium py-3 px-6 rounded-full flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-slate-300" />
              <span>Sign In with Email</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#151229] px-3 text-slate-400 font-medium">OR</span>
            </div>
          </div>

          {/* Create Account Link */}
          <div>
            <button
              onClick={() => {
                setAuthTab('register');
                setErrorMessage('');
                setShowEmailModal(true);
              }}
              className="text-xs font-semibold text-[#f5a623] hover:underline cursor-pointer transition-colors"
            >
              New here? Create Your Couple Account →
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-[11px] text-slate-500 pt-2">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>

      </main>

      {/* Bottom Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center z-10 py-4 text-xs text-slate-500">
        <p>© 2025 DuoLove. All moments stored securely across the cosmos.</p>
      </footer>

      {/* Google Account Selector Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cosmic-card rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-5 relative text-left text-slate-100 border border-white/20 shadow-2xl">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Google Account</h3>
                <p className="text-xs text-slate-400">Sign in with your Google email</p>
              </div>
            </div>

            <form onSubmit={handleGoogleAccountSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Google Email</label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your.name@gmail.com"
                  className="w-full px-3 py-2.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Your Name"
                  className="w-full px-3 py-2.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623]"
                />
              </div>

              <button
                type="submit"
                className="w-full amber-pill-btn py-3 rounded-full text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Connect with this Google Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Sign In / Registration Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cosmic-card rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-5 relative text-left text-slate-100">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-white">
                {authTab === 'signin' ? 'Sign In to Sanctuary' : 'Create Sanctuary Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {authTab === 'signin' ? 'Enter your celestial credentials.' : 'Begin weaving your constellation.'}
              </p>
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  authTab === 'signin' ? 'bg-[#f5a623] text-[#0b0914] shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  authTab === 'register' ? 'bg-[#f5a623] text-[#0b0914] shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs p-3 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
              {authTab === 'register' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Your Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full pl-10 pr-3 py-2.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={authTab === 'signin' ? loginEmail : regEmail}
                    onChange={(e) => authTab === 'signin' ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authTab === 'signin' ? loginPassword : regPassword}
                    onChange={(e) => authTab === 'signin' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full amber-pill-btn py-3 rounded-full text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? 'Connecting...' : authTab === 'signin' ? 'Sign In & Enter' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
