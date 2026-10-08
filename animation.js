// Render-only motion. Never changes simulation coordinates or task timings.
export function stepMotion(
  previous,
  { x, z, angle = 0, moving },
  dt,
  seed = 0,
  reduced = false,
) {
  const p = previous || { x, z, angle, stride: seed * 1.7, speed: 0 };
  const seconds = Math.max(0, Math.min(dt, 0.1));
  const distance = Math.hypot(x - p.x, z - p.z);
  const walking = moving && distance > 0.0001 && distance < 2;
  const speed =
    p.speed + ((walking ? 1 : 0) - p.speed) * (1 - Math.exp(-seconds * 16));
  const turn = Math.atan2(Math.sin(angle - p.angle), Math.cos(angle - p.angle));
  return {
    x,
    z,
    speed,
    angle: p.angle + turn * (1 - Math.exp(-seconds * 18)),
    stride: p.stride + (walking ? distance * 2.8 : 0),
    reduced,
  };
}
export function motionPose(m, time) {
  const stride = Math.sin(m.stride) * m.speed;
  return {
    leg: stride * 0.48,
    arm: -stride * 0.3,
    bob: m.reduced ? 0 : Math.abs(Math.sin(m.stride)) * 0.055 * m.speed,
    lean: m.reduced ? 0 : m.speed * 0.045,
    breath: m.reduced
      ? 1
      : 1 + Math.sin(time * 1.7 + m.stride) * 0.008 * (1 - m.speed),
  };
}
