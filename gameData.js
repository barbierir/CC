// Cataloghi statici del gioco.
// In questo step includono culture, advances e nomi città completi
// per consentire un setup iniziale realistico.

export const CULTURES = [
  { id: "egyptian", name: "Egyptian", startingAdvanceId: "engineering" },
  { id: "mesopotamian", name: "Mesopotamian", startingAdvanceId: "mathematics" },
  { id: "athenian", name: "Athenian", startingAdvanceId: "philosophy" },
  { id: "roman", name: "Roman", startingAdvanceId: "law" },
  { id: "minoan", name: "Minoan", startingAdvanceId: "music" },
  { id: "persian", name: "Persian", startingAdvanceId: "coinage" },
  { id: "assyrian", name: "Assyrian", startingAdvanceId: "metal-working" },
  { id: "babylonian", name: "Babylonian", startingAdvanceId: "astronomy" },
  { id: "mycenaean", name: "Mycenaean", startingAdvanceId: "pottery" },
  { id: "phoenician", name: "Phoenician", startingAdvanceId: "navigation" },
  { id: "spartan", name: "Spartan", startingAdvanceId: "military-doctrine" },
  { id: "mongolian", name: "Mongolian", startingAdvanceId: "equestrian" },
];

export const ADVANCES = [
  {
    id: "pottery",
    name: "Pottery",
    description: "Improves storage and handling of food surpluses in your cities.",
    victoryPoints: 1,
  },
  {
    id: "religion",
    name: "Religion",
    description: "Supports social cohesion and effects tied to temples and faith.",
    victoryPoints: 1,
  },
  {
    id: "astronomy",
    name: "Astronomy",
    description: "Unlocks celestial knowledge that boosts scientific development.",
    victoryPoints: 1,
  },
  {
    id: "literacy",
    name: "Literacy",
    description: "Improves transmission of knowledge and written administration.",
    victoryPoints: 1,
  },
  {
    id: "medicine",
    name: "Medicine",
    description: "Reduces losses and improves population resilience.",
    victoryPoints: 1,
  },
  {
    id: "coinage",
    name: "Coinage",
    description: "Strengthens trade and financial flexibility through currency.",
    victoryPoints: 1,
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Cities and wonders cost 20% less labor.",
    victoryPoints: 1,
  },
  {
    id: "mathematics",
    name: "Mathematics",
    description: "Improves planning and efficiency for growth and research systems.",
    victoryPoints: 1,
  },
  {
    id: "architecture",
    name: "Architecture",
    description: "Enhances city planning and major construction capabilities.",
    victoryPoints: 1,
  },
  {
    id: "law",
    name: "Law",
    description: "Provides governmental structure and stability benefits.",
    victoryPoints: 1,
  },
  {
    id: "music",
    name: "Music",
    description: "Develops cultural life and supports future culture-focused effects.",
    victoryPoints: 1,
  },
  {
    id: "democracy",
    name: "Democracy",
    description: "Represents advanced civic governance with broad societal impact.",
    victoryPoints: 1,
  },
  {
    id: "philosophy",
    name: "Philosophy",
    description: "Stimulates scholarly thought and future intellectual bonuses.",
    victoryPoints: 1,
  },
  {
    id: "metal-working",
    name: "Metal Working",
    description: "Improves tools and military equipment production.",
    victoryPoints: 1,
  },
  {
    id: "drama-poetry",
    name: "Drama & Poetry",
    description: "Major cultural achievement that grants extra victory points.",
    victoryPoints: 2,
  },
  {
    id: "art-sculpture",
    name: "Art & Sculpture",
    description: "Major artistic development that grants extra victory points.",
    victoryPoints: 2,
  },
  {
    id: "military-doctrine",
    name: "Military Doctrine",
    description: "Improves army organization and tactical readiness.",
    victoryPoints: 1,
  },
  {
    id: "irrigation",
    name: "Irrigation",
    description: "Increases agricultural efficiency through water management.",
    victoryPoints: 1,
  },
  {
    id: "navigation",
    name: "Navigation",
    description: "Expands movement and trade potential across sea routes.",
    victoryPoints: 1,
  },
  {
    id: "equestrian",
    name: "Equestrian",
    description: "Develops mounted mobility for military and logistics uses.",
    victoryPoints: 1,
  },
];

export const LEADERS = [];

export const WONDERS = [];

export const DISASTER_TYPES = [];

export const CITY_NAMES = [
  "Memphis",
  "Thebes",
  "Heliopolis",
  "Alexandria",
  "Babylon",
  "Ur",
  "Uruk",
  "Nineveh",
  "Persepolis",
  "Susa",
  "Athens",
  "Sparta",
  "Corinth",
  "Knossos",
  "Mycenae",
  "Troy",
  "Rome",
  "Carthage",
  "Tyre",
  "Sidon",
  "Byblos",
  "Damascus",
  "Jerusalem",
  "Antioch",
  "Ephesus",
  "Miletus",
  "Rhodes",
  "Delphi",
  "Pergamon",
  "Sardis",
];
