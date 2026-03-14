import { ADVANCES, CITY_NAMES, CULTURES, LEADERS } from "./gameData.js";

const POPULATION_ROLES = ["army", "agriculture", "trade", "labor", "scholars"];

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

function sumAssignments(assignments) {
  return POPULATION_ROLES.reduce((sum, role) => sum + (assignments[role] || 0), 0);
}

export function hasAdvance(state, advanceId) {
  return state.advances.includes(advanceId);
}

export function countLeadersByType(state, leaderType) {
  return state.leaders.filter((leader) => leader.id === leaderType).length;
}

export function getCityCount(state) {
  return state.cities.length;
}

export function generateUniqueId(state, prefix) {
  const currentValue = state.idCounters[prefix] || 0;
  const nextValue = currentValue + 1;
  state.idCounters[prefix] = nextValue;
  return `${prefix}-${nextValue}`;
}

function getFoodPerAgricultureUnit(state) {
  return hasAdvance(state, "irrigation") ? 4 : 3;
}

function canRoleIncreaseWithinLimit(state, role) {
  const startValue = state.turnStartAssignments[role] || 0;
  return state.populationAssignments[role] < startValue + 6;
}

function canRoleDecreaseWithinLimit(state, role) {
  const startValue = state.turnStartAssignments[role] || 0;
  return state.populationAssignments[role] > Math.max(0, startValue - 6);
}

function findRoleForDecrease(state, excludedRoles = []) {
  const preferredOrder = ["agriculture", "trade", "labor", "scholars", "army"];

  return preferredOrder.find((role) => {
    if (excludedRoles.includes(role)) {
      return false;
    }

    return state.populationAssignments[role] > 0 && canRoleDecreaseWithinLimit(state, role);
  });
}

function findRoleForIncrease(state, excludedRoles = []) {
  const preferredOrder = ["agriculture", "trade", "labor", "scholars", "army"];

  return preferredOrder.find((role) => {
    if (excludedRoles.includes(role)) {
      return false;
    }

    return canRoleIncreaseWithinLimit(state, role);
  });
}

function findLeaderTemplateByTypeRoll() {
  while (true) {
    const typeRoll = rollDie(6);
    if (typeRoll >= 1 && typeRoll <= 4) {
      return LEADERS[typeRoll - 1];
    }
  }
}

export function rollDie(sides) {
  const numericSides = Number(sides);
  if (!Number.isInteger(numericSides) || numericSides < 2) {
    throw new Error("rollDie requires an integer >= 2");
  }

  return Math.floor(Math.random() * numericSides) + 1;
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
    turnStartAssignments: { ...populationAssignments },
    food: 0,
    gold: 6,
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
    idCounters: {
      leader: 0,
    },
    skipBuildPhase: false,
    currentProject: null,
    projectProgress: 0,
    gameLog,
    gameOver: false,
    currentPhase: "ready",
  };
}

function startPopulationIncreasePhase(state) {
  state.turnStartAssignments = { ...state.populationAssignments };

  const dieRoll = rollDie(6);
  const bonus = hasAdvance(state, "religion") ? 1 : 0;
  const populationGain = Math.max(0, dieRoll - 2 + bonus);

  state.populationTotal += populationGain;
  state.populationAssignments.agriculture += populationGain;

  state.gameLog.push(`Population increased by ${populationGain}`);
}

function runGainLeaderPhase(state) {
  const gainRoll = rollDie(6);

  if (gainRoll >= 3) {
    state.gameLog.push("No new leader this turn");
    return;
  }

  const leaderTemplate = findLeaderTemplateByTypeRoll();
  const newLeader = {
    uniqueId: generateUniqueId(state, "leader"),
    id: leaderTemplate.id,
    name: leaderTemplate.name,
    description: leaderTemplate.description,
    effectType: leaderTemplate.effectType,
  };

  state.leaders.push(newLeader);
  state.gameLog.push(`A new leader appeared: ${newLeader.name}`);
}

function runHarvestPhase(state) {
  const foodPerUnit = getFoodPerAgricultureUnit(state);
  const agriculturePopulation = state.populationAssignments.agriculture;
  const foodProduced = agriculturePopulation * foodPerUnit;

  state.food += foodProduced;
  state.gameLog.push(`Harvest produced ${foodProduced} food`);
}

function runUpkeepPhase(state) {
  let foodConsumed = Math.min(state.food, state.populationTotal);
  state.food -= foodConsumed;

  if (foodConsumed < state.populationTotal) {
    const missingFood = state.populationTotal - foodConsumed;
    state.populationTotal -= missingFood;

    for (let index = 0; index < missingFood; index += 1) {
      const roleToReduce = findRoleForDecrease(state);
      if (!roleToReduce) {
        break;
      }
      state.populationAssignments[roleToReduce] -= 1;
    }

    state.gameLog.push(`Population lost due to starvation: ${missingFood}`);
  }

  let armyPopulation = state.populationAssignments.army;
  let goldConsumed = Math.min(state.gold, armyPopulation);
  state.gold -= goldConsumed;

  if (goldConsumed < armyPopulation) {
    const unpaidArmy = armyPopulation - goldConsumed;
    state.populationAssignments.army -= unpaidArmy;
    state.populationAssignments.agriculture += unpaidArmy;
    armyPopulation = state.populationAssignments.army;
    goldConsumed = armyPopulation;
  }

  state.gameLog.push(`Upkeep consumed ${foodConsumed} food and ${goldConsumed} gold`);

  const assignmentTotal = sumAssignments(state.populationAssignments);
  if (assignmentTotal !== state.populationTotal) {
    state.populationAssignments.agriculture += state.populationTotal - assignmentTotal;
  }
}

