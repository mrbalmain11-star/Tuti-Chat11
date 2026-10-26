/**
 * Web Audio sound synthesizer - completely muted by user preference
 * All sound effects (clicks, coins, recharge, profile changes, VIP, fanfares) are silenced.
 */

class SoundEffects {
  playClick(): void {}
  playCoinChime(): void {}
  playCoin(): void {}
  playGiftFanfare(): void {}
  playMicConnect(): void {}
  playLevelUp(): void {}
  playSuccess(): void {}
  playError(): void {}
}

export const sounds = new SoundEffects();
