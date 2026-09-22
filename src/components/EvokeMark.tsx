import React from 'react';

interface EvokeMarkProps {
  progress: number;
  mouseX: number;
  mouseY: number;
}

// Utility range mapper
function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const clamped = Math.min(Math.max(value, inMin), inMax);
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export const EvokeMark: React.FC<EvokeMarkProps> = ({
  progress,
  mouseX,
  mouseY,
}) => {
  // 1. Slanted angular blades convergence & assembly
  // Converges inwards as progress goes from 0.1 to 0.7
  const bladeSpread = mapRange(progress, 0.1, 0.7, 130, 0);
  const bladeOpacity = mapRange(progress, 0.12, 0.55, 0, 0.9);
  const bladeBlur = mapRange(progress, 0.15, 0.6, 6, 0);

  // Left blade: tilted at -26deg
  const leftBladeTransform = `translate3d(${-bladeSpread - 160 + mouseX * 8}px, ${-bladeSpread * 0.2 - 20 + mouseY * 6}px, 0) rotate(${-26 + progress * 16}deg)`;
  // Right blade: tilted at -26deg
  const rightBladeTransform = `translate3d(${bladeSpread + 160 + mouseX * 8}px, ${bladeSpread * 0.2 + 20 + mouseY * 6}px, 0) rotate(${-26 - progress * 16}deg)`;

  // 2. Concentric geometric ring fragments
  const ring1Rotation = progress * 100 + mouseX * 6;
  const ring2Rotation = -progress * 140 - mouseX * 6;
  const ring1Scale = 0.75 + progress * 0.35;
  const ring2Scale = 0.85 + progress * 0.25;
  const ringOpacity = mapRange(progress, 0.15, 0.65, 0.05, 0.35);

  // 3. Central Diamond & Chevron Crest
  const coreScale = mapRange(progress, 0.15, 0.7, 0.45, 1.05);
  const coreOpacity = mapRange(progress, 0.15, 0.6, 0, 0.95);
  const coreDiamondRot = 45 + progress * 90 + mouseX * 4;

  // 4. Circular crest motto: "A DEFINITIVE STANDARD FORGED FOR PURE MASTERY"
  const mottoOpacity = mapRange(progress, 0.5, 0.72, 0, 0.65);
  const mottoScale = mapRange(progress, 0.5, 0.7, 0.85, 1);

  return (
    <div
      className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] md:w-[520px] md:h-[520px] flex items-center justify-center pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${mouseX * 12}px, ${mouseY * 12}px, 0)`,
      }}
    >
      {/* Outer Rotating Hairline Orbit */}
      <div
        className="absolute inset-0 border border-[#F4F0EA]/15 rounded-full transition-opacity duration-300"
        style={{
          transform: `scale(${ring1Scale}) rotate(${ring1Rotation}deg)`,
          opacity: ringOpacity,
        }}
      />

      {/* Inner Rotating Dashed Mauve Accent Orbit */}
      <div
        className="absolute inset-8 sm:inset-12 border border-dashed border-[#A62B5F]/35 rounded-full transition-opacity duration-300"
        style={{
          transform: `scale(${ring2Scale}) rotate(${ring2Rotation}deg)`,
          opacity: ringOpacity * 1.2,
        }}
      />

      {/* Left Slanted Blade (Mauve to Plum) */}
      <div
        className="absolute w-2.5 sm:w-3.5 h-64 sm:h-80 md:h-96 bg-gradient-to-b from-[#A62B5F] via-[#3A102C] to-transparent clip-slant will-change-transform"
        style={{
          transform: leftBladeTransform,
          opacity: bladeOpacity,
          filter: `blur(${bladeBlur}px)`,
        }}
      />

      {/* Right Slanted Blade (Burnt Orange to Mauve) */}
      <div
        className="absolute w-2.5 sm:w-3.5 h-64 sm:h-80 md:h-96 bg-gradient-to-b from-[#E66A3A] via-[#A62B5F] to-transparent clip-slant will-change-transform"
        style={{
          transform: rightBladeTransform,
          opacity: bladeOpacity,
          filter: `blur(${bladeBlur}px)`,
        }}
      />

      {/* Center Diamond Frame & Monogram Crest */}
      <div
        className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center will-change-transform"
        style={{
          transform: `scale(${coreScale})`,
          opacity: coreOpacity,
        }}
      >
        {/* Outer Diamond Wireframe */}
        <div
          className="absolute inset-0 border-2 border-[#F4F0EA]/25 transition-transform duration-100 ease-out"
          style={{
            transform: `rotate(${coreDiamondRot}deg)`,
          }}
        />

        {/* Inner Mauve Accent Diamond with Plum glow */}
        <div
          className="absolute inset-3 sm:inset-4 bg-gradient-to-tr from-[#3A102C]/80 to-[#A62B5F]/40 border border-[#A62B5F]/50 shadow-[0_0_40px_rgba(166,43,95,0.4)]"
          style={{
            transform: `rotate(${coreDiamondRot}deg)`,
          }}
        />

        {/* The Evoke Chevron Crest & Burnt Orange Apex Dot */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <svg
            className="w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 text-[#F4F0EA] drop-shadow-[0_0_15px_rgba(244,240,234,0.4)]"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
          >
            {/* Outer Bold Chevron */}
            <path
              d="M22 28L50 78L78 28"
              strokeWidth="6"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Inner Concentric Chevron */}
            <path
              d="M36 28L50 56L64 28"
              strokeWidth="3.5"
              strokeOpacity="0.6"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Burnt Orange Apex Dot */}
            <circle
              cx="50"
              cy="20"
              r="3.5"
              fill="#E66A3A"
              stroke="#E66A3A"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      {/* Circular Curvature Motto / Subtitle (As seen in Image 1.png) */}
      <div
        className="absolute -bottom-10 sm:-bottom-12 flex flex-col items-center pointer-events-none transition-all duration-300"
        style={{
          opacity: mottoOpacity,
          transform: `scale(${mottoScale})`,
        }}
      >
        <span className="font-sans text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.32em] text-[#F4F0EA]/55 uppercase text-center max-w-xs">
          A definitive standard forged for pure mastery.
        </span>
      </div>
    </div>
  );
};
