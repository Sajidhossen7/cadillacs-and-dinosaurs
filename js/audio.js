// ============================================================================
// CPS-1 QSOUND INSPIRED WEBAUDIO SYNTHESIZER & SFX ENGINE
// ============================================================================

class ArcadeAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicTimer = null;
    this.currentTrack = null;
    this.step = 0;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.65;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.26;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.78;
    this.sfxGain.connect(this.masterGain);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.65 : 0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // Helper: create noise buffer
  createNoiseBuffer(duration = 0.3) {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playTone(freq, endFreq, duration, type = 'sawtooth', vol = 0.4, dest = null) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(dest || this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playNoise(duration = 0.15, filterFreq = 1200, filterType = 'bandpass', vol = 0.5) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  // --- Arcade Sound Effects ---
  sfxSwing() {
    this.playNoise(0.08, 900, 'bandpass', 0.25);
    this.playTone(260, 90, 0.08, 'triangle', 0.2);
  }

  sfxHitLight() {
    this.playNoise(0.09, 1600, 'lowpass', 0.55);
    this.playTone(190, 55, 0.1, 'square', 0.42);
  }

  sfxHitHeavy() {
    this.playNoise(0.22, 850, 'lowpass', 0.85);
    this.playTone(150, 32, 0.24, 'sawtooth', 0.65);
    this.playTone(320, 48, 0.18, 'square', 0.4);
  }

  sfxSpecial() {
    this.playTone(240, 880, 0.18, 'sawtooth', 0.45);
    setTimeout(() => this.playTone(880, 180, 0.25, 'square', 0.5), 90);
    this.playNoise(0.28, 1800, 'bandpass', 0.6);
  }

  sfxJump() {
    this.playTone(150, 460, 0.13, 'triangle', 0.26);
  }

  sfxGunshot(weaponType = 'revolver') {
    if (weaponType === 'shotgun') {
      this.playNoise(0.28, 750, 'lowpass', 0.95);
      this.playTone(140, 28, 0.26, 'sawtooth', 0.65);
    } else if (weaponType === 'm16' || weaponType === 'uzi') {
      this.playNoise(0.08, 2200, 'lowpass', 0.58);
      this.playTone(280, 75, 0.08, 'square', 0.45);
    } else if (weaponType === 'bazooka') {
      this.playNoise(0.35, 500, 'lowpass', 0.9);
      this.playTone(110, 42, 0.35, 'sawtooth', 0.6);
    } else {
      // Revolver
      this.playNoise(0.14, 1500, 'lowpass', 0.72);
      this.playTone(240, 50, 0.14, 'sawtooth', 0.5);
    }
  }

  sfxExplosion() {
    this.playNoise(0.55, 420, 'lowpass', 1.0);
    this.playTone(95, 22, 0.5, 'sawtooth', 0.8);
    this.playTone(160, 30, 0.38, 'square', 0.5);
  }

  sfxDinoRoar(big = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const dur = big ? 0.65 : 0.38;
    const base = big ? 115 : 220;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(base * 1.4, now);
    osc.frequency.linearRampToValueAtTime(base * 1.8, now + dur * 0.25);
    osc.frequency.exponentialRampToValueAtTime(base * 0.45, now + dur);

    lfo.frequency.value = 34;
    lfoGain.gain.value = 45;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur);
    lfo.stop(now + dur);

    this.playNoise(dur * 0.8, big ? 500 : 1100, 'bandpass', 0.4);
  }

  sfxCadillacHorn() {
    // Classic 1953 Cadillac dual-note horn + V8 rev
    this.playTone(311.13, 311.13, 0.24, 'sawtooth', 0.4);
    this.playTone(392.00, 392.00, 0.24, 'sawtooth', 0.4);
    setTimeout(() => {
      this.playTone(311.13, 311.13, 0.36, 'sawtooth', 0.45);
      this.playTone(392.00, 392.00, 0.36, 'sawtooth', 0.45);
    }, 270);
    // V8 engine rumble
    this.playTone(65, 145, 0.55, 'sawtooth', 0.45);
  }

  sfxPickup(isFood = false) {
    if (isFood) {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => {
        setTimeout(() => this.playTone(n, n, 0.1, 'triangle', 0.35), i * 55);
      });
    } else {
      this.playTone(587.33, 880, 0.12, 'square', 0.32);
      setTimeout(() => this.playTone(880, 1174.66, 0.14, 'square', 0.32), 70);
    }
  }

  sfxCoin() {
    this.playTone(987.77, 987.77, 0.08, 'square', 0.45);
    setTimeout(() => this.playTone(1318.51, 1318.51, 0.28, 'square', 0.45), 80);
  }

  sfxGoArrow() {
    this.playTone(660, 880, 0.11, 'square', 0.3);
    setTimeout(() => this.playTone(880, 1100, 0.15, 'square', 0.35), 110);
  }

  // --- Procedural CPS-1 Style Chiptune Sequencer ---
  startMusic(trackName = 'stage1') {
    this.init();
    if (this.currentTrack === trackName && this.musicTimer) return;
    this.stopMusic();
    this.currentTrack = trackName;
    this.step = 0;

    const tracks = {
      select: {
        tempo: 135,
        bass: [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98],
        lead: [440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25]
      },
      stage1: {
        tempo: 142,
        bass: [82.41, 82.41, 98.0, 110.0, 82.41, 110.0, 123.47, 110.0, 73.42, 73.42, 87.31, 98.0, 82.41, 82.41, 65.41, 73.42],
        lead: [329.63, 0, 392.0, 440.0, 493.88, 440.0, 392.0, 329.63, 293.66, 0, 349.23, 392.0, 329.63, 0, 246.94, 293.66]
      },
      stage2: {
        tempo: 158,
        bass: [98.0, 98.0, 98.0, 116.54, 130.81, 130.81, 116.54, 98.0, 87.31, 87.31, 98.0, 116.54, 146.83, 130.81, 116.54, 98.0],
        lead: [392.0, 466.16, 523.25, 0, 587.33, 523.25, 466.16, 392.0, 349.23, 392.0, 466.16, 523.25, 587.33, 0, 698.46, 587.33]
      },
      stage3: {
        tempo: 150,
        bass: [73.42, 73.42, 87.31, 73.42, 110.0, 103.83, 98.0, 87.31, 65.41, 65.41, 77.78, 87.31, 82.41, 77.78, 73.42, 65.41],
        lead: [293.66, 349.23, 440.0, 415.30, 392.0, 349.23, 293.66, 0, 261.63, 311.13, 392.0, 349.23, 329.63, 311.13, 293.66, 0]
      },
      boss: {
        tempo: 168,
        bass: [65.41, 69.30, 65.41, 77.78, 65.41, 69.30, 87.31, 82.41, 65.41, 69.30, 65.41, 77.78, 98.0, 92.50, 87.31, 77.78],
        lead: [523.25, 554.37, 523.25, 622.25, 523.25, 554.37, 698.46, 659.25, 523.25, 0, 622.25, 554.37, 783.99, 739.99, 698.46, 622.25]
      }
    };

    const spec = tracks[trackName] || tracks.stage1;
    const stepMs = Math.floor((60000 / spec.tempo) / 2);

    this.musicTimer = setInterval(() => {
      if (!this.enabled || !this.ctx || document.hidden) return;
      const idx = this.step % spec.bass.length;
      const bassNote = spec.bass[idx];
      const leadNote = spec.lead[idx];

      // FM Bass
      if (bassNote > 0) {
        this.playTone(bassNote, bassNote * 0.98, stepMs * 0.00085, 'sawtooth', 0.35, this.musicGain);
      }
      // Lead Synth
      if (leadNote > 0) {
        this.playTone(leadNote, leadNote * 1.005, stepMs * 0.00075, 'square', 0.18, this.musicGain);
      }
      // Arcade Drum beat
      if (this.step % 4 === 0) {
        // Kick
        this.playTone(120, 34, 0.09, 'sine', 0.45, this.musicGain);
      } else if (this.step % 4 === 2) {
        // Snare
        this.playNoise(0.07, 1600, 'bandpass', 0.18);
      }

      this.step++;
    }, stepMs);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

window.arcadeAudio = new ArcadeAudioEngine();
