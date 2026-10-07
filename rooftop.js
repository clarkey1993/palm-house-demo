import {
  createGame,
  PADS,
  price,
  complete,
  distance,
  payroll,
  onDuty,
  moveRate,
} from "./model.js";
export const ROOF_LIFT = { x: 3.2, z: 12.8 };
export const ROOF_CASH = { x: 1.7, z: 5.5 };
export const roofValue = (s) =>
  60 + s.poolLevel * 25 + s.roofJuice * 25 + s.roofSpa * 40;
export function createRooftop(saved) {
  const g = createGame({
    ...saved,
    version: 5,
    floor: 2,
    levels: Array(8).fill(0),
    staff: { receptionist: 0, cleaner: 0, runner: 0 },
    expanded: false,
    wing: false,
  });
  Object.assign(g.player, ROOF_LIFT);
  g.hostClock = 0;
  g.hosts = Array.from({ length: 2 }, (_, i) => ({
    x: -3 + i * 1.2,
    z: 11.5,
    angle: 0,
    moving: false,
    phase: "idle",
  }));
  return g;
}
function walk(v, target, dt, speed = 3) {
  const dx = target.x - v.x,
    dz = target.z - v.z,
    d = Math.hypot(dx, dz);
  v.moving = d > 0.08;
  if (d < speed * dt) {
    v.x = target.x;
    v.z = target.z;
    v.moving = false;
    return true;
  }
  v.x += (dx / d) * speed * dt;
  v.z += (dz / d) * speed * dt;
  v.angle = Math.atan2(dx, dz);
  return false;
}
export function roofBlocked(x, z) {
  return (
    x < -10.5 ||
    x > 10.5 ||
    z < -12 ||
    z > 15 ||
    (x > -9 && x < 0.5 && z > -10 && z < 1) ||
    (x > 5.3 && z > -11 && z < -8.5) ||
    (x > 5.3 && z > -3 && z < 0)
  );
}
export function updateRooftop(g, dt, input = { x: 0, z: 0 }) {
  const s = g.state,
    p = g.player;
  g.events = [];
  g.time += dt;
  const length = Math.hypot(input.x, input.z),
    speed = 5 * moveRate(s);
  p.moving = p.present !== false && length > 0.05;
  if (p.moving) {
    const dx = (input.x / Math.max(1, length)) * speed * dt,
      dz = (input.z / Math.max(1, length)) * speed * dt;
    if (!roofBlocked(p.x + dx, p.z)) p.x += dx;
    if (!roofBlocked(p.x, p.z + dz)) p.z += dz;
    p.angle = Math.atan2(dx, dz);
  }
  payroll(g, dt);
  for (const v of g.guests) {
    if (v.phase === "roofArrive") {
      if (walk(v, { x: 2, z: 2.5 }, dt)) {
        v.phase = "roofSwim";
        v.timer = 10;
        v.moving = false;
      }
    } else if (v.phase === "roofSwim") {
      v.timer -= dt;
      v.x +=
        (-4.5 + Math.sin(g.time * 0.5 + v.id) * 2 - v.x) * Math.min(1, dt * 2);
      v.z +=
        (-4 + Math.cos(g.time * 0.5 + v.id) * 2 - v.z) * Math.min(1, dt * 2);
      if (v.timer <= 0) {
        v.x = 2;
        v.z = 2.5;
        v.phase = s.roofJuice ? "roofDrink" : s.roofSpa ? "roofSpa" : "roofPay";
        v.timer = 5;
      }
    } else if (v.phase === "roofDrink" || v.phase === "roofSpa") {
      const at =
        v.phase === "roofDrink" ? { x: 6.7, z: -7.8 } : { x: 6.7, z: 1 };
      if (walk(v, at, dt)) v.timer -= dt;
      if (v.timer <= 0) {
        v.phase = v.phase === "roofDrink" && s.roofSpa ? "roofSpa" : "roofPay";
        v.timer = 6;
      }
    } else if (v.phase === "roofPay") {
      const value = roofValue(s);
      s.earned += value;
      s.welcomed++;
      if (g.piles.length >= 6) g.piles[0].value += value;
      else
        g.piles.push({
          id: ++g.seq,
          source: "reception",
          value,
          x: ROOF_CASH.x + (g.piles.length % 2) * 0.4,
          z: ROOF_CASH.z + Math.floor(g.piles.length / 2) * 0.3,
        });
      g.events.push({ type: "tip", ...ROOF_CASH, value });
      v.satisfaction = Math.min(100, (v.satisfaction || 75) + 12);
      v.phase = "roofLeave";
    } else if (v.phase === "roofLeave" && walk(v, ROOF_LIFT, dt))
      v.phase = "roofReturn";
  }
  const collect = (pile, automatic = false) => {
    s.cash += pile.value;
    g.events.push({
      type: automatic ? "runnerCollect" : "collect",
      x: pile.x,
      z: pile.z,
      value: pile.value,
    });
    g.piles = g.piles.filter((c) => c !== pile);
  };
  for (const pile of [...g.piles])
    if (p.present !== false && distance(p, pile) < 1.45) collect(pile);
  const reserved = new Set();
  for (let i = 0; i < g.hosts.length; i++) {
    const host = g.hosts[i];
    host.moving = false;
    if (i >= s.attendants || !onDuty(s)) continue;
    const pile = g.piles.find((c) => !reserved.has(c.id));
    if (pile) {
      reserved.add(pile.id);
      if (walk(host, pile, dt, 3.5)) collect(pile, true);
    } else walk(host, { x: -3 + i * 1.2, z: 11.5 }, dt, 3.5);
  }
  if (g.purchaseLatch >= 0 && distance(p, PADS[g.purchaseLatch]) > 1.4)
    g.purchaseLatch = -1;
  const pad = PADS.find(
    (a) =>
      a.i >= 29 &&
      a.i <= 32 &&
      !complete(s, a.i) &&
      a.i !== g.purchaseLatch &&
      p.present !== false &&
      distance(a, p) < 1.04,
  );
  g.active = pad?.i ?? -1;
  g.payment = pad && s.cash > 0 ? g.payment + dt : 0;
  if (pad && s.cash > 0 && g.payment >= 0.055) {
    const cost = price(s, pad.i),
      amount = Math.min(
        s.cash,
        cost - s.paid[pad.i],
        Math.ceil((cost / 2.4) * g.payment),
      );
    s.cash -= amount;
    s.paid[pad.i] += amount;
    g.payment = 0;
    g.events.push({ type: "spend", ...pad, amount });
    if (s.paid[pad.i] >= cost) {
      s.paid[pad.i] = 0;
      s[
        { 29: "poolLevel", 30: "roofJuice", 31: "roofSpa", 32: "attendants" }[
          pad.i
        ]
      ]++;
      g.purchaseLatch = pad.i;
      g.events.push({ type: "build", ...pad });
    }
  }
}
