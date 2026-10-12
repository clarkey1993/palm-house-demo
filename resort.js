// Optional resort projects. Old hotels start with every new project unpurchased.
// IDs are appended: existing construction investments keep their meaning.
export const PROJECTS = [
  {
    i: 38,
    key: "garage",
    floor: 0,
    name: "Parking garage",
    x: 17,
    z: 10,
    cost: [2200, 3800],
    requires: "expanded",
    benefit:
      "Three parking bays; $45 per car. Upgrade adds EV charging and $25.",
    service: { x: 22, z: 11 },
    visit: { x: 26, z: 16 },
    fee: 45,
  },
  {
    i: 39,
    key: "garden",
    floor: 0,
    name: "Tea garden",
    x: 0,
    z: 17,
    cost: [1800, 3200],
    requires: "expanded",
    benefit:
      "Afternoon tea earns $40 per visit. Upgrade adds a fountain and $20.",
    service: { x: 0, z: 22 },
    visit: { x: -6, z: 25.8 },
    seats: [
      { x: -6, z: 25.8 },
      { x: 6, z: 25.8 },
    ],
    fee: 40,
  },
  {
    i: 40,
    key: "weights",
    floor: 0,
    name: "Strength studio",
    x: 17,
    z: -26,
    cost: [1600, 2600],
    requires: "gym",
    benefit: "Weight training adds $15 per gym visit per level.",
  },
  {
    i: 41,
    key: "yoga",
    floor: 0,
    name: "Yoga studio",
    x: 31,
    z: -27,
    cost: [1800, 2800],
    requires: "gym",
    benefit: "Stretching area adds $15 per gym visit per level.",
  },
  {
    i: 42,
    key: "desserts",
    floor: 0,
    name: "Dessert counter",
    x: 31,
    z: 3.1,
    cost: [1400, 2400],
    requires: "restaurant",
    benefit: "Servers include dessert: +$20 per meal per level.",
  },
  {
    i: 43,
    key: "chef",
    floor: 0,
    name: "Chef station",
    x: 18,
    z: -9,
    cost: [1800, 3000],
    requires: "restaurant",
    benefit: "25% faster meal preparation per level; +$10 per meal per level.",
  },
  {
    i: 44,
    key: "luggage",
    floor: 0,
    name: "Luggage storage",
    x: -7.5,
    z: 16.2,
    cost: [1000, 1800],
    requires: "expanded",
    benefit: "Store visitors’ bags for $30. Upgrade earns $15 extra.",
    service: { x: -6, z: 19 },
    visit: { x: -6, z: 18.8 },
    fee: 30,
  },
  {
    i: 45,
    key: "excursions",
    floor: 0,
    name: "Seaside concierge",
    x: 7.8,
    z: 15,
    cost: [1700, 2900],
    requires: "expanded",
    benefit: "Book seaside outings for $55 commission; upgrade adds $25.",
    service: { x: 7, z: 17.8 },
    visit: { x: 5, z: 17.8 },
    fee: 55,
  },
  {
    i: 46,
    key: "roomService",
    floor: 1,
    name: "Room service kitchen",
    x: 17,
    z: 5,
    cost: [1500, 2500],
    requires: "lounge",
    benefit: "Deliver upstairs orders for $60. Upgrade earns $25 extra.",
    service: { x: 20, z: 4.5 },
    visit: { x: 26, z: 0 },
    fee: 60,
  },
  {
    i: 47,
    key: "skyCafe",
    floor: 1,
    name: "Sky café & library",
    x: 29,
    z: 4.5,
    cost: [1700, 2800],
    requires: "lounge",
    benefit: "Coffee and reading visits earn $50; upgrade adds $20.",
    service: { x: 24, z: 4.5 },
    visit: { x: 26.5, z: -2 },
    seats: [
      { x: 26.5, z: -2 },
      { x: 29.5, z: -2 },
    ],
    fee: 50,
  },
  {
    i: 48,
    key: "cabanas",
    floor: 2,
    name: "Private cabanas",
    x: -9.5,
    z: 8,
    cost: [2200, 3600],
    benefit: "Shaded poolside stays add $35 per rooftop guest per level.",
  },
  {
    i: 49,
    key: "sunset",
    floor: 2,
    name: "Sunset dining",
    x: 8,
    z: 9.3,
    cost: [2400, 3800],
    benefit: "A sunset meal adds $45 per rooftop guest per level.",
  },
  {
    i: 50,
    key: "roofGarden",
    floor: 2,
    name: "Sky garden & lanterns",
    x: 0,
    z: 10,
    cost: [1800, 3000],
    benefit: "A planted roof terrace adds $20 per rooftop guest per level.",
  },
];
export const RESORT_STAFF = [
  {
    i: 51,
    key: "valet",
    project: "garage",
    floor: 0,
    name: "Hire valet",
    x: 19.5,
    z: 10,
    wage: 45,
    cost: [900, 1600],
  },
  {
    i: 52,
    key: "gardener",
    project: "garden",
    floor: 0,
    name: "Hire tea host",
    x: 3,
    z: 19,
    wage: 40,
    cost: [800, 1400],
  },
  {
    i: 53,
    key: "bellhop",
    project: "luggage",
    floor: 0,
    name: "Hire bellhop",
    x: -10,
    z: 17,
    wage: 35,
    cost: [700, 1200],
  },
  {
    i: 54,
    key: "concierge",
    project: "excursions",
    floor: 0,
    name: "Hire tour concierge",
    x: 10.2,
    z: 17.6,
    wage: 45,
    cost: [1000, 1700],
  },
  {
    i: 55,
    key: "roomWaiter",
    project: "roomService",
    floor: 1,
    name: "Hire room-service waiter",
    x: 17,
    z: 2,
    wage: 55,
    cost: [1100, 1800],
  },
  {
    i: 56,
    key: "barista",
    project: "skyCafe",
    floor: 1,
    name: "Hire sky café host",
    x: 31,
    z: 2,
    wage: 45,
    cost: [900, 1600],
  },
];
export const RESORT_PADS = [...PROJECTS, ...RESORT_STAFF];
export const resortProject = (i) => RESORT_PADS.find((p) => p.i === i);
export const level = (s, key) => s?.resort?.levels?.[key] || 0;
const finite = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
export function restoreResort(saved) {
  const out = { levels: {}, visits: {}, earned: 0, claimed: [] };
  for (const p of RESORT_PADS)
    out.levels[p.key] = Math.max(
      0,
      Math.min(p.cost.length, Math.floor(finite(saved?.levels?.[p.key]))),
    );
  for (const p of PROJECTS)
    out.visits[p.key] = Math.max(
      0,
      Math.min(1e9, Math.floor(finite(saved?.visits?.[p.key]))),
    );
  out.earned = Math.max(0, Math.min(1e12, finite(saved?.earned)));
  out.claimed = Array.isArray(saved?.claimed)
    ? [
        ...new Set(
          saved.claimed.filter((key) => PROJECTS.some((p) => p.key === key)),
        ),
      ]
    : [];
  return out;
}
export const resortUnlocked = (s, p) =>
  s.floor === p.floor &&
  (p.project ? level(s, p.project) > 0 : !p.requires || !!s[p.requires]);
