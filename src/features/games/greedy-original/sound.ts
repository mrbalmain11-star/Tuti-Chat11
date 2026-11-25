// Web Audio API procedural sound synthesizer with gentle, calming effects and relaxing background music

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = false;
  private musicInterval: NodeJS.Timeout | null = null;
  private musicMasterGain: GainNode | null = null;
  private musicStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  public dispose() {
    this.stopBgMusic();
    this.musicEnabled = false;
    const context = this.ctx;
    this.ctx = null;
    if (context) void context.close().catch(() => {});
  }

  // Toggle sound effects on/off
  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Toggle background music on/off
  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startBgMusic();
    } else {
      this.stopBgMusic();
    }
    return this.musicEnabled;
  }

  // Calming, pleasant background music synthesized in real-time (موسيقى هادئة ولطيفة)
  // Plays warm, relaxing pentatonic bell / electric piano arpeggios at a gentle whisper volume
  public startBgMusic() {
    if (!this.musicEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.musicInterval) return; // already playing

    if (!this.musicMasterGain) {
      this.musicMasterGain = this.ctx.createGain();
      this.musicMasterGain.gain.setValueAtTime(0.045, this.ctx.currentTime); // very gentle, unobtrusive level
      this.musicMasterGain.connect(this.ctx.destination);
    }

    // Relaxing musical sequence (Pentatonic C Major / A Minor: C4, E4, G4, A4, B4, C5, D5, E5)
    const melodyPattern = [
      [261.63, 392.00, 523.25], // C4, G4, C5 (C Major)
      [329.63, 493.88],         // E4, B4
      [220.00, 329.63, 440.00], // A3, E4, A4 (A Minor)
      [349.23, 440.00, 523.25], // F4, A4, C5 (F Major)
      [261.63, 329.63, 392.00], // C4, E4, G4
      [293.66, 440.00, 587.33], // D4, A4, D5
      [196.00, 293.66, 392.00], // G3, D4, G4 (G Major)
      [329.63, 523.25],         // E4, C5
    ];

    this.musicInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx || !this.musicMasterGain) return;
      if (this.ctx.state === 'suspended') return;

      const chord = melodyPattern[this.musicStep % melodyPattern.length];
      this.musicStep++;

      chord.forEach((freq, noteIdx) => {
        if (!this.ctx || !this.musicMasterGain) return;
        const noteTime = this.ctx.currentTime + noteIdx * 0.14;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Warm, soft sine waves with subtle warmth
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Gentle low-pass filter to make it mellow and soft
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, noteTime);

        // Smooth acoustic envelope (no clicking, soft fade)
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.08, noteTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicMasterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 1.25);
      });
    }, 1100);
  }

  public stopBgMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Soft, pleasant chip selection (gentle marimba note)
  public playChipSelect() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.04); // D6

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Gentle, musical coin drop sound
  public playBetPlace() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.50, t); // C6
    osc1.frequency.exponentialRampToValueAtTime(1318.51, t + 0.06); // E6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, t); // G6
    osc2.frequency.exponentialRampToValueAtTime(2093.00, t + 0.06); // C7

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.12);
    osc2.stop(t + 0.12);
  }

  // Soft, pleasant wooden tick during spinning (بدون إزعاج)
  public playWheelTick(_speed: number = 1) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Sweet, serene victory chime (ألحان ناعمة عند الفوز)
  public playWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Gentle ascending pentatonic arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // Soft pulse for countdown (لا صوت مزعج)
  public playCountdownBeep(highPitch: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(highPitch ? 659.25 : 523.25, t);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }
}

export const sound = new SoundManager();
