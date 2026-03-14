const { ADVANCES: GAME_ADVANCES } = window.GameData;
const {
  applyPopulationChange,
  canStartCityProject,
  canStartWonderProject,
  createCityProject,
  createInitialGameState,
  createWonderProject,
  getAvailableWonderDefinitions,
  getEconomyPreview,
  getResearchRollBreakdown,
  canIncreasePopulationRole,
  canDecreasePopulationRole,
  calculateFinalScore,
  nextTurn,
} = window.GameLogic;

const POPULATION_ROLES = ["army", "agriculture", "trade", "labor", "scholars"];

const SPECIALIST_TOOLTIPS = {
  army: "Army: combatte in guerra ma consuma 1 gold in upkeep.",
  agriculture: "Agriculture: produce food ogni turno (più con Irrigation).",
  trade: "Trade: genera gold base nella fase Trade.",
  labor: "Labor: avanza i progetti di city/wonder.",
  scholars: "Scholars: aggiungono research rolls (max 1 per city).",
};

const ADVANCE_MITIGATION_HINTS = {
  irrigation: "Mitigates Flood and increases food from agriculture.",
  architecture: "Mitigates Earthquake and reduces construction gold cost.",
  music: "Mitigates Unrest.",
  law: "Mitigates Anarchy.",
  medicine: "Mitigates Epidemic and Pestilence.",
  pottery: "Mitigates Famine/Drought and preserves food reserve.",
  democracy: "Mitigates Civil War and Mad King.",
  religion: "Mitigates Heresy impact.",
};


const gameState = createInitialGameState();

const elements = {
  turnValue: document.getElementById("turn-value"),
  maxTurnsValue: document.getElementById("max-turns-value"),
  cultureValue: document.getElementById("culture-value"),
  startingAdvanceValue: document.getElementById("starting-advance-value"),
  phaseValue: document.getElementById("phase-value"),
  gameOverValue: document.getElementById("game-over-value"),
  projectValue: document.getElementById("project-value"),
  lastDisasterValue: document.getElementById("last-disaster-value"),
  lastWarValue: document.getElementById("last-war-value"),
  warTypeValue: document.getElementById("war-type-value"),
  warEnemyValue: document.getElementById("war-enemy-value"),
  warResultValue: document.getElementById("war-result-value"),
  disasterLastValue: document.getElementById("disaster-last-value"),
  buildSkippedValue: document.getElementById("build-skipped-value"),
  summaryCulture: document.getElementById("summary-culture"),
  summaryTurn: document.getElementById("summary-turn"),
  summaryPopulation: document.getElementById("summary-population"),
  summaryCities: document.getElementById("summary-cities"),
  summaryWonders: document.getElementById("summary-wonders"),
  summaryAdvances: document.getElementById("summary-advances"),
  foodValue: document.getElementById("food-value"),
  goldValue: document.getElementById("gold-value"),
  populationTotalResourceValue: document.getElementById("population-total-resource-value"),
  cityCountResourceValue: document.getElementById("city-count-resource-value"),
  foodProductionPreview: document.getElementById("food-production-preview"),
  foodUpkeepPreview: document.getElementById("food-upkeep-preview"),
  goldUpkeepPreview: document.getElementById("gold-upkeep-preview"),
  tradePopulationPreview: document.getElementById("trade-population-preview"),
  tradeCitiesPreview: document.getElementById("trade-cities-preview"),
  tradeCoinagePreview: document.getElementById("trade-coinage-preview"),
  tradeNavigationPreview: document.getElementById("trade-navigation-preview"),
  tradeRulersPreview: document.getElementById("trade-rulers-preview"),
  tradeTotalPreview: document.getElementById("trade-total-preview"),
  goldProductionPreview: document.getElementById("gold-production-preview"),
  researchScholarsPreview: document.getElementById("research-scholars-preview"),
  researchThinkersPreview: document.getElementById("research-thinkers-preview"),
  researchAstronomyPreview: document.getElementById("research-astronomy-preview"),
  researchLiteracyPreview: document.getElementById("research-literacy-preview"),
  researchMathematicsPreview: document.getElementById("research-mathematics-preview"),
  researchGreatLibraryPreview: document.getElementById("research-great-library-preview"),
  researchAdvancesTotalPreview: document.getElementById("research-advances-total-preview"),
  researchWondersTotalPreview: document.getElementById("research-wonders-total-preview"),
  researchTotalPreview: document.getElementById("research-total-preview"),
  populationTotalValue: document.getElementById("population-total-value"),
  populationAssignmentsList: document.getElementById("population-assignments-list"),
  populationDistributionControls: document.getElementById("population-distribution-controls"),
  distributionStatus: document.getElementById("distribution-status"),
  cityCountValue: document.getElementById("city-count-value"),
  citiesList: document.getElementById("cities-list"),
  wondersList: document.getElementById("wonders-list"),
  advancesList: document.getElementById("advances-list"),
  leadersList: document.getElementById("leaders-list"),
  eventLogList: document.getElementById("event-log-list"),
  endTurnButton: document.getElementById("end-turn-button"),
  turnHelpText: document.getElementById("turn-help-text"),
  projectTypeSelect: document.getElementById("project-type-select"),
  startCityProjectButton: document.getElementById("start-city-project-button"),
  wonderControls: document.getElementById("wonder-controls"),
  wonderSelect: document.getElementById("wonder-select"),
  wonderCitySelect: document.getElementById("wonder-city-select"),
  startWonderProjectButton: document.getElementById("start-wonder-project-button"),
  buildStatusMessage: document.getElementById("build-status-message"),
  activeProjectBox: document.getElementById("active-project-box"),
  buildCurrentProject: document.getElementById("build-current-project"),
  buildLaborProgress: document.getElementById("build-labor-progress"),
  buildLaborRequired: document.getElementById("build-labor-required"),
  buildProjectCity: document.getElementById("build-project-city"),
  surrenderIfWarCheckbox: document.getElementById("surrender-if-war-checkbox"),
  finalScorePanel: document.getElementById("final-score-panel"),
  finalAdvancePoints: document.getElementById("final-advance-points"),
  finalCityPoints: document.getElementById("final-city-points"),
  finalWonderPoints: document.getElementById("final-wonder-points"),
  finalTotalScore: document.getElementById("final-total-score"),
};

