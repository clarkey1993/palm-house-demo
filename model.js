import { ROOMS, PADS, FACILITIES } from "./layout.js";
export { ROOMS, PADS, FACILITIES } from "./layout.js";
import { ECONOMY } from "./economy.js";
import { demoPadAllowed } from "./opening.js";
// Pure game simulation: rendering, input and persistence live outside this module.
export const CLEAN_SPOTS = ROOMS.map((r) => ({
  x: r.x - Math.sign(r.x) * 2.65,
  z: r.z + 1.3,
}));
export const cafeOffset = (s) => (s.wing ? -17.5 : s.expanded ? -7.5 : 0);
export const padPosition = (s, pad) =>
  pad.i === 26 ? { ...pad, z: pad.z + cafeOffset(s) } : pad;
export const facilityPosition = (s, source) => ({
  ...FACILITIES[source],
  z: FACILITIES[source].z + (source === "cafe" ? cafeOffset(s) : 0),
});
export const RECEPTION = { x: 0, z: 5.8 };
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const roomForPad = (i) =>
  i < 4 ? i : i === 13 ? 4 : i === 14 ? 5 : i === 20 ? 6 : i === 21 ? 7 : -1;
export const roomCount = (s) =>
  s.floor === 2 ? 0 : s.wing ? 8 : s.expanded ? 6 : 4;
export const RESTAURANT_SERVICE = { x: 22.4, z: -4 };
const doorX = (i) => Math.sign(ROOMS[i].x) * 3.1;
const corridorX = (i) => 2.9;
export const unlocked = (s, i) => {
  if (s.openingDemo && !demoPadAllowed(s, i)) return false;
  if (i === 36) return !s.floor && s.wing && s.restaurant;
  if (i === 37) return !s.floor && s.gym;
  if (s.floor === 2) return i >= 29 && i <= 32;
  if (i === 28) return s.floor === 1 && s.levels.filter(Boolean).length >= 2;
  if (i >= 29 && i <= 32) return false;
  if (i === 33) return !s.floor && s.expanded;
  if (i === 34 || i === 35) return !s.floor && s.restaurant;
  if (s.floor === 1 && (i === 13 || i === 14)) return s.expanded;
  if (s.floor === 1)
    return [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 27].includes(i);
  if (i === 25) return s.pool;
  if (i === 26) return s.cafe;
  if (i === 27) return s.expanded;
  if (i === 19) return s.expanded;
  if (i === 20 || i === 21) return s.wing;
  if (i === 22) return s.restaurantPlot;
  if (i === 23) return s.restaurant;
  if (i === 24) return s.expanded;
  if (i === 15) return s.expanded;
  if (i === 16 || i === 17) return false;
  if (i === 18) return s.runner;
  return i < 13 || s.expanded;
};
export const workRate = (s) => 1 + s.training * 0.25;
export const moveRate = (s) => 1 + s.shoes * 0.2;
export const roomRate = (s, i) =>
  ECONOMY.roomRates[s.floor === 1 ? 1 : 0][s.levels[i] === 2 ? 1 : 0] +
  (!s.floor && i >= 4 ? ECONOMY.extraRoomRate : 0);
export const ROLE_BY_PAD = { 6: "receptionist", 8: "cleaner", 9: "runner" };
export const BASE_WAGES = ECONOMY.baseWages;
export const staffCount = (s, role) =>
  s.staff?.[role] ?? Number(role === "receptionist" ? s.concierge : s[role]);
export const nextWage = (s, role) =>
  (BASE_WAGES[role] + staffCount(s, role) * 10) *
  (s.economy ? (s.floor === 1 ? 4 : 3) : 1);
export const wageRate = (s) =>
  s.attendants * 60 +
  15 * s.attendants * (s.attendants - 1) +
  (s.servers ? 90 * s.servers + 15 * s.servers * (s.servers - 1) : 0) +
  Object.keys(BASE_WAGES).reduce((sum, role) => {
    const n = staffCount(s, role);
    return (
      sum +
      (n * BASE_WAGES[role] + 5 * n * (n - 1)) *
        (s.economy ? (s.floor === 1 ? 4 : 3) : 1)
    );
  }, 0);