export const resortPrice = (s, p) =>
  p.cost[Math.min(p.cost.length - 1, level(s, p.key))];
export const resortBenefit = (s, p) =>
  p.project
    ? `New hire: $${p.wage + level(s, p.key) * 15}/min · ${level(s, p.key) ? "+35% automatic service and delivery speed" : "automates " + PROJECTS.find((a) => a.key === p.project).name.toLowerCase()}`
    : p.benefit;
export const resortWages = (s) =>
  RESORT_STAFF.reduce((sum, p) => {
    const n = level(s, p.key);
    return sum + p.wage * n + (15 * n * (n - 1)) / 2;
  }, 0);
export const gymBonus = (s) => 15 * (level(s, "weights") + level(s, "yoga"));
export const mealBonus = (s) =>
  20 * level(s, "desserts") + 10 * level(s, "chef");
export const roofBonus = (s) =>
  35 * level(s, "cabanas") +
  45 * level(s, "sunset") +
  20 * level(s, "roofGarden");
export function resortArea(s, x, z) {
  if (s.floor === 2) return false;
  if (!s.floor) {
    if (
      s.expanded &&
      ((x >= 11 && x <= 19 && z >= 8.5 && z <= 11.5) ||
        (x >= -11 && x <= 11 && z >= 13 && z <= 20))
    )
      return true;
    if (level(s, "garage") && x >= 15 && x <= 33 && z >= 8 && z <= 23)
      return true;
    if (level(s, "garden") && x >= -11 && x <= 11 && z >= 16 && z <= 30)
      return true;
  } else {
    if (s.lounge && x >= 11 && x <= 19 && z >= 3.5 && z <= 6) return true;
    if (s.lounge && x >= 15 && x <= 33 && z >= -8 && z <= 6) return true;
  }
  return false;
}
// Grid routing uses the same collision query as player movement. No furniture shortcuts.
export function resortRoute(g, start, end, blocked) {
  const step = 0.7,
    key = (x, z) => `${x},${z}`,
    sx = Math.round(start.x / step),
    sz = Math.round(start.z / step),
    tx = Math.round(end.x / step),
    tz = Math.round(end.z / step);
  const clear = (a, b) => {
    const n = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 0.15));
    for (let i = 0; i <= n; i++)
      if (blocked(g, a.x + ((b.x - a.x) * i) / n, a.z + ((b.z - a.z) * i) / n))
        return false;
    return true;
  };
  const anchors = (x, z, at) =>
    [-1, 0, 1]
      .flatMap((dx) => [-1, 0, 1].map((dz) => [x + dx, z + dz]))
      .filter(([x, z]) => clear(at, { x: x * step, z: z * step }))
      .sort(
        (a, b) =>
          Math.hypot(a[0] * step - at.x, a[1] * step - at.z) -
          Math.hypot(b[0] * step - at.x, b[1] * step - at.z),
      );
  const first = anchors(sx, sz, start)[0],
    goals = new Set(anchors(tx, tz, end).map((a) => key(...a)));
  if (!first || !goals.size) return null;
  const q = [first],
    seen = new Map([[key(...first), null]]);
  let found;
  for (let n = 0; n < q.length && n < 14000; n++) {
    const [x, z] = q[n];
    if (goals.has(key(x, z))) {
      found = [x, z];
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        k = key(nx, nz);
      if (
        seen.has(k) ||
        blocked(g, nx * step, nz * step) ||
        blocked(g, (x + dx / 2) * step, (z + dz / 2) * step)
      )
        continue;
      seen.set(k, [x, z]);
      q.push([nx, nz]);
    }
  }
  if (!found) return null;
  const route = [end];
  for (let at = found; at; at = seen.get(key(...at)))
    route.unshift({ x: at[0] * step, z: at[1] * step });
  // Remove collinear intermediate points.
  return route.filter(
    (p, i, a) =>
      !i ||
      i === a.length - 1 ||
      Math.abs(
        (p.x - a[i - 1].x) * (a[i + 1].z - p.z) -
          (p.z - a[i - 1].z) * (a[i + 1].x - p.x),
      ) > 0.001,
  );
}
export function walkResort(a, dt, speed = 3) {
  if (a.route === null) {
    a.moving = false;
    return false;
  }
  const t = a.route?.[0];
  a.moving = !!t;
  if (!t) return true;
  const dx = t.x - a.x,
    dz = t.z - a.z,
    d = Math.hypot(dx, dz),
    step = speed * dt;
  if (d <= step) {
    a.x = t.x;
    a.z = t.z;
    a.route.shift();
    a.moving = !!a.route.length;
    return !a.moving;
  }
  a.x += (dx / d) * step;
  a.z += (dz / d) * step;
  a.angle = Math.atan2(dx, dz);
  return false;
}
export function recordResortVisit(g, key) {
  if (!level(g.state, key)) return;
  const r = g.state.resort;
  r.visits[key]++;
  if (r.visits[key] >= 10 && !r.claimed.includes(key)) {
    r.claimed.push(key);
    g.state.cash += 300;
    g.events.push({
      type: "notice",
      text: `${PROJECTS.find((p) => p.key === key).name}: first 10 visits! $300 opening bonus.`,
    });
  }
}
export function updateResort(g, dt, api) {
  const s = g.state,
    r = s.resort;
  g.resortActors ??= [];
  g.resortNext ??= {};
  g.resortClock = (g.resortClock || 0) + dt;
  const layout = [
    s.expanded,
    s.wing,
    s.gym,
    s.gymUpgrade,
    s.restaurant,
    s.lounge,
    ...s.levels,
    ...Object.values(r.levels),
  ].join(":");
  if (g.resortLayout !== layout) {
    g.resortLayout = layout;
    for (const a of g.resortActors) {
      // Construction may put a fountain underneath a passing visitor.
      if (api.blocked(g, a.x, a.z)) {
        let free;
        for (let radius = 0.35; radius <= 3 && !free; radius += 0.35)
          for (let n = 0; n < 16; n++) {
            const at = {
              x: a.x + Math.cos((n * Math.PI) / 8) * radius,
              z: a.z + Math.sin((n * Math.PI) / 8) * radius,
            };
            if (!api.blocked(g, at.x, at.z)) {
              free = at;
              break;
            }
          }
        if (free) Object.assign(a, free);
      }
      if (a.worker) {
        a.destination = null;
        a.route = [];
      } else if (["resortWalk", "resortLeave"].includes(a.phase))
        a.route = resortRoute(
          g,
          a,
          a.phase === "resortWalk"
            ? a.target
            : s.floor
              ? { x: 3.2, z: 12.8 }
              : { x: 2.9, z: 12 },
          api.blocked,
        );
    }
  }
  const available = PROJECTS.filter(
    (p) => p.floor === s.floor && p.service && level(s, p.key),
  );
  // A single bounded queue per service keeps traffic readable and avoids runaway income.
  for (const p of available) {
    let actor = g.resortActors.find((a) => a.project === p.key && !a.worker);
    if (
      !actor &&
      g.time >= (g.resortNext[p.key] || 10) &&
      g.guests.some((v) => !["queue", "exit", "gone"].includes(v.phase))
    ) {
      g.resortNext[p.key] = g.time + (p.key === "roomService" ? 12 : 20);
      const room =
        p.key === "roomService"
          ? g.guests
              .filter((v) => v.phase === "stay" && !v.roomServiceOrdered)
              .sort((a, b) => (b.timer || 0) - (a.timer || 0))[0]
          : null;
      if (p.key === "roomService" && !room) continue;
      const target = room
        ? api.cleanSpots[room.room]
        : p.seats
          ? p.seats[r.visits[p.key] % p.seats.length]
          : p.visit;
      const origin = s.floor ? { x: 3.2, z: 12.8 } : { x: 2.9, z: 12 };
      const route = resortRoute(g, origin, target, api.blocked);
      if (!route) continue;
      if (room) room.roomServiceOrdered = true;
      actor = {
        id: 1000000 + ++g.seq,
        project: p.key,
        x: origin.x,
        z: origin.z,
        angle: 0,
        color: 0xe4b77c,
        phase: room ? "resortWait" : "resortWalk",
        route: room ? [] : route,
        timer: 0,
        service: 0,
        target,
        room: room?.room,
        guestId: room?.id,
        reading: p.key === "skyCafe" && r.visits[p.key] % 2 === 1,
      };
      g.resortActors.push(actor);
    }
    const staff = RESORT_STAFF.find((a) => a.project === p.key),
      n = level(s, staff.key);
    const workers = g.resortActors.filter(
      (a) => a.project === p.key && a.worker,
    );
    for (let index = workers.length; index < n; index++) {
      const worker = {
        id: 2000000 + ++g.seq,
        project: p.key,
        worker: true,
        x: p.service.x + index * 0.7,
        z: p.service.z,
        angle: Math.PI,
        color: 0x76a79a,
        phase: "resortWork",
        route: [],
      };
      workers.push(worker);
      g.resortActors.push(worker);
    }
    const worker = workers[0];
    const returnToStation = () => {
      for (const w of workers) {
        w.moving = false;
        w.working = false;
      }
      if (!worker || s.wagesDue > 0) return;
      const destination = `home:${p.key}`;
      if (worker.destination !== destination) {
        worker.destination = destination;
        worker.route = resortRoute(g, worker, p.service, api.blocked) || [];
      }
      walkResort(worker, dt, 3.5);
    };
    if (!actor) {
      returnToStation();
      continue;
    }
    if (
      actor.room !== undefined &&
      !g.guests.some((v) => v.id === actor.guestId && v.phase === "stay") &&
      actor.phase === "resortWait"
    ) {
      g.resortActors = g.resortActors.filter((a) => a !== actor);
      returnToStation();
      continue;
    }
    if (actor.phase === "resortWalk" && walkResort(actor, dt))
      actor.phase = "resortWait";
    if (actor.phase === "resortWait") {
      const at = p.key === "roomService" ? actor.target : p.service;
      const manual =
        g.player.present !== false &&
        Math.hypot(g.player.x - at.x, g.player.z - at.z) < 1.5 &&
        !g.player.moving;
      let auto = false;
      if (worker && s.wagesDue === 0) {
        const destination = `${at.x},${at.z}`;
        if (worker.destination !== destination) {
          worker.destination = destination;
          worker.route = resortRoute(g, worker, at, api.blocked) || [];
        }
        walkResort(worker, dt, 3.5 * (1 + (n - 1) * 0.35));
        auto = Math.hypot(worker.x - at.x, worker.z - at.z) < 1.3;
      }
      if (worker) worker.working = auto;
      if (manual || auto)
        actor.service += dt * (manual ? 1 : 1 + (n - 1) * 0.35);
      if (actor.service >= 3) {
        const fee =
          p.fee +
          (level(s, p.key) - 1) *
            (p.key === "garage" ||
            p.key === "excursions" ||
            p.key === "roomService"
              ? 25
              : p.key === "luggage"
                ? 15
                : 20);
        // Receipts join the existing collection/runner system on the same floor.
        api.dropCash(g, fee, s.floor ? "cafe" : "reception");
        s.earned += fee;
        r.earned += fee;
        recordResortVisit(g, p.key);
        g.events.push({ type: "tip", ...at, value: fee });
        actor.phase = "resortEnjoy";
        actor.timer = 6;
      }
    } else if (actor.phase === "resortEnjoy") {
      actor.timer -= dt;
      if (actor.timer <= 0) {
        if (actor.room !== undefined) {
          g.resortActors = g.resortActors.filter((a) => a !== actor);
          continue;
        }
        actor.phase = "resortLeave";
        actor.route =
          resortRoute(
            g,
            actor,
            s.floor ? { x: 3.2, z: 12.8 } : { x: 2.9, z: 12 },
            api.blocked,
          ) || [];
      }
    } else if (actor.phase === "resortLeave" && walkResort(actor, dt)) {
      g.resortActors = g.resortActors.filter((a) => a !== actor);
    }
    if (workers[1])
      workers[1].working = actor.phase === "resortWait" && s.wagesDue === 0;
    if (actor.phase !== "resortWait") returnToStation();
    else if (worker && s.wagesDue > 0) worker.moving = false;
  }
  if (g.resortClock > 20) g.resortClock = 0;
}
export function resortObstacles(s) {
  const out = [];
  if (!s.floor && level(s, "garage"))
    for (let i = 0; i < 3; i++)
      out.push({ x: 18.1 + i * 5, z: 14.5, w: 1.8, d: 3 });
  if (!s.floor && level(s, "garden")) {
    out.push({ x: -1.4, z: 23.5, w: 2.8, d: 1 });
    if (level(s, "garden") > 1) out.push({ x: 6.9, z: 20.4, w: 2.2, d: 2.2 });
  }
  if (!s.floor && level(s, "excursions"))
    out.push({ x: 5.85, z: 18.95, w: 2.3, d: 0.7 });
  if (!s.floor && level(s, "desserts"))
    out.push({ x: 27.8, z: 0.8, w: 2.4, d: 1.05 });
  if (!s.floor && level(s, "chef"))
    out.push({ x: 16.75, z: -11.55, w: 2.5, d: 1.1 });
  if (s.floor === 1 && level(s, "roomService"))
    out.push({ x: 18, z: -6.35, w: 4, d: 1.3 });
  if (s.floor === 1 && level(s, "skyCafe"))
    out.push({ x: 22.7, z: 1.45, w: 2.6, d: 1.1 });
  return out;
}
