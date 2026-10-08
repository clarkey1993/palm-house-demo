// The full hotel's service journey is separate from demo rewards and purchases.
const ground = (h) => h.floors[0].state;
const upper = (h) => h.floors[1]?.state;
const roof = (h) => h.floors[2]?.state;
const goal = (label, target, value) => ({ label, target, value });
export const RESTORATION = [
  {
    id: "lobby",
    title: "A place to belong",
    reward: 350,
    goals: [
      goal(
        "Original rooms open",
        4,
        (h) => ground(h).levels.slice(0, 4).filter(Boolean).length,
      ),
      goal("Guests welcomed", 25, (h) => ground(h).welcomed),
      goal(
        "Receptionist and cleaner hired",
        2,
        (h) =>
          Number(ground(h).staff.receptionist > 0) +
          Number(ground(h).staff.cleaner > 0),
      ),
      goal("Palm Bar open", 1, (h) => Number(ground(h).pool)),
    ],
  },
  {
    id: "garden",
    title: "Room to grow",
    reward: 500,
    goals: [
      goal(
        "Downstairs rooms open",
        6,
        (h) => ground(h).levels.filter(Boolean).length,
      ),
      goal("Rooms cleaned", 20, (h) => ground(h).cleaned),
      goal("Drinks enjoyed at Palm Bar", 12, (h) => ground(h).visits.pool),
    ],
  },
  {
    id: "dining",
    title: "A table by the sea",
    reward: 650,
    goals: [
      goal("Restaurant open", 1, (h) => Number(ground(h).restaurant)),
      goal("Meals served", 20, (h) => ground(h).visits.restaurant),
      goal("Kitchen upgrades", 1, (h) => ground(h).kitchen),
    ],
  },
  {
    id: "wellness",
    title: "Time to unwind",
    reward: 750,
    goals: [
      goal(
        "Downstairs rooms open",
        8,
        (h) => ground(h).levels.filter(Boolean).length,
      ),
      goal("Gym open", 1, (h) => Number(ground(h).gym)),
      goal("Guest workouts completed", 15, (h) => ground(h).visits.gym),
    ],
  },
  {
    id: "suites",
    title: "Wake up to the horizon",
    reward: 900,
    goals: [
      goal(
        "Upstairs rooms open",
        4,
        (h) => upper(h)?.levels.filter(Boolean).length || 0,
      ),
      goal("Upstairs rooms cleaned", 20, (h) => upper(h)?.cleaned || 0),
      goal("Guest lounge open", 1, (h) => Number(!!upper(h)?.lounge)),
    ],
  },
  {
    id: "rooftop",
    title: "Under the open sky",
    reward: 1000,
    goals: [
      goal("Rooftop pool open", 1, (h) => Number(!!roof(h))),
      goal(
        "Juice bar and spa open",
        2,
        (h) => Number(!!roof(h)?.roofJuice) + Number(!!roof(h)?.roofSpa),
      ),
      goal("Rooftop visits enjoyed", 20, (h) => roof(h)?.welcomed || 0),
    ],
  },
  {
    id: "opening",
    title: "The grand opening",
    reward: 1500,
    goals: [
      goal("Guests welcomed", 200, (h) => ground(h).welcomed),
      goal("Happy guest reviews", 50, (h) => h.happy),
      goal("Premium rooms", 6, (h) =>
        h.floors
          .slice(0, 2)
          .reduce(
            (n, g) => n + g.state.levels.filter((v) => v === 2).length,
            0,
          ),
      ),
    ],
  },
];
export const nextRestoration = (h) =>
  RESTORATION.find((c) => !h.restoration.includes(c.id));
export const restorationReady = (h, c) =>
  nextRestoration(h)?.id === c.id &&
  c.goals.every((g) => g.value(h) >= g.target);
export function finishRestoration(h, id) {
  const c = RESTORATION.find((c) => c.id === id);
  if (!c || !restorationReady(h, c)) return false;
  h.restoration.push(id);
  for (const g of h.floors) g.state.cash += c.reward;
  return true;
}
