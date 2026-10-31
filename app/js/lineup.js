import { loadCards, cardImageUrl, escapeHtml } from "./cards.js";
import { loadState, updateState } from "./storage.js";
import { initSharedUI } from "./ui.js";

const FORMATION = [
  { id: "lw", label: "LW", group: "attack" },
  { id: "st", label: "ST", group: "attack" },
  { id: "rw", label: "RW", group: "attack" },
  { id: "lcm", label: "LCM", group: "midfield" },
  { id: "cm", label: "CM", group: "midfield" },
  { id: "rcm", label: "RCM", group: "midfield" },
  { id: "lb", label: "LB", group: "defence" },
  { id: "lcb", label: "CB", group: "defence" },
  { id: "rcb", label: "CB", group: "defence" },
  { id: "rb", label: "RB", group: "defence" },
  { id: "gk", label: "GK", group: "keeper" },
];

const ROWS = ["attack", "midfield", "defence", "keeper"];
const SLOT_COUNT = FORMATION.length;

const CLOSE = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>`;

const root = document.querySelector("[data-lineup-root]");

const app = {
  cards: [],
  ownedIds: new Set(),
  state: null,
  picker: null,
  activeSlot: null,
};

initSharedUI();
boot();

async function boot() {
  renderLoading();

  try {
    app.cards = await loadCards();
    app.state = loadState();
    app.ownedIds = new Set(app.state.ownedCardIds);
    cleanLineup();
    renderLineup();
  } catch (error) {
    console.error("Lineup could not start.", error);
    renderError();
  }
}

function normalizeLineup(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const lineup = {};
  const seen = new Set();

  FORMATION.forEach((slot) => {
    const cardId = raw[slot.id];
    if (Number.isInteger(cardId) && !seen.has(cardId)) {
      seen.add(cardId);
      lineup[slot.id] = cardId;
    }
  });

  return lineup;
}

function cleanLineup() {
  const normalized = normalizeLineup(app.state.lineup);
  const cleaned = {};
  const seen = new Set();

  FORMATION.forEach((slot) => {
    const cardId = normalized[slot.id];
    if (!Number.isInteger(cardId) || seen.has(cardId)) return;
    if (!app.ownedIds.has(cardId)) return;

    cleaned[slot.id] = cardId;
    seen.add(cardId);
  });

  if (JSON.stringify(cleaned) === JSON.stringify(normalized)) {
    app.state.lineup = cleaned;
    return;
  }

  app.state = updateState((state) => {
    state.lineup = cleaned;
    return state;
  });
}

function renderLineup() {
  root.removeAttribute("aria-busy");

  const cardById = new Map(app.cards.map((card) => [card.id, card]));
  const lineup = app.state.lineup;
  const selected = FORMATION.map((slot) =>
    cardById.get(lineup[slot.id])
  ).filter(Boolean);
  const filled = selected.length;
  const rating =
    filled > 0
      ? selected.reduce((total, card) => total + card.rating, 0) / filled
      : null;
  const percent = Math.round((filled / SLOT_COUNT) * 100);
  const ownedCount = app.ownedIds.size;

  const rows = ROWS.map((group) => {
    const slots = FORMATION.filter((slot) => slot.group === group)
      .map((slot) => renderSlot(slot, cardById))
      .join("");

    return `
      <div class="pitch__row pitch__row--${group}">
        ${slots}
      </div>
    `;
  }).join("");

  root.innerHTML = `
    <div class="lineup-summary">
      <div class="lineup-summary__stat">
        <span class="lineup-summary__value" data-team-rating>
          ${rating === null ? "—" : rating.toFixed(1)}
        </span>
        <span class="lineup-summary__label">Team rating</span>
      </div>

      <div class="lineup-summary__progress">
        <div
          class="collection-meter"
          role="img"
          aria-label="${filled} of ${SLOT_COUNT} slots filled"
        >
          <span class="collection-meter__fill" style="width: ${percent}%"></span>
        </div>
        <p class="lineup-summary__hint">
          ${filled} of ${SLOT_COUNT} slots filled${
            filled === SLOT_COUNT ? " · your XI is complete" : ""
          }
        </p>
      </div>

      <button
        class="btn btn--ghost lineup-summary__clear"
        type="button"
        data-clear-lineup
        ${filled === 0 ? "disabled" : ""}
      >
        Clear XI
      </button>
    </div>

    <div class="pitch">
      ${rows}
    </div>

    <div class="lineup-footer">
      <p class="lineup-footer__hint">
        ${
          ownedCount < SLOT_COUNT
            ? `You own ${ownedCount} of the ${SLOT_COUNT} cards needed to fill the XI. <a href="./store.html">Open a pack</a> to add more.`
            : "Tap any slot to change the card in it. The rating is the average of the cards you pick."
        }
      </p>
      <a class="lineup-footer__link" href="./collection.html">View collection</a>
    </div>
  `;

  root.querySelectorAll("[data-slot]").forEach((button) => {
    button.addEventListener("click", () => openPicker(button.dataset.slot));
  });

  root
    .querySelector("[data-clear-lineup]")
    ?.addEventListener("click", clearLineup);
}

function renderSlot(slot, cardById) {
  const card = cardById.get(app.state.lineup[slot.id]);

  if (!card) {
    return `
      <button
        class="pitch-slot is-empty"
        type="button"
        data-slot="${slot.id}"
        aria-label="${slot.label} slot: empty. Choose a card."
      >
        <span class="pitch-slot__position">${slot.label}</span>
        <span class="pitch-slot__plus" aria-hidden="true">+</span>
        <span class="pitch-slot__empty-label">Add</span>
      </button>
    `;
  }

  const isUnique = card.type === "unique";

  return `
    <button
      class="pitch-slot is-filled ${isUnique ? "is-unique" : ""}"
      type="button"
      data-slot="${slot.id}"
      aria-label="${slot.label} slot: ${escapeHtml(card.name)}, rated ${
        card.rating
      }. Change card."
    >
      <img
        class="pitch-slot__image"
        src="${cardImageUrl(card)}"
        alt=""
        width="470"
        height="660"
        loading="lazy"
      />
      <span class="pitch-slot__shade" aria-hidden="true"></span>
      <span class="pitch-slot__position">${slot.label}</span>
      <span class="pitch-slot__rating">${card.rating}</span>
      <span class="pitch-slot__name">${escapeHtml(card.name)}</span>
    </button>
  `;
}

function ensurePicker() {
  if (app.picker) return app.picker;

  const dialog = document.createElement("dialog");
  dialog.className = "card-picker";
  dialog.setAttribute("aria-labelledby", "picker-title");
  dialog.innerHTML = `
    <div class="card-picker__inner">
      <header class="card-picker__head">
        <div>
          <p class="eyebrow">
            <span class="eyebrow__dot" aria-hidden="true"></span>
            Slot
            <span class="eyebrow__separator" aria-hidden="true">/</span>
            <span data-picker-slot>LW</span>
          </p>
          <h2 class="card-picker__title" id="picker-title" data-picker-title>
            Choose a card
          </h2>
        </div>
        <button
          class="card-picker__close"
          type="button"
          data-picker-close
          aria-label="Close card picker"
        >
          ${CLOSE}
        </button>
      </header>

      <div class="card-picker__body" data-picker-body></div>

      <footer class="card-picker__footer">
        <button
          class="btn btn--ghost btn--wide"
          type="button"
          data-picker-remove
        >
          Remove from this slot
        </button>
      </footer>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector("[data-picker-close]")?.addEventListener("click", () => {
    dialog.close();
  });

  dialog.querySelector("[data-picker-remove]")?.addEventListener("click", () => {
    if (!app.activeSlot) return;
    const slot = app.activeSlot;
    dialog.close();
    clearSlot(slot);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  app.picker = dialog;
  return dialog;
}

function openPicker(slotId) {
  const slot = FORMATION.find((item) => item.id === slotId);
  if (!slot) return;

  app.activeSlot = slotId;

  const dialog = ensurePicker();
  const currentId = app.state.lineup[slotId];
  const usedIds = new Set(
    Object.entries(app.state.lineup)
      .filter(([key]) => key !== slotId)
      .map(([, cardId]) => cardId)
  );

  const cards = app.cards
    .filter((card) => app.ownedIds.has(card.id))
    .sort((a, b) => {
      if (a.id === currentId) return -1;
      if (b.id === currentId) return 1;

      const aUsed = usedIds.has(a.id);
      const bUsed = usedIds.has(b.id);
      if (aUsed !== bUsed) return aUsed ? 1 : -1;

      return b.rating - a.rating || a.name.localeCompare(b.name);
    });

  dialog.querySelector("[data-picker-slot]").textContent = slot.label;
  dialog.querySelector(
    "[data-picker-title]"
  ).textContent = `Choose a card for ${slot.label}`;

  const removeButton = dialog.querySelector("[data-picker-remove]");
  if (removeButton) {
    removeButton.disabled = !Number.isInteger(currentId);
    removeButton.hidden = !Number.isInteger(currentId);
  }

  const body = dialog.querySelector("[data-picker-body]");
  body.innerHTML =
    cards.length > 0
      ? cards
          .map((card) =>
            renderPickerCard(card, currentId, usedIds.has(card.id))
          )
          .join("")
      : `
        <div class="card-picker__empty">
          <p>You don't own any cards yet.</p>
          <a class="btn btn--primary btn--wide" href="./store.html">
            <span>Open a pack</span>
          </a>
        </div>
      `;

  body.querySelectorAll("[data-pick-card]").forEach((button) => {
    button.addEventListener("click", () => {
      const cardId = Number(button.dataset.pickCard);
      dialog.close();
      assignCard(slotId, cardId);
    });
  });

  if (!dialog.open) dialog.showModal();
}

function renderPickerCard(card, currentId, isUsed) {
  const isCurrent = card.id === currentId;
  const status = isCurrent ? "Selected" : isUsed ? "In XI" : `#${card.rating}`;
  const classes = [
    "picker-card",
    isCurrent ? "is-current" : "",
    isUsed ? "is-used" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <button
      class="${classes}"
      type="button"
      data-pick-card="${card.id}"
      ${isUsed ? "disabled" : ""}
      aria-label="${escapeHtml(card.name)}, ${escapeHtml(
        card.club
      )}, ${escapeHtml(card.position)}, rated ${card.rating}${
        isCurrent ? ", currently selected" : isUsed ? ", already in the XI" : ""
      }"
    >
      <span class="picker-card__thumb">
        <img
          src="${cardImageUrl(card)}"
          alt=""
          width="470"
          height="660"
          loading="lazy"
        />
      </span>
      <span class="picker-card__info">
        <span class="picker-card__name">${escapeHtml(card.name)}</span>
        <span class="picker-card__meta">
          ${escapeHtml(card.club)} · ${escapeHtml(card.position)}
        </span>
      </span>
      <span class="picker-card__status">${status}</span>
    </button>
  `;
}

function assignCard(slotId, cardId) {
  if (!app.ownedIds.has(cardId)) return;

  app.state = updateState((state) => {
    const lineup = normalizeLineup(state.lineup);

    Object.keys(lineup).forEach((key) => {
      if (lineup[key] === cardId) delete lineup[key];
    });

    lineup[slotId] = cardId;
    state.lineup = lineup;
    return state;
  });

  renderLineup();
}

function clearSlot(slotId) {
  app.state = updateState((state) => {
    const lineup = normalizeLineup(state.lineup);
    delete lineup[slotId];
    state.lineup = lineup;
    return state;
  });

  renderLineup();
}

function clearLineup() {
  const filled = FORMATION.some((slot) =>
    Number.isInteger(app.state.lineup[slot.id])
  );

  if (!filled) return;
  if (!window.confirm("Clear all eleven slots?")) return;

  app.state = updateState((state) => {
    state.lineup = {};
    return state;
  });

  renderLineup();
}

function renderLoading() {
  root.setAttribute("aria-busy", "true");
  root.innerHTML = `
    <div class="stage-card stage-card--loading" role="status">
      <p class="eyebrow">Loading your lineup</p>
      <div class="loading-lights" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <p class="stage-card__text">Checking the cards you own.</p>
    </div>
  `;
}

function renderError() {
  root.removeAttribute("aria-busy");
  root.innerHTML = `
    <div class="stage-card stage-card--error" role="alert">
      <p class="eyebrow">Something went wrong</p>
      <h2 class="stage-card__title">The lineup didn't load.</h2>
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
