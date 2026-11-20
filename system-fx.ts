// app/system-fx.ts
"use client";

class SystemSoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private getCtx(): AudioContext | null {
    if (this.muted || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Crystalline high-frequency tap click
  playTap() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1060, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.032);
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Dual-oscillator low-end sub-bass surge/thump
  playBassHit(intensity: "LIGHT" | "HEAVY" = "LIGHT") {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const primary = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const heavy = intensity === "HEAVY";
    const startFreq = heavy ? 148 : 98;
    const endFreq = heavy ? 30 : 42;
    const dur = heavy ? 0.66 : 0.24;
    const peak = heavy ? 0.46 : 0.23;

    primary.type = "sine";
    primary.frequency.setValueAtTime(startFreq, now);
    primary.frequency.exponentialRampToValueAtTime(endFreq, now + dur * 0.86);

    sub.type = "triangle";
    sub.frequency.setValueAtTime(startFreq * 0.5, now);
    sub.frequency.exponentialRampToValueAtTime(Math.max(22, endFreq * 0.72), now + dur * 0.86);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(heavy ? 300 : 215, now);
    filter.frequency.exponentialRampToValueAtTime(70, now + dur);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    primary.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    primary.start(now);
    sub.start(now);
    primary.stop(now + dur + 0.03);
    sub.stop(now + dur + 0.03);
  }

  // Harmonic chime for milestones & completions
  playSuccess() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.11, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.27);
    });
  }
}

export const soundEngine = new SystemSoundEngine();
