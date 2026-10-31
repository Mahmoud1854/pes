const STORAGE_KEY = "ffc.state.v1";

export function createDefaultState() {
  return {
    version: 1,
    coins: 0,
    ownedCardIds: [],
    lineup: {},
    trivia: {
      date: null,
      questionIds: [],
      answers: [],
      completed: false,
    },
    lastWeeklyPackDate: null,
  };
}

function normalizeState(raw) {
  const fallback = createDefaultState();

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fallback;
  }

  const trivia =
    raw.trivia && typeof raw.trivia === "object" && !Array.isArray(raw.trivia)
      ? raw.trivia
      : {};

  const answers = Array.isArray(trivia.answers)
    ? trivia.answers.filter(
        (answer) =>
          answer &&
          Number.isInteger(answer.questionId) &&
          Number.isInteger(answer.choice) &&
          typeof answer.correct === "boolean"
      )
    : [];

  return {
    ...fallback,
    coins: Number.isFinite(raw.coins)
      ? Math.max(0, Math.floor(raw.coins))
      : fallback.coins,
    ownedCardIds: Array.isArray(raw.ownedCardIds)
      ? [...new Set(raw.ownedCardIds.filter(Number.isInteger))]
      : [],
    lineup:
      raw.lineup && typeof raw.lineup === "object" && !Array.isArray(raw.lineup)
        ? { ...raw.lineup }
        : {},
    trivia: {
      date: typeof trivia.date === "string" ? trivia.date : fallback.trivia.date,
      questionIds: Array.isArray(trivia.questionIds)
        ? trivia.questionIds.filter(Number.isInteger)
        : [],
      answers,
      completed: Boolean(trivia.completed),
    },
    lastWeeklyPackDate:
      typeof raw.lastWeeklyPackDate === "string"
        ? raw.lastWeeklyPackDate
        : fallback.lastWeeklyPackDate,
  };
}

function announce(state) {
  window.dispatchEvent(
    new CustomEvent("ffc:statechange", { detail: state })
  );
}

export function loadState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createDefaultState();
    return normalizeState(JSON.parse(saved));
  } catch (error) {
    console.warn("Could not read saved progress.", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  const next = normalizeState(state);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    announce(next);
    return next;
  } catch (error) {
    console.warn("Could not save progress.", error);
    return next;
  }
}

export function updateState(updater) {
  const current = loadState();
  const result = updater(current);
  const next = result && typeof result === "object" ? result : current;
  return saveState(next);
}

export function resetState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Could not reset progress.", error);
  }
  const fresh = createDefaultState();
  announce(fresh);
  return fresh;
}
