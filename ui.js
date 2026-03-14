import { ADVANCES } from "./gameData.js";
import {
  applyPopulationChange,
  createInitialGameState,
  getEconomyPreview,
  nextTurn,
} from "./gameLogic.js";

const POPULATION_ROLES = ["army", "agriculture", "trade", "labor", "scholars"];

const gameState = createInitialGameState();

const elements = {
  turnValue: document.getElementById("turn-value"),
  maxTurnsValue: document.getElementById("max-turns-value"),
  cultureValue: document.getElementById("culture-value"),
  startingAdvanceValue: document.getElementById("starting-advance-value"),
  phaseValue: document.getElementById("phase-value"),
  gameOverValue: document.getElementById("game-over-value"),
  projectValue: document.getElementById("project-value"),
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
};

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
  const advance = ADVANCES.find((item) => item.id === advanceId);
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

function createDistributionRow(role, amount, isActiveDistribution) {
  const row = document.createElement("div");
  row.className = "distribution-row";

  const label = document.createElement("span");
  label.className = "distribution-label";
  label.textContent = role;

  const minusButton = document.createElement("button");
  minusButton.type = "button";
  minusButton.textContent = "-";
  minusButton.disabled = !isActiveDistribution;
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
  plusButton.disabled = !isActiveDistribution;
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
    const row = createDistributionRow(role, amount, isActiveDistribution);
    elements.populationDistributionControls.appendChild(row);
  });

  if (isActiveDistribution) {
    elements.distributionStatus.textContent =
      "Redistribuisci la popolazione (variazione max ±6 per categoria dal turno iniziale).";
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

export function renderGame(state) {
  const economyPreview = getEconomyPreview(state);

  elements.turnValue.textContent = String(state.turn);
  elements.maxTurnsValue.textContent = String(state.maxTurns);
  elements.cultureValue.textContent = state.culture.name;
  elements.startingAdvanceValue.textContent = state.startingAdvanceId
    ? getAdvanceNameById(state.startingAdvanceId)
    : "Nessuno";
  elements.phaseValue.textContent = getPhaseLabel(state.currentPhase);
  elements.gameOverValue.textContent = state.gameOver ? "Sì" : "No";
  elements.projectValue.textContent = state.currentProject || "Nessuno";

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

  elements.populationTotalValue.textContent = String(state.populationTotal);
  const assignments = Object.entries(state.populationAssignments).map(
    ([role, amount]) => `${role}: ${amount}`
  );
  renderList(elements.populationAssignmentsList, assignments, "Nessuna assegnazione");
  renderDistributionControls(state);

  elements.cityCountValue.textContent = String(state.cities.length);
  renderList(
    elements.citiesList,
    state.cities.map((city) => city.name),
    "Nessuna città"
  );

  renderList(elements.wondersList, state.wonders, "Nessun wonder");
  renderList(
    elements.advancesList,
    state.advances.map((advanceId) => getAdvanceNameById(advanceId)),
    "Nessun advance"
  );
  renderLeaders(state);

  // Log in ordine inverso: eventi più recenti in alto.
  renderList(elements.eventLogList, [...state.gameLog].reverse(), "Nessun evento");

  if (state.currentPhase === "distribution") {
    elements.endTurnButton.textContent = "Conferma distribuzione e completa turno";
    elements.turnHelpText.textContent =
      "Distribuisci popolazione, poi conferma per Gain Leader + Harvest + Upkeep + Trade.";
  } else {
    elements.endTurnButton.textContent = "Avvia turno economico";
    elements.turnHelpText.textContent = "Esegue Population Increase e apre la Distribution.";
  }

  elements.endTurnButton.disabled = state.gameOver;
}

elements.endTurnButton.addEventListener("click", () => {
  nextTurn(gameState);
  renderGame(gameState);
});

renderGame(gameState);
