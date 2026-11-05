import { loadCards, pickPackCard, welcomeCard } from "./cards.js";
import { loadState, updateState } from "./storage.js";
import { dateKey, humanDate, isThursday } from "./dates.js";
import { initSharedUI, refreshCoinDisplay } from "./ui.js";
import { showReveal } from "./reveal.js";

const DAILY_QUESTION_COUNT = 3;

const weekly = {
  cards: [],
  loading: false,
  error: false,
};

initSharedUI();

const todayLabel = document.querySelector("[data-today-label]");
if (todayLabel) todayLabel.textContent = humanDate();

renderDailyPanel(loadState());
bootWeekly();

async function bootWeekly() {
  document
    .querySelector("[data-weekly-claim]")
    ?.addEventListener("click", claimWeeklyPack);

  renderWeeklyPanel(loadState());

  try {
    weekly.cards = await loadCards();
    maybeGrantWelcomeCard();
  } catch (error) {
    console.error("The weekly pack could not load the card pool.", error);
    weekly.error = true;
  }

  renderWeeklyPanel(loadState());
}

function maybeGrantWelcomeCard() {
  const before = loadState();
  if (before.welcomeCardClaimed) return;

  const card = welcomeCard(weekly.cards);
  if (!card) return;

  const wasOwned = before.ownedCardIds.includes(card.id);
  let granted = false;

  updateState((state) => {
    if (state.welcomeCardClaimed) return state;

    state.welcomeCardClaimed = true;
    if (!state.ownedCardIds.includes(card.id)) {
      state.ownedCardIds.push(card.id);
    }
    granted = true;
    return state;
  });

  if (!granted) return;

  refreshCoinDisplay();

  showReveal({
    card,
    isNew: !wasOwned,
    sourceLabel: "Welcome card",
    actions: [
      {
        label: "View collection",
        kind: "primary",
        arrow: true,
        href: "./collection.html",
      },
      { label: "Build your XI", kind: "ghost", href: "./lineup.html" },
    ],
    hint: "A one-time welcome card, saved to your collection.",
  });
}

function renderWeeklyPanel(state, now = new Date()) {
  const panel = document.querySelector("[data-weekly-card]");
  if (!panel) return;

  const claimed = state.lastWeeklyPackDate === dateKey(now);
  const thursday = isThursday(now);
  const hasCards = weekly.cards.length > 0;
  const canClaim = thursday && !claimed && hasCards && !weekly.loading;

  panel.dataset.state = claimed ? "claimed" : thursday ? "ready" : "locked";

  const button = panel.querySelector("[data-weekly-claim]");
  const label = panel.querySelector("[data-weekly-label]");
  const status = panel.querySelector("[data-weekly-status]");
  const badge = panel.querySelector("[data-weekly-badge]");

  if (button) {
    button.disabled = !canClaim;
    button.setAttribute("aria-busy", weekly.loading ? "true" : "false");
  }

  if (label) {
    label.textContent = weekly.loading
      ? "Opening your pack..."
      : claimed
        ? "Claimed this Thursday"
        : thursday
          ? hasCards
            ? "Claim free pack"
            : "Loading cards..."
          : "Free pack on Thursday";
  }

  if (status) {
    status.textContent = weekly.error
      ? "The card pool did not load. Refresh the page to try again."
      : claimed
        ? "You already claimed this week's free card. It resets next Thursday."
        : thursday
          ? "It's Thursday. Claim one free card for your collection."
          : "One free card every Thursday. Check back then.";
  }

  if (badge) badge.textContent = claimed ? "✓" : "THU";
}

function claimWeeklyPack() {
  if (weekly.loading || weekly.cards.length === 0) return;

  const before = loadState();
  const today = dateKey();

  if (!isThursday() || before.lastWeeklyPackDate === today) {
    renderWeeklyPanel(before);
    return;
  }

  const card = pickPackCard(weekly.cards, new Set(before.ownedCardIds));
  if (!card) return;

  const wasOwned = before.ownedCardIds.includes(card.id);

  weekly.loading = true;
  renderWeeklyPanel(before);

  const next = updateState((state) => {
    if (!isThursday() || state.lastWeeklyPackDate === today) return state;

    state.lastWeeklyPackDate = today;
    if (!state.ownedCardIds.includes(card.id)) {
      state.ownedCardIds.push(card.id);
    }

    return state;
  });

  weekly.loading = false;

  if (next.lastWeeklyPackDate !== today) {
    renderWeeklyPanel(next);
    return;
  }

  refreshCoinDisplay();
  renderWeeklyPanel(next);

  showReveal({
    card,
    isNew: !wasOwned,
    sourceLabel: "Free pack",
    returnFocus: () => document.querySelector("[data-weekly-claim]"),
    actions: [
      {
        label: "View collection",
        kind: "primary",
        arrow: true,
        href: "./collection.html",
      },
      { label: "Build your XI", kind: "ghost", href: "./lineup.html" },
    ],
    hint: "Your free pack resets next Thursday.",
  });
}

function renderDailyPanel(state) {
  const panel = document.querySelector("[data-daily-card]");
  if (!panel) return;

  const progress = state.trivia.date === dateKey() ? state.trivia : null;
  const answered = progress
    ? Math.min(progress.answers.length, DAILY_QUESTION_COUNT)
    : 0;
  const completed =
    Boolean(progress?.completed) || answered >= DAILY_QUESTION_COUNT;
  const correct = progress
    ? progress.answers.filter((answer) => answer.correct).length
    : 0;
  const earned = correct * 150;

  panel.dataset.state = completed
    ? "complete"
    : answered > 0
      ? "in-progress"
      : "ready";

  const answeredLabel = panel.querySelector("[data-home-answered]");
  if (answeredLabel) answeredLabel.textContent = String(answered);

  const pips = panel.querySelector("[data-pips]");
  if (pips) {
    pips.innerHTML = Array.from(
      { length: DAILY_QUESTION_COUNT },
      (_, index) => {
        const stateClass =
          index < answered
            ? "is-done"
            : index === answered && !completed
              ? "is-current"
              : "";
        return `<span class="floodlight ${stateClass}"></span>`;
      }
    ).join("");
    pips.setAttribute("aria-label", `${answered} of 3 answered`);
  }

  const message = panel.querySelector("[data-daily-message]");
  const cta = panel.querySelector("[data-daily-cta]");
  const ctaLabel = panel.querySelector("[data-cta-label]");

  if (completed) {
    if (message) {
      message.textContent =
        earned > 0
          ? `Set complete. You banked ${earned} coins today.`
          : "Set complete. No coins today, but the next set is close.";
    }
    if (ctaLabel) ctaLabel.textContent = "Review today's set";
  } else if (answered > 0) {
    if (message) {
      message.textContent = `${answered} of 3 answered. Finish the set to bank the rest.`;
    }
    if (ctaLabel) ctaLabel.textContent = "Continue trivia";
  } else {
    if (message) {
      message.textContent =
        "Three questions. 150 coins for each correct answer.";
    }
    if (ctaLabel) ctaLabel.textContent = "Start today's trivia";
  }

  if (cta) {
    cta.href = "./trivia.html";
    cta.dataset.state = panel.dataset.state;
  }
}
