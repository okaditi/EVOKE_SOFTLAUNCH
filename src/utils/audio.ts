/**
 * Web Audio API synthesized cinematic atmospheric drone.
 * Fully self-contained, no external mp3 assets needed.
 */
class CinematicSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isPlaying = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Low pass filter for dark, cinematic resonance
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Deep root sub-bass oscillator (44Hz - F1)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(43.65, this.ctx.currentTime); // F1
      this.osc1.connect(this.filter);
      this.osc1.start();

      // Subtle fifth harmony oscillator (65.4Hz - C2)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2
      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.osc2.connect(osc2Gain);
      osc2Gain.connect(this.filter);
      this.osc2.start();
    } catch {
      // Audio not supported or blocked
    }
  }

  public toggle(): boolean {
    if (!this.ctx) {
      this.init();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.masterGain || !this.ctx) return false;

    if (this.isPlaying) {
      // Smooth fade out
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
      this.isPlaying = false;
    } else {
      // Smooth fade in to a gentle ambient level
      this.masterGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);
      this.isPlaying = true;
    }
    return this.isPlaying;
  }

  public updateScroll(progress: number) {
    if (!this.isPlaying || !this.ctx || !this.filter) return;
    // Modulate filter frequency subtly with scroll progression
    const targetFreq = 110 + progress * 160;
    this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
  }

  public playClick(pitch: number = 800) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio blocked or inactive
    }
  }

  public playPowerToggle(turningOn: boolean) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      if (turningOn) {
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.28);
      } else {
        osc.frequency.setValueAtTime(540, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.32);
      }
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Audio blocked
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  // ========================================================
  // HEADPHONE ESPORTS MUSIC SYNTHESIZER
  // 124 BPM Cyberpunk / Esports Driving Soundtrack
  // ========================================================
  private isHeadphonePlaying = false;
  private musicIntervalId: number | null = null;
  private musicMasterGain: GainNode | null = null;
  private beatStep = 0;
  private onBeatCb: ((step: number) => void) | null = null;

  public isMusicPlaying(): boolean {
    return this.isHeadphonePlaying;
  }

  public startHeadphoneMusic(onBeat?: (step: number) => void): boolean {
    if (!this.ctx) this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (this.isHeadphonePlaying) return true;
    this.isHeadphonePlaying = true;
    this.onBeatCb = onBeat || null;
    this.beatStep = 0;

    // Headphone Master Output with limiter
    this.musicMasterGain = this.ctx.createGain();
    this.musicMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.musicMasterGain.gain.linearRampToValueAtTime(0.24, this.ctx.currentTime + 0.8);
    this.musicMasterGain.connect(this.ctx.destination);

    // 124 BPM -> 16th note = ~121 ms (0.1209s)
    const stepIntervalMs = (60 / 124 / 4) * 1000;

    // D-minor Bass & Arp notes
    const bassNotes = [36.71, 36.71, 43.65, 38.89, 41.2, 41.2, 43.65, 36.71]; // D1, F1, G1, etc.
    const arpScale = [293.66, 349.23, 440.0, 523.25, 587.33, 698.46, 880.0]; // D4, F4, A4, C5, D5, F5, A5

    this.musicIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicMasterGain) return;
      const t = this.ctx.currentTime;
      const step = this.beatStep % 16;
      const barStep = this.beatStep % 64;

      // 1. Kick Drum on beats 0, 4, 8, 12 (Four-on-the-floor)
      if (step % 4 === 0) {
        try {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(140, t);
          kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.08);
          kickGain.gain.setValueAtTime(0.35, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicMasterGain);
          kickOsc.start(t);
          kickOsc.stop(t + 0.16);
        } catch {}
      }

      // 2. Snare / Clap on beats 4 and 12
      if (step === 4 || step === 12) {
        try {
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(220, t);
          snareOsc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
          snareGain.gain.setValueAtTime(0.2, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          snareOsc.connect(snareGain);
          snareGain.connect(this.musicMasterGain);
          snareOsc.start(t);
          snareOsc.stop(t + 0.12);
        } catch {}
      }

      // 3. Crisp Hi-Hats on every off-beat 16th
      if (step % 2 === 1) {
        try {
          const hatOsc = this.ctx.createOscillator();
          const hatGain = this.ctx.createGain();
          hatOsc.type = 'highpass' as unknown as OscillatorType;
          hatOsc.type = 'square';
          hatOsc.frequency.setValueAtTime(7000, t);
          hatGain.gain.setValueAtTime(0.04, t);
          hatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
          hatOsc.connect(hatGain);
          hatGain.connect(this.musicMasterGain);
          hatOsc.start(t);
          hatOsc.stop(t + 0.04);
        } catch {}
      }

      // 4. Heavy Driving Sawtooth Bassline
      if (step % 2 === 0) {
        try {
          const bassNoteIndex = Math.floor(barStep / 8) % bassNotes.length;
          const freq = bassNotes[bassNoteIndex];
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          const bassFilt = this.ctx.createBiquadFilter();

          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(freq, t);

          bassFilt.type = 'lowpass';
          bassFilt.frequency.setValueAtTime(600, t);
          bassFilt.frequency.exponentialRampToValueAtTime(140, t + 0.18);
          bassFilt.Q.setValueAtTime(4.0, t);

          bassGain.gain.setValueAtTime(0.22, t);
          bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

          bassOsc.connect(bassFilt);
          bassFilt.connect(bassGain);
          bassGain.connect(this.musicMasterGain);
          bassOsc.start(t);
          bassOsc.stop(t + 0.2);
        } catch {}
      }

      // 5. Arpeggiator Lead Synth (Dynamic cyberpunk melodic flourish)
      try {
        const arpIndex = (step * 3 + Math.floor(barStep / 4)) % arpScale.length;
        const arpFreq = arpScale[arpIndex];
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        const arpFilt = this.ctx.createBiquadFilter();

        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(arpFreq, t);

        arpFilt.type = 'bandpass';
        arpFilt.frequency.setValueAtTime(1200 + Math.sin(this.beatStep * 0.2) * 600, t);
        arpFilt.Q.setValueAtTime(3.0, t);

        arpGain.gain.setValueAtTime(0.09, t);
        arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        arpOsc.connect(arpFilt);
        arpFilt.connect(arpGain);
        arpGain.connect(this.musicMasterGain);
        arpOsc.start(t);
        arpOsc.stop(t + 0.14);
      } catch {}

      // Trigger beat callback for visual 3D headphone pulsing
      if (this.onBeatCb && step % 4 === 0) {
        this.onBeatCb(this.beatStep);
      }

      this.beatStep++;
    }, stepIntervalMs);

    return true;
  }

  public stopHeadphoneMusic() {
    if (!this.isHeadphonePlaying) return;
    this.isHeadphonePlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
      setTimeout(() => {
        if (this.musicMasterGain) {
          this.musicMasterGain.disconnect();
          this.musicMasterGain = null;
        }
      }, 500);
    }
  }

  public get isHeadphonesPlaying(): boolean {
    return this.isHeadphonePlaying;
  }

  public toggleHeadphoneMusic(onBeat?: (step: number) => void): boolean {
    if (this.isHeadphonePlaying) {
      this.stopHeadphoneMusic();
      return false;
    } else {
      return this.startHeadphoneMusic(onBeat);
    }
  }
}

export const soundscape = new CinematicSoundscape();
