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

const PIP_BASE: Record<AudioScene, number> = {
  hero: 46,
  sum: 52,
  b2w: 62,
  monarca: 43,
  brown: 55,
  tridifect: 38,
  convergence: 48,
  capacity: 44,
  "project-mall": 41,
  "project-campaign": 47,
  "project-corporate": 39,
  finale: 36,
};

const SCENE_CUE_THRESHOLDS: Record<AudioScene, number[]> = {
  hero: [0.06, 0.25, 0.44, 0.63, 0.82],
  sum: [0.16, 0.48, 0.78],
  b2w: [0.12, 0.32, 0.54, 0.78],
  monarca: [0.12, 0.32, 0.54, 0.78],
  brown: [0.1, 0.27, 0.44, 0.62, 0.8],
  tridifect: [0.12, 0.32, 0.54, 0.78],
  convergence: [0.1, 0.28, 0.46, 0.64, 0.82],
  capacity: [0.08, 0.19, 0.3, 0.41, 0.52, 0.63, 0.74, 0.86],
  "project-mall": [0.1, 0.24, 0.4, 0.56, 0.72, 0.86],
  "project-campaign": [0.1, 0.24, 0.4, 0.56, 0.72, 0.86],
  "project-corporate": [0.1, 0.24, 0.4, 0.56, 0.72, 0.86],
  finale: [0.16, 0.48, 0.78],
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export class CnsrcAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private drone: GainNode | null = null;
  private droneOscillators: OscillatorNode[] = [];
  private enabled = false;
  private currentScene: AudioScene = "hero";
  private lastSceneProgress = 0;
  private lastCueAt = 0;

  async start() {
    if (!this.context) this.createGraph();
    if (!this.context || !this.master) return;

    await this.context.resume();
    this.enabled = true;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.48, now + 0.2);
    if (this.drone) this.drone.gain.setTargetAtTime(0.020, now, 0.8);
  }

  setMuted(muted: boolean) {
    if (!this.context || !this.master) return;
    this.enabled = !muted;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.48, now + 0.2);
    if (!muted && this.context.state === "suspended") void this.context.resume();
  }

  setGlobalState(progress: number, velocity: number) {
    void progress;
    void velocity;
  }

  setSceneState(scene: AudioScene, progress: number, velocity: number, density: number) {
    void velocity;
    void density;
    if (!this.enabled || !this.context) return;
    if (scene !== this.currentScene) this.enterScene(scene);

    const cueThresholds = SCENE_CUE_THRESHOLDS[scene];
    const cueIndex = cueThresholds.findIndex((threshold) =>
      (this.lastSceneProgress < threshold && progress >= threshold) ||
      (this.lastSceneProgress > threshold && progress <= threshold),
    );

    if (cueIndex >= 0 && performance.now() - this.lastCueAt > 180) {
      this.triggerCue("text", cueIndex);
    }

    this.lastSceneProgress = progress;
  }

  enterScene(scene: AudioScene) {
    if (scene === this.currentScene) return;
    this.currentScene = scene;
    this.lastSceneProgress = 0;
    this.updateDroneFrequency(scene);
    if (this.enabled && this.context) this.triggerCue("section");
  }

  destroy() {
    this.droneOscillators.forEach((oscillator) => oscillator.stop());
    this.droneOscillators = [];
    void this.context?.close();
    this.context = null;
  }

  private createGraph() {
    const AudioContextConstructor = window.AudioContext ??
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextConstructor();
    this.context = context;

    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    this.master = master;

    const reverb = context.createConvolver();
    reverb.buffer = this.createImpulseResponse(context, 0.45, 3.2);
    const reverbReturn = context.createGain();
    reverbReturn.gain.value = 0.08;
    reverb.connect(reverbReturn).connect(master);

    const reverbSend = context.createGain();
    reverbSend.gain.value = 0.12;
    reverbSend.connect(reverb);
    this.reverbSend = reverbSend;

    const droneFilter = context.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 520;
    droneFilter.Q.value = 0.5;

    const drone = context.createGain();
    drone.gain.value = 0.020;
    droneFilter.connect(drone).connect(master);
    this.drone = drone;

    const ratios = [1, 1.5, 2.01, 4.02, 6.03];
    const levels = [0.3, 0.14, 0.09, 0.055, 0.035];
    ratios.forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = PIP_BASE[this.currentScene] * ratio;
      const gain = context.createGain();
      gain.gain.value = levels[index];
      oscillator.connect(gain).connect(droneFilter);
      oscillator.start();
      this.droneOscillators.push(oscillator);
    });
  }

  private updateDroneFrequency(scene: AudioScene) {
    if (!this.context || !this.droneOscillators.length) return;
    const now = this.context.currentTime;
    const ratios = [1, 1.5, 2.01, 4.02, 6.03];
    this.droneOscillators.forEach((oscillator, index) => {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(PIP_BASE[scene] * ratios[index], now, 1.4);
    });
  }

  private triggerCue(kind: "text" | "section", index = 0) {
    if (!this.enabled || !this.context || !this.master) return;
    this.lastCueAt = performance.now();
    const context = this.context;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    const pattern = [0, 92, 38, 126, 64];
    const base = clamp(PIP_BASE[this.currentScene] * 12.5, 540, 780);
    const frequency = kind === "section"
      ? Math.max(480, base - 70)
      : Math.min(930, base + pattern[index % pattern.length]);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 3.2;
    panner.pan.value = kind === "section" ? 0 : (index % 2 ? 0.08 : -0.08);

    const level = kind === "section" ? 0.041 : 0.054;
    const duration = kind === "section" ? 0.095 : 0.075;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter).connect(gain).connect(panner).connect(this.master);
    if (this.reverbSend) panner.connect(this.reverbSend);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.025);
  }

  private createImpulseResponse(context: AudioContext, duration: number, decay: number) {
    const length = Math.floor(context.sampleRate * duration);
    const impulse = context.createBuffer(2, length, context.sampleRate);

    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const envelope = Math.pow(1 - index / length, decay);
        data[index] = (Math.random() * 2 - 1) * envelope * 0.32;
      }
    }

    return impulse;
  }
}
