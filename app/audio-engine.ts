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
  hero: { frequency: 46, air: 0.006, resonance: 0.7, gesture: "material" },
  sum: { frequency: 52, air: 0.004, resonance: 1.2, gesture: "integrated" },
  b2w: { frequency: 62, air: 0.003, resonance: 2.4, gesture: "signal" },
  monarca: { frequency: 43, air: 0.006, resonance: 1.1, gesture: "physical" },
  brown: { frequency: 55, air: 0.008, resonance: 4.2, gesture: "spatial" },
  tridifect: { frequency: 38, air: 0.004, resonance: 1.8, gesture: "material" },
  convergence: { frequency: 48, air: 0.007, resonance: 3.4, gesture: "integrated" },
  capacity: { frequency: 44, air: 0.003, resonance: 1.4, gesture: "signal" },
  "project-mall": { frequency: 41, air: 0.008, resonance: 2.2, gesture: "project" },
  "project-campaign": { frequency: 47, air: 0.009, resonance: 1.7, gesture: "project" },
  "project-corporate": { frequency: 39, air: 0.007, resonance: 3.1, gesture: "project" },
  finale: { frequency: 36, air: 0.002, resonance: 3.8, gesture: "finale" },
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export class CnsrcAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private bed: GainNode | null = null;
  private bedFilter: BiquadFilterNode | null = null;
  private air: GainNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  private oscillators: OscillatorNode[] = [];
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
    this.master.gain.linearRampToValueAtTime(0.16, now + 0.65);
    this.applyProfile(this.currentScene, 0.8);
    this.triggerGesture("material", 0.3);
  }

  setMuted(muted: boolean) {
    if (!this.context || !this.master) return;
    this.enabled = !muted;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.16, now + (muted ? 0.28 : 0.55));
    if (!muted && this.context.state === "suspended") void this.context.resume();
  }

  setGlobalState(progress: number, velocity: number) {
    if (!this.enabled || !this.context || !this.bedFilter || !this.airFilter) return;
    const now = this.context.currentTime;
    const speed = clamp(Math.abs(velocity) / 2600);
    const direction = progress >= this.lastGlobalProgress ? 1 : -1;
    this.lastGlobalProgress = progress;

    this.bedFilter.frequency.setTargetAtTime(150 + speed * 560 + progress * 90, now, 0.16);
    this.airFilter.frequency.setTargetAtTime(520 + speed * 1450 + (direction > 0 ? 120 : 0), now, 0.12);
  }

  setSceneState(scene: AudioScene, progress: number, velocity: number, density: number) {
    if (!this.enabled || !this.context || !this.air || !this.bed) return;
    if (scene !== this.currentScene) this.enterScene(scene);

    const now = this.context.currentTime;
    const profile = SCENE_PROFILES[scene];
    const speed = clamp(Math.abs(velocity) / 2200);
    const calm = 1 - speed;
    const shapedDensity = clamp(density);

    this.air.gain.setTargetAtTime(profile.air * (0.28 + shapedDensity * 0.72) * (0.45 + calm * 0.55), now, 0.2);
    this.bed.gain.setTargetAtTime(0.014 + shapedDensity * 0.007 - speed * 0.004, now, 0.25);

    const crossed = [0.18, 0.52, 0.82].some((threshold) =>
      (this.lastSceneProgress < threshold && progress >= threshold) ||
      (this.lastSceneProgress > threshold && progress <= threshold),
    );
    const gestureGap = speed > 0.62 ? 620 : 260;
    if (crossed && performance.now() - this.lastGestureAt > gestureGap) {
      this.triggerGesture(profile.gesture, this.reducedMotion ? 0.3 : 0.38 + shapedDensity * 0.35 + speed * 0.18);
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
    this.applyProfile(scene, 1.4);
    const profile = SCENE_PROFILES[scene];
    const intensity = scene === "convergence" || scene === "finale" ? 0.62 : 0.32;
    this.triggerGesture(profile.gesture, intensity);
  }

  destroy() {
    this.oscillators.forEach((oscillator) => oscillator.stop());
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
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.32;
    master.connect(compressor).connect(context.destination);
    this.master = master;

    const bedFilter = context.createBiquadFilter();
    bedFilter.type = "lowpass";
    bedFilter.frequency.value = 180;
    bedFilter.Q.value = 0.7;
    const bed = context.createGain();
    bed.gain.value = 0.014;
    bedFilter.connect(bed).connect(master);
    this.bedFilter = bedFilter;
    this.bed = bed;

    [1, 1.503].forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index ? "sine" : "triangle";
      oscillator.frequency.value = SCENE_PROFILES.hero.frequency * ratio;
      const gain = context.createGain();
      gain.gain.value = index ? 0.16 : 0.3;
      oscillator.connect(gain).connect(bedFilter);
      oscillator.start();
      this.oscillators.push(oscillator);
    });

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < data.length; index += 1) {
      previous = previous * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[index] = previous;
    }
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const airFilter = context.createBiquadFilter();
    airFilter.type = "bandpass";
    airFilter.frequency.value = 640;
    airFilter.Q.value = 0.72;
    const air = context.createGain();
    air.gain.value = 0;
    noise.connect(airFilter).connect(air).connect(master);
    noise.start();
    this.noise = noise;
    this.air = air;
    this.airFilter = airFilter;
  }

  private applyProfile(scene: AudioScene, glide: number) {
    if (!this.context || !this.bedFilter || !this.airFilter || !this.air) return;
    const now = this.context.currentTime;
    const profile = SCENE_PROFILES[scene];
    this.oscillators.forEach((oscillator, index) => {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(profile.frequency * (index ? 1.503 : 1), now, glide);
    });
    this.bedFilter.Q.setTargetAtTime(profile.resonance, now, glide * 0.6);
    this.airFilter.Q.setTargetAtTime(0.7 + profile.resonance * 0.16, now, glide * 0.6);
    this.air.gain.setTargetAtTime(profile.air, now, glide);
  }

  private triggerGesture(type: SceneProfile["gesture"], intensity: number) {
    if (!this.enabled || !this.context || !this.master) return;
    this.lastGestureAt = performance.now();
    const context = this.context;
    const now = context.currentTime;
    const level = clamp(intensity, 0.12, 0.9) * 0.042;

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    const profile = SCENE_PROFILES[this.currentScene];

    const settings = {
      signal: { start: profile.frequency * 4, end: profile.frequency * 5.5, duration: 0.16, type: "square" as OscillatorType },
      physical: { start: profile.frequency * 2.2, end: profile.frequency * 0.85, duration: 0.42, type: "triangle" as OscillatorType },
      spatial: { start: profile.frequency * 3.2, end: profile.frequency * 7.8, duration: 0.78, type: "sine" as OscillatorType },
      material: { start: profile.frequency * 1.6, end: profile.frequency * 0.72, duration: 0.5, type: "sawtooth" as OscillatorType },
      integrated: { start: profile.frequency * 2.4, end: profile.frequency * 4.1, duration: 0.72, type: "triangle" as OscillatorType },
      project: { start: profile.frequency * 1.8, end: profile.frequency * 0.9, duration: 0.64, type: "sine" as OscillatorType },
      finale: { start: profile.frequency * 2, end: profile.frequency, duration: 1.1, type: "sine" as OscillatorType },
    }[type];

    oscillator.type = settings.type;
    oscillator.frequency.setValueAtTime(settings.start, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, settings.end), now + settings.duration);
    filter.type = type === "signal" ? "bandpass" : "lowpass";
    filter.frequency.value = type === "spatial" ? 1500 : 520;
    filter.Q.value = type === "signal" ? 5.5 : 1.4;
    panner.pan.value = type === "spatial" ? Math.random() * 1.3 - 0.65 : 0;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);

    oscillator.connect(filter).connect(gain).connect(panner).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + settings.duration + 0.04);
  }
}
