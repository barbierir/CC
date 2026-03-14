import { CITY_NAMES, CULTURES } from "./gameData.js";

/**
 * Restituisce il primo elemento di un array o un fallback.
 */
function firstOrFallback(values, fallback) {
  return Array.isArray(values) && values.length > 0 ? values[0] : fallback;
}

/**
 * Crea lo stato iniziale del gioco.
 */
export function createInitialGameState() {
  const startingCulture = firstOrFallback(CULTURES, {
    id: "placeholder",
    name: "Unknown",
    startingAdvanceIds: [],
  });

  const startingCityName = firstOrFallback(
    CITY_NAMES[startingCulture.id],
    "Founding City"
  );

  return {
    turn: 1,
    maxTurns: 50,
    culture: {
      id: startingCulture.id,
      name: startingCulture.name,
    },
    populationTotal: 10,
    populationAssignments: {
      army: 2,
      agriculture: 3,
      trade: 2,
      labor: 2,
      scholars: 1,
    },
    food: 0,
    gold: 0,
    cities: [
      {
        id: "city-1",
        name: startingCityName,
      },
    ],
    wonders: [],
    advances: [...(startingCulture.startingAdvanceIds || [])],
    leaders: [],
    currentProject: null,
    projectProgress: 0,
    skipBuildPhase: false,
    gameLog: ["Turno 1 iniziato. Fondazione della prima città."],
    gameOver: false,
  };
}

/**
 * Placeholder del loop turno.
 * In questo step non implementa ancora fasi complete.
 */
export function nextTurn(state) {
  if (state.gameOver) {
    state.gameLog.push("La partita è terminata. Nessun altro turno disponibile.");
    return state;
  }

  state.turn += 1;
  state.gameLog.push(
    `Turno ${state.turn}: placeholder fasi turno (build, research, eventi).`
  );

  if (state.turn > state.maxTurns) {
    state.gameOver = true;
    state.gameLog.push("Raggiunto il limite massimo di turni. Fine partita.");
  }

  return state;
}