const requiredElements = ["endTurnButton", "eventLogList", "turnValue"];
requiredElements.forEach((name) => {
  if (!elements[name]) {
    console.error(`[ERROR] Missing required DOM element: ${name}`);
  }
});


function renderList(listElement, values, emptyLabel) {
  listElement.innerHTML = "";

  if (!values || values.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = emptyLabel;
    listElement.appendChild(emptyItem);
    return;
  }

  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    listElement.appendChild(item);
  });
}

function getAdvanceNameById(advanceId) {
  const advance = GAME_ADVANCES.find((item) => item.id === advanceId);
  return advance ? advance.name : advanceId;
}

function getPhaseLabel(phase) {
  if (phase === "distribution") {
    return "Population Distribution";
  }

  return "Pronto";
}

function formatTradeTotalRange(range) {
  if (range.min === range.max) {
    return String(range.min);
  }

  return `${range.min}-${range.max}`;
}

function formatRulerTrade(range, rulerCount) {
  if (rulerCount === 0) {
    return "0";
  }

  if (range.min === range.max) {
    return `${range.min}`;
  }

  return `${range.min}-${range.max} (${rulerCount} Ruler${rulerCount > 1 ? "s" : ""})`;
}

function formatProjectSummary(project) {
  if (!project) {
    return "Nessuno";
  }

  if (project.type === "city") {
    return `New City (${project.laborProgress}/${project.laborRequired})`;
  }

  return `${project.name} (${project.laborProgress}/${project.laborRequired})`;
}

