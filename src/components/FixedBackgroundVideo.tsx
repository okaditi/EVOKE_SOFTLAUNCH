import React, { useRef, useEffect } from 'react';

interface FixedBackgroundVideoProps {
  scrollProgress: number;
}

export const FixedBackgroundVideo: React.FC<FixedBackgroundVideoProps> = ({ scrollProgress }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Screen 1: Background video is removed (opacity 0)
  // Screens 2+: Seamlessly cross-fades in for Part 2 cinematic story stages and waitlist
  const videoOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.07) * 9));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video plays smoothly
    const attemptPlay = () => {
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    };

    attemptPlay();

    // Browser autoplay policy fallbacks
    window.addEventListener('pointerdown', attemptPlay, { once: true });
    window.addEventListener('touchstart', attemptPlay, { once: true });
    window.addEventListener('scroll', attemptPlay, { once: true });

    return () => {
      window.removeEventListener('pointerdown', attemptPlay);
      window.removeEventListener('touchstart', attemptPlay);
      window.removeEventListener('scroll', attemptPlay);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none transition-opacity duration-300"
      style={{ opacity: videoOpacity }}
    >
      {/* 1. Fullscreen Fixed Video: Occupies 100% of the background for Part 2 and does NOT move on scroll */}
      <video
        ref={videoRef}
        src="/assets/evoke_battlefield.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* 2. Cinematic Darkening Overlay (30-35%) ensuring text readability across all screens */}
      <div className="absolute inset-0 bg-[#171519]/35 pointer-events-none" />

      {/* 3. Subtle Brand Vignette (Edge Darkening) for cinematic contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(23, 21, 25, 0.4) 70%, rgba(23, 21, 25, 0.8) 100%)',
        }}
      />
    </div>
  );
};
