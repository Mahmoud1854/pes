import { loadCards, pickPackCard, escapeHtml } from "./cards.js";
import { loadPackages } from "./packages.js";
import { loadState, updateState } from "./storage.js";
import { initSharedUI, refreshCoinDisplay } from "./ui.js";
import { showReveal, closeReveal } from "./reveal.js";

const DEV_COIN_AMOUNT = 1000;
const ARROW = `<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const COIN = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f0c75e"></circle><circle cx="12" cy="12" r="7" fill="none" stroke="#9a6406" stroke-width="1.5"></circle></svg>`;

const root = document.querySelector("[data-store-root]");

const app = {
  cards: [],
  packages: [],
  opening: false,
};

initSharedUI();
setupDevTools();
boot();

async function boot() {
  renderLoading();

  try {
    [app.cards, app.packages] = await Promise.all([
      loadCards(),
      loadPackages(),
    ]);
    renderStore();
  } catch (error) {
    console.error("Store could not start.", error);
    renderError();
  }
}

function packageMark(pack) {
  if (pack.id === "real_madrid") return "RM";
  if (pack.id === "barcelona") return "BAR";
  return pack.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function packageLabel(pack) {
  if (pack.id === "real_madrid") return "Madrid pack";
  if (pack.id === "barcelona") return "Barcelona pack";
  return pack.name;
}

function renderStore() {
  root.removeAttribute("aria-busy");

  const state = loadState();
  const randomPacks = app.packages.filter((pack) => pack.kind === "random");

  root.innerHTML = `
    <div class="package-grid">
      ${randomPacks.map((pack) => renderRandomPackage(pack, state)).join("")}
    </div>
  `;

  root.querySelectorAll("[data-open-pack]").forEach((button) => {
    button.addEventListener("click", () =>
      openPack(button.dataset.openPack)
    );
  });
}

function renderRandomPackage(pack, state) {
  const canAfford = state.coins >= pack.price;
  const shortfall = pack.price - state.coins;
  const isCollege = pack.id === "college_1";
  const mark = isCollege ? "FF" : packageMark(pack);
  const label = isCollege ? "Friends pack" : packageLabel(pack);

  const pool =
    pack.cardIds && pack.cardIds.length > 0
      ? app.cards.filter((card) => pack.cardIds.includes(card.id))
      : app.cards;
  const hasUnowned = pool.some(
    (card) => !state.ownedCardIds.includes(card.id)
  );

  return `
    <article class="store-panel package-card" data-package="${escapeHtml(pack.id)}">
      <div class="pack-visual" aria-hidden="true">
        <div class="card-back pack-visual__card">
          <span class="card-back__ring"></span>
          <span class="card-back__mark">${escapeHtml(mark)}</span>
          <span class="card-back__label">${escapeHtml(label)}</span>
        </div>
      </div>
      <div class="store-panel__body">
        <div class="store-meta">
          <span class="store-meta__label">${escapeHtml(pack.name)}</span>
          <span class="store-meta__cost">${COIN}${pack.price}</span>
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
        <button class="btn btn--primary btn--wide" type="button" data-open-pack="${escapeHtml(pack.id)}" ${canAfford && hasUnowned ? "" : "disabled"}>
          <span>Open pack · ${pack.price} coins</span>
          ${ARROW}
        </button>
        <p class="store-panel__hint">
          ${
            canAfford && hasUnowned
              ? "Ready when you are."
              : `You need ${
                  !canAfford
                    ? `${shortfall} more coins.`
                    : "You have all cards from this pack. "
                }<a href="./trivia.html">Answer today's three</a> to earn some.`
          }
        </p>
      </div>
    </article>
  `;
}

function renderBundlePackage(pack, state) {
  const owned = state.openedPackages.includes(pack.id);
  const ready =
    pack.cardIds.length > 0 && Number.isInteger(pack.managerId);
  const canAfford = state.coins >= pack.price;
  const shortfall = pack.price - state.coins;

  const label = owned
    ? "Owned"
    : ready
      ? `Buy · ${pack.price} coins`
      : "Contents coming soon";

  const hint = owned
    ? "You already own this one-time package."
    : !ready
      ? "The card list for this package has not been added yet."
      : canAfford
        ? "Get every player in this club bundle plus its manager in one go."
        : `You need ${shortfall} more coins. <a href="./trivia.html">Answer today's three</a> to earn some.`;

  const button = owned
    ? `<button class="btn btn--ghost btn--wide" type="button" disabled>
        <span>Owned</span>
      </button>`
    : ready
      ? `<button class="btn btn--primary btn--wide" type="button" data-buy-bundle="${escapeHtml(
          pack.id
        )}" ${canAfford ? "" : "disabled"}>
          <span>${label}</span>
          ${ARROW}
        </button>`
      : `<button class="btn btn--ghost btn--wide" type="button" disabled>
          <span>${label}</span>
        </button>`;

  return `
    <article class="store-panel package-card package-card--bundle ${
      owned ? "is-owned" : ""
    }" data-package="${escapeHtml(pack.id)}">
      <div class="pack-visual" aria-hidden="true">
        <div class="card-back pack-visual__card">
          <span class="card-back__ring"></span>
          <span class="card-back__mark">${packageMark(pack)}</span>
          <span class="card-back__label">${escapeHtml(packageLabel(pack))}</span>
        </div>
      </div>
      <div class="store-panel__body">
        <div class="store-meta">
          <span class="store-meta__label">${escapeHtml(pack.name)}</span>
          <span class="store-meta__cost">${COIN}${pack.price}</span>
        </div>
        <ul class="package-facts">
          <li><span>Type</span><strong>Fixed bundle</strong></li>
          <li><span>Manager</span><strong>Included</strong></li>
          <li><span>Limit</span><strong>Once per player</strong></li>
        </ul>
        <p class="store-panel__text">
          Get every player in this club bundle plus its manager in one go.
        </p>
        ${button}
        <p class="store-panel__hint">${hint}</p>
      </div>
    </article>
  `;
}