function createDistributionRow(role, amount, isActiveDistribution, state) {
  const row = document.createElement("div");
  row.className = "distribution-row";

  const label = document.createElement("span");
  label.className = "distribution-label";

  if (role === "scholars") {
    label.textContent = `scholars: ${amount} / ${state.cities.length} max`;
  } else {
    label.textContent = role;
  }
  label.title = SPECIALIST_TOOLTIPS[role] || "";

  const minusButton = document.createElement("button");
  minusButton.type = "button";
  minusButton.textContent = "-";
  const canDecrease = canDecreasePopulationRole(state, role);
  minusButton.disabled = !isActiveDistribution || !canDecrease.ok;
  minusButton.title = canDecrease.ok ? `Decrease ${role}` : canDecrease.reason;
  minusButton.addEventListener("click", () => {
    const result = applyPopulationChange(gameState, role, -1);
    if (!result.ok) {
      elements.distributionStatus.textContent = result.reason;
    }
    renderGame(gameState);
  });

  const amountValue = document.createElement("span");
  amountValue.className = "distribution-amount";
  amountValue.textContent = String(amount);

  const plusButton = document.createElement("button");
  plusButton.type = "button";
  plusButton.textContent = "+";
  const canIncrease = canIncreasePopulationRole(state, role);
  plusButton.disabled = !isActiveDistribution || !canIncrease.ok;
  plusButton.title = canIncrease.ok ? `Increase ${role}` : canIncrease.reason;
  plusButton.addEventListener("click", () => {
    const result = applyPopulationChange(gameState, role, 1);
    if (!result.ok) {
      elements.distributionStatus.textContent = result.reason;
    }
    renderGame(gameState);
  });

  row.append(label, minusButton, amountValue, plusButton);
  return row;
}

function renderDistributionControls(state) {
  elements.populationDistributionControls.innerHTML = "";

  const isActiveDistribution = state.currentPhase === "distribution";

  POPULATION_ROLES.forEach((role) => {
    const amount = state.populationAssignments[role] || 0;
    const row = createDistributionRow(role, amount, isActiveDistribution, state);
    elements.populationDistributionControls.appendChild(row);
  });

  if (isActiveDistribution) {
    const armyIncreaseCheck = canIncreasePopulationRole(state, "army");
    const armyHint = armyIncreaseCheck.ok ? "" : ` Army: ${armyIncreaseCheck.reason}.`;
    elements.distributionStatus.textContent =
      `Redistribuisci la popolazione (max ±6 per categoria). Scholars limit: ${state.populationAssignments.scholars}/${state.cities.length}.${armyHint}`;
  } else {
    elements.distributionStatus.textContent = "Attiva solo durante la fase Distribution.";
  }
}

function renderLeaders(state) {
  const leaderValues = state.leaders.map(
    (leader) => `${leader.name} — ${leader.description} [${leader.uniqueId}]`
  );
  renderList(elements.leadersList, leaderValues, "No leaders");
}

function getWonderHostCities(state) {
  return state.cities.filter((city) => !city.wonderId);
}

function renderWonderSelection(state) {
  const availableWonders = getAvailableWonderDefinitions(state);
  const availableCities = getWonderHostCities(state);

  elements.wonderSelect.innerHTML = "";
  availableWonders.forEach((wonder) => {
    const option = document.createElement("option");
    option.value = wonder.id;
    option.textContent = `${wonder.name} (req: ${getAdvanceNameById(wonder.requirementAdvanceId)})`;
    elements.wonderSelect.appendChild(option);
  });

  if (availableWonders.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nessun wonder disponibile";
    elements.wonderSelect.appendChild(option);
  }

  elements.wonderCitySelect.innerHTML = "";
  availableCities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city.id;
    option.textContent = city.name;
    elements.wonderCitySelect.appendChild(option);
  });

  if (availableCities.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nessuna città disponibile";
    elements.wonderCitySelect.appendChild(option);
  }

  const selectedWonderId = elements.wonderSelect.value;
  const selectedCityId = elements.wonderCitySelect.value;
  const startCheck = canStartWonderProject(state, selectedWonderId, selectedCityId);

  elements.startWonderProjectButton.disabled = !startCheck.ok;

  if (!startCheck.ok && selectedWonderId && selectedCityId) {
    elements.buildStatusMessage.textContent = startCheck.reason;
  }
}

