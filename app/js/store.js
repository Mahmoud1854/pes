import { loadCards, pickPackCard } from "./cards.js";
import { loadState, updateState } from "./storage.js";
import { initSharedUI, refreshCoinDisplay } from "./ui.js";
import { showReveal, closeReveal } from "./reveal.js";

const PACK_COST = 90;
const DEV_COIN_AMOUNT = 1000;
const ARROW = `<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const COIN = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f0c75e"></circle><circle cx="12" cy="12" r="7" fill="none" stroke="#9a6406" stroke-width="1.5"></circle></svg>`;

const root = document.querySelector("[data-store-root]");

const app = {
  cards: [],
  opening: false,
};

initSharedUI();
setupDevTools();
boot();

async function boot() {
  renderLoading();

  try {
    app.cards = await loadCards();
    renderStore();
  } catch (error) {
    console.error("Store could not start.", error);
    renderError();
  }
}

function renderStore() {
  root.removeAttribute("aria-busy");

  const state = loadState();
  const canAfford = state.coins >= PACK_COST;
  const shortfall = PACK_COST - state.coins;

  root.innerHTML = `
    <div class="store-panel">
      <div class="pack-visual" aria-hidden="true">
        <div class="card-back pack-visual__card">
          <span class="card-back__ring"></span>
          <span class="card-back__mark">FF</span>
          <span class="card-back__label">Friends pack</span>
        </div>
      </div>
      <div class="store-panel__body">
        <div class="store-meta">
          <span class="store-meta__label">Single card pack</span>
          <span class="store-meta__cost">${COIN}${PACK_COST}</span>
        </div>
        <ul class="store-panel__odds" aria-label="Drop odds">
          <li class="store-odds store-odds--unique">
            <span>Unique card</span>
            <strong>20%</strong>
          </li>
          <li class="store-odds store-odds--basic">
            <span>Basic card</span>
            <strong>80%</strong>
          </li>
        </ul>
        <p class="store-panel__text">
          One card per pack. Duplicates do nothing, but your coins still go down.
        </p>
        <button class="btn btn--primary btn--wide" type="button" data-open-pack ${canAfford ? "" : "disabled"}>
          <span>Open pack · ${PACK_COST} coins</span>
          ${ARROW}
        </button>
        <p class="store-panel__hint">
          ${
            canAfford
              ? "Ready when you are."
              : `You need ${shortfall} more coins. <a href="./trivia.html">Answer today's three</a> to earn some.`
          }
        </p>
      </div>
    </div>
  `;

  root.querySelector("[data-open-pack]")?.addEventListener("click", openPack);
}

function openPack() {
  if (app.opening || app.cards.length === 0) return;

  const current = loadState();
  if (current.coins < PACK_COST) {
    renderStore();
    return;
  }

  const card = pickPackCard(app.cards);
  if (!card) return;

  const wasOwned = current.ownedCardIds.includes(card.id);
  app.opening = true;

  const next = updateState((state) => {
    if (state.coins < PACK_COST) return state;
    state.coins -= PACK_COST;
    if (!state.ownedCardIds.includes(card.id)) {
      state.ownedCardIds.push(card.id);
    }
    return state;
  });

  if (next.coins === current.coins) {
    app.opening = false;
    renderStore();
    return;
  }

  refreshCoinDisplay({ bump: true });
  renderStore();

  const canOpenAgain = next.coins >= PACK_COST;
  const shortfall = Math.max(0, PACK_COST - next.coins);

  showReveal({
    card,
    isNew: !wasOwned,
    returnFocus: () => root.querySelector("[data-open-pack]"),
    onClose: () => {
      app.opening = false;
      renderStore();
    },
    actions: [
      {
        label: `Open another · ${PACK_COST} coins`,
        kind: "primary",
        arrow: true,
        disabled: !canOpenAgain,
        onClick: () => {
          closeReveal();
          window.setTimeout(openPack, 80);
        },
      },
      { label: "View collection", kind: "ghost", href: "./collection.html" },
      { label: "Build your XI", kind: "ghost", href: "./lineup.html" },
    ],
    hint: canOpenAgain
      ? ""
      : `You need ${shortfall} more coins for another pack.`,
  });
}

function setupDevTools() {
  const params = new URLSearchParams(window.location.search);
  const tools = document.querySelector("[data-dev-tools]");
  const button = document.querySelector("[data-dev-coins]");

  if (params.get("dev") !== "1" || !tools || !button) return;

  tools.hidden = false;
  button.addEventListener("click", () => {
    updateState((state) => {
      state.coins += DEV_COIN_AMOUNT;
      return state;
    });
    refreshCoinDisplay({ bump: true });
    renderStore();
  });
}

function renderLoading() {
  root.setAttribute("aria-busy", "true");
  root.innerHTML = `
    <div class="stage-card stage-card--loading" role="status">
      <p class="eyebrow">Loading the store</p>
      <div class="loading-lights" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <p class="stage-card__text">Checking your coins and the card pool.</p>
    </div>
  `;
}

function renderError() {
  root.removeAttribute("aria-busy");
  root.innerHTML = `
    <div class="stage-card stage-card--error" role="alert">
      <p class="eyebrow">Something went wrong</p>
      <h2 class="stage-card__title">The card pool didn't load.</h2>
      <p class="stage-card__text">
        Check that the <code>data</code> and <code>cards</code> folders are published with the site, then refresh the page.
      </p>
      <button class="btn btn--primary btn--wide" type="button" data-retry>
        <span>Try again</span>
      </button>
    </div>
  `;

  root.querySelector("[data-retry]")?.addEventListener("click", () => {
    window.location.reload();
  });
}
