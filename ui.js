import { ADVANCES } from "./gameData.js";
import { createInitialGameState, nextTurn } from "./gameLogic.js";

const gameState = createInitialGameState();

const elements = {
  turnValue: document.getElementById("turn-value"),
  maxTurnsValue: document.getElementById("max-turns-value"),
  cultureValue: document.getElementById("culture-value"),
  startingAdvanceValue: document.getElementById("starting-advance-value"),
  gameOverValue: document.getElementById("game-over-value"),
  projectValue: document.getElementById("project-value"),
  foodValue: document.getElementById("food-value"),
  goldValue: document.getElementById("gold-value"),
  populationTotalValue: document.getElementById("population-total-value"),
  populationAssignmentsList: document.getElementById("population-assignments-list"),
  cityCountValue: document.getElementById("city-count-value"),
  citiesList: document.getElementById("cities-list"),
  wondersList: document.getElementById("wonders-list"),
  advancesList: document.getElementById("advances-list"),
  leadersList: document.getElementById("leaders-list"),
  eventLogList: document.getElementById("event-log-list"),
  endTurnButton: document.getElementById("end-turn-button"),
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

export function renderGame(state) {
  elements.turnValue.textContent = String(state.turn);
  elements.maxTurnsValue.textContent = String(state.maxTurns);
  elements.cultureValue.textContent = state.culture.name;
  elements.startingAdvanceValue.textContent = state.startingAdvanceId
    ? getAdvanceNameById(state.startingAdvanceId)
    : "Nessuno";
  elements.gameOverValue.textContent = state.gameOver ? "Sì" : "No";
  elements.projectValue.textContent = state.currentProject || "Nessuno";

  elements.foodValue.textContent = String(state.food);
  elements.goldValue.textContent = String(state.gold);

  elements.populationTotalValue.textContent = String(state.populationTotal);
  const assignments = Object.entries(state.populationAssignments).map(
    ([role, amount]) => `${role}: ${amount}`
  );
  renderList(elements.populationAssignmentsList, assignments, "Nessuna assegnazione");

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
  renderList(elements.leadersList, state.leaders, "Nessun leader");

  // Log in ordine inverso: eventi più recenti in alto.
  renderList(elements.eventLogList, [...state.gameLog].reverse(), "Nessun evento");

  elements.endTurnButton.disabled = state.gameOver;
}

elements.endTurnButton.addEventListener("click", () => {
  nextTurn(gameState);
  renderGame(gameState);
});

renderGame(gameState);