function renderBuildControls(state) {
  const projectType = elements.projectTypeSelect.value;
  elements.wonderControls.style.display = projectType === "wonder" ? "flex" : "none";

  const cityStartCheck = canStartCityProject(state);
  elements.startCityProjectButton.disabled = !cityStartCheck.ok;

  if (projectType === "city" && !cityStartCheck.ok) {
    elements.buildStatusMessage.textContent = cityStartCheck.reason;
  }

  renderWonderSelection(state);

  if (state.currentProject) {
    const project = state.currentProject;
    const cityLabel =
      project.type === "wonder"
        ? state.cities.find((city) => city.id === project.cityId)?.name || "Unknown city"
        : "-";

    elements.buildCurrentProject.textContent = `${project.name} (${project.type})`;
    elements.buildLaborProgress.textContent = String(project.laborProgress);
    elements.buildLaborRequired.textContent = String(project.laborRequired);
    elements.buildProjectCity.textContent = cityLabel;
  } else {
    elements.buildCurrentProject.textContent = "No active project";
    elements.buildLaborProgress.textContent = "-";
    elements.buildLaborRequired.textContent = "-";
    elements.buildProjectCity.textContent = "-";
  }
}

function renderGame(state) {
  console.log("[DEBUG] renderGame", { turn: state?.turn, phase: state?.currentPhase, logEntries: state?.gameLog?.length });
  const economyPreview = getEconomyPreview(state);

  elements.turnValue.textContent = String(state.turn);
  elements.maxTurnsValue.textContent = String(state.maxTurns);
  elements.cultureValue.textContent = state.culture.name;
  elements.startingAdvanceValue.textContent = state.startingAdvanceId
    ? getAdvanceNameById(state.startingAdvanceId)
    : "Nessuno";
  elements.phaseValue.textContent = getPhaseLabel(state.currentPhase);
  elements.gameOverValue.textContent = state.gameOver ? "Sì" : "No";
  elements.projectValue.textContent = formatProjectSummary(state.currentProject);
  elements.lastDisasterValue.textContent = state.lastDisaster
    ? `${state.lastDisaster.name} (d20: ${state.lastDisaster.roll})`
    : "Nessuno";
  elements.lastWarValue.textContent = state.lastWarSummary
    ? `${state.lastWarSummary.name} — enemy ${state.lastWarSummary.enemyArmies}, seg ${state.lastWarSummary.maxSegments}, ${state.lastWarSummary.result}`
    : "Nessuna";
  elements.buildSkippedValue.textContent = state.skipBuildPhase ? "Sì" : "No";

  elements.summaryCulture.textContent = state.culture.name;
  elements.summaryTurn.textContent = `${state.turn}/${state.maxTurns}`;
  elements.summaryPopulation.textContent = String(state.populationTotal);
  elements.summaryCities.textContent = String(state.cities.length);
  elements.summaryWonders.textContent = String(state.wonders.length);
  elements.summaryAdvances.textContent = String(state.advances.length);

  elements.disasterLastValue.textContent = state.lastDisaster
    ? `${state.lastDisaster.name} (d20: ${state.lastDisaster.roll})`
    : "Nessuno";

  elements.warTypeValue.textContent = state.lastWarSummary ? state.lastWarSummary.name : "Nessuna";
  elements.warEnemyValue.textContent = state.lastWarSummary ? String(state.lastWarSummary.enemyArmies) : "-";
  elements.warResultValue.textContent = state.lastWarSummary ? state.lastWarSummary.result : "-";

  elements.foodValue.textContent = String(state.food);
  elements.goldValue.textContent = String(state.gold);
  elements.populationTotalResourceValue.textContent = String(state.populationTotal);
  elements.cityCountResourceValue.textContent = String(state.cities.length);
  elements.foodProductionPreview.textContent = String(economyPreview.foodProduction);
  elements.foodUpkeepPreview.textContent = String(economyPreview.foodUpkeep);
  elements.goldUpkeepPreview.textContent = String(economyPreview.armyGoldUpkeep);

  elements.tradePopulationPreview.textContent = String(economyPreview.tradePopulationGold);
  elements.tradeCitiesPreview.textContent = String(economyPreview.citiesGold);
  elements.tradeCoinagePreview.textContent = String(economyPreview.coinageGold);
  elements.tradeNavigationPreview.textContent = String(economyPreview.navigationGold);
  elements.tradeRulersPreview.textContent = formatRulerTrade(
    economyPreview.rulerGoldRange,
    economyPreview.rulerCount
  );
  elements.tradeTotalPreview.textContent = formatTradeTotalRange(economyPreview.tradeGoldRange);
  elements.goldProductionPreview.textContent = formatTradeTotalRange(economyPreview.tradeGoldRange);

  const researchBreakdown = getResearchRollBreakdown(state);
  elements.researchScholarsPreview.textContent = String(researchBreakdown.scholars);
  elements.researchThinkersPreview.textContent = String(researchBreakdown.thinkers);
  elements.researchAstronomyPreview.textContent = String(researchBreakdown.astronomyBonus);
  elements.researchLiteracyPreview.textContent = String(researchBreakdown.literacyBonus);
  elements.researchMathematicsPreview.textContent = String(researchBreakdown.mathematicsBonus);
  elements.researchGreatLibraryPreview.textContent = String(researchBreakdown.greatLibraryBonus);
  elements.researchAdvancesTotalPreview.textContent = String(researchBreakdown.astronomyBonus + researchBreakdown.literacyBonus + researchBreakdown.mathematicsBonus);
  elements.researchWondersTotalPreview.textContent = String(researchBreakdown.greatLibraryBonus);
  elements.researchTotalPreview.textContent = String(researchBreakdown.totalRolls);

  elements.populationTotalValue.textContent = String(state.populationTotal);
  const assignments = Object.entries(state.populationAssignments).map(
    ([role, amount]) => `${role}: ${amount}`
  );
  renderList(elements.populationAssignmentsList, assignments, "Nessuna assegnazione");
  renderDistributionControls(state);

  elements.cityCountValue.textContent = String(state.cities.length);
  renderList(
    elements.citiesList,
    state.cities.map((city) => `${city.name}${city.wonderId ? ` (Wonder: ${city.wonderId})` : ""}`),
    "Nessuna città"
  );

  elements.wondersList.innerHTML = "";
  if (state.wonders.length === 0) {
    const emptyWonderItem = document.createElement("li");
    emptyWonderItem.textContent = "No wonders yet";
    elements.wondersList.appendChild(emptyWonderItem);
  } else {
    state.wonders.forEach((wonder) => {
      const cityName = state.cities.find((city) => city.id === wonder.cityId)?.name || "Unknown";
      const wonderItem = document.createElement("li");
      wonderItem.textContent = `${wonder.name} in ${cityName}`;
      wonderItem.title = "Wonder: unique project hosted by one city only.";
      elements.wondersList.appendChild(wonderItem);
    });
  }

  elements.advancesList.innerHTML = "";
  if (state.advances.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Nessun advance";
    elements.advancesList.appendChild(emptyItem);
  } else {
    state.advances.forEach((advanceId) => {
      const advance = GAME_ADVANCES.find((item) => item.id === advanceId);
      const item = document.createElement("li");
      item.className = "advance-item";
      if (!advance) {
        item.textContent = advanceId;
      } else {
        if (state.lastUnlockedAdvance === advance.name) {
          item.classList.add("highlight-discovery");
        }
        const mitigationHint = ADVANCE_MITIGATION_HINTS[advance.id] ? ` ${ADVANCE_MITIGATION_HINTS[advance.id]}` : "";
        item.title = `${advance.name}: ${advance.description}${mitigationHint}`;
        item.innerHTML = `<strong>${advance.name}</strong><br /><span class="muted-line">${advance.description}</span><br /><span class="muted-line">VP: ${advance.victoryPoints}</span>`;
      }
      elements.advancesList.appendChild(item);
    });
  }
  renderLeaders(state);

  elements.eventLogList.innerHTML = "";
  const logValues = [...state.gameLog];
  if (logValues.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nessun evento";
    elements.eventLogList.appendChild(li);
  } else {
    logValues.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;

      if (entry.startsWith("===== TURN")) {
        li.classList.add("log-turn-header");
      } else if (entry.startsWith("===== DISASTER") || entry.startsWith("===== WAR")) {
        li.classList.add("log-block-header");
      }

      if (entry.startsWith("IMPORTANT:")) {
        li.classList.add("log-important");
      }

      if (entry.startsWith("Warning:")) {
        li.classList.add("log-warning");
      }

      elements.eventLogList.appendChild(li);
    });
  }

  if (state.currentPhase === "distribution") {
    elements.endTurnButton.textContent = "Concludi turno";
    elements.turnHelpText.textContent =
"Distribuisci popolazione, poi conferma per Gain Leader + Harvest + Disaster Check + Upkeep + Leader Aging + War + Trade + Build + Research.";
  } else {
    elements.endTurnButton.textContent = "Concludi turno";
    elements.turnHelpText.textContent = "Esegue Population Increase e apre la Distribution.";
  }


  if (state.gameOver) {
    const score = state.finalScore || calculateFinalScore(state);
    elements.finalScorePanel.hidden = false;
    elements.finalAdvancePoints.textContent = String(score.advancePoints);
    elements.finalCityPoints.textContent = String(score.cityPoints);
    elements.finalWonderPoints.textContent = String(score.wonderPoints);
    elements.finalTotalScore.textContent = String(score.total);
    elements.endTurnButton.textContent = "Partita conclusa";
  } else {
    elements.finalScorePanel.hidden = true;
  }

  elements.endTurnButton.disabled = state.gameOver;
  elements.surrenderIfWarCheckbox.checked = Boolean(state.surrenderIfWar);
  renderBuildControls(state);

  if (state.lastCompletedProject) {
    elements.activeProjectBox.classList.add("highlight-complete");
  } else {
    elements.activeProjectBox.classList.remove("highlight-complete");
  }
}