function openBundle(packageId) {
  if (app.opening || app.cards.length === 0) return;

  const pack = app.packages.find(
    (item) => item.id === packageId && item.kind === "bundle"
  );
  if (!pack) return;
  if (!Number.isInteger(pack.managerId) || pack.cardIds.length === 0) return;

  const current = loadState();
  if (current.openedPackages.includes(pack.id)) return;
  if (current.coins < pack.price) {
    renderStore();
    return;
  }

  const players = pack.cardIds
    .map((cardId) => app.cards.find((card) => card.id === cardId))
    .filter(Boolean);
  const manager = app.cards.find(
    (card) => card.id === pack.managerId && card.type === "manager"
  );

  if (players.length !== pack.cardIds.length || !manager) return;

  const bundleCards = [...players, manager];
  const missing = bundleCards.filter(
    (card) => !current.ownedCardIds.includes(card.id)
  );
  const received = missing.length > 0 ? missing : bundleCards;
  const newIds = new Set(missing.map((card) => card.id));

  app.opening = true;

  let changed = false;
  updateState((state) => {
    if (
      state.coins < pack.price ||
      state.openedPackages.includes(pack.id)
    ) {
      return state;
    }

    state.coins -= pack.price;
    received.forEach((card) => {
      if (!state.ownedCardIds.includes(card.id)) {
        state.ownedCardIds.push(card.id);
      }
    });
    state.openedPackages.push(pack.id);
    changed = true;
    return state;
  });

  if (!changed) {
    app.opening = false;
    renderStore();
    return;
  }

  refreshCoinDisplay({ bump: true });
  renderStore();

  showBundleReveal({
    title: pack.name,
    cards: received,
    newIds,
    returnFocus: () =>
      root.querySelector(`[data-buy-bundle="${pack.id}"]`),
    onClose: () => {
      app.opening = false;
      renderStore();
    },
    actions: [
      {
        label: "View collection",
        kind: "primary",
        arrow: true,
        href: "./collection.html",
      },
      { label: "Build your XI", kind: "ghost", href: "./lineup.html" },
    ],
    hint: "This one-time package is now marked as owned.",
  });
}

function openPack(packageId) {
  if (app.opening || app.cards.length === 0) return;

  const pack = app.packages.find(
    (item) => item.id === packageId && item.kind === "random"
  );
  if (!pack) return;

  const cost = pack.price;
  const current = loadState();
  if (current.coins < cost) {
    renderStore();
    return;
  }

  const pool =
    pack.cardIds && pack.cardIds.length > 0
      ? app.cards.filter((card) => pack.cardIds.includes(card.id))
      : app.cards;
  const unowned = pool.filter(
    (card) => !current.ownedCardIds.includes(card.id)
  );
  if (unowned.length === 0) {
    renderStore();
    return;
  }

  const card = pickPackCard(
    pool,
    new Set(current.ownedCardIds)
  );
  if (!card) return;

  const wasOwned = current.ownedCardIds.includes(card.id);
  app.opening = true;

  const next = updateState((state) => {
    if (state.coins < cost) return state;
    state.coins -= cost;
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

  const canOpenAgain = next.coins >= cost;
  const shortfall = Math.max(0, cost - next.coins);

  showReveal({
    card,
    isNew: !wasOwned,
    returnFocus: () => root.querySelector(`[data-open-pack="${pack.id}"]`),
    onClose: () => {
      app.opening = false;
      renderStore();
    },
    actions: [
      {
        label: `Open another · ${cost} coins`,
        kind: "primary",
        arrow: true,
        disabled: !canOpenAgain,
        onClick: () => {
          closeReveal();
          window.setTimeout(() => openPack(pack.id), 80);
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
