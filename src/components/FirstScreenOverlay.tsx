import React from 'react';
import { ArrowLeft, ArrowDown, Headphones, Power, RotateCw, MousePointer, Volume2, Sparkles } from 'lucide-react';

interface FirstScreenOverlayProps {
  progress: number;
  sceneMode: 'orbit' | 'monitor' | 'reveal';
  isPCPowered: boolean;
  isMonitorPowered: boolean;
  isHeadphonePlaying: boolean;
  onResetView: () => void;
  onTogglePCPower: () => void;
  onSpinChair: () => void;
  onToggleHeadphoneMusic: () => void;
}

export const FirstScreenOverlay: React.FC<FirstScreenOverlayProps> = ({
  progress,
  sceneMode,
  isPCPowered,
  isMonitorPowered,
  isHeadphonePlaying,
  onResetView,
  onTogglePCPower,
  onSpinChair,
  onToggleHeadphoneMusic,
}) => {
  // Fade out cleanly as the user starts scrolling into Part 2
  const opacity = Math.max(0, 1.0 - progress * 10);
  if (opacity <= 0.01) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-20 transition-opacity duration-200"
      style={{ opacity }}
    >
      {/* ========================================================= */}
      {/* 1. CREATIVE ATMOSPHERIC STUDIO BACKDROP FOR SCREEN 1     */}
      {/* Dark luxury cyber studio ambient glow to make setup POP   */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Deep ambient radial glow centered behind workstation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vh] max-w-[1200px] max-h-[900px] bg-gradient-to-tr from-[#3a102c]/25 via-[#a62b5f]/15 to-[#e66a3a]/10 rounded-full blur-[110px]" />
        
        {/* Subtle architectural vertical lines on sides */}
        <div className="absolute inset-y-0 left-8 sm:left-16 w-px bg-gradient-to-b from-transparent via-[#a62b5f]/20 to-transparent" />
        <div className="absolute inset-y-0 right-8 sm:right-16 w-px bg-gradient-to-b from-transparent via-[#a62b5f]/20 to-transparent" />

        {/* Minimal studio floor horizon line */}
        <div className="absolute bottom-[28%] inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f4f0ea]/10 to-transparent" />
      </div>

      {/* Top Center: If inside Monitor zoom mode, show Return pill */}
      {sceneMode === 'monitor' && (
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in duration-300">
          <button
            onClick={onResetView}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#171519]/90 border border-[#A62B5F] text-[#F4F0EA] font-display text-xs tracking-[0.25em] uppercase hover:bg-[#A62B5F]/25 hover:border-[#E66A3A] transition-all shadow-2xl cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#E66A3A]" />
            <span>RETURN TO ROOM SETUP</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. EVOKE RELATED TEXT ON LEFT SIDE                        */}
      {/* Architectural typography & tactical hardware telemetry    */}
      {/* ========================================================= */}
      <div className="absolute left-6 sm:left-10 top-24 bottom-24 hidden md:flex flex-col justify-between pointer-events-none select-none">
        {/* Top-Left: Brand Emblem & Creed */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E66A3A] animate-ping" />
            <span className="font-display font-black text-sm lg:text-base tracking-[0.4em] text-[#F4F0EA] uppercase">
              EVOKE // SYS.01
            </span>
          </div>
          <div className="font-display font-medium text-[10px] tracking-[0.3em] text-[#A62B5F] uppercase">
            MORE THAN A GAME.
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-r from-[#A62B5F] to-transparent mt-2" />
        </div>

        {/* Center-Left: Vertical Architectural Brand Text */}
        <div className="flex items-center gap-4 py-8">
          <div className="[writing-mode:vertical-rl] rotate-180 font-display font-extrabold text-[11px] lg:text-xs tracking-[0.45em] text-[#F4F0EA]/45 uppercase select-none hover:text-[#F4F0EA]/70 transition-colors">
            ENGINEERED FOR COMPETITIVE SUPREMACY • EST. 2026
          </div>
          <div className="w-px h-32 bg-gradient-to-b from-[#A62B5F]/40 via-[#F4F0EA]/15 to-transparent" />
        </div>

        {/* Bottom-Left: Hardware Telemetry HUD */}
        <div className="space-y-2 text-[10px] tracking-[0.2em] font-mono text-[#F4F0EA]/55">
          <div className="flex items-center gap-2">
            <span className="text-[#E66A3A]">▶</span>
            <span>LATENCY // 0.1MS POLLING</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A62B5F]">▶</span>
            <span>AUDIO // 3D BINAURAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#F4F0EA]/40">▶</span>
            <span>CHAIR // 360° GYRO SWIVEL</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. EVOKE RELATED TEXT ON RIGHT SIDE                       */}
      {/* Mission creed, status readouts & performance badges       */}
      {/* ========================================================= */}
      <div className="absolute right-6 sm:right-10 top-24 bottom-24 hidden md:flex flex-col justify-between items-end pointer-events-none select-none text-right">
        {/* Top-Right: Apex battlestation telemetry */}
        <div className="space-y-1">
          <div className="font-display font-black text-xs lg:text-sm tracking-[0.35em] text-[#F4F0EA]/90 uppercase">
            BATTLESTATION SYNCHRONIZED
          </div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-[#E66A3A] uppercase">
            ULTRA-WIDE 240HZ • HDR OLED
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-l from-[#E66A3A] to-transparent ml-auto mt-2" />
        </div>

        {/* Center-Right: Vertical Brand Creed */}
        <div className="flex items-center gap-4 py-8">
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-[#F4F0EA]/15 to-[#A62B5F]/40" />
          <div className="[writing-mode:vertical-rl] font-display font-bold text-[11px] lg:text-xs tracking-[0.45em] text-[#A62B5F]/70 uppercase select-none">
            PLAY. PROVE. PROGRESS. • EVOKE APEX
          </div>
        </div>

        {/* Bottom-Right: Status indicators */}
        <div className="space-y-2 text-[10px] tracking-[0.2em] font-mono text-[#F4F0EA]/55">
          <div className="flex items-center justify-end gap-2">
            <span>RIG CPU // {isPCPowered ? 'ACTIVE [ON]' : 'STANDBY [OFF]'}</span>
            <span className={`w-2 h-2 rounded-full ${isPCPowered ? 'bg-[#E66A3A] animate-pulse' : 'bg-[#3A102C]'}`} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>MONITOR // {isMonitorPowered ? 'OLED [240HZ]' : 'POWERED OFF'}</span>
            <span className={`w-2 h-2 rounded-full ${isMonitorPowered ? 'bg-[#A62B5F]' : 'bg-[#3A102C]'}`} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>MOUSE // LIVE CURSOR LINK</span>
            <span className="w-2 h-2 rounded-full bg-[#F4F0EA]/60" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. TACTILE INTERACTIVE SETUP CONTROLS HUD (BOTTOM BAR)    */}
      {/* Headphone Music, 360 Spin Chair, CPU Power, Mouse Drag    */}
      {/* ========================================================= */}
      <div className="absolute bottom-6 sm:bottom-10 inset-x-4 sm:inset-x-0 flex flex-col items-center gap-3 z-30 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-full bg-[#120F16]/90 border border-[#F4F0EA]/15 backdrop-blur-xl shadow-2xl">
          
          {/* A. PUT ON HEADPHONES BUTTON */}
          <button
            onClick={onToggleHeadphoneMusic}
            className={`group flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-display font-bold tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer ${
              isHeadphonePlaying
                ? 'bg-gradient-to-r from-[#A62B5F] to-[#E66A3A] text-[#F4F0EA] shadow-[0_0_20px_rgba(166,43,95,0.6)] animate-pulse'
                : 'bg-[#1D1722] text-[#F4F0EA]/85 hover:text-white hover:bg-[#A62B5F]/25 border border-[#A62B5F]/50'
            }`}
            title="Click to put on headphones and listen to procedural music"
          >
            <Headphones className={`w-4 h-4 ${isHeadphonePlaying ? 'text-[#F4F0EA]' : 'text-[#E66A3A] group-hover:scale-110 transition-transform'}`} />
            <span>{isHeadphonePlaying ? 'TAKE OFF HEADPHONES' : 'PUT ON HEADPHONES'}</span>
            
            {/* Animated Equalizer Visualizer when playing */}
            {isHeadphonePlaying ? (
              <span className="flex items-end gap-0.5 h-3.5 ml-1">
                <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-full" />
                <span className="w-0.5 bg-white rounded-full animate-[bounce_0.4s_ease-in-out_infinite_0.1s] h-2.5" />
                <span className="w-0.5 bg-white rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.2s] h-3.5" />
                <span className="w-0.5 bg-white rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.15s] h-2" />
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-[#E66A3A]" />
            )}
          </button>

          {/* B. SPIN CHAIR 360° BUTTON */}
          <button
            onClick={onSpinChair}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#1D1722]/80 hover:bg-[#A62B5F]/20 border border-[#F4F0EA]/15 text-[#F4F0EA]/80 hover:text-white text-xs font-display font-medium tracking-[0.15em] uppercase transition-all cursor-pointer"
            title="Spin the chair 360 degrees"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#A62B5F]" />
            <span className="hidden sm:inline">SPIN CHAIR</span> 360°
          </button>

          {/* C. CPU POWER BUTTON TOGGLE */}
          <button
            onClick={onTogglePCPower}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border text-xs font-display font-medium tracking-[0.15em] uppercase transition-all cursor-pointer ${
              isPCPowered
                ? 'bg-[#1D1722]/80 hover:bg-[#E66A3A]/20 border-[#E66A3A]/40 text-[#F4F0EA]'
                : 'bg-[#100D13] border-red-500/30 text-[#F4F0EA]/50 hover:text-[#F4F0EA]'
            }`}
            title="Turn CPU tower ON or OFF"
          >
            <Power className={`w-3.5 h-3.5 ${isPCPowered ? 'text-[#E66A3A]' : 'text-red-400'}`} />
            <span>CPU: <strong className={isPCPowered ? 'text-[#E66A3A]' : 'text-red-400'}>{isPCPowered ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* D. MOUSE GUIDANCE HINT */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#16131A]/60 border border-[#F4F0EA]/10 text-[11px] font-mono text-[#F4F0EA]/60">
            <MousePointer className="w-3 h-3 text-[#E66A3A]" />
            <span>DRAG MOUSE ON TABLE TO MOVE CURSOR</span>
          </div>
        </div>

        {/* Scroll cue under the bottom bar */}
        <div className="flex items-center gap-2 pointer-events-none opacity-60 mt-1">
          <span className="font-display text-[9px] uppercase tracking-[0.3em] text-[#F4F0EA]/40 flex items-center gap-1.5">
            <span>SCROLL TO EXPLORE STORY</span>
            <ArrowDown className="w-2.5 h-2.5 text-[#A62B5F] animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  );
};
