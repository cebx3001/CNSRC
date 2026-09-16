export type AudioScene =
  | "hero"
  | "sum"
  | "b2w"
  | "monarca"
  | "brown"
  | "tridifect"
  | "convergence"
  | "capacity"
  | "project-mall"
  | "project-campaign"
  | "project-corporate"
  | "finale";

type GestureType = "signal" | "physical" | "spatial" | "material" | "integrated" | "project" | "finale";

type SceneProfile = {
  frequency: number;
  air: number;
  shimmer: number;
  resonance: number;
  gesture: GestureType;
};

const SCENE_PROFILES: Record<AudioScene, SceneProfile> = {
  hero: { frequency: 46, air: 0.082, shimmer: 0.022, resonance: 0.7, gesture: "material" },
  sum: { frequency: 52, air: 0.078, shimmer: 0.021, resonance: 1.2, gesture: "integrated" },
  b2w: { frequency: 62, air: 0.07, shimmer: 0.019, resonance: 2.4, gesture: "signal" },
  monarca: { frequency: 43, air: 0.086, shimmer: 0.022, resonance: 1.1, gesture: "physical" },
  brown: { frequency: 55, air: 0.094, shimmer: 0.026, resonance: 4.2, gesture: "spatial" },
  tridifect: { frequency: 38, air: 0.078, shimmer: 0.02, resonance: 1.8, gesture: "material" },
  convergence: { frequency: 48, air: 0.092, shimmer: 0.026, resonance: 3.4, gesture: "integrated" },
  capacity: { frequency: 44, air: 0.076, shimmer: 0.019, resonance: 1.4, gesture: "signal" },
  "project-mall": { frequency: 41, air: 0.09, shimmer: 0.024, resonance: 2.2, gesture: "project" },
  "project-campaign": { frequency: 47, air: 0.094, shimmer: 0.026, resonance: 1.7, gesture: "project" },
  "project-corporate": { frequency: 39, air: 0.088, shimmer: 0.024, resonance: 3.1, gesture: "project" },
  finale: { frequency: 36, air: 0.074, shimmer: 0.018, resonance: 3.8, gesture: "finale" },
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export class CnsrcAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private bed: GainNode | null = null;
  private bedFilter: BiquadFilterNode | null = null;
  private air: GainNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  private shimmer: GainNode | null = null;
  private shimmerFilter: BiquadFilterNode | null = null;
  private reverbSend: GainNode | null = null;
  private delaySend: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private modulationOscillators: OscillatorNode[] = [];
  private noises: AudioBufferSourceNode[] = [];
  private enabled = false;
  private currentScene: AudioScene = "hero";
  private lastSceneProgress = 0;
  private lastGestureAt = 0;
  private lastGlobalProgress = 0;
  private reducedMotion = false;

  async start() {
    if (!this.context) this.createGraph();
    if (!this.context || !this.master) return;

    await this.context.resume();
    this.enabled = true;

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.52, now + 0.55);
    this.applyProfile(this.currentScene, 0.7);

    if (this.bed) this.bed.gain.setTargetAtTime(0.12, now, 0.45);
    if (this.shimmer) this.shimmer.gain.setTargetAtTime(SCENE_PROFILES[this.currentScene].shimmer, now, 0.65);
  }

  setMuted(muted: boolean) {
    if (!this.context || !this.master) return;

    this.enabled = !muted;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.52, now + (muted ? 0.22 : 0.5));

    if (!muted && this.context.state === "suspended") void this.context.resume();
  }

  setGlobalState(progress: number, velocity: number) {
    if (!this.enabled || !this.context || !this.bedFilter || !this.airFilter || !this.shimmerFilter) return;

    const now = this.context.currentTime;
    const speed = clamp(Math.abs(velocity) / 2800);
    const direction = progress >= this.lastGlobalProgress ? 1 : -1;
    this.lastGlobalProgress = progress;

    this.bedFilter.frequency.setTargetAtTime(420 + speed * 520 + progress * 170, now, 0.4);
    this.airFilter.frequency.setTargetAtTime(850 + speed * 950 + (direction > 0 ? 100 : 0), now, 0.36);
    this.shimmerFilter.frequency.setTargetAtTime(2100 + speed * 1500 + progress * 420, now, 0.5);
  }

  setSceneState(scene: AudioScene, progress: number, velocity: number, density: number) {
    if (!this.enabled || !this.context || !this.air || !this.bed || !this.shimmer) return;
    if (scene !== this.currentScene) this.enterScene(scene);

    const now = this.context.currentTime;
    const profile = SCENE_PROFILES[scene];
    const speed = clamp(Math.abs(velocity) / 2400);
    const calm = 1 - speed;
    const shapedDensity = clamp(density);
    const arc = Math.sin(progress * Math.PI);

    this.air.gain.setTargetAtTime(
      profile.air * (0.82 + shapedDensity * 0.28) * (0.88 + calm * 0.12),
      now,
      0.5,
    );

    this.bed.gain.setTargetAtTime(
      0.105 + shapedDensity * 0.032 + arc * 0.012 - speed * 0.008,
      now,
      0.6,
    );

    this.shimmer.gain.setTargetAtTime(
      profile.shimmer * (0.86 + shapedDensity * 0.32 + calm * 0.08),
      now,
      0.75,
    );

    const crossed = [0.2, 0.55, 0.84].some((threshold) =>
      (this.lastSceneProgress < threshold && progress >= threshold) ||
      (this.lastSceneProgress > threshold && progress <= threshold),
    );

    const gestureGap = speed > 0.62 ? 900 : 620;
    if (crossed && performance.now() - this.lastGestureAt > gestureGap) {
      this.triggerGesture(profile.gesture, this.reducedMotion ? 0.22 : 0.26 + shapedDensity * 0.14);
    }

    this.lastSceneProgress = progress;
  }

  enterScene(scene: AudioScene) {
    if (!this.enabled || !this.context) {
      this.currentScene = scene;
      return;
    }
    if (scene === this.currentScene) return;

    this.currentScene = scene;
    this.lastSceneProgress = 0;
    this.applyProfile(scene, 1.35);

    const profile = SCENE_PROFILES[scene];
    const intensity = scene === "convergence" || scene === "finale" ? 0.38 : 0.3;
    this.triggerGesture(profile.gesture, intensity);
  }

  destroy() {
    this.oscillators.forEach((oscillator) => oscillator.stop());
    this.modulationOscillators.forEach((oscillator) => oscillator.stop());
    this.noises.forEach((noise) => noise.stop());
    void this.context?.close();
    this.context = null;
  }

  private createGraph() {
    const AudioContextConstructor = window.AudioContext ??
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextConstructor();
    this.context = context;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    master.gain.value = 0;
    compressor.threshold.value = -20;
    compressor.knee.value = 14;
    compressor.ratio.value = 2.2;
    compressor.attack.value = 0.03;
    compressor.release.value = 0.5;
    master.connect(compressor).connect(context.destination);
    this.master = master;

    const reverb = context.createConvolver();
    reverb.buffer = this.createImpulseResponse(context, 3.2, 2.5);
    const reverbReturn = context.createGain();
    reverbReturn.gain.value = 0.18;
    reverb.connect(reverbReturn).connect(master);

    const reverbSend = context.createGain();
    reverbSend.gain.value = 0.24;
    reverbSend.connect(reverb);
    this.reverbSend = reverbSend;

    const delay = context.createDelay(0.8);
    delay.delayTime.value = 0.24;
    const delayFeedback = context.createGain();
    delayFeedback.gain.value = 0.12;
    const delayReturn = context.createGain();
    delayReturn.gain.value = 0.07;
    delay.connect(delayFeedback).connect(delay);
    delay.connect(delayReturn).connect(master);

    const delaySend = context.createGain();
    delaySend.gain.value = 0.13;
    delaySend.connect(delay);
    this.delaySend = delaySend;

    const bedFilter = context.createBiquadFilter();
    bedFilter.type = "lowpass";
    bedFilter.frequency.value = 520;
    bedFilter.Q.value = 0.55;
    const bedPanner = context.createStereoPanner();
    const bed = context.createGain();
    bed.gain.value = 0.12;
    bedFilter.connect(bedPanner).connect(bed).connect(master);
    bed.connect(reverbSend);
    this.bedFilter = bedFilter;
    this.bed = bed;

    const bedRatios = [1, 1.5, 2.01, 4.02, 6.03];
    const bedLevels = [0.3, 0.14, 0.09, 0.055, 0.035];
    bedRatios.forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = SCENE_PROFILES.hero.frequency * ratio;
      const gain = context.createGain();
      gain.gain.value = bedLevels[index];
      oscillator.connect(gain).connect(bedFilter);
      oscillator.start();
      this.oscillators.push(oscillator);
    });

    const bedPanLfo = context.createOscillator();
    const bedPanDepth = context.createGain();
    bedPanLfo.frequency.value = 0.028;
    bedPanDepth.gain.value = 0.52;
    bedPanLfo.connect(bedPanDepth).connect(bedPanner.pan);
    bedPanLfo.start();
    this.modulationOscillators.push(bedPanLfo);

    const airNoise = context.createBufferSource();
    airNoise.buffer = this.createAmbientNoise(context, 5, 0.34);
    airNoise.loop = true;
    const airFilter = context.createBiquadFilter();
    airFilter.type = "bandpass";
    airFilter.frequency.value = 1050;
    airFilter.Q.value = 0.55;
    const airPanner = context.createStereoPanner();
    const air = context.createGain();
    air.gain.value = SCENE_PROFILES.hero.air;
    airNoise.connect(airFilter).connect(airPanner).connect(air).connect(master);
    air.connect(reverbSend);
    this.air = air;
    this.airFilter = airFilter;

    const shimmerNoise = context.createBufferSource();
    shimmerNoise.buffer = this.createAmbientNoise(context, 5, 0.58);
    shimmerNoise.loop = true;
    const shimmerFilter = context.createBiquadFilter();
    shimmerFilter.type = "highpass";
    shimmerFilter.frequency.value = 2300;
    shimmerFilter.Q.value = 0.38;
    const shimmerPanner = context.createStereoPanner();
    const shimmer = context.createGain();
    shimmer.gain.value = SCENE_PROFILES.hero.shimmer;
    shimmerNoise.connect(shimmerFilter).connect(shimmerPanner).connect(shimmer).connect(master);
    shimmer.connect(reverbSend);
    shimmer.connect(delaySend);
    this.shimmer = shimmer;
    this.shimmerFilter = shimmerFilter;

    const airPanLfo = context.createOscillator();
    const airPanDepth = context.createGain();
    airPanLfo.frequency.value = 0.043;
    airPanDepth.gain.value = 0.65;
    airPanLfo.connect(airPanDepth).connect(airPanner.pan);
    airPanLfo.start();
    this.modulationOscillators.push(airPanLfo);

    const shimmerPanLfo = context.createOscillator();
    const shimmerPanDepth = context.createGain();
    shimmerPanLfo.frequency.value = 0.019;
    shimmerPanDepth.gain.value = -0.58;
    shimmerPanLfo.connect(shimmerPanDepth).connect(shimmerPanner.pan);
    shimmerPanLfo.start();
    this.modulationOscillators.push(shimmerPanLfo);

    airNoise.start();
    shimmerNoise.start();
    this.noises.push(airNoise, shimmerNoise);
  }

  private applyProfile(scene: AudioScene, glide: number) {
    if (!this.context || !this.bedFilter || !this.airFilter || !this.shimmerFilter || !this.air || !this.shimmer) return;

    const now = this.context.currentTime;
    const profile = SCENE_PROFILES[scene];
    const ratios = [1, 1.5, 2.01, 4.02, 6.03];

    this.oscillators.forEach((oscillator, index) => {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(profile.frequency * ratios[index], now, glide);
    });

    this.bedFilter.Q.setTargetAtTime(0.5 + profile.resonance * 0.1, now, glide * 0.7);
    this.airFilter.Q.setTargetAtTime(0.48 + profile.resonance * 0.08, now, glide * 0.7);
    this.shimmerFilter.Q.setTargetAtTime(0.32 + profile.resonance * 0.045, now, glide);
    this.air.gain.setTargetAtTime(profile.air, now, glide);
    this.shimmer.gain.setTargetAtTime(profile.shimmer, now, glide);

    if (this.reverbSend) {
      this.reverbSend.gain.setTargetAtTime(0.2 + clamp(profile.resonance / 6) * 0.12, now, glide);
    }
    if (this.delaySend) {
      this.delaySend.gain.setTargetAtTime(0.1 + clamp(profile.resonance / 7) * 0.08, now, glide);
    }
  }

  private triggerGesture(type: GestureType, intensity: number) {
    if (!this.enabled || !this.context || !this.master) return;

    this.lastGestureAt = performance.now();
    const context = this.context;
    const now = context.currentTime;
    const profile = SCENE_PROFILES[this.currentScene];
    const level = clamp(intensity, 0.12, 0.55) * 0.045;

    const multipliers: Record<GestureType, number> = {
      signal: 7.4,
      physical: 4.6,
      spatial: 9.2,
      material: 3.8,
      integrated: 6.1,
      project: 5.2,
      finale: 3.4,
    };

    const durations: Record<GestureType, number> = {
      signal: 0.11,
      physical: 0.16,
      spatial: 0.2,
      material: 0.15,
      integrated: 0.18,
      project: 0.16,
      finale: 0.24,
    };

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    const frequency = Math.max(120, Math.min(920, profile.frequency * multipliers[type]));
    oscillator.type = type === "signal" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now);

    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = type === "signal" ? 1.7 : 0.9;
    panner.pan.value = type === "spatial" ? Math.random() * 0.9 - 0.45 : Math.random() * 0.34 - 0.17;

    const duration = durations[type];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter).connect(gain).connect(panner).connect(this.master);
    if (this.reverbSend) panner.connect(this.reverbSend);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  private createAmbientNoise(context: AudioContext, seconds: number, brightness: number) {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let smooth = 0;

    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      smooth = smooth * 0.9 + white * 0.1;
      data[index] = smooth * (1 - brightness) + white * brightness * 0.52;
    }

    return buffer;
  }

  private createImpulseResponse(context: AudioContext, duration: number, decay: number) {
    const length = Math.floor(context.sampleRate * duration);
    const impulse = context.createBuffer(2, length, context.sampleRate);

    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const envelope = Math.pow(1 - index / length, decay);
        data[index] = (Math.random() * 2 - 1) * envelope * 0.55 * (channel === 0 ? 1 : 0.96);
      }
    }

    return impulse;
  }
}
