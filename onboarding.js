import {
  PADS,
  padPosition,
  CLEAN_SPOTS,
  RECEPTION,
  price,
  onDuty,
  distance,
} from "./model.js";
import { nextOpeningStep } from "./opening.js";

// One recommendation feeds both the written instruction and the map guide.
// Never changes the player position or spends money.
export function openingTask(h) {
  const g = h.floors[0],
    s = g.state;
  const reception = {
    title: "Welcome your next guest",
    detail:
      "Stand behind reception. Then collect the green cash beside the desk.",
    destination: RECEPTION,
    guide: "Reception",
    pad: -1,
  };
  if (!s.welcomed) return { ...reception, title: "Your first welcome" };
  const dirty = s.dirty.findIndex(Boolean);
  if (
    dirty >= 0 &&
    (!s.cleaner || !onDuty(s)) &&
    (!g.piles.length || g.cleanRoom >= 0)
  )
    return {
      title: "Fresh sheets for the next guest",
      detail:
        "Stand still in this room’s amber circle to clean. Cleaning costs nothing.",
      destination: CLEAN_SPOTS[dirty],
      guide: "Clean room " + (dirty + 1),
      pad: -1,
    };
  if (g.piles.length)
    return {
      title: "Collect your earnings",
      detail:
        "Walk over the green cash. Your next improvement is getting closer.",
      destination: [...g.piles].sort(
        (a, b) => distance(g.player, a) - distance(g.player, b),
      )[0],
      guide: "Collect cash",
      pad: -1,
    };
  const step = nextOpeningStep(h);
  let candidates = [];
  if (step?.id === "rooms")
    candidates = [0, 1, 2, 3].filter((i) => !s.levels[i]);
  if (step?.id === "team")
    candidates = [!s.cleaner ? 8 : null, !s.concierge ? 6 : null].filter(
      (i) => i !== null,
    );
  if (step?.id === "bar") candidates = [4];
  if (step?.id === "polish")
    candidates = [0, 1, 2, 3].filter((i) => s.levels[i] < 2);
  candidates.sort(
    (a, b) => price(s, a) - s.paid[a] - (price(s, b) - s.paid[b]),
  );
  const pad = candidates[0];
  if (pad !== undefined) {
    const remaining = Math.ceil(price(s, pad) - s.paid[pad]);
    if (s.cash >= remaining)
      return {
        title:
          pad < 4
            ? (s.levels[pad] ? "A little luxury for room " : "Open room ") +
              (pad + 1)
            : pad === 8
              ? "Hire your first cleaner"
              : pad === 6
                ? "Welcome a receptionist"
                : "Open your little bar",
        detail:
          "Stop on the glowing square · $" +
          remaining +
          ". " +
          (pad < 4
            ? "Inside the room, by the outer wall."
            : pad === 8
              ? "They keep rooms ready · $60/min wages."
              : pad === 6
                ? "They welcome guests · $45/min wages."
                : "Guests leave cash after a drink."),
        destination: padPosition(
          s,
          PADS.find((p) => p.i === pad),
        ),
        guide:
          pad < 4
            ? "Room " + (pad + 1)
            : pad === 8
              ? "Hire cleaner"
              : pad === 6
                ? "Hire reception"
                : "Open bar",
        pad,
      };
    return {
      ...reception,
      title:
        s.concierge && onDuty(s)
          ? "Your team has reception covered"
          : reception.title,
      detail:
        "$" +
        Math.max(0, Math.ceil(remaining - s.cash)) +
        " more for your next improvement. " +
        (s.concierge && onDuty(s)
          ? "Collect payments beside the desk and keep rooms fresh."
          : "Welcome guests and collect their payments beside the desk."),
    };
  }
  return {
    ...reception,
    title: step
      ? "Let your little hotel flourish"
      : "Your seaside escape, at your pace",
    detail: step
      ? "Your team can handle check-in. Collect cash, keep rooms fresh, or try another improvement."
      : "The opening is complete. Keep running your hotel for as long as you like.",
  };
}
