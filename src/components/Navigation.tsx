import React from 'react';
import { Heart, MessageCircle, BookOpen, Image as ImageIcon, MapPin, Settings } from 'lucide-react';

export type TabType = 'home' | 'chat' | 'scrapbook' | 'gallery' | 'map' | 'settings';

interface Props {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unreadCount?: number;
}

export const Navigation: React.FC<Props> = ({ activeTab, onChangeTab, unreadCount = 0 }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Sanctuary', icon: Heart },
    { id: 'chat' as TabType, label: 'Whisper Chat', icon: MessageCircle, badge: unreadCount },
    { id: 'map' as TabType, label: 'Star Map', icon: MapPin },
    { id: 'scrapbook' as TabType, label: 'Scrapbook', icon: BookOpen },
    { id: 'gallery' as TabType, label: 'Memories', icon: ImageIcon },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Horizontal Celestial Navigation Bar */}
      <nav className="hidden md:flex items-center justify-center py-2 px-4 bg-[#0b0914]/80 backdrop-blur-md border-b border-white/[0.06] sticky top-[61px] z-20 transition-all">
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/10 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#f5a623] text-[#0b0914] shadow-[0_0_16px_var(--theme-glow)] font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span>{tab.label}</span>

                {tab.badge && tab.badge > 0 ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                      isActive
                        ? 'bg-[#0b0914] text-[#f5a623]'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Floating Bottom Dock (No screen obstruction, floating pill) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-sm mx-auto bg-[#0b0914]/95 backdrop-blur-xl border border-white/15 rounded-full px-3 py-2 flex items-center justify-around shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
                isActive
                  ? 'text-[#0b0914] bg-[#f5a623] shadow-[0_0_16px_rgba(245,166,35,0.5)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title={tab.label}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />

              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0b0914] shadow-md">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
};


