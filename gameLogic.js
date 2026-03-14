import { ADVANCES, CITY_NAMES, CULTURES } from "./gameData.js";

function pickRandomItem(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
}

function removeOneValue(values, valueToRemove) {
  const index = values.indexOf(valueToRemove);
  if (index >= 0) {
    values.splice(index, 1);
  }
}

function findAdvanceById(advanceId) {
  return ADVANCES.find((advance) => advance.id === advanceId) || null;
}

/**
 * Crea lo stato iniziale del gioco.
 */
export function createInitialGameState() {
  const selectedCulture = pickRandomItem(CULTURES);
  const availableCityNames = [...CITY_NAMES];

  const selectedAdvance = selectedCulture
    ? findAdvanceById(selectedCulture.startingAdvanceId)
    : null;

  const firstCityName = pickRandomItem(availableCityNames) || "Founding City";
  removeOneValue(availableCityNames, firstCityName);

  // Distribuzione base semplice per questo step.
  // Alternativa possibile: tutto in agriculture.
  const populationAssignments = {
    army: 2,
    agriculture: 3,
    trade: 2,
    labor: 2,
    scholars: 1,
  };

  const gameLog = ["Game started"];
  if (selectedCulture) {
    gameLog.push(`Culture selected: ${selectedCulture.name}`);
  }
  if (selectedAdvance) {
    gameLog.push(`Starting advance: ${selectedAdvance.name}`);
  }
  gameLog.push(`First city founded: ${firstCityName}`);

  return {
    turn: 1,
    maxTurns: 50,
    culture: selectedCulture
      ? { id: selectedCulture.id, name: selectedCulture.name }
      : { id: "unknown", name: "Unknown" },
    startingAdvanceId: selectedAdvance ? selectedAdvance.id : null,
    populationTotal: 10,
    populationAssignments,
    food: 0,
    gold: 0,
    cities: [
      {
        id: "city-1",
        name: firstCityName,
        wonderId: null,
      },
    ],
    availableCityNames,
    wonders: [],
    leaders: [],
    advances: selectedAdvance ? [selectedAdvance.id] : [],
    skipBuildPhase: false,
    currentProject: null,
    projectProgress: 0,
    gameLog,
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
