// Procedural sound via WebAudio — no external audio files, fully self-contained.
// The AudioContext is created lazily and only played once RUNNING, so autoplay
// policy never surfaces a console error (it logs at most a benign warning).

export class Sfx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  _ensure() {
    if (this.ctx || !this.enabled) return this.ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
      else this.enabled = false;
    } catch {
      this.enabled = false;
    }
    return this.ctx;
  }

  resume() {
    const c = this._ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  blip(freq, dur = 0.08, type = 'square', gain = 0.04) {
    if (!this.enabled) return;
    const c = this._ensure();
    if (!c || c.state !== 'running') return; // never touch a suspended context
    try {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(c.destination);
      const t = c.currentTime;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    } catch {
      /* an audio hiccup must never break the game loop */
    }
  }

  shoot() { this.blip(660, 0.05, 'square', 0.025); }
  hit() { this.blip(190, 0.11, 'sawtooth', 0.045); }
  explode() { this.blip(90, 0.2, 'triangle', 0.06); }
}
