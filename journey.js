export const CHAPTERS = [
  {
    id: "welcome",
    title: "A warm welcome",
    detail: "Welcome 5 guests",
    reward: 200,
    goal: 5,
    value: (h) => h.floors[0].state.welcomed,
  },
  {
    id: "rooms",
    title: "Room for everyone",
    detail: "Open the four original rooms",
    reward: 350,
    goal: 4,
    value: (h) => h.floors[0].state.levels.slice(0, 4).filter(Boolean).length,
  },
  {
    id: "team",
    title: "Better together",
    detail: "Hire a receptionist and a cleaner",
    reward: 400,
    goal: 2,
    value: (h) =>
      Number(!!h.floors[0].state.concierge) +
      Number(!!h.floors[0].state.cleaner),
  },
  {
    id: "garden",
    title: "A little more sunshine",
    detail: "Open the Garden Wing",
    reward: 600,
    goal: 1,
    value: (h) => Number(h.floors[0].state.expanded),
  },
  {
    id: "flavour",
    title: "A taste of Palm House",
    detail: "Open the bar and breakfast counter",
    reward: 450,
    goal: 2,
    value: (h) =>
      Number(h.floors[0].state.pool) + Number(h.floors[0].state.cafe),
  },
  {
    id: "east",
    title: "Your own kind of escape",
    detail: "Build the north wing",
    reward: 750,
    goal: 1,
    value: (h) => Number(h.floors[0].state.wing),
  },
  {
    id: "sky",
    title: "A room with a view",
    detail: "Open two upstairs rooms",
    reward: 1000,
    goal: 2,
    value: (h) => h.floors[1]?.state.levels.filter(Boolean).length || 0,
  },
  {
    id: "roof",
    title: "Above it all",
    detail: "Open the rooftop pool",
    reward: 750,
    goal: 1,
    value: (h) => Number(!!h.floors[2]),
  },
  {
    id: "retreat",
    title: "The complete retreat",
    detail: "Add a rooftop juice bar and spa",
    reward: 1500,
    goal: 2,
    value: (h) =>
      Number(!!h.floors[2]?.state.roofJuice) +
      Number(!!h.floors[2]?.state.roofSpa),
  },
];
export const nextChapter = (h) =>
  CHAPTERS.find((c) => !h.claimed.includes(c.id));
export function claimChapter(h, id) {
  const chapter = CHAPTERS.find((c) => c.id === id);
  if (!chapter || h.claimed.includes(id) || chapter.value(h) < chapter.goal)
    return false;
  h.claimed.push(id);
  for (const g of h.floors) g.state.cash += chapter.reward;
  return true;
}
