// Rendering preferences are device-local, separate from hotel progress.
export function performanceProfile(touch, smooth, width, height, dpr = 1) {
  const battery = touch && !smooth;
  const budget = battery ? 1800000 : 3200000;
  return {
    fps: battery ? 30 : 60,
    pixelRatio: Math.min(
      Math.max(1, dpr),
      battery ? 1.5 : 2,
      Math.sqrt(budget / Math.max(1, width * height)),
    ),
    shadowSize: touch ? 1024 : 2048,
  };
}
export function readSmoothPreference() {
  try {
    return localStorage.getItem("palm-house-smooth") === "on";
  } catch {
    return false;
  }
}
// Keep simulation elapsed time independent of the display's refresh rate.
export class FrameClock {
  reset() {
    this.last = null;
    this.next = null;
  }
  constructor() {
    this.reset();
  }
  step(now, fps) {
    const interval = 1000 / fps;
    if (this.next == null) {
      this.last = now;
      this.next = now + interval;
      return 0;
    }
    if (now + 0.5 < this.next) return null;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.next +=
      interval *
      Math.max(1, Math.floor((now + 0.5 - this.next) / interval) + 1);
    return dt;
  }
}
