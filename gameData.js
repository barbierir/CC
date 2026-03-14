// Dati statici iniziali del prototipo.
// In step futuri questi cataloghi verranno riempiti con dati completi.

export const CULTURES = [
  {
    id: "egyptian",
    name: "Egyptian",
    description: "Cultura placeholder iniziale.",
    startingAdvanceIds: ["basic-farming"],
  },
];

export const ADVANCES = [
  {
    id: "basic-farming",
    name: "Basic Farming",
    category: "economy",
    description: "Advance placeholder già disponibile all'inizio.",
  },
];

export const LEADERS = [];

export const WONDERS = [];

export const DISASTER_TYPES = [];

export const CITY_NAMES = {
  egyptian: ["Memphis", "Thebes", "Alexandria"],
};
