import { RESTORATION } from "./restoration.js?v=13b0fb40d9189ad2";
import { selectDecor } from "./decor.js?v=13b0fb40d9189ad2";
import { ECONOMY } from "./economy.js?v=13b0fb40d9189ad2";
import { createRooftop, updateRooftop } from "./rooftop.js?v=13b0fb40d9189ad2";
import {
  createGame,
  update,
  serialize,
  depart,
  wageRate,
  staffCount,
  RECEPTION,
  roomRoute,
  distance,
} from "./model.js?v=13b0fb40d9189ad2";

// Demand follows built rooms accepting bookings across both floors.
export function arrivalInterval(h, busy = false) {
  const rooms = h.floors.reduce(
    (count, g) =>
      count +
      g.state.levels.filter(
        (level, i) => level > 0 && !g.state.bookingsPaused[i],
      ).length,
    0,
  );
  if (!rooms) return Infinity;
  const base = Math.max(4, 10 - (h.reputation - 50) / 15);
  return Math.max(
    busy ? 1.2 : 1.8,
    (base / (1 + 0.32 * (rooms - 1))) * (busy ? 0.65 : 1),
  );
}

export const LIFT = { x: 3.2, z: 12.8 };
const bounded = (v, fallback, lo, hi) =>
  Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
export function createHotel(saved) {
  const ground = createGame(saved);
  ground.state.economy = true;
  if (!saved) ground.state.cash = ECONOMY.startingCash;
  const h = {
    decor: "palm",
    restoration: [],
    openingCelebrated: !!saved?.openingCelebrated,
    liftReady: true,
    liftChoice: false,
    easygoing: saved?.easygoing !== false,
    claimed: Array.isArray(saved?.claimed)
      ? [...new Set(saved.claimed.filter((v) => typeof v === "string"))]
      : [],
    floors: [ground],
    active: 0,
    reputation: bounded(saved?.hospitality?.reputation, 78, 20, 100),
    reviews: bounded(saved?.hospitality?.reviews, 0, 0, 1e9),
    lost: bounded(saved?.hospitality?.lost, 0, 0, 1e9),
    happy: bounded(saved?.hospitality?.happy, 0, 0, 1e9),
    clock: bounded(saved?.hospitality?.clock, 0, 0, 1e9),
    reactionAt: -10,
    events: [],
    recent: [],
    waitSamples: [],
    income: 0,
    wages: 0,
    rushHandled: bounded(saved?.hospitality?.rushHandled, 0, 0, 1000),
    rushLost: bounded(saved?.hospitality?.rushLost, 0, 0, 1000),
    lastRush: bounded(saved?.hospitality?.lastRush, -1, -1, 1e9),
    rushPaid: !!saved?.hospitality?.rushPaid,
  };
  if (ground.state.elevator) {
    h.floors.push(makeUpper(saved?.upper));
    const upper = h.floors[1].state;
    // Upper-floor migration credits belong in the shared wallet too.
    const savedUpperCash = Math.max(
      0,
      Math.min(1e8, Number(saved?.upper?.cash) || 0),
    );
    ground.state.cash += Math.max(0, upper.cash - savedUpperCash);
    const relocated = upper.staff.receptionist;
    const room = Math.max(0, 3 - ground.state.staff.receptionist);
    ground.state.staff.receptionist += Math.min(room, relocated);
    for (let n = room; n < relocated; n++)
      ground.state.cash += Math.round((600 * Math.pow(1.75, n)) / 25) * 25;
    ground.state.concierge = ground.state.staff.receptionist > 0;
    ground.state.cash += (upper.paid[5] || 0) + (upper.paid[6] || 0);
    upper.paid[5] = 0;
    upper.paid[6] = 0;
    if (upper.desk) {
      if (ground.state.desk) ground.state.cash += 250;
      else ground.state.desk = true;
    }
    upper.staff.receptionist = 0;
    upper.concierge = false;
    upper.desk = false;
    upper.cash = ground.state.cash;
    ground.upper = h.floors[1];
  }
  if (h.floors[1]?.state.roofUnlocked) {
    h.floors.push(createRooftop(saved?.rooftop));
    h.floors[2].state.cash = ground.state.cash;
  }
  // Only retain a contiguous completed journey; old saves keep all gameplay.
  for (const chapter of RESTORATION) {
    if (
      !Array.isArray(saved?.restoration) ||
      !saved.restoration.includes(chapter.id)
    )
      break;
    h.restoration.push(chapter.id);
  }
  selectDecor(h, saved?.decor);
  return h;
}
function makeUpper(saved) {
  const upper = createGame(
    saved || { version: 5, floor: 1, levels: [0, 0, 0, 0, 0, 0] },
  );
  upper.state.floor = 1;
  upper.state.economy = true;
  upper.player.x = LIFT.x;
  upper.player.z = LIFT.z;
  return upper;
}
export function serializeHotel(h) {
  return {
    ...serialize(h.floors[0]),
    upper: h.floors[1] ? serialize(h.floors[1]) : undefined,
    rooftop: h.floors[2] ? serialize(h.floors[2]) : undefined,
    decor: h.decor,
    restoration: [...h.restoration],
    openingCelebrated: h.openingCelebrated,
    claimed: [...h.claimed],
    easygoing: h.easygoing,
    hospitality: {
      reputation: h.reputation,
      reviews: h.reviews,
      lost: h.lost,
      happy: h.happy,
      clock: h.clock,
      rushHandled: h.rushHandled,
      rushLost: h.rushLost,
      lastRush: h.lastRush,
      rushPaid: h.rushPaid,
    },
  };
}
export function travel(h, floor) {
  if (!h.floors[floor] || floor === h.active) return false;
  const current = h.floors[h.active];
  if (distance(current.player, LIFT) > 2.2) return false;
  current.player.present = false;
  h.active = floor;
  h.liftReady = false;
  h.liftChoice = false;
  const next = h.floors[floor];
  Object.assign(next.player, { ...LIFT, present: true, moving: false });
  return true;
}
export function transferStaff(h, role, from, to) {
  const a = h.floors[from],
    b = h.floors[to];
  if (from > 1 || to > 1 || (role === "receptionist" && to === 1)) return false;
  if (
    !a ||
    !b ||
    from === to ||
    !["receptionist", "cleaner", "runner"].includes(role) ||
    !staffCount(a.state, role) ||
    staffCount(b.state, role) >= 3
  )
    return false;
  // Preserve earned cargo and partial cleaning before reassigning a worker.
  const count = staffCount(a.state, role);
  const worker =
    role === "cleaner"
      ? a.cleaners[count - 1]
      : role === "runner"
        ? a.runners[count - 1]
        : null;
  if (worker) {
    if (worker.cargo) {
      for (const floor of h.floors) floor.state.cash += worker.cargo;
      worker.cargo = 0;
    }
    worker.phase = "idle";
    worker.route = [];
    worker.room = -1;
  }
  a.state.staff[role]--;
  b.state.staff[role]++;
  for (const g of [a, b]) {
    g.state.concierge = g.state.staff.receptionist > 0;
    g.state.cleaner = g.state.staff.cleaner > 0;
    g.state.runner = g.state.staff.runner > 0;
  }
  return true;
}
export function releaseStaff(h, role, floor) {
  const g = h.floors[floor];
  if (!g || !staffCount(g.state, role)) return false;
  const worker =
    role === "cleaner"
      ? g.cleaners[staffCount(g.state, role) - 1]
      : role === "runner"
        ? g.runners[staffCount(g.state, role) - 1]
        : null;
  if (worker) {
    if (worker.cargo) {
      for (const floor of h.floors) floor.state.cash += worker.cargo;
      worker.cargo = 0;
    }
    worker.phase = "idle";
    worker.route = [];
    worker.room = -1;
  }
  g.state.staff[role]--;
  g.state.concierge = g.state.staff.receptionist > 0;
  g.state.cleaner = g.state.staff.cleaner > 0;
  g.state.runner = g.state.staff.runner > 0;
  return true;
}
function review(h, g, v, score) {
  if (v.reviewed) return;
  v.reviewed = true;
  h.reviews++;
  h.reputation = Math.max(
    20,
    Math.min(100, h.reputation * 0.97 + score * 0.03),
  );
  if (score >= 80) h.happy++;
}
function react(h, g, v) {
  if (h.clock - h.reactionAt < 7 || v.reacted || g !== h.floors[h.active])
    return;
  v.reacted = true;
  v.happyUntil = g.time + 1.7;
  h.reactionAt = h.clock;
}
export function updateHotel(h, dt, input = { x: 0, z: 0 }) {
  dt = Math.max(0, Math.min(0.05, dt));
  h.clock += dt;
  h.events = [];
  const cycle = h.clock % 240,
    busy = cycle >= 180 && cycle < 220;
  const rush = Math.floor(h.clock / 240);
  if (busy && h.lastRush !== rush) {
    h.lastRush = rush;
    h.rushHandled = 0;
    h.rushLost = 0;
    h.events.push({
      type: "notice",
      text: "Tour group arriving · keep waits short for a $600 bonus.",
    });
  }
  h.floors[0].upper = h.floors[1];
  let wallet = h.floors[0].state.cash;
  for (let floor = 0; floor < h.floors.length; floor++) {
    const g = h.floors[floor],
      s = g.state;
    s.cash = wallet;
    g.player.present = floor === h.active;
    const incomeBefore = s.earned,
      wagesBefore = s.wagesPaid;
    const previous = new Map(g.guests.map((v) => [v.id, v.phase]));
    for (const v of g.guests) {
      if (v.phase === "queue") {
        v.wait = (v.wait || 0) + dt;
        const patience =
          (v.kind === "VIP" ? 30 : 55) +
          (h.easygoing ? 20 : 0) +
          (h.floors.some((f) => f.state.lounge) ? 20 : 0);
        if (v.wait > patience) {
          h.lost++;
          if (busy) h.rushLost++;
          review(h, g, v, 25);
          depart(g, v);
        }
      }
    }
    if (!floor) {
      const interval = arrivalInterval(h, busy);
      g.arrivalInterval = interval;
      // React immediately when new rooms open, without waiting out the old delay.
      g.spawn = Number.isFinite(interval) ? Math.min(g.spawn, interval) : 1;
    }
    if (floor === 2) {
      updateRooftop(g, dt, floor === h.active ? input : { x: 0, z: 0 });
      for (const visitor of g.guests.filter((v) => v.phase === "roofReturn")) {
        const lower = h.floors[0];
        const returning = {
          ...visitor,
          id: ++lower.seq,
          ...LIFT,
          room: -1,
          phase: "exit",
          route: [
            { x: 2.9, z: 12.8 },
            { x: 0, z: 16 },
          ],
          rooftopVisited: true,
        };
        lower.guests.push(returning);
      }
      g.guests = g.guests.filter((v) => v.phase !== "roofReturn");
      const income = s.earned - incomeBefore,
        wages = s.wagesPaid - wagesBefore;
      if (income || wages) h.recent.push({ at: h.clock, income, wages, floor });
      wallet = s.cash;
      continue;
    }
    update(g, dt, floor === h.active ? input : { x: 0, z: 0 });
    for (const v of g.guests) {
      if (!v.kind) {
        v.kind =
          h.floors[1]?.state.levels.some((l) => l === 2) && v.id % 4 === 0
            ? "VIP"
            : v.id % 3 === 0
              ? "Family"
              : "Leisure";
        v.wait = 0;
        v.satisfaction = 80;
        if (!s.levels.some(Boolean)) {
          v.phase = "gone";
          continue;
        }
      }
      if (
        previous.get(v.id) === "queue" &&
        ["room", "toLift"].includes(v.phase)
      ) {
        v.satisfaction = Math.max(
          35,
          96 - v.wait * (h.easygoing ? 0.6 : 0.9) + (s.lounge ? 8 : 0),
        );
        v.timer = v.phase === "toLift" || s.floor ? 32 : 22;
        if (busy) h.rushHandled++;
        if (v.satisfaction >= 82) react(h, g, v);
      }
      if (previous.get(v.id) === "stay" && v.phase === "leavingRoom") {
        v.satisfaction = Math.min(
          100,
          (v.satisfaction || 75) +
            (s.lounge ? 8 : 0) -
            (v.kind === "Family" && !h.floors[0].state.pool && !s.lounge
              ? 8
              : 0),
        );
        if (v.satisfaction >= 80) react(h, g, v);
      }
      if (
        v.phase === "toCafe" &&
        previous.get(v.id) !== "toCafe" &&
        g.guests.filter(
          (other) => other !== v && ["toCafe", "cafe"].includes(other.phase),
        ).length >= 2
      ) {
        v.satisfaction = Math.max(35, (v.satisfaction || 75) - 6);
        depart(g, v);
      }
      if (v.phase === "cafe" || v.phase === "pool")
        v.satisfaction = Math.min(100, (v.satisfaction || 75) + dt * 1.5);
      if (
        !floor &&
        h.floors[2] &&
        v.phase === "exit" &&
        !v.rooftopVisited &&
        (v.satisfaction || 0) >= 55 &&
        h.floors[2].guests.length +
          g.guests.filter((a) => ["toRoof", "transitRoof"].includes(a.phase))
            .length <
          6
      ) {
        v.rooftopVisited = true;
        v.phase = "toRoof";
        v.route = [{ x: 2.9, z: 5.2 }, { x: 2.9, z: 12.8 }, { ...LIFT }];
      }
      if (v.phase === "exit" && !v.reviewed)
        review(h, g, v, v.satisfaction || 75);
    }
    for (const v of g.guests) {
      if (v.phase === "transitRoof" && h.floors[2]) {
        const roof = h.floors[2];
        roof.guests.push({
          ...v,
          id: ++roof.seq,
          ...LIFT,
          room: -1,
          phase: "roofArrive",
        });
        v.phase = "gone";
      } else if (v.phase === "transitUp") {
        const reservation = h.floors[1]?.guests.find(
          (a) => a.arrivalToken === v.id && a.phase === "waitingLift",
        );
        if (reservation) {
          Object.assign(reservation, {
            x: LIFT.x,
            z: LIFT.z,
            phase: "room",
            route: roomRoute(reservation.room),
            satisfaction: v.satisfaction,
            timer: v.timer,
            wait: v.wait,
          });
          delete reservation.arrivalToken;
          h.floors[1].state.welcomed++;
        }
        v.phase = "gone";
      } else if (v.phase === "transitDown") {
        const lower = h.floors[0];
        const returning = {
          ...v,
          id: ++lower.seq,
          x: LIFT.x,
          z: LIFT.z,
          room: -1,
        };
        returning.phase = "leavingRoom";
        returning.route = [{ x: 2.9, z: 12.8 }];
        lower.guests.push(returning);
        v.phase = "gone";
      }
    }
    const income = s.earned - incomeBefore,
      wages = s.wagesPaid - wagesBefore;
    const upstairsSales = g.events
      .filter((e) => e.type === "checkin" && e.bookedFloor === 1)
      .reduce((a, e) => a + e.value, 0);
    if (income || wages)
      h.recent.push({
        at: h.clock,
        income: income - upstairsSales,
        wages,
        floor,
      });
    if (upstairsSales)
      h.recent.push({ at: h.clock, income: upstairsSales, wages: 0, floor: 1 });
    for (const e of g.events)
      if (e.type === "checkin")
        h.waitSamples.push({
          at: h.clock,
          wait: e.wait || 0,
          floor: e.bookedFloor || 0,
        });
    wallet = s.cash;
  }
  if (h.floors[0].state.elevator && !h.floors[1]) {
    h.floors.push(makeUpper());
    h.events.push({
      type: "notice",
      text: "Second floor open! Walk into the elevator to visit Floor 2.",
    });
  }
  if (h.floors[1]?.state.roofUnlocked && !h.floors[2]) {
    h.floors.push(createRooftop());
    h.events.push({
      type: "notice",
      text: "The rooftop is open · a pool above the palms. Walk into the lift to visit.",
    });
  }
  if (h.lastRush === rush && cycle >= 220 && !h.rushPaid) {
    h.rushPaid = true;
    if (h.rushHandled >= 5 && h.rushLost <= 2) {
      wallet += 600;
      h.recent.push({ at: h.clock, income: 600, wages: 0, floor: 0 });
      h.events.push({
        type: "notice",
        text: "Tour group delighted · $600 bonus!",
      });
    } else
      h.events.push({
        type: "notice",
        text: "Tour group left · aim for 5 check-ins and at most 2 lost guests next time.",
      });
  }
  if (cycle < 180) h.rushPaid = false;
  const shoes = Math.max(...h.floors.map((g) => g.state.shoes));
  for (const g of h.floors) {
    g.state.cash = wallet;
    g.state.shoes = shoes;
  }
  const manager = h.floors[h.active].player;
  const liftDistance = distance(manager, LIFT);
  if (liftDistance > 1.6) h.liftReady = true;
  if (
    h.floors.length > 1 &&
    h.liftReady &&
    manager.moving &&
    liftDistance < 0.9
  ) {
    if (h.floors.length === 2) travel(h, 1 - h.active);
    else {
      h.liftChoice = true;
      h.liftReady = false;
    }
  }
  h.waitSamples = h.waitSamples.filter((e) => h.clock - e.at < 60);
  h.recent = h.recent.filter((e) => h.clock - e.at < 60);
  h.income = h.recent.reduce((a, e) => a + e.income, 0);
  h.wages = h.recent.reduce((a, e) => a + e.wages, 0);
}
export const totalWages = (h) =>
  h.floors.reduce((a, g) => a + wageRate(g.state), 0);

export function chooseWing(h, type) {
  const s = h.floors[0].state;
  if (
    !["rooms", "restaurant"].includes(type) ||
    !s.expanded ||
    s.wing ||
    s.paid[19] > 0
  )
    return false;
  s.wingType = type;
  return true;
}
export function toggleBookings(h, floor, room) {
  const s = h.floors[floor]?.state;
  if (!s || !s.levels[room]) return false;
  s.bookingsPaused[room] = !s.bookingsPaused[room];
  return true;
}
export function floorMetrics(h, floor) {
  const g = h.floors[floor];
  const built = g.state.levels.filter(Boolean).length;
  const occupied = new Set(
    g.guests
      .filter((v) => v.room >= 0 && !["exit", "gone"].includes(v.phase))
      .map((v) => v.room),
  ).size;
  const entries = h.recent.filter((e) => e.floor === floor),
    waits = h.waitSamples.filter((e) => e.floor === floor);
  const income = entries.reduce((a, e) => a + e.income, 0),
    wages = entries.reduce((a, e) => a + e.wages, 0);
  return {
    built,
    occupied,
    income,
    wages,
    profit: income - wages,
    wait: waits.length
      ? waits.reduce((a, e) => a + e.wait, 0) / waits.length
      : null,
  };
}
