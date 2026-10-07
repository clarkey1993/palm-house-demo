// Cosmetic rewards never change prices, earnings or purchased room levels.
export const DECOR = [
  {
    id: "palm",
    name: "Palm House",
    description: "Fresh mint, warm linen and your original room colours.",
    guests: 0,
    cleans: 0,
    palette: ["#4c988e", "#72b4a0", "#e2bc6e"],
    colors: {},
  },
  {
    id: "coral",
    name: "Coral Sands",
    description: "Sunset terracotta with soft peach and sandy gold.",
    guests: 12,
    cleans: 0,
    palette: ["#b97766", "#d9a28e", "#edc89c"],
    colors: {
      border: 0xb97766,
      carpet: 0xd9a28e,
      stripe: 0xe6b9a5,
      wall: 0xc59180,
      linen: 0xedc89c,
    },
  },
  {
    id: "blue",
    name: "Blue Horizon",
    description: "Sea-glass blue, dusky teal and breezy ivory.",
    guests: 30,
    cleans: 8,
    palette: ["#467e92", "#86b6c7", "#d4e4df"],
    colors: {
      border: 0x467e92,
      carpet: 0x86b6c7,
      stripe: 0xb1d0da,
      wall: 0x7aa7b4,
      linen: 0xd4e4df,
    },
  },
];
export function decorProgress(h) {
  return {
    guests: h.floors[0].state.welcomed,
    cleans: h.floors.reduce((n, g) => n + (g.state.cleaned || 0), 0),
  };
}
export function decorAvailable(h, id) {
  const style = DECOR.find((d) => d.id === id),
    p = decorProgress(h);
  return !!style && p.guests >= style.guests && p.cleans >= style.cleans;
}
export function selectDecor(h, id) {
  if (!decorAvailable(h, id)) return false;
  h.decor = id;
  return true;
}
