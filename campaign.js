// Saved service events are independent of cash, buildings and older chapter rewards.
const state = (h, floor = 0) => h.floors[floor]?.state;
const metric = (key, label, target) => ({ key, label, target });
export const CAMPAIGN = [
  {
    id: "welcome",
    title: "A seaside welcome",
    preparation: "Open the four original rooms and Palm Bar.",
    ready: (h) => state(h).levels.slice(0, 4).every(Boolean) && state(h).pool,
    tip: "Welcome guests, collect their cash and keep rooms clean. A receptionist and cleaner can help.",
    unlock: "Garden Wing",
    reward: 600,
    goals: [
      metric("welcomed", "Guests welcomed", 24),
      metric("cleaned", "Rooms refreshed", 16),
      metric("drinks", "Bar drinks enjoyed", 18),
    ],
  },
  {
    id: "breakfast",
    title: "Breakfast by the sea",
    preparation:
      "Open the breakfast counter at the north end of the corridor, then the Garden Wing beside it.",
    ready: (h) => state(h).expanded && state(h).cafe,
    tip: "Keep bedrooms ready for arrivals. Departing guests stop for breakfast; collect their payments by the counter.",
    unlock: "Restaurant terrace",
    reward: 250,
    goals: [
      metric("breakfast", "Breakfasts enjoyed", 30),
      metric("cleaned", "Rooms refreshed", 24),
    ],
  },
  {
    id: "dining",
    title: "An evening at Palm Kitchen",
    preparation:
      "Buy the restaurant terrace on the right of the lobby, then build Palm Kitchen there.",
    ready: (h) => state(h).restaurant,
    tip: "Stand at the serving counter or hire a server. More tables and a kitchen upgrade help your queue move.",
    unlock: "North Wing and gym",
    reward: 300,
    goals: [
      metric("meals", "Meals served", 36),
      metric("welcomed", "Guests welcomed", 30),
    ],
  },
  {
    id: "wellness",
    title: "A restorative retreat",
    preparation:
      "Extend the North Wing at the far end of the corridor, then open the gym above the restaurant on the right.",
    ready: (h) => state(h).gym,
    tip: "Fresh rooms bring new guests to the gym. Your team can handle service while you improve the hotel.",
    unlock: "Elevator to the Sky Suites",
    reward: 350,
    goals: [
      metric("workouts", "Workouts enjoyed", 30),
      metric("cleaned", "Rooms refreshed", 30),
    ],
  },
  {
    id: "suites",
    title: "A weekend in the Sky Suites",
    preparation:
      "Build the elevator and walk into it. Upstairs, open the four original rooms and the lounge at the north end.",
    ready: (h) =>
      state(h, 1)?.levels.slice(0, 4).every(Boolean) && state(h, 1)?.lounge,
    tip: "Guests arrive from downstairs. Keep upstairs rooms clean yourself or hire a cleaner on that floor.",
    unlock: "Rooftop",
    reward: 400,
    goals: [
      metric("upperCleaned", "Upstairs rooms refreshed", 32),
      metric("welcomed", "Guests welcomed", 40),
    ],
  },
  {
    id: "rooftop",
    title: "Sunset at Palm House",
    preparation:
      "Unlock the rooftop from upstairs and take the elevator there. Open its juice bar and spa.",
    ready: (h) => state(h, 2)?.roofJuice && state(h, 2)?.roofSpa,
    tip: "Welcome guests at the pool or hire a rooftop host. There is no deadline: enjoy your finished hotel.",
    unlock: "Grand opening celebration",
    reward: 500,
    goals: [
      metric("roofVisits", "Rooftop guests welcomed", 45),
      metric("meals", "Celebration meals served", 30),
    ],
  },
];
export function serviceTotals(h) {
  const s = state(h);
  return {
    welcomed: s.welcomed,
    cleaned: s.cleaned,
    drinks: s.visits.pool,
    breakfast: s.visits.cafe,
    meals: s.visits.restaurant,
    workouts: s.visits.gym,
    upperCleaned: state(h, 1)?.cleaned || 0,
    roofVisits: state(h, 2)?.welcomed || 0,
  };
}
export function restoreCampaign(saved, hasOldSave) {
  const completed = [];
  for (const event of CAMPAIGN) {
    if (!Array.isArray(saved?.completed) || !saved.completed.includes(event.id))
      break;
    completed.push(event.id);
  }
  const next = CAMPAIGN[completed.length];
  const active = saved?.active === next?.id ? next?.id : null;
  const progress = {};
  for (const g of active ? next.goals : [])
    progress[g.key] =
      active && Number.isFinite(saved?.progress?.[g.key])
        ? Math.max(0, Math.min(g.target, saved.progress[g.key]))
        : 0;
  return {
    version: 1,
    guided: saved?.version === 1 ? saved.guided === true : !hasOldSave,
    completed,
    active,
    progress,
  };
}
export const nextEvent = (h) => CAMPAIGN[h.campaign.completed.length];
export function startEvent(h) {
  const event = nextEvent(h);
  if (!event || h.campaign.active || !event.ready(h)) return false;
  h.campaign.active = event.id;
  h.campaign.progress = Object.fromEntries(event.goals.map((g) => [g.key, 0]));
  return true;
}
export function advanceCampaign(h, before) {
  const event = nextEvent(h);
  if (!event || h.campaign.active !== event.id) return;
  const after = serviceTotals(h);
  for (const goal of event.goals)
    h.campaign.progress[goal.key] = Math.min(
      goal.target,
      (h.campaign.progress[goal.key] || 0) +
        Math.max(0, after[goal.key] - before[goal.key]),
    );
  if (!event.goals.every((g) => h.campaign.progress[g.key] >= g.target)) return;
  h.campaign.completed.push(event.id);
  h.events.push({ type: "campaignComplete", id: event.id });
  h.campaign.active = null;
  h.campaign.progress = {};
  for (const floor of h.floors) floor.state.cash += event.reward;
  h.events.push({
    type: "notice",
    text:
      event.title +
      " complete! +$" +
      event.reward +
      " · " +
      event.unlock +
      " ready.",
  });
}
export function applyCampaign(h) {
  for (const floor of h.floors) floor.state.campaignLocks = {};
  if (!h.campaign.guided || h.floors[0].state.openingDemo) return;
  const gates = [
    [0, 10, "welcome"],
    [0, 33, "breakfast"],
    [0, 19, "dining"],
    [0, 36, "dining"],
    [0, 15, "wellness"],
    [1, 28, "suites"],
  ];
  for (const [floor, pad, id] of gates) {
    const s = state(h, floor);
    // Preserve old partial investments, including imported saves.
    if (s && !s.paid[pad] && !h.campaign.completed.includes(id))
      s.campaignLocks[pad] =
        "Finish “" +
        CAMPAIGN.find((e) => e.id === id).title +
        "” · Hotel book → Journey";
  }
}