export const onDuty = (s) => s.wagesDue === 0;
export const LOBBY_UPGRADES = { 25: "barMenu", 26: "bakery", 27: "minibar" };
export const price = (s, i) => {
  if (Object.hasOwn(ECONOMY.fixed, i)) return ECONOMY.fixed[i];
  if (i === 35) return ECONOMY.kitchen[s.kitchen ? 1 : 0];
  if (i === 27 && s.floor === 1) return ECONOMY.upperMinibar[s.minibar] ?? 1600;
  if (i === 29) return ECONOMY.pool[s.poolLevel] ?? 3000;
  if (i === 30) return ECONOMY.juice[s.roofJuice ? 1 : 0];
  if (i === 31) return ECONOMY.spa[s.roofSpa ? 1 : 0];
  if (i === 32) return ECONOMY.hostHire[Math.min(1, s.attendants)];
  if (i >= 25 && i <= 27)
    return ECONOMY.incomeUpgrades[s[LOBBY_UPGRADES[i]]] ?? 2200;
  if (i === 23) return ECONOMY.serverHire[Math.min(2, s.servers)];
  if (i === 20 || i === 21)
    return s.levels[roomForPad(i)]
      ? ECONOMY.northUpgrade[i - 20]
      : ECONOMY.northBuild[i - 20];
  if (i === 18) return ECONOMY.carts[s.floor === 1 ? 1 : 0];
  const r = roomForPad(i);
  if (r >= 0 && s.floor === 1)
    return s.levels[r] ? ECONOMY.upperUpgrade[r] : ECONOMY.upperBuild[r];
  if (r >= 0)
    return s.levels[r] === 0 ? ECONOMY.roomBuild[r] : ECONOMY.roomUpgrade[r];
  if (ROLE_BY_PAD[i]) {
    const count = staffCount(s, ROLE_BY_PAD[i]),
      base = ECONOMY.staffHire[i];
    return Math.round((base * Math.pow(ECONOMY.staffGrowth, count)) / 25) * 25;
  }
  if (i === 10) return ECONOMY.expansion[s.floor === 1 ? 1 : 0];
  if (i === 11) return ECONOMY.training[Math.min(2, s.training)];
  if (i === 12) return ECONOMY.shoes[Math.min(2, s.shoes)];
  return ECONOMY.lobby[i - 4];
};
export const complete = (s, i) => {
  if (i === 36) return s.gym;
  if (i === 37) return s.gymUpgrade;
  if (i === 33) return s.restaurantPlot;
  if (i === 34) return s.diningExpansion;
  if (i === 35) return s.kitchen >= 2;
  if (i === 28) return s.roofUnlocked;
  if (i === 29) return s.poolLevel >= 2;
  if (i === 30) return s.roofJuice >= 2;
  if (i === 31) return s.roofSpa >= 2;
  if (i === 32) return s.attendants >= 2;
  if (i >= 25 && i <= 27) return s[LOBBY_UPGRADES[i]] >= 3;
  if (i === 19) return s.wing;
  if (i === 22) return s.restaurant;
  if (i === 23) return s.servers >= 3;
  if (i === 24) return s.extraDesk;
  if (i >= 15 && i <= 18)
    return !!s[{ 15: "elevator", 16: "laundry", 17: "lounge", 18: "cart" }[i]];
  if (ROLE_BY_PAD[i]) return staffCount(s, ROLE_BY_PAD[i]) >= 3;
  const r = roomForPad(i);
  if (r >= 0) return s.levels[r] >= 2;
  return i === 10
    ? s.expanded
    : i === 11
      ? s.training >= 3
      : i === 12
        ? s.shoes >= 3
        : s[["pool", "desk", "concierge", "cafe", "cleaner", "runner"][i - 4]];
};
export const label = (s, i) => {
  if (i === 36) return "Open guest gym";
  if (i === 37) return "Upgrade gym";
  if (i === 28) return "Open the rooftop";
  if (i === 29) return "Pool cabanas " + (s.poolLevel + 1) + "/2";
  if (i === 30) return s.roofJuice ? "Upgrade juice bar" : "Sunset juice bar";
  if (i === 31) return s.roofSpa ? "Upgrade spa" : "Open the spa";
  if (i === 32) return "Hire pool host " + (s.attendants + 1) + "/2";
  if (i >= 25 && i <= 27)
    return (
      { 25: "Bar menu", 26: "Bakery counter", 27: "Room minibars" }[i] +
      " " +
      (s[LOBBY_UPGRADES[i]] + 1) +
      "/3"
    );
  if (i === 33) return "Restaurant terrace";
  if (i === 34) return "Three more tables";
  if (i === 35) return "Upgrade kitchen " + (s.kitchen + 1) + "/2";
  if (i === 19) return "North bedroom wing";
  if (i === 20 || i === 21)
    return s.levels[roomForPad(i)] ? "Upgrade suite" : "Unlock room";
  if (i === 22) return "Open restaurant";
  if (i === 23) return "Hire server " + (s.servers + 1) + "/3";
  if (i === 24) return "Second desk position";
  if (i >= 15)
    return {
      15: "Elevator · floor 2",
      16: "Laundry station",
      17: "Guest lounge",
      18: "Luggage carts",
    }[i];
  if (ROLE_BY_PAD[i])
    return (
      "Hire " +
      (i === 6 ? "reception" : i === 8 ? "cleaner" : "runner") +
      " " +
      (staffCount(s, ROLE_BY_PAD[i]) + 1) +
      "/3"
    );
  const r = roomForPad(i);
  if (r >= 0) return s.levels[r] ? "Upgrade suite" : "Build room";
  if (i === 10) return "Garden wing";
  if (i === 11) return "Train team " + (s.training + 1) + "/3";
  if (i === 12) return "Comfy shoes " + (s.shoes + 1) + "/3";
  return [
    "Open bar",
    "Faster desk",
    "Hire receptionist",
    "Breakfast bar",
    "Hire cleaner",
    "Hire cash runner",
  ][i - 4];
};
export const benefit = (s, i) => {
  if (i === 4) return "Guests buy drinks for $20 · collect tips beside the bar";
  if (i === 5)
    return "Check-in takes 0.65 seconds instead of 1.3 · no extra wages";
  if (i === 7)
    return "Guests buy breakfast for $15 · collect tips beside the counter";
  if (i === 36) return "Guest workouts earn $40 · three exercise spaces";
  if (i === 37) return "Six spaces · $65 per workout";
  if (i === 28)
    return "A rooftop pool included · hotel guests visit after their stay";
  if (i === 29) return "Pool visits earn $" + (60 + 25 * (s.poolLevel + 1));
  if (i === 30) return "Adds $" + (s.roofJuice + 1) * 25 + " per rooftop visit";
  if (i === 31) return "Adds $" + (s.roofSpa + 1) * 40 + " per rooftop visit";
  if (i === 32)
    return (
      "Collects rooftop cash · new host wages $" +
      (60 + s.attendants * 30) +
      "/min"
    );
  if (i === 25)
    return (
      "Drinks earn $" +
      (20 + 15 * (s.barMenu + 1)) +
      " per guest · no extra wages"
    );
  if (i === 26)
    return (
      "Breakfast earns $" +
      (15 + 15 * (s.bakery + 1)) +
      " per guest · no extra wages"
    );
  if (i === 27)
    return (
      "Every downstairs checkout leaves $" +
      15 * (s.minibar + 1) +
      " in the room · collect it or hire runners"
    );
  if (i === 20 || i === 21)
    return "North-wing stays earn $55 · premium suites $80";
  if (i === 33) return "A separate restaurant terrace · keep all your rooms";
  if (i === 34) return "Six tables instead of three · shorter dining queues";
  if (i === 35)
    return (
      "Meals earn $" +
      (45 + 15 * (s.kitchen + 1)) +
      " · preparation 25% faster per level"
    );
  if (i === 19)
    return "Two more bedroom projects · restaurant remains available";
  if (i === 22)
    return "Serve dinner for $45 per guest · hire servers or help yourself";
  if (i === 23) return "New server wages $" + (90 + s.servers * 30) + "/min";
  if (i === 24) return "Two staffed desks check in two guests at once";
  if (i >= 15)
    return {
      15: "Open an unfinished second floor · rooms from $2,400",
      16: "Clean upstairs rooms 50% faster",
      17: "Guests relax here and leave $45 · more patience too",
      18: "Cash runners walk 50% faster",
    }[i];
  if (s.floor === 1 && roomForPad(i) >= 0)
    return "Upstairs stays earn $110 · premium suites earn $180";
  if (i === 10) return "Add two furnished rooms · capacity grows to six";
  if (i === 11)
    return "Team work and walking speed: +" + (s.training + 1) * 25 + "%";
  if (i === 12) return "Your walking speed: +" + (s.shoes + 1) * 20 + "%";
  if (ROLE_BY_PAD[i])
    return (
      "New hire: $" +
      nextWage(s, ROLE_BY_PAD[i]) +
      "/min · team total $" +
      (wageRate(s) + nextWage(s, ROLE_BY_PAD[i])) +
      "/min"
    );
  const r = roomForPad(i);
  if (r >= 0)
    return (
      "Earn $" +
      (s.levels[r] ? 55 + (r >= 4 ? 25 : 0) : 30 + (r >= 4 ? 25 : 0)) +
      " at check-in"
    );
  return "Stand here to invest your cash";
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function createGame(saved) {
  const s = {
    cash: 0,
    floor: 0,
    elevator: false,
    laundry: false,
    lounge: false,
    cart: false,
    economy: false,
    welcomed: 0,
    levels: [1, 0, 0, 0, 0, 0, 0, 0],
    expanded: false,
    wing: false,
    wingType: null,
    restaurant: false,
    restaurantPlot: false,
    gym: false,
    gymUpgrade: false,
    diningExpansion: false,
    kitchen: 0,
    servers: 0,
    extraDesk: false,
    roofUnlocked: false,
    poolLevel: 0,
    roofJuice: 0,
    roofSpa: 0,
    attendants: 0,
    barMenu: 0,
    bakery: 0,
    minibar: 0,
    bookingsPaused: Array(8).fill(false),
    training: 0,
    shoes: 0,
    staff: { receptionist: 0, cleaner: 0, runner: 0 },
    runnerLoads: [0, 0, 0],
    payrollClock: 0,
    wageAccrued: 0,
    wagesDue: 0,
    wagesPaid: 0,
    paid: Array(PADS.length).fill(0),
    dirty: Array(8).fill(false),
    cleaning: Array(8).fill(0),
    cleaner: false,
    runner: false,
    runnerCash: 0,
    cleaned: 0,
    visits: { pool: 0, cafe: 0, restaurant: 0, gym: 0 },
    pool: false,
    desk: false,
    concierge: false,
    cafe: false,
    earned: 0,
  };
  if (saved && [1, 2, 3, 4, 5].includes(saved.version)) {
    s.floor = [1, 2].includes(saved.floor) ? saved.floor : 0;
    for (const key of ["elevator", "laundry", "lounge", "cart", "economy"])
      s[key] = !!saved[key];
    s.cash = clamp(Number(saved.cash) || 0, 0, 1e8);
    s.welcomed = clamp(Number(saved.welcomed) || 0, 0, 1e8);
    s.earned = clamp(Number(saved.earned) || 0, 0, 1e9);
    s.expanded = !!saved.expanded;
    s.wingType = ["rooms", "restaurant"].includes(saved.wingType)
      ? saved.wingType
      : null;
    s.wing = !!saved.wing && !s.floor && s.expanded;
    s.restaurantPlot =
      !s.floor &&
      (!!saved.restaurantPlot || (s.wing && s.wingType === "restaurant"));
    s.gym = !s.floor && !!saved.restaurant && !!saved.gym;
    s.gymUpgrade = s.gym && !!saved.gymUpgrade;
    s.restaurant = !!saved.restaurant && s.restaurantPlot;
    s.diningExpansion = !!saved.diningExpansion && s.restaurant;
    s.kitchen = s.restaurant
      ? clamp(Math.floor(Number(saved.kitchen) || 0), 0, 2)
      : 0;
    s.servers = s.restaurant
      ? clamp(Math.floor(Number(saved.servers) || 0), 0, 3)
      : 0;
    s.extraDesk = !!saved.extraDesk && !s.floor;
    s.roofUnlocked = s.floor === 1 && !!saved.roofUnlocked;
    for (const key of ["poolLevel", "roofJuice", "roofSpa", "attendants"])
      s[key] =
        s.floor === 2 ? clamp(Math.floor(Number(saved[key]) || 0), 0, 2) : 0;
    for (const key of Object.values(LOBBY_UPGRADES))
      s[key] =
        s.floor && !(s.floor === 1 && key === "minibar")
          ? 0
          : clamp(Math.floor(Number(saved[key]) || 0), 0, 3);
    s.bookingsPaused = Array.from(
      { length: 8 },
      (_, i) => !!saved.bookingsPaused?.[i],
    );
    s.training = clamp(Math.floor(Number(saved.training) || 0), 0, 3);
    s.shoes = clamp(Math.floor(Number(saved.shoes) || 0), 0, 3);
    s.payrollClock = clamp(Number(saved.payrollClock) || 0, 0, 59.99);
    s.wageAccrued = clamp(Number(saved.wageAccrued) || 0, 0, 3000);
    s.wagesDue = clamp(Math.round(Number(saved.wagesDue) || 0), 0, 3000);
    s.wagesPaid = clamp(Number(saved.wagesPaid) || 0, 0, 1e9);
    s.levels = Array.from({ length: 8 }, (_, i) =>
      i >= roomCount(s)
        ? 0
        : clamp(
            Math.floor(Number(saved.levels?.[i]) || 0),
            i === 0 && !s.floor ? 1 : 0,
            2,
          ),
    );
    s.pool = !!saved.pool;
    s.desk = !!saved.desk;
    s.concierge = !!saved.concierge;
    s.cafe = !!saved.cafe;
    s.cleaner = !!saved.cleaner;
    s.runner = !!saved.runner;
    s.staff = Object.fromEntries(
      Object.keys(BASE_WAGES).map((role) => [
        role,
        clamp(
          Math.floor(
            Number(
              saved.staff?.[role] ??
                Number(role === "receptionist" ? s.concierge : s[role]),
            ),
          ) || 0,
          0,
          3,
        ),
      ]),
    );
    s.concierge = s.staff.receptionist > 0;
    s.cleaner = s.staff.cleaner > 0;
    s.runner = s.staff.runner > 0;
    s.runnerCash = clamp(Number(saved.runnerCash) || 0, 0, 1e9);
    s.cleaned = clamp(Number(saved.cleaned) || 0, 0, 1e9);
    s.dirty = Array.from(
      { length: 8 },
      (_, i) => !!saved.dirty?.[i] && s.levels[i] > 0,
    );
    s.cleaning = Array.from({ length: 8 }, (_, i) =>
      s.dirty[i] ? clamp(Number(saved.cleaning?.[i]) || 0, 0, 0.99) : 0,
    );
    s.visits = {
      restaurant: clamp(Number(saved.visits?.restaurant) || 0, 0, 1e9),
      gym: clamp(Number(saved.visits?.gym) || 0, 0, 1e9),
      pool: clamp(Number(saved.visits?.pool) || 0, 0, 1e9),
      cafe: clamp(Number(saved.visits?.cafe) || 0, 0, 1e9),
    };
    s.paid = Array.from({ length: PADS.length }, (_, i) => {
      const previous = clamp(Number(saved.paid?.[i]) || 0, 0, 1e7);
      const retained = complete(s, i)
        ? 0
        : Math.min(previous, Math.max(0, (price(s, i) || 0) - 1));
      // A lower price in the new version must not destroy previously invested cash.
      const oldRoom = roomForPad(i);
      const oldCap =
        s.floor === 1 && oldRoom >= 0 && oldRoom < 6
          ? (s.levels[oldRoom]
              ? [8000, 10000, 12000, 15000, 3000, 3600]
              : [6000, 8000, 10000, 12000, 2000, 2400])[oldRoom]
          : {
              15: 20000,
              16: 4000,
              17: 7000,
              18: 2500,
              19: 14000,
              20: 8500,
              21: 10000,
              22: 9000,
              24: 3500,
            }[i];
      if (saved.version === 1 || (oldCap && previous <= oldCap))
        s.cash += previous - retained;
      return retained;
    });
  }
  const g = {
    state: s,
    player: { x: -1.6, z: 5.8, angle: 0, moving: false },
    guests: [],
    piles: [],
    events: [],
    service: 0,
    spawn: 0,
    time: 0,
    payment: 0,
    active: -1,
    purchaseLatch: -1,
    seq: 0,
    cleanRoom: -1,
    runner: {
      x: 2.9,
      z: 5.1,
      angle: 0,
      phase: "idle",
      route: [],
      moving: false,
      target: -1,
      source: "reception",
    },
    cleaner: {
      x: -6.4,
      z: 4.8,
      angle: 0,
      room: -1,
      phase: "idle",
      route: [],
      moving: false,
    },
  };
  g.cleaners = Array.from({ length: 3 }, (_, i) => ({
    ...g.cleaner,
    x: -6.4 - i * 0.65,
    route: [],
    slot: i,
  }));
  g.runners = Array.from({ length: 3 }, (_, i) => ({
    ...g.runner,
    x: 2.9 + i * 0.6,
    route: [],
    slot: i,
    cargo: clamp(
      Number(saved?.runnerLoads?.[i] ?? (i === 0 ? s.runnerCash : 0)) || 0,
      0,
      1e9,
    ),
  }));
  g.cleaner = g.cleaners[0];
  g.runner = g.runners[0];
  s.runnerCash = g.runners.reduce((sum, c) => sum + c.cargo, 0);
  if (Array.isArray(saved?.piles)) {
    for (const c of saved.piles)
      if (c && Number.isFinite(c.value) && c.value > 0)
        dropCash(
          g,
          Math.min(c.value, 1e7),
          Object.hasOwn(FACILITIES, c.source) ? c.source : "reception",
          Number.isFinite(c.x) && Number.isFinite(c.z)
            ? {
                x:
                  c.source === "restaurant"
                    ? FACILITIES.restaurant.x
                    : c.source === "gym"
                      ? FACILITIES.gym.x
                      : ![2, 3, 4].includes(saved.layoutVersion) && c.x > 11
                        ? c.z < -4
                          ? -5.3
                          : 5.3
                        : clamp(c.x, -11, s.restaurantPlot ? 33 : 11),
                z:
                  c.source === "restaurant"
                    ? FACILITIES.restaurant.z
                    : c.source === "gym"
                      ? FACILITIES.gym.z
                      : ![2, 3, 4].includes(saved.layoutVersion) && c.x > 11
                        ? -24.7
                        : [2, 3].includes(saved.layoutVersion) &&
                            c.source === "reception" &&
                            c.z < -20
                          ? c.z - 2.5
                          : c.source === "cafe"
                            ? facilityPosition(s, "cafe").z
                            : clamp(
                                c.z,
                                s.gym
                                  ? -30
                                  : s.wing
                                    ? -29.6
                                    : s.expanded
                                      ? -19.6
                                      : -12,
                                14,
                              ),
              }
            : undefined,
        );
  }
  return g;
}
export function serialize(g) {
  return {
    ...g.state,
    runnerLoads: g.runners.map((c) => c.cargo),
    version: 5,
    layoutVersion: 4,
    piles: g.piles.map(({ value, source, x, z }) => ({ value, source, x, z })),
  };
}
export function payroll(g, dt) {
  const s = g.state,
    rate = wageRate(s);
  if (s.wagesDue > 0) {
    if (s.cash >= s.wagesDue) {
      const amount = s.wagesDue;
      s.cash -= amount;
      s.wagesPaid += amount;
      s.wagesDue = 0;
      g.events.push({ type: "wages", amount, resumed: true });
    }
    return;
  }
  if (!rate && !s.wageAccrued) {
    s.payrollClock = 0;
    s.wageAccrued = 0;
    return;
  }
  s.payrollClock += dt;
  s.wageAccrued += (rate * dt) / 60;
  if (s.payrollClock >= 60) {
    const amount = Math.round(s.wageAccrued);
    s.payrollClock = 0;
    s.wageAccrued = 0;
    if (s.cash >= amount) {
      s.cash -= amount;
      s.wagesPaid += amount;
      g.events.push({ type: "wages", amount });
    } else {
      s.wagesDue = amount;
      g.events.push({ type: "wagesDue", amount });
    }
  }
}
// Keep a bounded number of cash piles per facility, without losing their value.
function dropCash(g, value, source = "reception", spot) {
  const at = spot || facilityPosition(g.state, source),
    existing = g.piles.filter((c) => c.source === source),
    n = existing.length;
  if (n >= 6) existing[0].value += value;
  else
    g.piles.push({
      id: ++g.seq,
      source,
      value,
      x: at.x + (n % 2) * 0.4,
      z: at.z + Math.floor(n / 2) * 0.3,
    });
}
export function depart(g, v) {
  if (g.state.floor === 1) {
    if (
      g.state.lounge &&
      !v.usedSkyLounge &&
      g.guests.filter((a) => ["toSkyLounge", "skyLounge"].includes(a.phase))
        .length < 3
    ) {
      v.usedSkyLounge = true;
      v.phase = "toSkyLounge";
      v.timer = 6;
      v.route = [
        { x: 2.9, z: -8.2 + cafeOffset(g.state) },
        { x: ((v.id % 3) - 1) * 0.9, z: -9.3 + cafeOffset(g.state) },
      ];
      return;
    }
    v.phase = "downLift";
    v.route = [
      { x: 2.9, z: 4.7 },
      { x: 3.2, z: 12.8 },
    ];
    return;
  }
  v.phase = "exit";
  v.route = [
    { x: 2.9, z: 4.7 },
    { x: 2.9, z: 10.6 },
    { x: 0, z: 16 },
  ];
}
function toPool(g, v) {
  v.phase = "toPool";
  v.route = [
    { x: 2.9, z: 4.7 },
    { x: -6.8, z: 5.6 },
    { x: -6.8, z: 7.2 },
  ];
}
function finishClean(g, i) {
  g.state.dirty[i] = false;
  g.state.cleaning[i] = 0;
  g.state.cleaned++;
  g.events.push({ type: "clean", room: i, ...CLEAN_SPOTS[i] });
}
function runCash(g, dt, c) {
  const s = g.state;
  if (!s.runner || !onDuty(s)) {
    c.moving = false;
    return;
  }
  if (c.phase === "idle") {
    c.moving = false;
    if (c.cargo > 0) {
      s.cash += c.cargo;
      g.events.push({
        type: "runnerCollect",
        x: c.x,
        z: c.z,
        value: c.cargo,
      });
      c.cargo = 0;
    }
    const pile = g.piles.find(
      (p) =>
        !g.runners.some(
          (other) =>
            other !== c && other.phase === "walk" && other.target === p.id,
        ),
    );
    if (!pile) return;
    c.target = pile.id;
    c.source = pile.source || "reception";
    c.roomCash =
      c.source === "reception" &&
      CLEAN_SPOTS.some((spot) => distance(spot, pile) < 1.5);
    c.phase = "walk";
    c.route =
      c.source === "gym"
        ? [
            { x: 2.9, z: 4.7 },
            { x: 16, z: 4.7 },
            { x: 16, z: -14 },
            { x: pile.x, z: pile.z },
          ]
        : c.source === "restaurant"
          ? [
              { x: 2.9, z: 4.7 },
              { x: 12, z: 4.7 },
              { x: pile.x, z: pile.z },
            ]
          : c.source === "pool"
            ? [
                { x: 2.9, z: 10.6 },
                { x: 0, z: 13.4 },
                { x: pile.x, z: pile.z },
              ]
            : c.source === "cafe"
              ? [
                  { x: 2.9, z: -9.5 + cafeOffset(s) },
                  { x: pile.x, z: pile.z },
                ]
              : c.roomCash
                ? [
                    { x: 2.9, z: pile.z },
                    { x: Math.sign(pile.x) * 3.1, z: pile.z },
                    { x: pile.x, z: pile.z },
                  ]
                : [{ x: pile.x, z: pile.z }];
  } else if (c.phase === "walk") {
    if (follow(c, dt, workRate(s) * (s.cart ? 1.5 : 1))) {
      for (let i = g.piles.length - 1; i >= 0; i--)
        if (distance(c, g.piles[i]) < 1.4) {
          c.cargo += g.piles[i].value;
          g.piles.splice(i, 1);
        }
      c.phase = "return";
      c.route =
        c.source === "gym"
          ? [
              { x: 16, z: -14 },
              { x: 16, z: 4.7 },
              { x: 2.9, z: 4.7 },
              { x: 2.9, z: 5.1 },
            ]
          : c.source === "restaurant"
            ? [
                { x: 12, z: 4.7 },
                { x: 2.9, z: 4.7 },
                { x: 2.9, z: 5.1 },
              ]
            : c.source === "pool"
              ? [
                  { x: 0, z: 13.4 },
                  { x: 2.9, z: 10.6 },
                  { x: 2.9, z: 5.1 },
                ]
              : c.source === "cafe"
                ? [
                    { x: 2.9, z: -9.5 + cafeOffset(s) },
                    { x: 2.9, z: 5.1 },
                  ]
                : c.roomCash
                  ? [
                      { x: Math.sign(c.x) * 3.1, z: c.z },
                      { x: 2.9, z: c.z },
                      { x: 2.9, z: 5.1 },
                    ]
                  : [{ x: 2.9, z: 5.1 }];
    }
  } else if (follow(c, dt, workRate(s) * (s.cart ? 1.5 : 1))) c.phase = "idle";
}
function housekeeping(g, dt) {
  const s = g.state,
    p = g.player;
  g.cleanRoom = s.dirty.findIndex(
    (dirty, i) =>
      dirty &&
      p.present !== false &&
      distance(p, CLEAN_SPOTS[i]) < 0.85 &&
      !p.moving,
  );
  if (g.cleanRoom >= 0) {
    const i = g.cleanRoom;
    s.cleaning[i] += (dt * (s.laundry ? 1.5 : 1)) / 2.2;
    if (s.cleaning[i] >= 1) finishClean(g, i);
  }
  for (const c of g.cleaners.slice(0, staffCount(s, "cleaner")))
    cleanWorker(g, dt, c);
}
function cleanWorker(g, dt, c) {
  const s = g.state;
  const reserved = (i) =>
    g.cleaners.some(
      (other) =>
        other !== c &&
        (other.phase === "walk" || other.phase === "clean") &&
        other.room === i,
    );
  if (!s.cleaner || !onDuty(s)) {
    c.moving = false;
    return;
  }
  if (c.phase === "walk") {
    if (follow(c, dt, workRate(s))) c.phase = "clean";
  } else if (c.phase === "clean") {
    c.moving = false;
    if (s.dirty[c.room]) {
      s.cleaning[c.room] += (dt * workRate(s) * (s.laundry ? 1.5 : 1)) / 3.2;
      if (s.cleaning[c.room] >= 1) finishClean(g, c.room);
    }
    if (!s.dirty[c.room]) {
      c.route = [
        { x: doorX(c.room), z: ROOMS[c.room].z + 1.3 },
        { x: corridorX(c.room), z: ROOMS[c.room].z + 1.3 },
        { x: 2.9, z: 4.7 },
        { x: -6.4, z: 4.8 },
      ];
      const next = Array.from({ length: ROOMS.length - 1 }, (_, i) => i + 1)
        .map((offset) => (c.room + offset) % ROOMS.length)
        .find((i) => s.dirty[i] && !reserved(i));
      if (next !== undefined) {
        const r = ROOMS[next];
        c.route = c.route
          .slice(0, 2)
          .concat([
            { x: corridorX(next), z: r.z + 1.3 },
            { x: doorX(next), z: r.z + 1.3 },
            { ...CLEAN_SPOTS[next] },
          ]);
        c.room = next;
        c.phase = "walk";
      } else c.phase = "return";
    }
  } else if (c.phase === "return") {
    if (follow(c, dt, workRate(s))) {
      c.phase = "idle";
      c.room = -1;
      c.moving = false;
    }
  } else {
    const i = s.dirty.findIndex((dirty, i) => dirty && !reserved(i));
    if (i >= 0) {
      const r = ROOMS[i];
      c.room = i;
      c.phase = "walk";
      c.route = [
        { x: 2.9, z: 4.7 },
        { x: corridorX(i), z: r.z + 1.3 },
        { x: doorX(i), z: r.z + 1.3 },
        { ...CLEAN_SPOTS[i] },
      ];
    }
  }
}
// Solid footprint of furniture and walls. Door openings align with corridor purchase pads.
export function obstacles(s) {
  let r = [
    ...(s.floor ? [] : [{ x: -2.2, z: 7, w: 4.4, d: 1.3 }]),
    { x: 5.4, z: 8.1, w: 4.6, d: 1.2 },
  ];
  for (const room of ROOMS.slice(0, roomCount(s))) {
    const left = room.x < 0,
      x = room.x - 3.6;
    r.push({ x, z: room.z - 3.3, w: 7.6, d: 0.28 });
    r.push({ x: room.x - 3.9, z: room.z + 3.25, w: 7.8, d: 0.3 });
    r.push({
      x: room.x + Math.sign(room.x) * 3.9 - 0.15,
      z: room.z - 3.3,
      w: 0.3,
      d: 6.85,
    });
    r.push({
      x: left ? room.x + 3.5 : room.x - 3.8,
      z: room.z - 3.3,
      w: 0.3,
      d: 3.6,
    });
    r.push({
      x: left ? room.x + 3.5 : room.x - 3.8,
      z: room.z + 2.1,
      w: 0.3,
      d: 1.15,
    });
    const i = ROOMS.indexOf(room);
    if (s.levels[i])
      r.push({ x: room.x - 1.7, z: room.z - 1.8, w: 3.4, d: 3.8 });
  }
  if (s.cafe) r.push({ x: -1.7, z: -11.8 + cafeOffset(s), w: 3.4, d: 1.4 });
  // The legacy pool save flag now owns the downstairs bar.
  if (s.pool) r.push({ x: -10.65, z: 9.75, w: 5.5, d: 1.5 });
  if (s.restaurant) {
    r.push({ x: 23.35, z: -8.5, w: 1.3, d: 5 });
    for (let slot = 0; slot < (s.diningExpansion ? 6 : 3); slot++)
      r.push({
        x: 26 + (slot % 3) * 2 - 0.65,
        z: -3.65 - Math.floor(slot / 3) * 5,
        w: 1.3,
        d: 1.3,
      });
  }
  if (s.gym)
    for (let i = 0; i < (s.gymUpgrade ? 6 : 3); i++)
      r.push({
        x: 20 + (i % 3) * 4 - 0.85,
        z: -20.35 - Math.floor(i / 3) * 5,
        w: 1.7,
        d: 2.7,
      });
  if (s.laundry) r.push({ x: -9.8, z: 8.65, w: 3.6, d: 1.3 });
  if (s.lounge) r.push({ x: -1.85, z: -11.2 + cafeOffset(s), w: 3.7, d: 1.5 });
  return r;
}
export function blocked(g, x, z) {
  const s = g.state;
  const main =
    x >= -11.4 &&
    x <= 11.4 &&
    z >= (s.wing ? -29.6 : s.expanded ? -19.6 : -11.9) &&
    z <= 14;
  const dining = s.restaurantPlot && x >= 15 && x <= 33 && z >= -12 && z <= 6;
  const bridge = s.restaurantPlot && x > 11.4 && x <= 33 && z >= 3.5 && z <= 6;
  const gym = s.gym && x >= 15 && x <= 33 && z >= -30 && z <= -12;
  const gymPassage =
    s.gym && s.wing && x > 11.4 && x < 15 && z >= -22 && z <= -20;
  if (!(main || dining || bridge || gym || gymPassage)) return true;
  return obstacles(g.state).some(
    (r) =>
      x > r.x - 0.3 &&
      x < r.x + r.w + 0.3 &&
      z > r.z - 0.3 &&
      z < r.z + r.d + 0.3,
  );
}
export function roomRoute(i, exit = false) {
  const r = ROOMS[i],
    door = { x: doorX(i), z: r.z + 1.3 },
    inside = { x: r.x - Math.sign(r.x) * 2.5, z: r.z + 1.3 };
  return exit
    ? [inside, door, { x: 2.9, z: 4.7 }, { x: 2.9, z: 10.6 }, { x: 0, z: 16 }]
    : [
        { x: 2.9, z: 9.6 },
        { x: 2.9, z: 4.7 },
        { x: corridorX(i), z: door.z },
        door,
        inside,
      ];
}
function follow(g, dt, rate = 1) {
  if (!g.route?.length) return false;
  const a = g.route[0],
    d = distance(g, a),
    step = Math.min(d, 3.3 * dt * rate);
  if (d > 0.01) {
    g.angle = Math.atan2(a.x - g.x, a.z - g.z);
    g.x += ((a.x - g.x) / d) * step;
    g.z += ((a.z - g.z) / d) * step;
  }
  g.moving = d > 0.03;
  if (d < 0.1) g.route.shift();
  return g.route.length === 0;
}
export function update(g, dt, input = { x: 0, z: 0 }) {
  dt = clamp(dt, 0, 0.05);
  g.time += dt;
  const s = g.state,
    p = g.player;
  g.events = [];
  const len = Math.hypot(input.x, input.z),
    dx = input.x / Math.max(1, len),
    dz = input.z / Math.max(1, len),
    speed = 5.8 * moveRate(s);
  p.moving = len > 0.05;
  if (p.moving) {
    p.angle = Math.atan2(dx, dz);
    const x = p.x + dx * speed * dt,
      z = p.z + dz * speed * dt;
    if (!blocked(g, x, p.z)) p.x = x;
    if (!blocked(g, p.x, z)) p.z = z;
  }
  let queue = g.guests.filter((v) => v.phase === "queue");
  g.spawn -= dt;
  if (!s.floor && g.spawn <= 0 && queue.length < 5) {
    const guest = {
      id: ++g.seq,
      x: s.floor ? 3.2 : 0,
      z: 16.5,
      phase: "queue",
      room: -1,
      timer: 0,
      angle: Math.PI,
      color: g.seq % 5,
      moving: true,
    };
    g.guests.push(guest);
    queue.push(guest);
    g.spawn = g.arrivalInterval ?? 2.4;
  }
  const workingStaff =
    s.concierge && onDuty(s) ? staffCount(s, "receptionist") : 0;
  const stations =
    s.extraDesk &&
    (workingStaff >= 2 ||
      (workingStaff >= 1 &&
        p.present !== false &&
        distance(p, { x: -3.3, z: 5.8 }) < 1.35))
      ? 2
      : 1;
  for (let deskIndex = 0; deskIndex < stations; deskIndex++) {
    const candidate = queue[deskIndex],
      station = deskIndex ? { x: -3.3, z: 5.8 } : RECEPTION;
    const serviceKey = deskIndex ? "secondService" : "service";
    g[serviceKey] ||= 0;
    const guestKey = serviceKey + "Guest";
    if (g[guestKey] !== candidate?.id) g[serviceKey] = 0;
    g[guestKey] = candidate?.id;
    const availableRoom = (floor) =>
      floor.state.levels.findIndex(
        (lv, i) =>
          lv &&
          !floor.state.dirty[i] &&
          !floor.state.bookingsPaused[i] &&
          (!s.economy || candidate?.kind !== "VIP" || lv === 2) &&
          !floor.guests.some((v) => v.room === i && v.phase !== "exit"),
      );
    let booking = g;
    let free = availableRoom(g);
    if (g.upper) {
      const upstairs = availableRoom(g.upper);
      const occupancy = (f) => {
        const open = f.state.levels.filter(
          (lv, i) => lv && !f.state.bookingsPaused[i],
        ).length;
        const booked = new Set(
          f.guests
            .filter((v) => v.room >= 0 && !["exit", "gone"].includes(v.phase))
            .map((v) => v.room),
        ).size;
        return open ? booked / open : 1;
      };
      if (
        upstairs >= 0 &&
        (free < 0 ||
          candidate?.kind === "VIP" ||
          occupancy(g.upper) < occupancy(g) + 0.15)
      ) {
        booking = g.upper;
        free = upstairs;
      }
    }
    if (
      !s.floor &&
      candidate &&
      free >= 0 &&
      ((p.present !== false && distance(p, station) < 1.35) ||
        workingStaff > deskIndex) &&
      distance(candidate, { x: station.x, z: 9.65 }) < 0.4
    ) {
      g[serviceKey] += dt;
      const duration =
        (s.desk ? 0.65 : 1.3) /
        (s.concierge && onDuty(s)
          ? workRate(s) *
            (1 + 0.35 * Math.max(0, staffCount(s, "receptionist") - stations))
          : 1);
      if (g[serviceKey] >= duration) {
        const v = candidate;
        v.phase = "room";
        v.room = free;
        v.route = roomRoute(free);
        v.timer = 6;
        if (booking !== g) {
          booking.guests.push({
            ...v,
            id: ++booking.seq,
            phase: "waitingLift",
            arrivalToken: v.id,
            moving: false,
          });
          v.phase = "toLift";
          v.room = -1;
          v.route = [
            { x: 2.9, z: 9.6 },
            { x: 3.2, z: 12.8 },
          ];
        }
        const value = Math.round(
          roomRate(booking.state, free) *
            (s.economy && v.kind === "VIP" ? 1.25 : 1),
        );
        dropCash(g, value);
        s.welcomed++;
        s.earned += value;
        g[serviceKey] = 0;
        g.events.push({
          type: "checkin",
          x: station.x,
          z: 7,
          value,
          bookedFloor: booking.state.floor,
          room: free,
          wait: v.wait || 0,
        });
      }
    } else g[serviceKey] = 0;
  }
  if (stations === 1) g.secondService = 0;
  const serviceCount =
    (onDuty(s) ? s.servers : 0) +
    (p.present !== false && distance(p, RESTAURANT_SERVICE) < 1.5 ? 1 : 0);
  const serving = new Set(
    g.guests
      .filter((v) => v.phase === "restaurant")
      .slice(0, serviceCount)
      .map((v) => v.id),
  );
  g.servingIds = [...serving];
  for (const v of g.guests) {
    if (v.phase === "queue") {
      const rank = queue.indexOf(v);
      v.route = [
        {
          x: stations === 2 && rank === 1 ? -3.3 : 0,
          z: 9.65 + Math.max(0, rank - (stations - 1)) * 1.15,
        },
      ];
      follow(v, dt);
    } else if (
      v.phase === "toLift" ||
      v.phase === "downLift" ||
      v.phase === "toRoof"
    ) {
      if (follow(v, dt))
        v.phase =
          v.phase === "toRoof"
            ? "transitRoof"
            : v.phase === "toLift"
              ? "transitUp"
              : "transitDown";
    } else if (v.phase === "room") {
      if (follow(v, dt)) {
        v.phase = "stay";
        v.moving = false;
      }
    } else if (v.phase === "stay") {
      v.timer -= dt;
      if (v.timer <= 0) {
        const room = v.room;
        if (s.floor !== 2 && s.minibar) {
          const value = s.minibar * 15;
          dropCash(g, value, "reception", CLEAN_SPOTS[room]);
          s.earned += value;
          g.events.push({ type: "tip", ...CLEAN_SPOTS[room], value });
        }
        if (s.floor && (v.satisfaction || 0) >= 80) {
          dropCash(g, 15, "reception", CLEAN_SPOTS[room]);
          s.earned += 15;
          g.events.push({ type: "tip", ...CLEAN_SPOTS[room], value: 15 });
        }
        v.room = -1;
        s.dirty[room] = true;
        s.cleaning[room] = 0;
        const r = ROOMS[room];
        v.phase = "leavingRoom";
        v.route = [
          { x: doorX(room), z: r.z + 1.3 },
          { x: corridorX(room), z: r.z + 1.3 },
        ];
        g.events.push({ type: "checkout", room });
      }
    } else if (v.phase === "leavingRoom") {
      if (follow(v, dt)) {
        if (
          s.gym &&
          !v.exercised &&
          g.guests.filter((a) => ["toGym", "gym"].includes(a.phase)).length <
            (s.gymUpgrade ? 6 : 3)
        ) {
          v.exercised = true;
          v.phase = "toGym";
          const occupied = new Set(
            g.guests
              .filter((a) => ["toGym", "gym"].includes(a.phase) && a !== v)
              .map((a) => a.gymSlot),
          );
          v.gymSlot = Array.from(
            { length: s.gymUpgrade ? 6 : 3 },
            (_, i) => i,
          ).find((i) => !occupied.has(i));
          v.route = [
            { x: 2.9, z: 4.7 },
            { x: 16, z: 4.7 },
            { x: 16, z: -14 },
            {
              x: 20 + (v.gymSlot % 3) * 4,
              z: -18 - Math.floor(v.gymSlot / 3) * 5,
            },
          ];
        } else if (
          s.restaurant &&
          !v.dined &&
          g.guests.filter((a) =>
            ["toRestaurantQueue", "restaurantQueue"].includes(a.phase),
          ).length < 5
        ) {
          v.dined = true;
          v.phase = "toRestaurantQueue";
          v.mealWait = 0;
          v.route = [
            { x: 2.9, z: 4.7 },
            { x: 12, z: 4.7 },
            { x: 20, z: 4.7 },
          ];
        } else if (s.cafe) {
          v.phase = "toCafe";
          v.route = [
            { x: 2.9, z: -8.2 + cafeOffset(s) },
            { x: 0, z: -8.2 + cafeOffset(s) },
            { x: ((v.id % 3) - 1) * 0.8, z: -9.1 + cafeOffset(s) },
          ];
        } else if (s.pool) toPool(g, v);
        else depart(g, v);
      }
    } else if (v.phase === "toGym") {
      if (follow(v, dt)) {
        v.phase = "gym";
        v.timer = 8;
        v.moving = false;
      }
    } else if (v.phase === "gym") {
      v.timer -= dt;
      if (v.timer <= 0) {
        const value = s.gymUpgrade ? 65 : 40;
        dropCash(g, value, "gym");
        s.visits.gym++;
        s.earned += value;
        v.satisfaction = Math.min(100, (v.satisfaction || 75) + 6);
        g.events.push({ type: "tip", ...FACILITIES.gym, value });
        v.phase = "leavingRoom";
        v.route = [
          { x: 16, z: -14 },
          { x: 16, z: 4.7 },
          { x: 2.9, z: 4.7 },
        ];
      }
    } else if (v.phase === "toRestaurantQueue") {
      if (follow(v, dt)) {
        v.phase = "restaurantQueue";
        v.mealWait = 0;
      }
    } else if (v.phase === "restaurantQueue") {
      v.mealWait += dt;
      const waiting = g.guests.filter((a) => a.phase === "restaurantQueue");
      v.route = [{ x: 20, z: 2.5 - waiting.indexOf(v) * 1.15 }];
      follow(v, dt);
      const slots = Array.from(
        { length: s.diningExpansion ? 6 : 3 },
        (_, i) => i,
      );
      const freeTable = slots.find(
        (i) =>
          !g.guests.some(
            (a) =>
              ["toRestaurant", "restaurant", "restaurantEating"].includes(
                a.phase,
              ) && a.table === i,
          ),
      );
      if (waiting[0] === v && freeTable !== undefined) {
        v.table = freeTable;
        v.phase = "toRestaurant";
        v.mealWait = 0;
        const seat = {
          x: 26 + (v.table % 3) * 2,
          z: -1.7 - Math.floor(v.table / 3) * 5,
        };
        v.route = [
          { x: 20, z: 4.7 },
          { x: 32, z: 4.7 },
          { x: 32, z: seat.z },
          seat,
        ];
      } else if (v.mealWait > 55) {
        v.satisfaction = Math.max(40, (v.satisfaction || 75) - 8);
        v.phase = "leavingRoom";
        v.route = [
          { x: 20, z: 4.7 },
          { x: 12, z: 4.7 },
          { x: 2.9, z: 4.7 },
        ];
      }
    } else if (v.phase === "toRestaurant") {
      if (follow(v, dt)) {
        v.phase = "restaurant";
        v.timer = 7;
        v.mealWait = 0;
        v.moving = false;
      }
    } else if (v.phase === "restaurant") {
      v.mealWait += dt;
      if (serving.has(v.id)) v.timer -= dt * (1 + s.kitchen * 0.25);
      if (v.timer <= 0 || v.mealWait > 40) {
        if (v.timer <= 0) {
          const value = 45 + s.kitchen * 15;
          dropCash(g, value, "restaurant");
          s.visits.restaurant++;
          s.earned += value;
          v.satisfaction = Math.min(100, (v.satisfaction || 75) + 10);
          g.events.push({ type: "tip", ...FACILITIES.restaurant, value });
          v.phase = "restaurantEating";
          v.timer = 5;
        } else {
          v.satisfaction = Math.max(40, (v.satisfaction || 75) - 12);
          v.phase = "restaurantEating";
          v.timer = 0;
        }
      }
    } else if (v.phase === "restaurantEating") {
      v.timer -= dt;
      if (v.timer <= 0) {
        v.phase = "leavingRoom";
        v.route = [
          { x: 32, z: v.z },
          { x: 32, z: 4.7 },
          { x: 12, z: 4.7 },
          { x: 2.9, z: 4.7 },
        ];
      }
    } else if (v.phase === "toSkyLounge") {
      if (follow(v, dt)) {
        v.phase = "skyLounge";
        v.moving = false;
        v.angle = Math.PI;
      }
    } else if (v.phase === "skyLounge") {
      v.timer -= dt;
      if (v.timer <= 0) {
        dropCash(g, 45, "cafe");
        s.earned += 45;
        v.satisfaction = Math.min(100, (v.satisfaction || 75) + 8);
        g.events.push({
          type: "tip",
          ...facilityPosition(s, "cafe"),
          value: 45,
        });
        depart(g, v);
      }
    } else if (v.phase === "toCafe") {
      if (follow(v, dt)) {
        v.phase = "cafe";
        v.timer = 3.8;
        v.moving = false;
        v.angle = Math.PI;
      }
    } else if (v.phase === "cafe") {
      v.timer -= dt;
      if (v.timer <= 0) {
        const value = 15 + s.bakery * 15;
        dropCash(g, value, "cafe");
        s.earned += value;
        s.visits.cafe++;
        g.events.push({
          type: "tip",
          ...facilityPosition(s, "cafe"),
          value,
        });
        if (s.pool) toPool(g, v);
        else depart(g, v);
      }
    } else if (v.phase === "toPool") {
      if (follow(v, dt)) {
        v.phase = "pool";
        v.timer = 5;
        v.swimTime = 0;
        v.moving = false;
      }
    } else if (v.phase === "pool") {
      v.timer -= dt;
      v.swimTime += dt;
      v.x += (-9.5 + (v.id % 3) * 1.6 - v.x) * Math.min(1, dt * 3);
      v.z += (8 - v.z) * Math.min(1, dt * 3);
      v.angle = 0;
      if (v.timer <= 0) {
        const value = 20 + s.barMenu * 15;
        dropCash(g, value, "pool");
        s.earned += value;
        s.visits.pool++;
        g.events.push({ type: "tip", ...FACILITIES.pool, value });
        v.phase = "fromPool";
        v.route = [{ x: -6.8, z: 6.2 }];
      }
    } else if (v.phase === "fromPool") {
      if (follow(v, dt)) {
        v.phase = "exit";
        v.route = [
          { x: -2.9, z: 5.2 },
          { x: 2.9, z: 5.2 },
          { x: 2.9, z: 10.6 },
          { x: 0, z: 16 },
        ];
      }
    } else if (v.phase === "exit") {
      if (follow(v, dt)) v.phase = "gone";
    }
  }
  housekeeping(g, dt);
  g.guests = g.guests.filter((v) => v.phase !== "gone");
  for (let i = g.piles.length - 1; i >= 0; i--) {
    const c = g.piles[i];
    if (p.present !== false && distance(p, c) < 1.25) {
      s.cash += c.value;
      g.piles.splice(i, 1);
      g.events.push({ type: "collect", ...c });
    }
  }
  for (const c of g.runners.slice(0, staffCount(s, "runner")))
    runCash(g, dt, c);
  s.runnerCash = g.runners.reduce((sum, c) => sum + c.cargo, 0);
  payroll(g, dt);
  if (
    g.purchaseLatch >= 0 &&
    distance(
      p,
      padPosition(
        s,
        PADS.find((a) => a.i === g.purchaseLatch),
      ),
    ) > 1.4
  )
    g.purchaseLatch = -1;
  const pad = PADS.map((a) => padPosition(s, a)).find(
    (a) =>
      p.present !== false &&
      a.i !== g.purchaseLatch &&
      unlocked(s, a.i) &&
      !complete(s, a.i) &&
      distance(p, a) < 1.04,
  );
  g.active = pad?.i ?? -1;
  const stopped = Math.hypot(input.x, input.z) < 0.05;
  g.payment = pad && stopped && s.cash > 0 ? g.payment + dt : 0;
  if (pad && stopped && s.openingDemo && pad.i === 10) {
    g.payment = 0;
    g.active = -1;
    g.purchaseLatch = 10;
    g.events.push({ type: "demoBoundary" });
    return;
  }
  if (pad && s.cash > 0 && g.payment >= 0.055) {
    const i = pad.i,
      // Scale with the full price so large purchases take about 2.4 seconds.
      amount = Math.min(
        Math.max(1, Math.ceil(Math.max(120, price(s, i) / 2.4) * g.payment)),
        s.cash,
        price(s, i) - s.paid[i],
      );
    s.cash -= amount;
    s.paid[i] += amount;
    g.payment = 0;
    g.events.push({ type: "spend", x: pad.x, z: pad.z, amount });
    if (s.paid[i] >= price(s, i)) {
      s.paid[i] = 0;
      const room = roomForPad(i);
      if (room >= 0) s.levels[room]++;
      else if (i === 4) {
        s.pool = true;
        g.player.x = -3.4;
        g.player.z = 9.6;
      } else if (i === 5) s.desk = true;
      else if (i === 6) {
        s.staff.receptionist++;
        s.concierge = true;
      } else if (i === 7) s.cafe = true;
      else if (i === 8) {
        s.staff.cleaner++;
        s.cleaner = true;
      } else if (i === 9) {
        s.staff.runner++;
        s.runner = true;
      } else if (i === 10) {
        s.expanded = true;
        for (const guest of g.guests) {
          if (guest.phase === "toCafe") {
            for (const point of guest.route) point.z -= 7.5;
          } else if (guest.phase === "cafe") guest.z -= 7.5;
        }
        s.levels[4] = Math.max(1, s.levels[4]);
        s.levels[5] = Math.max(1, s.levels[5]);
      } else if (i === 11) s.training++;
      else if (i === 12) s.shoes++;
      else if (i === 19) {
        s.wing = true;
        for (const guest of g.guests) {
          if (guest.phase === "toCafe")
            for (const point of guest.route) point.z -= 10;
          else if (guest.phase === "cafe") guest.z -= 10;
        }
      } else if (i === 22) s.restaurant = true;
      else if (i === 23) s.servers++;
      else if (i === 24) s.extraDesk = true;
      else if (i === 28) s.roofUnlocked = true;
      else if (i === 33) s.restaurantPlot = true;
      else if (i === 34) s.diningExpansion = true;
      else if (i === 35) s.kitchen++;
      else if (i === 36) s.gym = true;
      else if (i === 37) s.gymUpgrade = true;
      else if (i >= 25 && i <= 27) s[LOBBY_UPGRADES[i]]++;
      else if (i >= 15)
        s[{ 15: "elevator", 16: "laundry", 17: "lounge", 18: "cart" }[i]] =
          true;
      if (i === 16) {
        g.player.x = -5.3;
        g.player.z = 9.6;
      }
      g.purchaseLatch = i;
      g.events.push({ type: "build", i, x: pad.x, z: pad.z });
    }
  }
}
