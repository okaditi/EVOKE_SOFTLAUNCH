import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundscape } from '../utils/audio';

interface NavigationProps {
  onOpenWaitlist: () => void;
  onResetView: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onOpenWaitlist,
  onResetView,
}) => {
  const [audioActive, setAudioActive] = useState(false);

  const handleAudioToggle = () => {
    const active = soundscape.toggle();
    setAudioActive(active);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-10 py-6 pointer-events-auto transition-all select-none">
      {/* Top Left: EVOKE Monogram & Brandmark */}
      <button
        onClick={onResetView}
        className="flex items-center gap-3.5 group cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A62B5F]"
        aria-label="Reset Evoke 3D perspective"
        title="Reset 3D Room Perspective"
      >
        <div className="relative w-7 h-7 flex items-center justify-center">
          <div className="absolute inset-0 border border-[#A62B5F]/40 rotate-45 transition-transform duration-700 ease-out group-hover:rotate-90 group-hover:border-[#A62B5F]" />
          <span className="font-display font-black text-xs tracking-widest text-[#F4F0EA]">
            E
          </span>
        </div>
        <span className="font-display font-extrabold text-sm sm:text-base tracking-[0.35em] text-[#F4F0EA] uppercase transition-colors group-hover:text-[#A62B5F]">
          EVOKE
        </span>
      </button>

      {/* Top Right: Soundscape Toggle + Primary Action */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Subtle Ambient Drone Toggle */}
        <button
          onClick={handleAudioToggle}
          className="flex items-center gap-2 text-[#F4F0EA]/50 hover:text-[#F4F0EA] transition-colors p-2 text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A62B5F] cursor-pointer"
          title={audioActive ? 'Mute cinematic drone' : 'Enable cinematic atmospheric drone'}
          aria-label={audioActive ? 'Mute audio' : 'Unmute audio'}
        >
          {audioActive ? (
            <>
              <Volume2 className="w-4 h-4 text-[#A62B5F]" />
              <span className="hidden sm:inline font-display text-[10px] tracking-[0.2em] text-[#A62B5F] uppercase">
                ATMOSPHERE ON
              </span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline font-display text-[10px] tracking-[0.2em] text-[#F4F0EA]/40 uppercase hover:text-[#F4F0EA]">
                ATMOSPHERE
              </span>
            </>
          )}
        </button>

        {/* Top-Right: JOIN THE WAITLIST */}
        <button
          onClick={onOpenWaitlist}
          className="relative group overflow-hidden border border-[#F4F0EA]/20 hover:border-[#A62B5F] px-5 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all duration-300 bg-[#171519]/70 hover:bg-[#A62B5F]/20 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A62B5F]"
        >
          <span className="relative z-10 font-display font-bold text-[11px] sm:text-xs tracking-[0.22em] text-[#F4F0EA] uppercase group-hover:text-[#F4F0EA] transition-colors">
            Join The Waitlist
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#A62B5F] to-[#E66A3A] opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        </button>
      </div>
    </header>
  );
};
