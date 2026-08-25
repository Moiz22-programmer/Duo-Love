import React, { useState, useEffect } from 'react';
import { User, CoupleSpace } from '../types';
import { UserCheck, RefreshCw, Sparkles, MessageCircle, Link as LinkIcon, Check, Copy, Stars, Moon, Wand2 } from 'lucide-react';

interface Props {
  currentUser: User;
  coupleSpace: CoupleSpace | null;
  availableUsers: User[];
  fetchAvailableUsers: () => void;
  onDirectConnect: (targetUid: string) => Promise<boolean>;
  onConnectByEmail?: (email: string) => Promise<boolean>;
  onCreateSpace: () => Promise<CoupleSpace | null>;
  onJoinSpace: (token: string) => Promise<boolean>;
}

export const PairingScreen: React.FC<Props> = ({
  currentUser,
  coupleSpace,
  availableUsers,
  fetchAvailableUsers,
  onDirectConnect,
  onConnectByEmail,
  onCreateSpace,
  onJoinSpace,
}) => {
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [linkingEmail, setLinkingEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAvailableUsers();
    const interval = setInterval(fetchAvailableUsers, 3000);
    return () => clearInterval(interval);
  }, [fetchAvailableUsers]);

  // Ensure space exists
  useEffect(() => {
    if (!coupleSpace) {
      onCreateSpace();
    }
  }, [coupleSpace, onCreateSpace]);

  const handleConnect = async (targetUid: string) => {
    setLoadingUid(targetUid);
    await onDirectConnect(targetUid);
    setLoadingUid(null);
  };

  const handleEmailConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !onConnectByEmail) return;
    setLinkingEmail(true);
    try {
      await onConnectByEmail(emailInput.trim());
      setEmailInput('');
    } finally {
      setLinkingEmail(false);
    }
  };

  const shareableUrl = window.location.href;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0914] flex flex-col items-center justify-center p-4 relative text-slate-100 cosmos-grid-bg">
      
      {/* Background glow orb */}
      <div className="absolute w-96 h-96 bg-[#f5a623]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full cosmic-card border border-[#f5a623]/60 rounded-3xl p-8 shadow-2xl text-center relative z-10 my-auto">
        
        {/* Animated Celestial Icon */}
        <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#f5a623] text-black flex items-center justify-center shadow-lg relative z-10">
            <Sparkles className="w-8 h-8 text-black fill-black" />
          </div>
        </div>

        <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center justify-center gap-2">
          Connect Your Stardust ✨
        </h1>
        <p className="text-slate-400 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
          When your partner opens this website and signs in, she will appear below. Just tap to link your celestial spaces!
        </p>

        {/* Discovered Active Users Section */}
        <div className="my-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-serif font-bold text-[#f5a623] flex items-center gap-1.5 uppercase tracking-wider">
              <Stars className="w-4 h-4 text-[#f5a623]" />
              Active Souls on Website:
            </span>
            <button
              onClick={fetchAvailableUsers}
              className="text-[11px] text-slate-400 hover:text-[#f5a623] font-medium flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {availableUsers.length > 0 ? (
            <div className="space-y-2.5">
              {availableUsers.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between p-3.5 bg-black/40 hover:bg-white/5 rounded-2xl border border-white/10 transition-all text-left shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.photoUrl}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#f5a623] ring-2 ring-black"
                    />
                    <div>
                      <h4 className="text-xs font-serif font-bold text-white">{u.displayName}</h4>
                      <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Online in celestial space
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(u.uid)}
                    disabled={loadingUid === u.uid}
                    className="amber-pill-btn text-black text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-105"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {loadingUid === u.uid ? 'Linking...' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-black/40 rounded-2xl border border-white/10 text-center">
              <p className="text-xs font-bold text-slate-200">Waiting for partner to enter space...</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Share this link with her so she can sign in!
              </p>
            </div>
          )}
        </div>

        {/* Website Link Share & Email Direct Connect */}
        <div className="pt-4 border-t border-white/10 text-left space-y-4">
          <form onSubmit={handleEmailConnect} className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Link Partner by Email:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="e.g. moiz88053@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full text-xs font-sans text-white bg-black/50 p-2.5 rounded-xl border border-white/10 focus:border-[#f5a623] outline-none"
                required
              />
              <button
                type="submit"
                disabled={linkingEmail || !emailInput.trim()}
                className="amber-pill-btn text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md disabled:opacity-50 hover:scale-105"
              >
                {linkingEmail ? 'Linking...' : 'Connect'}
              </button>
            </div>
          </form>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Celestial Link (Send to your partner):
            </label>
            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-xl border border-white/10">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full text-xs font-mono text-slate-300 bg-transparent outline-none truncate px-1"
              />
              <button
                onClick={handleCopyLink}
                className="amber-pill-btn text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