elements.endTurnButton.addEventListener("click", (event) => {
  event.preventDefault();
  console.log("[DEBUG] end turn button clicked", { turn: gameState.turn, phase: gameState.currentPhase });

  try {
    nextTurn(gameState);
    renderGame(gameState);
  } catch (error) {
    console.error("[ERROR] Failed to execute economic turn", error);
  }
});

elements.projectTypeSelect.addEventListener("change", () => {
  elements.buildStatusMessage.textContent = "";
  renderGame(gameState);
});

elements.wonderSelect.addEventListener("change", () => {
  renderGame(gameState);
});

elements.wonderCitySelect.addEventListener("change", () => {
  renderGame(gameState);
});

elements.startCityProjectButton.addEventListener("click", () => {
  const result = createCityProject(gameState);
  if (!result.ok) {
    elements.buildStatusMessage.textContent = result.reason;
  } else {
    elements.buildStatusMessage.textContent = "City project started.";
  }
  renderGame(gameState);
});

elements.startWonderProjectButton.addEventListener("click", () => {
  const wonderId = elements.wonderSelect.value;
  const cityId = elements.wonderCitySelect.value;
  const result = createWonderProject(gameState, wonderId, cityId);

  if (!result.ok) {
    elements.buildStatusMessage.textContent = result.reason;
  } else {
    elements.buildStatusMessage.textContent = "Wonder project started.";
  }

  renderGame(gameState);
});

renderGame(gameState);


elements.surrenderIfWarCheckbox.addEventListener("change", () => {
  gameState.surrenderIfWar = elements.surrenderIfWarCheckbox.checked;
  renderGame(gameState);
});

window.renderGame = renderGame;
