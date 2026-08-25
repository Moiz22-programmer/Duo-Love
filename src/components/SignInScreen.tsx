import React, { useState } from 'react';
import { User } from '../types';
import { 
  MessageCircle, 
  Video, 
  Image as ImageIcon, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  X, 
  Lock, 
  Mail, 
  UserCheck, 
  User as UserIcon,
  Eye, 
  EyeOff, 
  CheckCircle2,
  AlertCircle,
  Stars,
  Wand2,
  Moon
} from 'lucide-react';

interface Props {
  onSignInWithGoogle: (selectedUser?: User) => void;
  onLoginCredentials?: (email: string, pass: string) => Promise<any>;
  onRegisterUser?: (email: string, pass: string, name: string, photo?: string) => Promise<any>;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
];

export const SignInScreen: React.FC<Props> = ({ 
  onSignInWithGoogle, 
  onLoginCredentials, 
  onRegisterUser 
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState<'email' | 'password'>('email');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePass, setGooglePass] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (onLoginCredentials) {
        await onLoginCredentials(loginEmail.trim(), loginPassword.trim());
      } else {
        // Fallback demo user creation
        const email = loginEmail.trim();
        const username = email.split('@')[0] || 'User';
        const user: User = {
          uid: `usr_${Date.now()}`,
          displayName: username.charAt(0).toUpperCase() + username.slice(1),
          email,
          photoUrl: selectedAvatar,
          createdAt: Date.now(),
          statusMessage: 'In love 💕',
        };
        onSignInWithGoogle(user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Please fill in all fields to create your account.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      if (onRegisterUser) {
        await onRegisterUser(regEmail.trim(), regPassword.trim(), regName.trim(), selectedAvatar);
      } else {
        const user: User = {
          uid: `usr_${Date.now()}`,
          displayName: regName.trim(),
          email: regEmail.trim(),
          photoUrl: selectedAvatar,
          createdAt: Date.now(),
          statusMessage: 'In love 💕',
        };
        onSignInWithGoogle(user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Email might already be taken.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    const email = googleEmail.trim();
    const username = email.split('@')[0] || 'User';
    const displayName = username.charAt(0).toUpperCase() + username.slice(1);
    const customUid = `usr_google_${Date.now()}`;

    const user: User = {
      uid: customUid,
      displayName,
      email,
      photoUrl: selectedAvatar,
      createdAt: Date.now(),
      statusMessage: 'Logged in via Google ✨',
    };

    setShowGoogleModal(false);
    onSignInWithGoogle(user);
  };

  return (
    <div className="min-h-screen cosmos-grid-bg flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Background soft glowing ambient shapes */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#f5a623]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#9b51e0]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full cosmic-card rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative z-10 my-auto transition-all">
        {/* Celestial Brand Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-3 sm:mb-4 transform hover:scale-105 transition-transform bg-gradient-to-tr from-[#d97706] to-[#f5a623] text-black ring-4 ring-[#f5a623]/30">
          <span className="font-serif font-black text-2xl sm:text-3xl tracking-tighter">D</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center justify-center gap-2">
          DuoLove
          <Stars className="w-4 h-4 text-[#f5a623] animate-pulse" />
        </h1>
        <p className="text-slate-400 font-serif italic text-xs sm:text-sm mt-0.5">
          A Celestial Sanctuary Just for Two
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 my-4 text-center">
          <div className="bg-white/[0.04] p-2.5 rounded-2xl border border-white/10">
            <MessageCircle className="w-4 h-4 text-[#f5a623] mx-auto mb-1" />
            <p className="text-[11px] font-serif font-bold text-slate-200">Live Chat</p>
          </div>
          <div className="bg-white/[0.04] p-2.5 rounded-2xl border border-white/10">
            <ImageIcon className="w-4 h-4 text-[#f5a623] mx-auto mb-1" />
            <p className="text-[11px] font-serif font-bold text-slate-200">Gallery</p>
          </div>
          <div className="bg-white/[0.04] p-2.5 rounded-2xl border border-white/10">
            <Video className="w-4 h-4 text-[#f5a623] mx-auto mb-1" />
            <p className="text-[11px] font-serif font-bold text-slate-200">Calls</p>
          </div>
        </div>

        {/* 2-Tab Side-by-Side Quick Switcher */}
        <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-[#f5a623]/30 rounded-2xl p-3 mb-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#f5a623]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tab Testing Profiles</span>
            </div>
            <span className="text-[10px] text-slate-400">Isolated per tab</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mb-2.5">
            Open 2 browser tabs. Click <strong>Abdul Moiz</strong> in Tab 1, and <strong>Fatima</strong> in Tab 2 to test live chat, reactions & calls:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onSignInWithGoogle({
                  uid: 'usr_moiz',
                  displayName: 'Abdul Moiz',
                  email: 'moiz77053@gmail.com',
                  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                  createdAt: Date.now(),
                  statusMessage: 'In celestial love with you 💕',
                });
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.07] hover:bg-[#f5a623]/20 border border-white/10 hover:border-[#f5a623]/40 text-left transition-all cursor-pointer group"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Abdul Moiz"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400/50"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-[#f5a623] truncate">Abdul Moiz</p>
                <p className="text-[9px] text-slate-400">Tab 1 (User)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSignInWithGoogle({
                  uid: 'usr_fatima',
                  displayName: 'Fatima',
                  email: 'fatima@duolove.app',
                  photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
                  createdAt: Date.now(),
                  statusMessage: 'Forever & always in starlight ✨',
                });
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.07] hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-left transition-all cursor-pointer group"
            >
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80"
                alt="Fatima"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-400/50"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">Fatima</p>
                <p className="text-[9px] text-slate-400">Tab 2 (Partner)</p>
              </div>
            </button>
          </div>
        </div>

        {/* Auth Mode Toggle Tabs (Sign In vs Register) */}
        <div className="flex items-center bg-black/40 p-1 rounded-2xl mb-4 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'signin'
                ? 'amber-pill-btn text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'register'
                ? 'amber-pill-btn text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error / Success Messages */}
        {errorMessage && (
          <div className="mb-4 bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs p-3 rounded-2xl flex items-start gap-2 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-teal-950/80 border border-teal-700/60 text-teal-200 text-xs p-3 rounded-2xl flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'signin' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-serif font-bold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-white/[0.05] rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-serif font-bold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/[0.05] rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full amber-pill-btn text-black font-serif font-bold py-3 rounded-2xl transition-all shadow-lg cursor-pointer text-xs flex items-center justify-center gap-2 mt-2 hover:scale-[1.02]"
            >
              {isLoading ? (
                <span>Opening Sanctuary...</span>
              ) : (
                <>
                  <span>Sign In & Open Realm</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-serif font-bold text-slate-300 block mb-1">Your Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Alex Smith"
                  className="w-full pl-10 pr-3 py-2.5 bg-white/[0.05] rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-serif font-bold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-white/[0.05] rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-serif font-bold text-slate-300 block mb-1">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/[0.05] rounded-2xl border border-white/10 text-xs text-white outline-none focus:border-[#f5a623] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Choose Avatar */}
            <div>
              <label className="text-[11px] font-serif font-bold text-slate-300 block mb-1">Choose Profile Photo</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`relative rounded-full transition-transform cursor-pointer shrink-0 ${
                      selectedAvatar === url ? 'ring-2 ring-[#f5a623] scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-8 h-8 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full amber-pill-btn text-black font-serif font-bold py-3 rounded-2xl transition-all shadow-lg cursor-pointer text-xs flex items-center justify-center gap-2 mt-2 hover:scale-[1.02]"
            >
              {isLoading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Or Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0b0914] px-3 text-slate-400 font-bold">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={async () => {
            setErrorMessage('');
            try {
              setIsLoading(true);
              await onSignInWithGoogle();
            } catch (err: any) {
              console.warn("Google auth notice:", err);
              setGoogleEmail('');
              setGooglePass('');
              setGoogleStep('email');
              setShowGoogleModal(true);
            } finally {
              setIsLoading(false);
            }
          }}
          className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-100 font-bold py-2.5 px-4 rounded-2xl border border-white/10 shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer text-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Sign in with Google</span>
        </button>

        {/* Encryption badge */}
        <div className="mt-4 text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time persistence • Private celestial space</span>
        </div>
      </div>

      {/* Realistic Google Sign-In Popup Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cosmic-card rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/15 relative text-left space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-100">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              <div>
                <h3 className="text-sm font-serif font-bold text-white">Sign in with Google</h3>
                <p className="text-[10px] text-slate-400">to continue to DuoLove</p>
              </div>
            </div>

            {googleStep === 'email' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleEmail.trim()) setGoogleStep('password');
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="font-serif font-bold text-slate-300 block mb-1">Email or Phone</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full p-3 bg-white/[0.05] rounded-xl border border-white/10 outline-none focus:border-[#f5a623] font-medium text-sm text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="amber-pill-btn text-black font-serif font-bold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-xs"
                  >
                    Next
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleGoogleAuthSubmit} className="space-y-4 text-xs">
                <div className="flex items-center gap-2 bg-white/[0.05] p-2.5 rounded-xl border border-white/10">
                  <UserCheck className="w-4 h-4 text-[#f5a623]" />
                  <span className="font-bold text-white truncate">{googleEmail}</span>
                </div>

                <div>
                  <label className="font-serif font-bold text-slate-300 block mb-1">Enter Password</label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={googlePass}
                    onChange={(e) => setGooglePass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-white/[0.05] rounded-xl border border-white/10 outline-none focus:border-[#f5a623] font-medium text-sm text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setGoogleStep('email')}
                    className="text-xs text-[#f5a623] font-bold hover:underline cursor-pointer font-serif"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="amber-pill-btn text-black font-serif font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-xs"
                  >
                    Sign In & Continue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

