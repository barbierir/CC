(() => {
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
  continueAfterEnd,
  nextTurn,
} = window.GameLogic;

const POPULATION_ROLES = ["army", "agriculture", "trade", "labor", "scholars"];
const DEFAULT_VISIBLE_LOG_ENTRIES = 5;

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
let showFullLog = false;

const elements = {
  turnValue: document.getElementById("turn-value"),
  maxTurnsValue: document.getElementById("max-turns-value"),
  cultureValue: document.getElementById("culture-value"),
  phaseValue: document.getElementById("phase-value"),
  headerPhaseChip: document.getElementById("header-phase-chip"),
  warPeaceValue: document.getElementById("war-peace-value"),
  lastDisasterValue: document.getElementById("last-disaster-value"),
  lastWarValue: document.getElementById("last-war-value"),
  warStatusBadge: document.getElementById("war-status-badge"),
  disasterStatusBadge: document.getElementById("disaster-status-badge"),
  buildSkippedBadge: document.getElementById("build-skipped-badge"),
  summaryCities: document.getElementById("summary-cities"),
  summaryWonders: document.getElementById("summary-wonders"),
  summaryAdvances: document.getElementById("summary-advances"),
  summaryLeaders: document.getElementById("summary-leaders"),
  foodValue: document.getElementById("food-value"),
  goldValue: document.getElementById("gold-value"),
  populationTotalResourceValue: document.getElementById("population-total-resource-value"),
  cityCountResourceValue: document.getElementById("city-count-resource-value"),
  foodProductionPreview: document.getElementById("food-production-preview"),
  foodUpkeepPreview: document.getElementById("food-upkeep-preview"),
  goldUpkeepPreview: document.getElementById("gold-upkeep-preview"),
  goldProductionPreview: document.getElementById("gold-production-preview"),
  researchTotalPreview: document.getElementById("research-total-preview"),
  netTurnPreview: document.getElementById("net-turn-preview"),
  scholarsCapValue: document.getElementById("scholars-cap-value"),
  populationTotalValue: document.getElementById("population-total-value"),
  populationAssignmentSummary: document.getElementById("population-assignment-summary"),
  populationDistributionControls: document.getElementById("population-distribution-controls"),
  distributionStatus: document.getElementById("distribution-status"),
  cityCountValue: document.getElementById("city-count-value"),
  citiesList: document.getElementById("cities-list"),
  wondersList: document.getElementById("wonders-list"),
  advancesList: document.getElementById("advances-list"),
  leadersList: document.getElementById("leaders-list"),
  eventLogList: document.getElementById("event-log-list"),
  toggleLogButton: document.getElementById("toggle-log-button"),
  endTurnButton: document.getElementById("end-turn-button"),
  turnHelpText: document.getElementById("turn-help-text"),
  turnReasonText: document.getElementById("turn-reason-text"),
  readinessBadge: document.getElementById("readiness-badge"),
  recommendedActionTitle: document.getElementById("recommended-action-title"),
  projectPhaseBadge: document.getElementById("project-phase-badge"),
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
  workflowStepDistribution: document.getElementById("workflow-step-distribution"),
  workflowStepBuild: document.getElementById("workflow-step-build"),
  workflowStepEnd: document.getElementById("workflow-step-end"),
  finalScorePanel: document.getElementById("final-score-panel"),
  finalScoreDetails: document.getElementById("final-score-details"),
  endlessModeMessage: document.getElementById("endless-mode-message"),
  continueAfterEndButton: document.getElementById("continue-after-end-button"),
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
  return phase === "distribution" ? "Population Distribution" : "Ready";
}

function formatTradeTotalRange(range) {
  if (range.min === range.max) {
    return String(range.min);
  }

  return `${range.min}-${range.max}`;
}

function formatNetRange(range, upkeep) {
  const min = range.min - upkeep;
  const max = range.max - upkeep;
  return min === max ? `${min}` : `${min}-${max}`;
}

function formatProjectSummary(project) {
  if (!project) {
    return "No active project";
  }

  if (project.type === "city") {
    return `New City`;
  }

  return project.name;
}

function updateStatusAppearance(element, tone) {
  if (!element) {
    return;
  }

  element.classList.remove("status-positive", "status-warning", "status-danger", "badge--state-success", "badge--state-warning", "badge--state-danger");

  if (tone === "success") {
    element.classList.add(element.classList.contains("badge") ? "badge--state-success" : "status-positive");
  }

  if (tone === "warning") {
    element.classList.add(element.classList.contains("badge") ? "badge--state-warning" : "status-warning");
  }

  if (tone === "danger") {
    element.classList.add(element.classList.contains("badge") ? "badge--state-danger" : "status-danger");
  }
}

function getWonderHostCities(state) {
  return state.cities.filter((city) => !city.wonderId);
}

function getTurnUxState(state) {
  const cityStartCheck = canStartCityProject(state);
  const hostCities = getWonderHostCities(state);
  const availableWonders = getAvailableWonderDefinitions(state);
  const wonderStartCheck = canStartWonderProject(
    state,
    availableWonders[0]?.id || "",
    hostCities[0]?.id || ""
  );
  const hasBuildOpportunity = cityStartCheck.ok || wonderStartCheck.ok;

  if (state.gameOver) {
    return {
      readiness: "Game Over",
      readinessTone: "danger",
      reason: "La partita è conclusa. Puoi consultare il punteggio finale o proseguire in endless mode.",
      actionTitle: "Partita conclusa",
      actionText: "Nessuna azione del turno disponibile.",
      currentStep: "end",
      endTurnDisabled: true,
      endTurnReason: "La partita è conclusa.",
    };
  }

  if (state.currentPhase === "distribution") {
    return {
      readiness: "Step 1 attivo",
      readinessTone: "warning",
      reason: `Distribuisci la popolazione per continuare. Scholars ${state.populationAssignments.scholars}/${state.cities.length} max.`,
      actionTitle: "Distribuisci la popolazione",
      actionText: "Completa lo Step 1: assegna i cittadini e poi concludi il turno.",
      currentStep: "distribution",
      endTurnDisabled: false,
      endTurnReason: "",
    };
  }

  if (hasBuildOpportunity) {
    return {
      readiness: "Step 2 opzionale",
      readinessTone: "success",
      reason: "Puoi avviare un progetto oppure chiudere subito il turno.",
      actionTitle: "Puoi avviare un progetto oppure concludere il turno",
      actionText: "Lo Step 2 è opzionale: investi ora oppure passa direttamente allo Step 3.",
      currentStep: "build",
      endTurnDisabled: false,
      endTurnReason: "",
    };
  }

  return {
    readiness: "Step 3 disponibile",
    readinessTone: "success",
    reason: "Nessun blocco attivo: puoi concludere il turno.",
    actionTitle: "Concludi il turno",
    actionText: "Hai già tutte le informazioni necessarie per decidere il prossimo ciclo.",
    currentStep: "end",
    endTurnDisabled: false,
    endTurnReason: "",
  };
}

function setWorkflowStepState(activeStep) {
  const stepMap = [
    { element: elements.workflowStepDistribution, key: "distribution" },
    { element: elements.workflowStepBuild, key: "build" },
    { element: elements.workflowStepEnd, key: "end" },
  ];

  const activeIndex = stepMap.findIndex((step) => step.key === activeStep);
  stepMap.forEach((step, index) => {
    step.element.classList.remove("is-active", "is-complete");
    if (index < activeIndex) {
      step.element.classList.add("is-complete");
    } else if (index === activeIndex) {
      step.element.classList.add("is-active");
    }
  });
}

function createDistributionRow(role, amount, isActiveDistribution, state) {
  const row = document.createElement("div");
  row.className = "distribution-row";

  const labelWrap = document.createElement("div");

  const label = document.createElement("div");
  label.className = "distribution-label";
  label.textContent = role;
  label.title = SPECIALIST_TOOLTIPS[role] || "";

  const meta = document.createElement("div");
  meta.className = "distribution-meta";
  meta.textContent = role === "scholars" ? `max ${state.cities.length}` : "";

  labelWrap.append(label, meta);

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

  row.append(labelWrap, minusButton, amountValue, plusButton);
  return row;
}

function renderDistributionControls(state) {
  elements.populationDistributionControls.innerHTML = "";
  const isActiveDistribution = state.currentPhase === "distribution";

  POPULATION_ROLES.forEach((role) => {
    const amount = state.populationAssignments[role] || 0;
    elements.populationDistributionControls.appendChild(
      createDistributionRow(role, amount, isActiveDistribution, state)
    );
  });

  elements.distributionStatus.textContent = isActiveDistribution
    ? `Distribuisci ora la popolazione. Scholars ${state.populationAssignments.scholars}/${state.cities.length} max.`
    : "Questa sezione si attiva quando il turno entra nella fase Distribution.";

  elements.populationAssignmentSummary.textContent = POPULATION_ROLES
    .map((role) => `${role[0].toUpperCase()}${role.slice(1)} ${state.populationAssignments[role] || 0}`)
    .join(" · ");
}

function renderLeaders(state) {
  const leaderValues = state.leaders.map(
    (leader) => `${leader.name} — ${leader.description} [${leader.uniqueId}]`
  );
  renderList(elements.leadersList, leaderValues, "No leaders");
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
  elements.wonderControls.style.display = projectType === "wonder" ? "grid" : "none";

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
        : "All cities";

    elements.buildCurrentProject.textContent = `${formatProjectSummary(project)} (${project.type})`;
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

function renderEventLog(state) {
  elements.eventLogList.innerHTML = "";
  const allEntries = [...state.gameLog];

  if (allEntries.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nessun evento";
    elements.eventLogList.appendChild(li);
    if (elements.toggleLogButton) {
      elements.toggleLogButton.hidden = true;
    }
    return;
  }

  const logValues = showFullLog ? allEntries : allEntries.slice(-DEFAULT_VISIBLE_LOG_ENTRIES);
  if (elements.toggleLogButton) {
    elements.toggleLogButton.hidden = allEntries.length <= DEFAULT_VISIBLE_LOG_ENTRIES;
    elements.toggleLogButton.textContent = showFullLog ? "Mostra meno" : "Vedi tutto";
  }

  logValues.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = entry;

    if (index === logValues.length - 1) {
      li.classList.add("log-latest-entry");
    }

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

function renderGame(state) {
  const economyPreview = getEconomyPreview(state);
  const researchBreakdown = getResearchRollBreakdown(state);
  const currentPhaseLabel = getPhaseLabel(state.currentPhase);
  const turnUx = getTurnUxState(state);
  const lastWarText = state.lastWarSummary
    ? `${state.lastWarSummary.name} — enemy ${state.lastWarSummary.enemyArmies}, seg ${state.lastWarSummary.maxSegments}, ${state.lastWarSummary.result}`
    : "Nessuna";
  const lastDisasterText = state.lastDisaster
    ? `${state.lastDisaster.name} (d20: ${state.lastDisaster.roll})`
    : "Nessuno";

  elements.turnValue.textContent = String(state.turn);
  elements.maxTurnsValue.textContent = String(state.maxTurns);
  elements.cultureValue.textContent = state.culture.name;
  elements.phaseValue.textContent = currentPhaseLabel;
  elements.headerPhaseChip.textContent = currentPhaseLabel;
  elements.lastDisasterValue.textContent = lastDisasterText;
  elements.lastWarValue.textContent = lastWarText;

  elements.summaryCities.textContent = String(state.cities.length);
  elements.summaryWonders.textContent = String(state.wonders.length);
  elements.summaryAdvances.textContent = String(state.advances.length);
  elements.summaryLeaders.textContent = String(state.leaders.length);

  elements.disasterStatusBadge.textContent = state.lastDisaster ? state.lastDisaster.name : "No disaster";
  elements.warPeaceValue.textContent = state.pendingWar ? "War" : "Peace";
  elements.warStatusBadge.textContent = state.pendingWar ? "In progress" : "Peace";

  updateStatusAppearance(elements.headerPhaseChip, state.currentPhase === "distribution" ? "warning" : "success");
  updateStatusAppearance(elements.warStatusBadge, state.pendingWar ? "danger" : "success");
  updateStatusAppearance(elements.disasterStatusBadge, state.lastDisaster ? "warning" : "success");

  elements.foodValue.textContent = String(state.food);
  elements.goldValue.textContent = String(state.gold);
  elements.populationTotalResourceValue.textContent = String(state.populationTotal);
  elements.cityCountResourceValue.textContent = String(state.cities.length);
  elements.foodProductionPreview.textContent = String(economyPreview.foodProduction);
  elements.foodUpkeepPreview.textContent = String(economyPreview.foodUpkeep);
  elements.goldUpkeepPreview.textContent = String(economyPreview.armyGoldUpkeep);
  elements.goldProductionPreview.textContent = formatTradeTotalRange(economyPreview.tradeGoldRange);
  elements.researchTotalPreview.textContent = String(researchBreakdown.totalRolls);
  elements.netTurnPreview.textContent =
    `${economyPreview.foodProduction - economyPreview.foodUpkeep} food / ${formatNetRange(
      economyPreview.tradeGoldRange,
      economyPreview.armyGoldUpkeep
    )} gold`;

  elements.populationTotalValue.textContent = String(state.populationTotal);
  elements.scholarsCapValue.textContent = String(state.cities.length);
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
  renderEventLog(state);

  elements.readinessBadge.textContent = turnUx.readiness;
  elements.turnReasonText.textContent = turnUx.reason;
  elements.recommendedActionTitle.textContent = turnUx.actionTitle;
  elements.turnHelpText.textContent = turnUx.actionText;
  updateStatusAppearance(elements.readinessBadge, turnUx.readinessTone);
  setWorkflowStepState(turnUx.currentStep);

  elements.endTurnButton.textContent = "Concludi turno";
  elements.endTurnButton.disabled = turnUx.endTurnDisabled;
  elements.buildSkippedBadge.textContent = state.skipBuildPhase ? "Build saltata" : "Build opzionale";
  updateStatusAppearance(elements.buildSkippedBadge, state.skipBuildPhase ? "warning" : "success");
  elements.projectPhaseBadge.textContent = state.currentProject ? "In progress" : "Optional";

  if (turnUx.endTurnDisabled && turnUx.endTurnReason) {
    elements.turnReasonText.textContent = turnUx.endTurnReason;
  }

  if (state.gameOver) {
    const score = state.scoreEnabled === false ? null : (state.finalScore || calculateFinalScore(state));
    elements.finalScorePanel.hidden = false;
    elements.finalScoreDetails.hidden = !score;
    elements.endlessModeMessage.hidden = Boolean(score);
    elements.continueAfterEndButton.hidden = state.endlessMode;

    if (score) {
      elements.finalAdvancePoints.textContent = String(score.advancePoints);
      elements.finalCityPoints.textContent = String(score.cityPoints);
      elements.finalWonderPoints.textContent = String(score.wonderPoints);
      elements.finalTotalScore.textContent = String(score.total);
    }
  } else {
    elements.finalScorePanel.hidden = true;
  }

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
  elements.buildStatusMessage.textContent = result.ok ? "City project started." : result.reason;
  renderGame(gameState);
});

elements.startWonderProjectButton.addEventListener("click", () => {
  const wonderId = elements.wonderSelect.value;
  const cityId = elements.wonderCitySelect.value;
  const result = createWonderProject(gameState, wonderId, cityId);
  elements.buildStatusMessage.textContent = result.ok ? "Wonder project started." : result.reason;
  renderGame(gameState);
});

elements.continueAfterEndButton.addEventListener("click", () => {
  continueAfterEnd(gameState);
  renderGame(gameState);
});

elements.surrenderIfWarCheckbox.addEventListener("change", () => {
  gameState.surrenderIfWar = elements.surrenderIfWarCheckbox.checked;
  renderGame(gameState);
});

if (elements.toggleLogButton) {
  elements.toggleLogButton.addEventListener("click", () => {
    showFullLog = !showFullLog;
    renderEventLog(gameState);
  });
}

renderGame(gameState);
window.renderGame = renderGame;
})();
