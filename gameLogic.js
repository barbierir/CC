const { ADVANCES, CITY_NAMES, CULTURES, DISASTERS, LEADERS, WONDERS } = window.GameData;

const POPULATION_ROLES = ["army", "agriculture", "trade", "labor", "scholars"];
const POPULATION_LOSS_ORDER = ["agriculture", "trade", "labor", "scholars", "army"];

function pushLog(state, message) {
  state.gameLog.push(message);
}

function pushImportantLog(state, message) {
  state.gameLog.push(`IMPORTANT: ${message}`);
}

function pushSectionHeader(state, title) {
  state.gameLog.push(`===== ${title} =====`);
}

function getRandomItem(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  return values[Math.floor(Math.random() * values.length)];
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

function findWonderDefinitionById(wonderId) {
  return WONDERS.find((wonder) => wonder.id === wonderId) || null;
}

function sumAssignments(assignments) {
  return POPULATION_ROLES.reduce((sum, role) => sum + (assignments[role] || 0), 0);
}

function hasAdvance(state, advanceId) {
  return state.advances.includes(advanceId);
}

function hasWonder(state, wonderId) {
  return state.wonders.some((wonder) => wonder.id === wonderId);
}

function countLeadersByType(state, leaderType) {
  return state.leaders.filter((leader) => leader.id === leaderType).length;
}

function getCityCount(state) {
  return state.cities.length;
}

function getScholarCount(state) {
  return state.populationAssignments.scholars || 0;
}

function generateUniqueId(state, prefix) {
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

function rollDie(sides) {
  const numericSides = Number(sides);
  if (!Number.isInteger(numericSides) || numericSides < 2) {
    throw new Error("rollDie requires an integer >= 2");
  }

  return Math.floor(Math.random() * numericSides) + 1;
}

function rollTwoDice() {
  return rollDie(6) + rollDie(6);
}

function rollMultipleDice(count, sides) {
  const rolls = [];
  for (let index = 0; index < count; index += 1) {
    rolls.push(rollDie(sides));
  }
  return rolls;
}

function sumDice(count, sides) {
  return rollMultipleDice(count, sides).reduce((sum, value) => sum + value, 0);
}

function syncPopulationAssignments(state) {
  let hadNegative = false;
  for (const role of POPULATION_ROLES) {
    if ((state.populationAssignments[role] || 0) < 0) {
      state.populationAssignments[role] = 0;
      hadNegative = true;
    }
  }

  if (hadNegative) {
    pushLog(state, "Warning: negative population assignment corrected");
  }

  const total = sumAssignments(state.populationAssignments);
  if (total === state.populationTotal) {
    return;
  }

  if (total < state.populationTotal) {
    state.populationAssignments.agriculture += state.populationTotal - total;
    return;
  }

  let overflow = total - state.populationTotal;
  for (const role of POPULATION_LOSS_ORDER) {
    if (overflow <= 0) {
      break;
    }

    const current = state.populationAssignments[role] || 0;
    const removal = Math.min(current, overflow);
    state.populationAssignments[role] -= removal;
    overflow -= removal;
  }

  pushLog(state, "Warning: population assignments rebalanced");
}

function enforceStateInvariants(state) {
  const previousFood = state.food;
  const previousGold = state.gold;

  state.food = Math.max(0, Math.floor(state.food || 0));
  state.gold = Math.max(0, Math.floor(state.gold || 0));

  if (state.food !== previousFood || state.gold !== previousGold) {
    pushLog(state, "Warning: negative resources corrected");
  }

  const uniqueAdvances = [...new Set(state.advances)];
  if (uniqueAdvances.length !== state.advances.length) {
    state.advances = uniqueAdvances;
    pushLog(state, "Warning: duplicate advances removed");
  }

  const wonderSeenById = new Set();
  let duplicateWonderFound = false;
  state.wonders = state.wonders.filter((wonder) => {
    if (wonderSeenById.has(wonder.id)) {
      duplicateWonderFound = true;
      return false;
    }

    wonderSeenById.add(wonder.id);
    return true;
  });

  const cityWonderHost = new Set();
  state.wonders = state.wonders.filter((wonder) => {
    if (cityWonderHost.has(wonder.cityId)) {
      duplicateWonderFound = true;
      return false;
    }

    cityWonderHost.add(wonder.cityId);
    return true;
  });

  if (duplicateWonderFound) {
    pushLog(state, "Warning: duplicate wonder data corrected");
  }

  state.cities.forEach((city) => {
    const hostWonder = state.wonders.find((wonder) => wonder.cityId === city.id);
    city.wonderId = hostWonder ? hostWonder.id : null;
  });

  if (state.currentProject && state.currentProject.laborProgress > state.currentProject.laborRequired) {
    state.currentProject.laborProgress = state.currentProject.laborRequired;
    pushLog(state, "Warning: project progress corrected");
  }

  const scholarCap = getCityCount(state);
  if ((state.populationAssignments.scholars || 0) > scholarCap) {
    const overflow = state.populationAssignments.scholars - scholarCap;
    state.populationAssignments.scholars = scholarCap;
    state.populationAssignments.agriculture += overflow;
    pushLog(state, "Warning: scholars above city limit corrected");
  }

  syncPopulationAssignments(state);
}

function losePopulation(state, amount, reason) {
  const finalLoss = Math.max(0, Math.min(Math.floor(amount), state.populationTotal));
  if (finalLoss <= 0) {
    state.gameLog.push(`Population lost: 0 (${reason})`);
    return 0;
  }

  let remaining = finalLoss;
  for (const role of POPULATION_LOSS_ORDER) {
    if (remaining <= 0) {
      break;
    }

    const current = state.populationAssignments[role] || 0;
    const removed = Math.min(current, remaining);
    state.populationAssignments[role] -= removed;
    remaining -= removed;
  }

  state.populationTotal -= finalLoss;
  syncPopulationAssignments(state);
  state.gameLog.push(`Population lost: ${finalLoss} (${reason})`);
  return finalLoss;
}

function loseArmyPopulation(state, amount) {
  const currentArmy = state.populationAssignments.army || 0;
  const loss = Math.max(0, Math.min(amount, currentArmy));
  if (loss <= 0) {
    return 0;
  }

  state.populationAssignments.army -= loss;
  state.populationTotal -= loss;
  syncPopulationAssignments(state);
  return loss;
}

function loseFood(state, amount, reason) {
  const finalLoss = Math.max(0, Math.min(Math.floor(amount), state.food));
  state.food -= finalLoss;
  state.gameLog.push(`Food lost: ${finalLoss} (${reason})`);
  return finalLoss;
}

function loseGold(state, amount, reason) {
  const finalLoss = Math.max(0, Math.min(Math.floor(amount), state.gold));
  state.gold -= finalLoss;
  state.gameLog.push(`Gold lost: ${finalLoss} (${reason})`);
  return finalLoss;
}

function loseRandomCity(state, reason) {
  if (state.cities.length === 0) {
    state.gameLog.push(`No city lost (${reason})`);
    return null;
  }

  const city = getRandomItem(state.cities);
  state.cities = state.cities.filter((item) => item.id !== city.id);

  if (city.wonderId) {
    state.wonders = state.wonders.filter((wonder) => wonder.id !== city.wonderId);
    state.gameLog.push(`City lost with wonder: ${city.name} (${city.wonderId})`);
  }

  state.gameLog.push(`City lost: ${city.name} (${reason})`);
  return city;
}

function loseRandomWonder(state, reason) {
  if (state.wonders.length === 0) {
    state.gameLog.push(`No wonder lost (${reason})`);
    return null;
  }

  const wonder = getRandomItem(state.wonders);
  state.wonders = state.wonders.filter((item) => item.id !== wonder.id);

  const hostCity = state.cities.find((city) => city.id === wonder.cityId);
  if (hostCity) {
    hostCity.wonderId = null;
  }

  state.gameLog.push(`Wonder lost: ${wonder.name} (${reason})`);
  return wonder;
}

function applyPopulationDisaster(state, baseLoss, mitigationActive, mitigationLabel) {
  let finalLoss = baseLoss;
  if (mitigationActive) {
    finalLoss = Math.floor(baseLoss / 2);
  }

  losePopulation(state, finalLoss, state.lastDisaster?.name || "Disaster");
}

function getConstructionCost(state, laborBase, goldBase) {
  const laborRequired = hasAdvance(state, "engineering") ? Math.floor(laborBase * 0.8) : laborBase;
  const goldCost = hasAdvance(state, "architecture") ? Math.floor(goldBase * 0.8) : goldBase;
  return { laborRequired, goldCost };
}

function getLaborProducedThisTurn(state) {
  const laborPopulation = state.populationAssignments.labor || 0;
  const builders = countLeadersByType(state, "builder");

  let buildersLabor = 0;
  for (let index = 0; index < builders; index += 1) {
    buildersLabor += rollDie(6);
  }

  return laborPopulation + buildersLabor;
}

function getAvailableWonderDefinitions(state) {
  return WONDERS.filter((wonder) => {
    if (!hasAdvance(state, wonder.requirementAdvanceId)) {
      return false;
    }

    return !state.completedWonders.includes(wonder.id);
  });
}

function getUnusedCityName(state) {
  if (!Array.isArray(state.availableCityNames) || state.availableCityNames.length === 0) {
    return `City ${state.cities.length + 1}`;
  }

  const name = getRandomItem(state.availableCityNames);
  removeOneValue(state.availableCityNames, name);
  return name;
}

function canStartCityProject(state) {
  if (state.currentProject) {
    return { ok: false, reason: "Another project is already active" };
  }

  const { goldCost } = getConstructionCost(state, 50, 25);
  if (state.gold < goldCost) {
    return { ok: false, reason: `Not enough gold to start city project (${goldCost} required)` };
  }

  return { ok: true };
}

function canStartWonderProject(state, wonderId, cityId) {
  if (state.currentProject) {
    return { ok: false, reason: "Another project is already active" };
  }

  const wonderDefinition = findWonderDefinitionById(wonderId);
  if (!wonderDefinition) {
    return { ok: false, reason: "Selected wonder is invalid" };
  }

  if (!hasAdvance(state, wonderDefinition.requirementAdvanceId)) {
    return {
      ok: false,
      reason: `Advance required: ${findAdvanceById(wonderDefinition.requirementAdvanceId)?.name || wonderDefinition.requirementAdvanceId}`,
    };
  }

  if (state.completedWonders.includes(wonderId)) {
    return { ok: false, reason: "This wonder has already been built" };
  }

  const city = state.cities.find((item) => item.id === cityId);
  if (!city) {
    return { ok: false, reason: "Selected city is invalid" };
  }

  if (city.wonderId) {
    return { ok: false, reason: "Selected city already hosts a wonder" };
  }

  const { goldCost } = getConstructionCost(
    state,
    wonderDefinition.laborRequiredBase,
    wonderDefinition.goldCostBase
  );

  if (state.gold < goldCost) {
    return {
      ok: false,
      reason: `Not enough gold to start wonder project (${goldCost} required)`,
    };
  }

  return { ok: true };
}

function createCityProject(state) {
  const startCheck = canStartCityProject(state);
  if (!startCheck.ok) {
    state.gameLog.push(startCheck.reason);
    return { ok: false, reason: startCheck.reason };
  }

  const { laborRequired, goldCost } = getConstructionCost(state, 50, 25);
  state.gold -= goldCost;

  const project = {
    id: generateUniqueId(state, "project"),
    type: "city",
    targetId: null,
    cityId: null,
    name: "New City",
    laborProgress: 0,
    laborRequired,
    goldCost,
    startedTurn: state.turn,
  };

  state.currentProject = project;
  state.gameLog.push(`Started city project (${goldCost} gold paid)`);

  return { ok: true, project };
}

function createWonderProject(state, wonderId, cityId) {
  const startCheck = canStartWonderProject(state, wonderId, cityId);
  if (!startCheck.ok) {
    state.gameLog.push(startCheck.reason);
    return { ok: false, reason: startCheck.reason };
  }

  const wonderDefinition = findWonderDefinitionById(wonderId);
  const city = state.cities.find((item) => item.id === cityId);
  const { laborRequired, goldCost } = getConstructionCost(
    state,
    wonderDefinition.laborRequiredBase,
    wonderDefinition.goldCostBase
  );

  state.gold -= goldCost;

  const project = {
    id: generateUniqueId(state, "project"),
    type: "wonder",
    targetId: wonderDefinition.id,
    cityId,
    name: wonderDefinition.name,
    laborProgress: 0,
    laborRequired,
    goldCost,
    startedTurn: state.turn,
  };

  state.currentProject = project;
  state.gameLog.push(`Started wonder project: ${wonderDefinition.name} in ${city.name} (${goldCost} gold paid)`);

  return { ok: true, project };
}

function completeCityProject(state, project) {
  const cityName = getUnusedCityName(state);
  const newCity = {
    id: generateUniqueId(state, "city"),
    name: cityName,
    wonderId: null,
  };

  state.cities.push(newCity);
  state.lastCompletedProject = `City completed: ${cityName}`;
  pushImportantLog(state, `City founded: ${cityName}`);
  pushLog(state, `Project completed: ${project.name}`);
}

function completeWonderProject(state, project) {
  const city = state.cities.find((item) => item.id === project.cityId);
  const wonderDefinition = findWonderDefinitionById(project.targetId);

  if (!city || !wonderDefinition) {
    state.gameLog.push(`Project failed to complete: ${project.name}`);
    return;
  }

  city.wonderId = wonderDefinition.id;
  if (state.wonders.some((wonder) => wonder.id === wonderDefinition.id)) {
    pushLog(state, `Warning: duplicate wonder prevented (${wonderDefinition.name})`);
    return;
  }

  state.wonders.push({
    id: wonderDefinition.id,
    name: wonderDefinition.name,
    cityId: city.id,
  });

  if (!state.completedWonders.includes(wonderDefinition.id)) {
    state.completedWonders.push(wonderDefinition.id);
  }
  state.lastCompletedProject = `Wonder completed: ${wonderDefinition.name}`;

  pushImportantLog(state, `Wonder completed: ${wonderDefinition.name} in ${city.name}`);
  pushLog(state, `Project completed: ${project.name}`);
}

function resolveBuildPhase(state) {
  const producedLabor = getLaborProducedThisTurn(state);
  state.gameLog.push(`Build produced ${producedLabor} labor`);

  if (!state.currentProject) {
    state.gameLog.push("No active build project");
    return;
  }

  const project = state.currentProject;
  project.laborProgress += producedLabor;
  if (project.laborProgress > project.laborRequired) {
    project.laborProgress = project.laborRequired;
  }
  state.gameLog.push(
    `Project advanced: ${project.name} (${Math.min(project.laborProgress, project.laborRequired)}/${project.laborRequired})`
  );

  if (project.laborProgress < project.laborRequired) {
    return;
  }

  if (project.type === "city") {
    completeCityProject(state, project);
  } else if (project.type === "wonder") {
    completeWonderProject(state, project);
  }

  state.currentProject = null;
}

function createInitialGameState() {
  const selectedCulture = getRandomItem(CULTURES);
  const availableCityNames = [...CITY_NAMES];

  const selectedAdvance = selectedCulture
    ? findAdvanceById(selectedCulture.startingAdvanceId)
    : null;

  const firstCityName = getRandomItem(availableCityNames) || "Founding City";
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
    completedWonders: [],
    leaders: [],
    advances: selectedAdvance ? [selectedAdvance.id] : [],
    idCounters: {
      leader: 0,
      city: 1,
      project: 0,
    },
    skipBuildPhase: false,
    currentProject: null,
    pendingWar: null,
    surrenderIfWar: false,
    lastDisaster: null,
    lastWarSummary: null,
    gameLog,
    gameOver: false,
    finalScore: null,
    lastUnlockedAdvance: null,
    lastCompletedProject: null,
    currentPhase: "ready",
  };
}

function startPopulationIncreasePhase(state) {
  state.turnStartAssignments = { ...state.populationAssignments };

  const dieRoll = rollDie(6);
  const bonus = hasAdvance(state, "religion") ? 1 : 0;
  let populationGain = Math.max(0, dieRoll - 2 + bonus);
  if (state.populationTotal < 5) {
    populationGain = Math.max(1, populationGain);
  }

  state.populationTotal += populationGain;
  state.populationAssignments.agriculture += populationGain;
  pushLog(state, `Population increased by ${populationGain}`);
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

  if (hasWonder(state, "colossus")) {
    const bonusGold = rollDie(6);
    state.gold += bonusGold;
    state.gameLog.push(`Colossus generated ${bonusGold} gold`);
  }
}

function getRandomDisaster() {
  const roll = rollDie(20);
  const disaster = DISASTERS.find((item) => roll >= item.rollMin && roll <= item.rollMax);
  return { roll, disaster: disaster || null };
}

function createSpecialWarFromDisaster(state, disasterId, mitigationApplied) {
  const baseEnemyArmies = rollDie(6);
  let enemyArmies = disasterId === "civil-war" && mitigationApplied
    ? Math.max(1, Math.floor(baseEnemyArmies / 2))
    : baseEnemyArmies;

  if ((state.populationAssignments.army || 0) <= 0) {
    enemyArmies = Math.max(1, Math.floor(enemyArmies / 2));
    pushLog(state, "Warning: war triggered with no army, enemy armies reduced by 50%");
  }

  const mapping = {
    "civil-war": {
      type: "civil-war",
      name: "Civil War",
      onEnemyVictoryEffect: "lose_random_city",
    },
    uprising: {
      type: "uprising",
      name: "Uprising",
      onEnemyVictoryEffect: "lose_population_2d6",
    },
    barbarians: {
      type: "barbarians",
      name: "Barbarians",
      onEnemyVictoryEffect: "lose_all_gold",
    },
  };

  const details = mapping[disasterId];
  if (!details) {
    return null;
  }

  return {
    ...details,
    enemyArmies,
    remainingEnemyArmies: enemyArmies,
    maxSegments: rollDie(6),
    currentSegment: 0,
    playerLossesInflicted: 0,
    playerLossesSuffered: 0,
  };
}

function resolveDisasterCheck(state) {
  state.skipBuildPhase = false;
  state.pendingWar = null;
  state.lastDisaster = null;
  state.lastWarSummary = null;

  const checkRoll = rollTwoDice();
  pushSectionHeader(state, "DISASTER CHECK");
  pushLog(state, `Disaster check roll: ${checkRoll}`);

  if (checkRoll === 2) {
    state.pendingWar = createNormalWar(state);
    pushImportantLog(state, "War started");
    return;
  }

  if (checkRoll !== 12) {
    pushLog(state, "No disaster this turn");
    return;
  }

  state.skipBuildPhase = true;

  const { roll, disaster } = getRandomDisaster();
  if (!disaster) {
    pushLog(state, "No disaster this turn");
    return;
  }

  state.lastDisaster = {
    id: disaster.id,
    name: disaster.name,
    roll,
  };

  pushSectionHeader(state, `DISASTER: ${disaster.name.toUpperCase()}`);
  pushImportantLog(state, `Disaster occurred: ${disaster.name}`);
  pushLog(state, `Disaster table roll: ${roll}`);

  const mitigationByAdvance = disaster.mitigationAdvanceId && hasAdvance(state, disaster.mitigationAdvanceId);
  const mitigationByWonder = disaster.mitigationWonderId && hasWonder(state, disaster.mitigationWonderId);

  switch (disaster.id) {
    case "flood":
    case "earthquake":
    case "unrest":
    case "anarchy":
    case "epidemic":
    case "mad-king":
    case "pestilence": {
      const baseLoss = sumDice(disaster.effect.diceCount, disaster.effect.diceSides);
      const unrestWonderMitigation = disaster.id === "unrest" && hasWonder(state, "hanging-gardens");
      const anarchyWonderMitigation = disaster.id === "anarchy" && hasWonder(state, "pyramids");
      const mitigation = Boolean(mitigationByAdvance || mitigationByWonder || unrestWonderMitigation || anarchyWonderMitigation);
      if (mitigation) {
        state.gameLog.push(`${disaster.name} mitigated by ${disaster.mitigationAdvanceId || disaster.mitigationWonderId}`);
      }
      applyPopulationDisaster(state, baseLoss, mitigation, disaster.mitigationAdvanceId || disaster.mitigationWonderId);
      break;
    }
    case "heresy": {
      const mitigated = hasAdvance(state, "religion") || hasAdvance(state, "philosophy") || hasWonder(state, "parthenon");
      const baseLoss = mitigated ? sumDice(1, 6) : sumDice(2, 6);
      if (mitigated) {
        state.gameLog.push("Heresy mitigated by Religion/Philosophy/Parthenon");
      }
      losePopulation(state, baseLoss, "Heresy");
      break;
    }
    case "volcano":
      loseRandomCity(state, "Volcano");
      break;
    case "sands-of-time":
      loseRandomWonder(state, "Sands of Time");
      break;
    case "pirates": {
      const baseLoss = Math.floor(state.gold / 2);
      loseGold(state, baseLoss, "Pirates");
      break;
    }
    case "famine":
    case "drought": {
      const baseLoss = Math.floor(state.food / 2);
      const finalLoss = mitigationByAdvance ? Math.floor(baseLoss / 2) : baseLoss;
      if (mitigationByAdvance) {
        state.gameLog.push(`${disaster.name} mitigated by Pottery`);
      }
      loseFood(state, finalLoss, disaster.name);
      break;
    }
    case "corruption": {
      if (mitigationByWonder) {
        state.gameLog.push("Corruption mitigated by Oracle");
      } else {
        loseGold(state, state.gold, "Corruption");
      }
      break;
    }
    case "hurricane": {
      if (mitigationByWonder) {
        state.gameLog.push("Hurricane mitigated by Lighthouse");
      } else {
        losePopulation(state, sumDice(1, 6), "Hurricane");
      }
      break;
    }
    case "civil-war":
    case "uprising":
    case "barbarians": {
      if (disaster.id === "civil-war" && mitigationByAdvance) {
        state.gameLog.push("Civil War mitigated by Democracy");
      }
      state.pendingWar = createSpecialWarFromDisaster(state, disaster.id, Boolean(mitigationByAdvance));
      break;
    }
    default:
      break;
  }
}

function runUpkeepPhase(state) {
  const reserveBeforeUpkeep = state.food;
  let foodConsumed = Math.min(state.food, state.populationTotal);
  state.food -= foodConsumed;

  if (foodConsumed < state.populationTotal) {
    const missingFood = state.populationTotal - foodConsumed;
    losePopulation(state, missingFood, "Starvation");
  }

  const armyPopulation = state.populationAssignments.army;
  let goldConsumed = Math.min(state.gold, armyPopulation);
  state.gold -= goldConsumed;

  if (goldConsumed < armyPopulation) {
    const unpaidArmy = armyPopulation - goldConsumed;
    state.populationAssignments.army -= unpaidArmy;
    state.populationAssignments.agriculture += unpaidArmy;
    goldConsumed = state.populationAssignments.army;
  }

  state.gameLog.push(`Upkeep consumed ${foodConsumed} food and ${goldConsumed} gold`);

  if (state.gold < 0) {
    state.gold = 0;
    pushLog(state, "Warning: gold corrected to 0 after upkeep");
  }

  if (!hasAdvance(state, "pottery")) {
    state.food = 0;
    state.gameLog.push("Food reserve reset (no Pottery)");
  } else {
    state.gameLog.push(`Food reserve kept by Pottery: ${state.food} (from ${reserveBeforeUpkeep})`);
  }

  syncPopulationAssignments(state);
}

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

function getPlayerBattleDiceCount(state) {
  let battleDice = 3;

  if (hasAdvance(state, "metal-working")) {
    battleDice += 1;
  }

  if (hasAdvance(state, "military-doctrine")) {
    battleDice += 1;
  }

  if (hasAdvance(state, "equestrian")) {
    battleDice += 1;
  }

  battleDice += countLeadersByType(state, "general");

  return battleDice;
}

function countBattleHits(rolls) {
  return rolls.filter((roll) => roll === 6).length;
}

function createNormalWar(state) {
  let enemyArmies = sumDice(4, 6);
  if ((state.populationAssignments.army || 0) <= 0) {
    enemyArmies = Math.max(1, Math.floor(enemyArmies / 2));
    pushLog(state, "Warning: war triggered with no army, enemy armies reduced by 50%");
  }

  return {
    type: "normal",
    name: "War",
    enemyArmies,
    remainingEnemyArmies: enemyArmies,
    maxSegments: rollDie(6),
    currentSegment: 0,
    playerLossesInflicted: 0,
    playerLossesSuffered: 0,
    onEnemyVictoryEffect: "lose_gold_2d6",
  };
}

function applyEnemyVictoryEffect(state, war) {
  if (war.type === "normal" || war.onEnemyVictoryEffect === "lose_gold_2d6") {
    const goldLoss = sumDice(2, 6);
    loseGold(state, goldLoss, "War defeat");
    return;
  }

  if (war.onEnemyVictoryEffect === "lose_random_city") {
    loseRandomCity(state, war.name);
    return;
  }

  if (war.onEnemyVictoryEffect === "lose_population_2d6") {
    losePopulation(state, sumDice(2, 6), war.name);
    return;
  }

  if (war.onEnemyVictoryEffect === "lose_all_gold") {
    loseGold(state, state.gold, war.name);
  }
}

function resolveWarPhase(state) {
  const war = state.pendingWar;
  if (!war) {
    return;
  }

  const startingEnemyArmies = war.enemyArmies;

  if (state.surrenderIfWar) {
    const goldLoss = sumDice(2, 6);
    loseGold(state, goldLoss, "Surrender");
    state.gameLog.push(`Player surrendered and lost ${goldLoss} gold`);
    state.lastWarSummary = {
      type: war.type,
      name: war.name,
      enemyArmies: startingEnemyArmies,
      maxSegments: war.maxSegments,
      result: "Surrender",
    };
    state.pendingWar = null;
    return;
  }

  pushSectionHeader(state, `WAR: ${war.name.toUpperCase()}`);
  pushImportantLog(state, `War started: ${war.name}`);
  pushLog(state, `War setup: ${war.enemyArmies} enemy armies, ${war.maxSegments} segments`);

  for (let segment = 1; segment <= war.maxSegments; segment += 1) {
    if (war.remainingEnemyArmies <= 0 || state.populationAssignments.army <= 0) {
      break;
    }

    war.currentSegment = segment;

    const defensiveBonus = hasWonder(state, "great-wall") ? 1 : 0;
    const playerRolls = rollMultipleDice(getPlayerBattleDiceCount(state) + defensiveBonus, 6);
    const enemyRolls = rollMultipleDice(3, 6);
    const playerHits = countBattleHits(playerRolls);
    const enemyHits = countBattleHits(enemyRolls);

    state.gameLog.push(
      `War segment ${segment}: player rolls [${playerRolls.join(",")}], enemy rolls [${enemyRolls.join(",")}]`
    );
    state.gameLog.push(`Player inflicted ${playerHits} loss, enemy inflicted ${enemyHits} losses`);

    war.remainingEnemyArmies = Math.max(0, war.remainingEnemyArmies - playerHits);
    const playerArmyLosses = loseArmyPopulation(state, enemyHits);

    war.playerLossesInflicted += playerHits;
    war.playerLossesSuffered += playerArmyLosses;

    state.gameLog.push(
      `Remaining armies - Player: ${state.populationAssignments.army}, Enemy: ${war.remainingEnemyArmies}`
    );
  }

  let result = "Tactical draw";

  if (state.populationAssignments.army <= 0 && war.remainingEnemyArmies > 0) {
    applyEnemyVictoryEffect(state, war);
    result = "Enemy victory";

    if (war.type === "barbarians") {
      pushImportantLog(state, "War lost: Barbarians won (all gold lost)");
    }
  } else if (war.remainingEnemyArmies <= 0 && state.populationAssignments.army > 0) {
    result = "Player victory";
    pushImportantLog(state, `War won: ${war.name}`);
  } else {
    const goldWon = Math.max(0, war.playerLossesInflicted - war.playerLossesSuffered);
    if (goldWon > 0) {
      state.gold += goldWon;
      result = `Points victory (+${goldWon} gold)`;
      state.gameLog.push(`War ended on points: player won ${goldWon} gold`);
    } else {
      state.gameLog.push("War ended in tactical draw");
    }
  }

  state.lastWarSummary = {
    type: war.type,
    name: war.name,
    enemyArmies: startingEnemyArmies,
    maxSegments: war.maxSegments,
    result,
  };

  state.pendingWar = null;
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

function getResearchBonusFromAdvances(state) {
  let bonus = 0;

  if (hasAdvance(state, "astronomy")) {
    bonus += 1;
  }

  if (hasAdvance(state, "literacy")) {
    bonus += 1;
  }

  if (hasAdvance(state, "mathematics")) {
    bonus += 1;
  }

  return bonus;
}

function getResearchBonusFromWonders(state) {
  return hasWonder(state, "great-library") ? 1 : 0;
}

function getTotalResearchRolls(state) {
  const scholars = getScholarCount(state);
  const thinkers = countLeadersByType(state, "thinker");
  const advancesBonus = getResearchBonusFromAdvances(state);
  const wonderBonus = getResearchBonusFromWonders(state);

  return scholars + thinkers + advancesBonus + wonderBonus;
}

function getResearchRollBreakdown(state) {
  return {
    scholars: getScholarCount(state),
    thinkers: countLeadersByType(state, "thinker"),
    astronomyBonus: hasAdvance(state, "astronomy") ? 1 : 0,
    literacyBonus: hasAdvance(state, "literacy") ? 1 : 0,
    mathematicsBonus: hasAdvance(state, "mathematics") ? 1 : 0,
    greatLibraryBonus: getResearchBonusFromWonders(state),
    totalRolls: getTotalResearchRolls(state),
  };
}

function getRandomAvailableAdvance(state) {
  const availableAdvances = ADVANCES.filter((advance) => !hasAdvance(state, advance.id));
  return getRandomItem(availableAdvances) || null;
}

function resolveResearchPhase(state) {
  const totalRolls = getTotalResearchRolls(state);
  state.gameLog.push(`Research phase: ${totalRolls} rolls`);

  for (let rollIndex = 1; rollIndex <= totalRolls; rollIndex += 1) {
    const result = rollTwoDice();
    state.gameLog.push(`Research roll ${rollIndex}: ${result}`);

    if (result !== 2 && result !== 12) {
      continue;
    }

    const unlockedAdvance = getRandomAvailableAdvance(state);
    if (!unlockedAdvance) {
      state.gameLog.push("Research succeeded but no advances remained");
      continue;
    }

    if (state.advances.includes(unlockedAdvance.id)) {
      pushLog(state, `Warning: duplicate advance prevented (${unlockedAdvance.name})`);
      continue;
    }

    state.advances.push(unlockedAdvance.id);
    state.lastUnlockedAdvance = unlockedAdvance.name;
    pushImportantLog(state, `Advance discovered: ${unlockedAdvance.name}`);
  }
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

function getAdvanceScore(state) {
  return state.advances.reduce((sum, advanceId) => {
    const definition = findAdvanceById(advanceId);
    return sum + (definition?.victoryPoints || 1);
  }, 0);
}

function calculateFinalScore(state) {
  const advancePoints = getAdvanceScore(state);
  const cityPoints = getCityCount(state) * 5;
  const wonderPoints = state.completedWonders.length * 15;

  return {
    advancePoints,
    cityPoints,
    wonderPoints,
    total: advancePoints + cityPoints + wonderPoints,
  };
}

function canIncreasePopulationRole(state, role) {
  if (!POPULATION_ROLES.includes(role)) {
    return { ok: false, reason: "Invalid population role" };
  }

  if (!canRoleIncreaseWithinLimit(state, role)) {
    return { ok: false, reason: "Role cannot increase more than +6 from turn start" };
  }

  if (role === "army" && state.gold <= 0) {
    return { ok: false, reason: "Not enough gold to assign more Army" };
  }

  if (role === "scholars" && getScholarCount(state) >= getCityCount(state)) {
    return { ok: false, reason: `Scholar limit reached (${getCityCount(state)} max)` };
  }

  const donorRole = findRoleForDecrease(state, [role]);
  if (!donorRole) {
    return { ok: false, reason: "No population available to move" };
  }

  return { ok: true };
}

function canDecreasePopulationRole(state, role) {
  if (!POPULATION_ROLES.includes(role)) {
    return { ok: false, reason: "Invalid population role" };
  }

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

  return { ok: true };
}

function applyPopulationChange(state, role, delta) {
  if (state.currentPhase !== "distribution") {
    return { ok: false, reason: "Distribution phase is not active" };
  }

  if (!POPULATION_ROLES.includes(role)) {
    return { ok: false, reason: "Invalid population role" };
  }

  if (delta === 1) {
    const canIncrease = canIncreasePopulationRole(state, role);
    if (!canIncrease.ok) {
      return canIncrease;
    }

    const donorRole = findRoleForDecrease(state, [role]);

    state.populationAssignments[donorRole] -= 1;
    state.populationAssignments[role] += 1;

    if (role === "army") {
      state.gold -= 1;
    }

    return { ok: true };
  }

  if (delta === -1) {
    const canDecrease = canDecreasePopulationRole(state, role);
    if (!canDecrease.ok) {
      return canDecrease;
    }

    const receiverRole = findRoleForIncrease(state, [role]);

    state.populationAssignments[role] -= 1;
    state.populationAssignments[receiverRole] += 1;

    return { ok: true };
  }

  return { ok: false, reason: "Delta must be +1 or -1" };
}

function nextTurn(state) {
  console.log("[DEBUG] nextTurn started", { turn: state?.turn, phase: state?.currentPhase, gameOver: state?.gameOver });
  if (state.gameOver) {
    state.gameLog.push("La partita è terminata. Nessun altro turno disponibile.");
    return state;
  }

  if (state.currentPhase === "ready") {
    enforceStateInvariants(state);
    pushSectionHeader(state, `TURN ${state.turn}`);
    state.lastUnlockedAdvance = null;
    state.lastCompletedProject = null;
    startPopulationIncreasePhase(state);
    state.currentPhase = "distribution";
    return state;
  }

  if (state.currentPhase === "distribution") {
    // 1 Population Increase (già eseguita)
    // 2 Population Distribution (UI)
    // 3 Gain Leader
    // 4 Harvest
    // 5 Disaster Check
    // 6 Upkeep
    // 7 Leader aging
    // 8 War (se presente)
    // 9 Trade
    // 10 Build
    // 11 Research
    runGainLeaderPhase(state);
    runHarvestPhase(state);
    resolveDisasterCheck(state);
    runUpkeepPhase(state);
    runLeaderAgingPhase(state);

    if (state.pendingWar) {
      resolveWarPhase(state);
    }

    runTradePhase(state);

    if (state.skipBuildPhase) {
      state.gameLog.push("Build phase skipped due to disaster");
    } else {
      resolveBuildPhase(state);
    }

    resolveResearchPhase(state);

    pushLog(state, `Build: ${state.currentProject ? "project advanced" : "no active project"}`);
    pushLog(state, `Research: ${getTotalResearchRolls(state)} rolls`);

    state.turn += 1;
    state.currentPhase = "ready";

    enforceStateInvariants(state);

    if (state.turn > state.maxTurns) {
      state.gameOver = true;
      state.finalScore = calculateFinalScore(state);
      state.gameLog.push("Game finished after 50 turns");
    }
  }

  return state;
}

function getEconomyPreview(state) {
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


window.GameLogic = {
  getRandomItem,
  hasAdvance,
  hasWonder,
  countLeadersByType,
  getCityCount,
  getScholarCount,
  generateUniqueId,
  rollDie,
  rollTwoDice,
  rollMultipleDice,
  sumDice,
  losePopulation,
  loseFood,
  loseGold,
  loseRandomCity,
  loseRandomWonder,
  getLaborProducedThisTurn,
  getAvailableWonderDefinitions,
  getUnusedCityName,
  canStartCityProject,
  canStartWonderProject,
  createCityProject,
  createWonderProject,
  resolveBuildPhase,
  createInitialGameState,
  resolveDisasterCheck,
  getResearchBonusFromAdvances,
  getTotalResearchRolls,
  getResearchRollBreakdown,
  getRandomAvailableAdvance,
  resolveResearchPhase,
  calculateFinalScore,
  canIncreasePopulationRole,
  canDecreasePopulationRole,
  applyPopulationChange,
  nextTurn,
  getEconomyPreview,
};
