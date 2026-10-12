// Wall-clock inactivity, independent of animation frame rate or simulation speed.
export class InactivityTimer {
  constructor(timeout = 60000) {
    this.timeout = timeout;
    this.reset();
  }
  reset() {
    this.lastMovement = null;
    this.position = null;
  }
  expired(now, position, suspended = false) {
    if (suspended) {
      this.reset();
      return false;
    }
    const moved = !this.position ||
      Math.hypot(position.x - this.position.x, position.z - this.position.z) > 0.001;
    if (this.lastMovement === null || moved) this.lastMovement = now;
    this.position = { x: position.x, z: position.z };
    return now - this.lastMovement >= this.timeout;
  }
}