// Sequenza scelta: Harvest -> Upkeep -> Leader aging -> Trade.
function runLeaderAgingPhase(state) {
  const survivors = [];

  state.leaders.forEach((leader) => {
    const agingRoll = rollDie(6);
    if (agingRoll === 1) {
      state.gameLog.push(`Leader died of old age: ${leader.name}`);
      return;
    }

    survivors.push(leader);
  });

  state.leaders = survivors;
}

function runTradePhase(state) {
  const preview = getTradeIncomePreview(state);

  let rulersGold = 0;
  for (let index = 0; index < preview.rulerCount; index += 1) {
    rulersGold += rollDie(6);
  }

  const totalGold =
    preview.tradePopulation +
    preview.citiesGold +
    preview.coinageBonus +
    preview.navigationBonus +
    rulersGold;

  state.gold += totalGold;

  state.gameLog.push(
    `Trade generated ${totalGold} gold (${preview.tradePopulation} from trade, ${preview.citiesGold} from cities, ${preview.coinageBonus} from Coinage, ${preview.navigationBonus} from Navigation, ${rulersGold} from Rulers)`
  );
}

function getTradeIncomePreview(state) {
  const cityCount = getCityCount(state);

  return {
    tradePopulation: state.populationAssignments.trade || 0,
    citiesGold: cityCount,
    coinageBonus: hasAdvance(state, "coinage") ? cityCount : 0,
    navigationBonus: hasAdvance(state, "navigation") ? cityCount : 0,
    rulerCount: countLeadersByType(state, "ruler"),
  };
}

export function applyPopulationChange(state, role, delta) {
  if (state.currentPhase !== "distribution") {
    return { ok: false, reason: "Distribution phase is not active" };
  }

  if (!POPULATION_ROLES.includes(role)) {
    return { ok: false, reason: "Invalid population role" };
  }

  if (delta === 1) {
    if (!canRoleIncreaseWithinLimit(state, role)) {
      return { ok: false, reason: "Role cannot increase more than +6 from turn start" };
    }

    if (role === "army" && state.gold <= 0) {
      return { ok: false, reason: "Not enough gold to assign more Army" };
    }

    const donorRole = findRoleForDecrease(state, [role]);
    if (!donorRole) {
      return { ok: false, reason: "No population available to move" };
    }

    state.populationAssignments[donorRole] -= 1;
    state.populationAssignments[role] += 1;

    if (role === "army") {
      state.gold -= 1;
    }

    return { ok: true };
  }

  if (delta === -1) {
    if (state.populationAssignments[role] <= 0) {
      return { ok: false, reason: "Role already at 0" };
    }

    if (!canRoleDecreaseWithinLimit(state, role)) {
      return { ok: false, reason: "Role cannot decrease more than -6 from turn start" };
    }

    const receiverRole = findRoleForIncrease(state, [role]);
    if (!receiverRole) {
      return { ok: false, reason: "No role can receive additional population" };
    }

    state.populationAssignments[role] -= 1;
    state.populationAssignments[receiverRole] += 1;

    return { ok: true };
  }

  return { ok: false, reason: "Delta must be +1 or -1" };
}

/**
 * Loop turno economico base in 2 step:
 * - click 1: Population Increase e avvio Distribution
 * - click 2: conferma Distribution e risoluzione fasi economiche
 */
export function nextTurn(state) {
  if (state.gameOver) {
    state.gameLog.push("La partita è terminata. Nessun altro turno disponibile.");
    return state;
  }

  if (state.currentPhase === "ready") {
    startPopulationIncreasePhase(state);
    state.currentPhase = "distribution";
    return state;
  }

  if (state.currentPhase === "distribution") {
    // Ordine turno attuale:
    // 1) Population Increase (già fatto al click precedente)
    // 2) Population Distribution (gestita dalla UI)
    // 3) Gain Leader
    // 4) Harvest
    // 5) Upkeep
    // 6) Trade (dopo aging leader)
    runGainLeaderPhase(state);
    runHarvestPhase(state);
    runUpkeepPhase(state);
    runLeaderAgingPhase(state);
    runTradePhase(state);

    state.turn += 1;
    state.currentPhase = "ready";

    if (state.turn > state.maxTurns) {
      state.gameOver = true;
      state.gameLog.push("Raggiunto il limite massimo di turni. Fine partita.");
    }
  }

  return state;
}

export function getEconomyPreview(state) {
  const foodPerUnit = getFoodPerAgricultureUnit(state);
  const tradePreview = getTradeIncomePreview(state);

  const fixedTradeGold =
    tradePreview.tradePopulation +
    tradePreview.citiesGold +
    tradePreview.coinageBonus +
    tradePreview.navigationBonus;

  const rulerMinGold = tradePreview.rulerCount;
  const rulerMaxGold = tradePreview.rulerCount * 6;

  return {
    foodProduction: state.populationAssignments.agriculture * foodPerUnit,
    foodUpkeep: state.populationTotal,
    armyGoldUpkeep: state.populationAssignments.army,
    tradePopulationGold: tradePreview.tradePopulation,
    citiesGold: tradePreview.citiesGold,
    coinageGold: tradePreview.coinageBonus,
    navigationGold: tradePreview.navigationBonus,
    rulerCount: tradePreview.rulerCount,
    rulerGoldRange: {
      min: rulerMinGold,
      max: rulerMaxGold,
    },
    tradeGoldRange: {
      min: fixedTradeGold + rulerMinGold,
      max: fixedTradeGold + rulerMaxGold,
    },
  };
}
