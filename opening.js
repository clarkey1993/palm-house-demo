export const OPENING_STEPS = [
  {
    id: "welcome",
    title: "Your first welcome",
    detail: "Stand behind reception to welcome a guest.",
    goal: 1,
    value: (h) => h.floors[0].state.welcomed,
  },
  {
    id: "rooms",
    title: "Room to stay",
    detail: "Open the four original rooms on their glowing floor squares.",
    goal: 4,
    value: (h) => h.floors[0].state.levels.slice(0, 4).filter(Boolean).length,
  },
  {
    id: "team",
    title: "A helping hand",
    detail:
      "Hire a receptionist and a cleaner. Their wages are shown before you hire.",
    goal: 2,
    value: (h) =>
      Number(h.floors[0].state.concierge) + Number(h.floors[0].state.cleaner),
  },
  {
    id: "bar",
    title: "A taste of the seaside",
    detail: "Open the little lobby bar. Guests leave cash after a drink.",
    goal: 1,
    value: (h) => Number(h.floors[0].state.pool),
  },
  {
    id: "polish",
    title: "Little touches of luxury",
    detail: "Upgrade your four rooms. Each suite earns more per stay.",
    goal: 8,
    value: (h) =>
      h.floors[0].state.levels
        .slice(0, 4)
        .reduce((sum, level) => sum + level, 0),
  },
  {
    id: "settled",
    title: "A place worth returning to",
    detail: "Welcome 50 guests and let your little hotel find its rhythm.",
    goal: 50,
    value: (h) => h.floors[0].state.welcomed,
  },
];
export const openingComplete = (h) =>
  OPENING_STEPS.every((s) => s.value(h) >= s.goal);
export const nextOpeningStep = (h) =>
  OPENING_STEPS.find((s) => s.value(h) < s.goal);

export const OPENING_HELP = [
  {
    id: "opening-first-welcome",
    title: "Your first guest · a little head start",
    reward: 100,
    ready: (s) => s.welcomed > 0,
  },
  {
    id: "opening-first-help",
    title: "Your first cleaner · help for the next hire",
    reward: 150,
    ready: (s) => s.cleaner,
  },
];
export function grantOpeningHelp(h, enabled = h.floors[0].state.openingDemo) {
  if (!enabled) return [];
  const earned = OPENING_HELP.filter(
    (r) => !h.claimed.includes(r.id) && r.ready(h.floors[0].state),
  );
  for (const r of earned) {
    h.claimed.push(r.id);
    for (const g of h.floors) g.state.cash += r.reward;
  }
  return earned;
}
export function demoPadAllowed(s, i) {
  if (s.floor) return false;
  // Introduce management gradually, retaining upgrades to all four rooms.
  if (i < 4 || i === 5 || i === 12) return true;
  if (i === 6 || i === 8 || i === 9)
    return s.welcomed >= 1 && s.levels.slice(0, 4).every(Boolean);
  if (i === 4 || i === 7 || i === 9 || i === 11)
    return s.levels.slice(0, 4).filter(Boolean).length >= 2;
  if (i === 25) return s.pool;
  if (i === 26) return s.cafe;
  return i === 10 && s.levels.slice(0, 4).every(Boolean);
}
export function applyOpeningPolicy(h, enabled) {
  for (const g of h.floors) g.state.openingDemo = enabled;
  return h;
}
export const fitsOpening = (save) =>
  !save.expanded &&
  !save.elevator &&
  !save.upper &&
  !save.rooftop &&
  !save.wing &&
  !save.restaurantPlot;
