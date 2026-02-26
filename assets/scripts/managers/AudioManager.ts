/**
 * AudioManager - 音效与 BGM (占位)
 * 实际可接 Cocos AudioSource / Web Audio
 */

import { _decorator } from 'cc';

export class AudioManager {
  private static _instance: AudioManager;

  static get instance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  playMerge() {
    try {
      if (typeof (window as any).AudioContext !== 'undefined') {
        const ctx = new (window as any).AudioContext();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 600;
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.1);
      }
    } catch (_) {}
  }

  playCoin() {
    try {
      if (typeof (window as any).AudioContext !== 'undefined') {
        const ctx = new (window as any).AudioContext();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.08);
      }
    } catch (_) {}
  }

  playBGM() {
    // 占位：可挂载 loop 的 BGM
  }

  stopBGM() {}

  playBreedSuccess() {
    try {
      if (typeof (window as any).AudioContext !== 'undefined') {
        const ctx = new (window as any).AudioContext();
        [523, 659, 784].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.08, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          o.start(ctx.currentTime + i * 0.08);
          o.stop(ctx.currentTime + i * 0.08 + 0.15);
        });
      }
    } catch (_) {}
  }
}
