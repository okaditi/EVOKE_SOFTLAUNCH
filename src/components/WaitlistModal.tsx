import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ArrowRight, ShieldCheck, Copy } from 'lucide-react';
import { DISCIPLINES } from '../types';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryGame, setPrimaryGame] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rosterId, setRosterId] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setIsSubmitted(false);
        setCopied(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !primaryGame) return;

    // Generate random Genesis roster identifier
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setRosterId(`EVK-${randNum}-ALPHA`);
    setIsSubmitted(true);
  };

  const handleCopy = () => {
    if (!rosterId) return;
    navigator.clipboard.writeText(rosterId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171519]/90 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-[#1D171E] border border-[#F4F0EA]/15 p-7 sm:p-10 md:p-12 rounded-2xl shadow-2xl glow-mauve transform transition-all duration-300"
      >
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 text-[#F4F0EA]/50 hover:text-[#F4F0EA] transition-colors w-9 h-9 rounded-full border border-[#F4F0EA]/10 hover:border-[#A62B5F] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A62B5F]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Minimal Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#E66A3A]" />
              <span className="font-display text-[10px] tracking-[0.3em] uppercase text-[#A62B5F]">
                Priority Roster
              </span>
            </div>

            <h2
              id="waitlist-title"
              className="font-display font-black text-2xl sm:text-3xl tracking-[0.1em] text-[#F4F0EA] uppercase"
            >
              JOIN THE WAITLIST
            </h2>

            <p className="mt-2 text-xs tracking-wider text-[#F4F0EA]/60 uppercase leading-relaxed">
              Something new is taking shape.
            </p>

            {/* Waitlist Form with exact requested fields */}
            <form onSubmit={handleSubmit} className="mt-7 sm:mt-8 space-y-5">
              <div>
                <label className="block font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-[#F4F0EA]/70 mb-2">
                  NAME
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="PLAYER HANDLE OR FULL NAME"
                  className="w-full bg-[#171519]/70 border border-[#F4F0EA]/15 focus:border-[#A62B5F] focus:ring-1 focus:ring-[#A62B5F] text-[#F4F0EA] placeholder-[#F4F0EA]/25 px-4 py-3 text-xs tracking-wider uppercase rounded-lg outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-[#F4F0EA]/70 mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="NAME@DOMAIN.COM"
                  className="w-full bg-[#171519]/70 border border-[#F4F0EA]/15 focus:border-[#A62B5F] focus:ring-1 focus:ring-[#A62B5F] text-[#F4F0EA] placeholder-[#F4F0EA]/25 px-4 py-3 text-xs tracking-wider uppercase rounded-lg outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-[#F4F0EA]/70 mb-2">
                  PRIMARY GAME
                </label>
                <div className="relative">
                  <select
                    required
                    value={primaryGame}
                    onChange={(e) => setPrimaryGame(e.target.value)}
                    className="w-full bg-[#171519]/70 border border-[#F4F0EA]/15 focus:border-[#A62B5F] focus:ring-1 focus:ring-[#A62B5F] text-[#F4F0EA] px-4 py-3 text-xs tracking-wider uppercase rounded-lg outline-none appearance-none transition-all cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#171519] text-[#F4F0EA]/40">
                      SELECT YOUR PRIMARY DISCIPLINE
                    </option>
                    {DISCIPLINES.map((d) => (
                      <option key={d.value} value={d.value} className="bg-[#171519] text-[#F4F0EA]">
                        {d.label} — {d.genre}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#F4F0EA]/40">
                    <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Exact button requested: JOIN EVOKE */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full group relative overflow-hidden bg-[#A62B5F] hover:bg-[#A62B5F]/90 active:scale-[0.99] text-[#F4F0EA] py-3.5 sm:py-4 rounded-lg font-display font-bold text-xs tracking-[0.25em] uppercase transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(166,43,95,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E66A3A] cursor-pointer"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>JOIN EVOKE</span>
                    <span className="text-[#E66A3A] transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-[10px] tracking-[0.2em] uppercase text-[#F4F0EA]/40">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A62B5F]" />
                <span>CHRONOLOGICAL ALPHA ACCESS PROTOCOL</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full border border-[#A62B5F] flex items-center justify-center bg-[#A62B5F]/15 glow-mauve">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 text-[#F4F0EA]" />
            </div>

            {/* Exact text requested: YOU'RE IN. "Welcome to the beginning." */}
            <h3 className="font-display font-black text-3xl sm:text-4xl tracking-[0.2em] text-[#F4F0EA] uppercase">
              YOU'RE IN.
            </h3>

            <p className="mt-4 font-sans text-xs sm:text-sm tracking-[0.2em] uppercase text-[#F4F0EA]/80 max-w-sm mx-auto leading-relaxed">
              Welcome to the beginning.
            </p>

            {/* Assigned Member Protocol Key */}
            <div className="mt-6 p-4 rounded-lg bg-[#171519]/80 border border-[#F4F0EA]/15 flex items-center justify-between max-w-xs mx-auto">
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-display uppercase tracking-widest text-[#F4F0EA]/40">
                  Roster Node
                </span>
                <span className="font-display font-bold text-xs tracking-wider text-[#A62B5F] tabular-nums">
                  {rosterId}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 text-[#F4F0EA]/50 hover:text-[#F4F0EA] transition-colors cursor-pointer"
                title="Copy Roster Token"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#F4F0EA]/10">
              <button
                onClick={onClose}
                className="text-[11px] font-display font-bold tracking-[0.25em] text-[#A62B5F] hover:text-[#F4F0EA] uppercase transition-colors cursor-pointer"
              >
                RETURN TO EXPERIENCE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
