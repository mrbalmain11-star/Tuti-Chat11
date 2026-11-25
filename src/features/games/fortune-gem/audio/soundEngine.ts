// Web Audio API Sound Synthesizer for Fortune Gem Slot
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private spinOsc: OscillatorNode | null = null;
  private spinGain: GainNode | null = null;
  private spinLfo: OscillatorNode | null = null;
  private spinLfoGain: GainNode | null = null;

  constructor() {
    // Initialized on first user interaction
  }

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
    } catch {
      this.ctx = null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpinLoop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public startSpinLoop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopSpinLoop();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);

    // Rapid rhythmic modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(14, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(40, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();

    this.spinOsc = osc;
    this.spinGain = gain;
    this.spinLfo = lfo;
    this.spinLfoGain = lfoGain;
  }

  public stopSpinLoop() {
    if (this.spinLfo) {
      try {
        this.spinLfo.stop();
        this.spinLfo.disconnect();
      } catch {}
      this.spinLfo = null;
    }
    if (this.spinLfoGain) {
      try {
        this.spinLfoGain.disconnect();
      } catch {}
      this.spinLfoGain = null;
    }
    if (this.spinOsc) {
      try {
        this.spinOsc.stop();
        this.spinOsc.disconnect();
      } catch {}
      this.spinOsc = null;
    }
    if (this.spinGain) {
      try {
        this.spinGain.disconnect();
      } catch {}
      this.spinGain = null;
    }
  }

  public playReelStop(reelIndex: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 160 + reelIndex * 35;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // Add metallic click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(800 + reelIndex * 150, now);
    clickGain.gain.setValueAtTime(0.12, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start(now);
    click.stop(now + 0.04);
  }

  public playSpecialReelStop(isHighMultiplier: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = isHighMultiplier ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  public playWinChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.25, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.35);
    });
  }

  public playBigWinFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [
      [261.63, 329.63, 392.0], // C major
      [329.63, 392.0, 523.25], // C/E
      [392.0, 493.88, 587.33], // G major
      [523.25, 659.25, 783.99, 1046.5], // High C triumph
    ];

    chords.forEach((chord, chordIdx) => {
      const time = this.ctx!.currentTime + chordIdx * 0.22;
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(time);
        osc.stop(time + 0.45);
      });
    });
  }

  public playCoinTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playWheelTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playWheelWin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];

    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }
}

export const soundEngine = new SoundEngine();
