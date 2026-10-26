/**
 * AURA MOTORS - Web Audio API Procedural Sound Engine
 * Synthesizes engine revs, ambient showroom acoustic hum, hydraulic door sounds, and UI feedback
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
    
    // Ambient sound nodes
    this.ambientGain = null;
    this.ambientOsc = null;
    this.ambientFilter = null;
    
    // Engine sound nodes
    this.isRevving = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
      this.startAmbientShowroom();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Continuous gentle acoustic ambiance: low showroom air circulation and subtle high harmonic tone
   */
  startAmbientShowroom() {
    if (!this.ctx || this.isMuted) return;

    // Pinkish/Brown noise buffer for soft architectural air wash
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Gentle low-pass filter
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);

    whiteNoise.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);
    whiteNoise.start();

    // Subtle harmonic room tone (55Hz sub + 110Hz warmth)
    const hum = this.ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(55, this.ctx.currentTime);
    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    hum.connect(humGain);
    humGain.connect(this.ambientGain);
    hum.start();
  }

  /**
   * Procedural Twin-Turbo V8 Engine Rev:
   * Dynamic oscillator mix with waveshaper distortion and resonant throat filter
   */
  playEngineRev() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isRevving) return;
    this.isRevving = true;

    const t = this.ctx.currentTime;
    const duration = 2.4;

    // Master engine gain
    const engineGain = this.ctx.createGain();
    engineGain.gain.setValueAtTime(0.01, t);
    engineGain.gain.exponentialRampToValueAtTime(0.35, t + 0.35);
    engineGain.gain.exponentialRampToValueAtTime(0.45, t + 0.9);
    engineGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    engineGain.connect(this.ctx.destination);

    // Distortion wave shaper for exhaust throat growl
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(18);
    distortion.oversample = '4x';
    distortion.connect(engineGain);

    // Primary V8 Low Freq Oscillator
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(75, t); // Idle
    osc1.frequency.exponentialRampToValueAtTime(340, t + 0.7); // Rev peak
    osc1.frequency.exponentialRampToValueAtTime(390, t + 1.1); // Shift/hold
    osc1.frequency.exponentialRampToValueAtTime(80, t + duration);

    // Secondary sub-harmonic
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(38, t);
    osc2.frequency.exponentialRampToValueAtTime(170, t + 0.7);
    osc2.frequency.exponentialRampToValueAtTime(40, t + duration);

    // Resonant exhaust filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.8);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration);
    filter.Q.setValueAtTime(3.5, t);

    // Turbo wastegate whoosh / blowoff valve at release
    setTimeout(() => {
      this.playTurboWhoosh();
    }, 1100);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(distortion);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);

    setTimeout(() => {
      this.isRevving = false;
    }, duration * 1000);
  }

  playTurboWhoosh() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 0.6;
    
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    for (let i = 0; i < out.length; i++) {
      out[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + dur);
    filter.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  playDoorSound(isOpen) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const dur = 0.5;

    // Pneumatic hydraulic strut hiss
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    for (let i = 0; i < out.length; i++) {
      out[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isOpen ? 600 : 1200, t);
    filter.frequency.exponentialRampToValueAtTime(isOpen ? 1400 : 400, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);

    // Mechanical latch click
    this.playClick(isOpen ? 1200 : 800);
  }

  playClick(pitch = 1400) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, t + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
}

export const sound = new SoundEngine();
