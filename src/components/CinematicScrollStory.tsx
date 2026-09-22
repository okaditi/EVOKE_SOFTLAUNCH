import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CinematicScrollStoryProps {
  progress: number;
  onOpenWaitlist: () => void;
}

// Linear range clamp & map helper
function clampMap(
  val: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (val <= inMin) return outMin;
  if (val >= inMax) return outMax;
  const ratio = (val - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

export const CinematicScrollStory: React.FC<CinematicScrollStoryProps> = ({
  progress,
  onOpenWaitlist,
}) => {
  const p = Math.min(Math.max(progress, 0), 1);

  // If we are on the first screen (p < 0.07), Part 2 is completely hidden
  if (p < 0.07) return null;

  // -------------------------------------------------------------
  // STAGE 1: MORE THAN A GAME. (p: 0.08 -> 0.32)
  // -------------------------------------------------------------
  let s1Opacity = 0;
  let s1Blur = 18;
  let s1Scale = 0.88;
  let s1Y = 50;

  if (p >= 0.08 && p <= 0.34) {
    if (p < 0.21) {
      s1Opacity = clampMap(p, 0.09, 0.20, 0, 1);
      s1Blur = clampMap(p, 0.09, 0.20, 18, 0);
      s1Scale = clampMap(p, 0.09, 0.20, 0.88, 1.0);
      s1Y = clampMap(p, 0.09, 0.20, 50, 0);
    } else {
      s1Opacity = clampMap(p, 0.23, 0.33, 1, 0);
      s1Blur = clampMap(p, 0.23, 0.33, 0, 16);
      s1Scale = clampMap(p, 0.23, 0.33, 1.0, 1.14);
      s1Y = clampMap(p, 0.23, 0.33, 0, -45);
    }
  }

  // -------------------------------------------------------------
  // STAGE 2: PLAY. (p: 0.30 -> 0.52)
  // -------------------------------------------------------------
  let s2Opacity = 0;
  let s2Blur = 18;
  let s2Scale = 0.86;
  let s2Y = 60;
  let s2ParallaxX = 0;

  if (p >= 0.29 && p <= 0.54) {
    if (p < 0.41) {
      s2Opacity = clampMap(p, 0.30, 0.40, 0, 1);
      s2Blur = clampMap(p, 0.30, 0.40, 18, 0);
      s2Scale = clampMap(p, 0.30, 0.40, 0.86, 1.0);
      s2Y = clampMap(p, 0.30, 0.40, 60, 0);
    } else {
      s2Opacity = clampMap(p, 0.43, 0.53, 1, 0);
      s2Blur = clampMap(p, 0.43, 0.53, 0, 18);
      s2Scale = clampMap(p, 0.43, 0.53, 1.0, 1.15);
      s2Y = clampMap(p, 0.43, 0.53, 0, -50);
    }
    s2ParallaxX = (p - 0.41) * -80;
  }

  // -------------------------------------------------------------
  // STAGE 3: PROVE. (p: 0.49 -> 0.70)
  // -------------------------------------------------------------
  let s3Opacity = 0;
  let s3Blur = 18;
  let s3Scale = 0.86;
  let s3Y = 60;
  let s3ParallaxX = 0;

  if (p >= 0.48 && p <= 0.72) {
    if (p < 0.59) {
      s3Opacity = clampMap(p, 0.49, 0.58, 0, 1);
      s3Blur = clampMap(p, 0.49, 0.58, 18, 0);
      s3Scale = clampMap(p, 0.49, 0.58, 0.86, 1.0);
      s3Y = clampMap(p, 0.49, 0.58, 60, 0);
    } else {
      s3Opacity = clampMap(p, 0.61, 0.71, 1, 0);
      s3Blur = clampMap(p, 0.61, 0.71, 0, 18);
      s3Scale = clampMap(p, 0.61, 0.71, 1.0, 1.15);
      s3Y = clampMap(p, 0.61, 0.71, 0, -50);
    }
    s3ParallaxX = (p - 0.59) * 80;
  }

  // -------------------------------------------------------------
  // STAGE 4: PROGRESS. + TRIAD INTERACTION (p: 0.67 -> 0.86)
  // -------------------------------------------------------------
  let s4Opacity = 0;
  let s4Blur = 18;
  let s4Scale = 0.86;
  let s4Y = 60;

  if (p >= 0.66 && p <= 0.87) {
    if (p < 0.76) {
      s4Opacity = clampMap(p, 0.67, 0.75, 0, 1);
      s4Blur = clampMap(p, 0.67, 0.75, 18, 0);
      s4Scale = clampMap(p, 0.67, 0.75, 0.86, 1.0);
      s4Y = clampMap(p, 0.67, 0.75, 60, 0);
    } else {
      s4Opacity = clampMap(p, 0.78, 0.86, 1, 0);
      s4Blur = clampMap(p, 0.78, 0.86, 0, 16);
      s4Scale = clampMap(p, 0.78, 0.86, 1.0, 1.12);
      s4Y = clampMap(p, 0.78, 0.86, 0, -45);
    }
  }

  // -------------------------------------------------------------
  // STAGE 5: FINAL COMPOSITION + JOIN THE WAITLIST (p: 0.83 -> 1.0)
  // -------------------------------------------------------------
  let s5Opacity = 0;
  let s5Blur = 16;
  let s5Scale = 0.88;
  let s5Y = 50;

  if (p >= 0.82) {
    s5Opacity = clampMap(p, 0.84, 0.94, 0, 1);
    s5Blur = clampMap(p, 0.84, 0.94, 16, 0);
    s5Scale = clampMap(p, 0.84, 0.94, 0.90, 1.0);
    s5Y = clampMap(p, 0.84, 0.94, 50, 0);
  }

  // Translucent backdrop scrim allowing background video to shine through all screens
  const bgOpacity = clampMap(p, 0.08, 0.22, 0.1, 0.38);

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-30 overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: `rgba(23, 21, 25, ${bgOpacity})`,
      }}
    >
      {/* Subtle Atmospheric Mauve Glow Pulse */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[850px] max-h-[850px] rounded-full bg-radial from-[#A62B5F]/20 via-[#3A102C]/10 to-transparent blur-[140px] pointer-events-none transition-opacity duration-300"
        style={{ opacity: clampMap(p, 0.15, 0.9, 0.2, 0.85) }}
      />

      {/* ========================================================= */}
      {/* STAGE 1: MORE THAN A GAME.                                */}
      {/* ========================================================= */}
      {s1Opacity > 0.005 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 will-change-transform pointer-events-none"
          style={{
            opacity: s1Opacity,
            filter: `blur(${s1Blur}px)`,
            transform: `translate3d(0, ${s1Y}px, 0) scale(${s1Scale})`,
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[1px] w-10 sm:w-16 bg-[#A62B5F]/80" />
            <span className="font-display font-bold text-[10px] sm:text-xs tracking-[0.4em] uppercase text-[#A62B5F]">
              THE ESSENCE
            </span>
            <div className="h-[1px] w-10 sm:w-16 bg-[#A62B5F]/80" />
          </div>

          <h2 className="font-display font-black text-4xl sm:text-7xl md:text-8xl lg:text-[7.5rem] tracking-tight text-[#F4F0EA] uppercase leading-none text-glow">
            MORE THAN <br />
            <span className="text-[#A62B5F]">A GAME.</span>
          </h2>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: PLAY.                                            */}
      {/* ========================================================= */}
      {s2Opacity > 0.005 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 will-change-transform pointer-events-none"
          style={{
            opacity: s2Opacity,
            filter: `blur(${s2Blur}px)`,
            transform: `translate3d(${s2ParallaxX}px, ${s2Y}px, 0) scale(${s2Scale})`,
          }}
        >
          <div className="font-display font-black text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] tracking-tight text-[#F4F0EA] uppercase leading-none text-glow">
            PLAY<span className="text-[#A62B5F]">.</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: PROVE.                                           */}
      {/* ========================================================= */}
      {s3Opacity > 0.005 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 will-change-transform pointer-events-none"
          style={{
            opacity: s3Opacity,
            filter: `blur(${s3Blur}px)`,
            transform: `translate3d(${s3ParallaxX}px, ${s3Y}px, 0) scale(${s3Scale})`,
          }}
        >
          <div className="font-display font-black text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] tracking-tight text-[#A62B5F] uppercase leading-none text-glow-mauve">
            PROVE<span className="text-[#E66A3A]">.</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 4: PROGRESS. + TRIAD INTERACTION                    */}
      {/* ========================================================= */}
      {s4Opacity > 0.005 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 will-change-transform pointer-events-none"
          style={{
            opacity: s4Opacity,
            filter: `blur(${s4Blur}px)`,
            transform: `translate3d(0, ${s4Y}px, 0) scale(${s4Scale})`,
          }}
        >
          {p < 0.76 ? (
            <div className="font-display font-black text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] tracking-tight text-[#F4F0EA] uppercase leading-none text-glow">
              PROGRESS<span className="text-[#A62B5F]">.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 sm:gap-3">
              <div className="font-display font-black text-4xl sm:text-6xl md:text-8xl tracking-tight text-[#F4F0EA] uppercase text-glow">
                PLAY<span className="text-[#A62B5F]">.</span>
              </div>
              <div className="font-display font-black text-4xl sm:text-6xl md:text-8xl tracking-tight text-[#A62B5F] uppercase text-glow-mauve">
                PROVE<span className="text-[#E66A3A]">.</span>
              </div>
              <div className="font-display font-black text-4xl sm:text-6xl md:text-8xl tracking-tight text-[#F4F0EA] uppercase text-glow">
                PROGRESS<span className="text-[#A62B5F]">.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 5: FINAL COMPOSITION + JOIN THE WAITLIST            */}
      {/* ========================================================= */}
      {s5Opacity > 0.005 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 will-change-transform pointer-events-none"
          style={{
            opacity: s5Opacity,
            filter: `blur(${s5Blur}px)`,
            transform: `translate3d(0, ${s5Y}px, 0) scale(${s5Scale})`,
          }}
        >
          {/* Subtle Top Accent */}
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="h-[1px] w-8 sm:w-14 bg-[#A62B5F]/80" />
            <span className="font-display font-extrabold text-[10px] sm:text-xs tracking-[0.4em] uppercase text-[#A62B5F]">
              THE ARRIVAL
            </span>
            <div className="h-[1px] w-8 sm:w-14 bg-[#A62B5F]/80" />
          </div>

          {/* Monumental EVOKE Wordmark */}
          <h1 className="font-display font-black text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-[0.16em] text-[#F4F0EA] uppercase leading-none text-glow">
            EVOKE
          </h1>

          {/* Creed Triad */}
          <div className="mt-4 sm:mt-6 font-display font-extrabold text-sm sm:text-lg md:text-xl tracking-[0.35em] text-[#A62B5F] uppercase">
            PLAY. <span className="text-[#F4F0EA]">PROVE.</span> PROGRESS.
          </div>

          {/* Core Proposition */}
          <div className="mt-2 font-display font-semibold text-xs sm:text-sm md:text-base tracking-[0.28em] text-[#F4F0EA]/90 uppercase">
            MORE THAN A GAME.
          </div>

          {/* Large Elegant CTA: JOIN THE WAITLIST */}
          <div className="mt-9 sm:mt-12 pointer-events-auto">
            <button
              onClick={onOpenWaitlist}
              className="group relative inline-flex items-center gap-3 sm:gap-4 bg-[#A62B5F] hover:bg-[#A62B5F]/90 text-[#F4F0EA] px-9 sm:px-12 py-4 sm:py-5 rounded-full font-display font-bold text-xs sm:text-sm tracking-[0.25em] uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-[0_0_50px_rgba(166,43,95,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E66A3A] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#E66A3A]" />
              <span>JOIN THE WAITLIST</span>
              <ArrowRight className="w-4 h-4 text-[#F4F0EA] transition-transform duration-300 group-hover:translate-x-1" />
              <div className="absolute -inset-0.5 rounded-full border border-[#E66A3A]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Protocol Genesis Subtext */}
          <div className="mt-7 sm:mt-8 flex items-center gap-3 text-[10px] tracking-[0.25em] text-[#F4F0EA]/35 uppercase">
            <span>GENESIS ALPHA PROTOCOL</span>
            <span className="text-[#A62B5F]">•</span>
            <span className="text-[#E66A3A]">NODE ACCESS OPEN</span>
          </div>
        </div>
      )}
    </div>
  );
};
