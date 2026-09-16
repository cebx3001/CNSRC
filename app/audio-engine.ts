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

type SceneProfile = {
  frequency: number;
  air: number;
  resonance: number;
  gesture: "signal" | "physical" | "spatial" | "material" | "integrated" | "project" | "finale";
};

const SCENE_PROFILES: Record<AudioScene, SceneProfile> = {
  hero: { frequency: 46, air: 0.024, resonance: 0.7, gesture: "material" },
  sum: { frequency: 52, air: 0.022, resonance: 1.2, gesture: "integrated" },
  b2w: { frequency: 62, air: 0.018, resonance: 2.4, gesture: "signal" },
  monarca: { frequency: 43, air: 0.026, resonance: 1.1, gesture: "physical" },
  brown: { frequency: 55, air: 0.032, resonance: 4.2, gesture: "spatial" },
  tridifect: { frequency: 38, air: 0.022, resonance: 1.8, gesture: "material" },
  convergence: { frequency: 48, air: 0.03, resonance: 3.4, gesture: "integrated" },
  capacity: { frequency: 44, air: 0.02, resonance: 1.4, gesture: "signal" },
  "project-mall": { frequency: 41, air: 0.03, resonance: 2.2, gesture: "project" },
  "project-campaign": { frequency: 47, air: 0.034, resonance: 1.7, gesture: "project" },
  "project-corporate": { frequency: 39, air: 0.03, resonance: 3.1, gesture: "project" },
  finale: { frequency: 36, air: 0.018, resonance: 3.8, gesture: "finale" },
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
  private noise: AudioBufferSourceNode | null = null;
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
    this.master.gain.linearRampToValueAtTime(0.38, now + 0.8);
    this.applyProfile(this.currentScene, 1.1);
  }

  setMuted(muted: boolean) {
    if (!this.context || !this.master) return;
    this.enabled = !muted;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.38, now + (muted ? 0.28 : 0.7));
    if (!muted && this.context.state === "suspended") void this.context.resume();
  }

  setGlobalState(progress: number, velocity: number) {
    if (!this.enabled || !this.context || !this.bedFilter || !this.airFilter || !this.shimmerFilter) return;
    const now = this.context.currentTime;
    const speed = clamp(Math.abs(velocity) / 2800);
    const direction = progress >= this.lastGlobalProgress ? 1 : -1;
    this.lastGlobalProgress = progress;

    this.bedFilter.frequency.setTargetAtTime(210 + speed * 420 + progress * 120, now, 0.5);
    this.airFilter.frequency.setTargetAtTime(760 + speed * 900 + (direction > 0 ? 80 : 0), now, 0.4);
    this.shimmerFilter.frequency.setTargetAtTime(1850 + speed * 1700 + progress * 350, now, 0.6);
  }

  setSceneState(scene: AudioScene, progress: number, velocity: number, density: number) {
    if (!this.enabled || !this.context || !this.air || !this.bed || !this.shimmer) return;
    if (scene !== this.currentScene) this.enterScene(scene);

    const now = this.context.currentTime;
    const profile = SCENE_PROFILES[scene];
    const speed = clamp(Math.abs(velocity) / 2400);
    const calm = 1 - speed;
    const shapedDensity = clamp(density);
    const breathing = 0.5 + Math.sin(progress * Math.PI) * 0.5;

    this.air.gain.setTargetAtTime(
      profile.air * (0.72 + shapedDensity * 0.38) * (0.78 + calm * 0.22),
      now,
      0.55,
    );
    this.bed.gain.setTargetAtTime(
      0.082 + shapedDensity * 0.032 + breathing * 0.01 - speed * 0.01,
      now,
      0.7,
    );
    this.shimmer.gain.setTargetAtTime(
      0.018 + shapedDensity * 0.018 + calm * 0.006,
      now,
      0.9,
    );

    const crossed = [0.22, 0.58, 0.86].some((threshold) =>
      (this.lastSceneProgress < threshold && progress >= threshold) ||
      (this.lastSceneProgress > threshold && progress <= threshold),
    );
    const gestureGap = speed > 0.62 ? 1000 : 700;
    if (crossed && performance.now() - this.lastGestureAt > gestureGap) {
      this.triggerGesture(profile.gesture, this.reducedMotion ? 0.16 : 0.18 + shapedDensity * 0.12);
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
    this.applyProfile(scene, 1.8);

    const profile = SCENE_PROFILES[scene];
    const intensity = scene === "convergence" || scene === "finale" ? 0.24 : 0.16;
    this.triggerGesture(profile.gesture, intensity);
  }

  destroy() {
    this.oscillators.forEach((oscillator) => oscillator.stop());
    this.modulationOscillators.forEach((oscillator) => oscillator.stop());
    this.noise?.stop();
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
    compressor.threshold.value = -24;
    compressor.knee.value = 16;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.025;
    compressor.release.value = 0.6;
    master.connect(compressor).connect(context.destination);
    this.master = master;

    const reverb = context.createConvolver();
    reverb.buffer = this.createImpulseResponse(context, 3.8, 2.2);
    const reverbReturn = context.createGain();
    reverbReturn.gain.value = 0.34;
    reverb.connect(reverbReturn).connect(master);
    const reverbSend = context.createGain();
    reverbSend.gain.value = 0.62;
    reverbSend.connect(reverb);
    this.reverbSend = reverbSend;

    const delay = context.createDelay(1.2);
    delay.delayTime.value = 0.31;
    const delayFeedback = context.createGain();
    delayFeedback.gain.value = 0.18;
    const delayReturn = context.createGain();
    delayReturn.gain.value = 0.14;
    delay.connect(delayFeedback).connect(delay);
    delay.connect(delayReturn).connect(master);
    const delaySend = context.createGain();
    delaySend.gain.value = 0.28;
    delaySend.connect(delay);
    this.delaySend = delaySend;

    const bedFilter = context.createBiquadFilter();
    bedFilter.type = "lowpass";
    bedFilter.frequency.value = 260;
    bedFilter.Q.value = 0.55;
    const bedPanner = context.createStereoPanner();
    const bed = context.createGain();
    bed.gain.value = 0.09;
    bedFilter.connect(bedPanner).connect(bed).connect(master);
    bed.connect(reverbSend);
    bed.connect(delaySend);
    this.bedFilter = bedFilter;
    this.bed = bed;

    [1, 1.498, 2.01].forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "sine" : index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = SCENE_PROFILES.hero.frequency * ratio;
      const gain = context.createGain();
      gain.gain.value = index === 0 ? 0.3 : index === 1 ? 0.13 : 0.07;
      oscillator.connect(gain).connect(bedFilter);
      oscillator.start();
      this.oscillators.push(oscillator);
    });

    const bedPanLfo = context.createOscillator();
    const bedPanDepth = context.createGain();
    bedPanLfo.frequency.value = 0.035;
    bedPanDepth.gain.value = 0.68;
    bedPanLfo.connect(bedPanDepth).connect(bedPanner.pan);
    bedPanLfo.start();
    this.modulationOscillators.push(bedPanLfo);

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < data.length; index += 1) {
      previous = previous * 0.992 + (Math.random() * 2 - 1) * 0.008;
      data[index] = previous;
    }
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const airFilter = context.createBiquadFilter();
    airFilter.type = "bandpass";
    airFilter.frequency.value = 920;
    airFilter.Q.value = 0.5;
    const airPanner = context.createStereoPanner();
    const air = context.createGain();
    air.gain.value = 0;
    noise.connect(airFilter).connect(airPanner).connect(air).connect(master);
    air.connect(reverbSend);
    this.air = air;
    this.airFilter = airFilter;

    const shimmerFilter = context.createBiquadFilter();
    shimmerFilter.type = "highpass";
    shimmerFilter.frequency.value = 2200;
    shimmerFilter.Q.value = 0.35;
    const shimmerPanner = context.createStereoPanner();
    const shimmer = context.createGain();
    shimmer.gain.value = 0.018;
    noise.connect(shimmerFilter).connect(shimmerPanner).connect(shimmer).connect(master);
    shimmer.connect(reverbSend);
    shimmer.connect(delaySend);
    this.shimmer = shimmer;
    this.shimmerFilter = shimmerFilter;

    const airPanLfo = context.createOscillator();
    const airPanDepth = context.createGain();
    airPanLfo.frequency.value = 0.052;
    airPanDepth.gain.value = 0.8;
    airPanLfo.connect(airPanDepth).connect(airPanner.pan);
    airPanLfo.start();
    this.modulationOscillators.push(airPanLfo);

    const shimmerPanLfo = context.createOscillator();
    const shimmerPanDepth = context.createGain();
    shimmerPanLfo.frequency.value = 0.021;
    shimmerPanDepth.gain.value = -0.72;
    shimmerPanLfo.connect(shimmerPanDepth).connect(shimmerPanner.pan);
    shimmerPanLfo.start();
    this.modulationOscillators.push(shimmerPanLfo);

    noise.start();
    this.noise = noise;
  }

  private applyProfile(scene: AudioScene, glide: number) {
    if (!this.context || !this.bedFilter || !this.airFilter || !this.shimmerFilter || !this.air) return;
    const now = this.context.currentTime;
    const profile = SCENE_PROFILES[scene];
    this.oscillators.forEach((oscillator, index) => {
      const ratios = [1, 1.498, 2.01];
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(profile.frequency * ratios[index], now, glide);
    });
    this.bedFilter.Q.setTargetAtTime(0.5 + profile.resonance * 0.12, now, glide * 0.8);
    this.airFilter.Q.setTargetAtTime(0.45 + profile.resonance * 0.1, now, glide * 0.8);
    this.shimmerFilter.Q.setTargetAtTime(0.3 + profile.resonance * 0.05, now, glide);
    this.air.gain.setTargetAtTime(profile.air, now, glide);

    if (this.reverbSend) {
      this.reverbSend.gain.setTargetAtTime(0.54 + clamp(profile.resonance / 6) * 0.26, now, glide);
    }
    if (this.delaySend) {
      this.delaySend.gain.setTargetAtTime(0.18 + clamp(profile.resonance / 7) * 0.16, now, glide);
    }
  }

  private triggerGesture(type: SceneProfile["gesture"], intensity: number) {
    if (!this.enabled || !this.context || !this.master) return;
    this.lastGestureAt = performance.now();
    const context = this.context;
    const now = context.currentTime;
    const level = clamp(intensity, 0.08, 0.32) * 0.024;
    const profile = SCENE_PROFILES[this.currentScene];

    const baseMultipliers: Record<SceneProfile["gesture"], number> = {
      signal: 8.2,
      physical: 5.1,
      spatial: 10.5,
      material: 4.2,
      integrated: 6.8,
      project: 5.8,
      finale: 3.7,
    };

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    oscillator.type = "sine";
    oscillator.frequency.value = Math.max(110, Math.min(980, profile.frequency * baseMultipliers[type]));
    filter.type = "bandpass";
    filter.frequency.value = oscillator.frequency.value;
    filter.Q.value = type === "signal" ? 2.1 : 1.1;
    panner.pan.value = type === "spatial" ? Math.random() * 0.8 - 0.4 : Math.random() * 0.28 - 0.14;

    const duration = type === "finale" ? 0.18 : type === "spatial" ? 0.14 : 0.085;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter).connect(gain).connect(panner).connect(this.master);
    if (this.reverbSend) panner.connect(this.reverbSend);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  private createImpulseResponse(context: AudioContext, duration: number, decay: number) {
    const length = Math.floor(context.sampleRate * duration);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const envelope = Math.pow(1 - index / length, decay);
        data[index] = (Math.random() * 2 - 1) * envelope * (channel === 0 ? 1 : 0.94);
      }
    }
    return impulse;
  }
}
