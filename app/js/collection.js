import {
  loadCards,
  cardImageUrl,
  escapeHtml,
  playerCards,
  managerCards,
} from "./cards.js";
import { loadState } from "./storage.js";
import { initSharedUI } from "./ui.js";

const LOCK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><rect x="5" y="10" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect></svg>`;

const root = document.querySelector("[data-collection-root]");

const app = {
  cards: [],
  owned: new Set(),
};

initSharedUI();
boot();

async function boot() {
  renderLoading();

  try {
    app.cards = await loadCards();
    app.owned = new Set(loadState().ownedCardIds);
    renderCollection();
  } catch (error) {
    console.error("Collection could not start.", error);
    renderError();
  }
}

function renderCollection() {
  root.removeAttribute("aria-busy");

  const cards = playerCards(app.cards).sort((a, b) => {
    if (a.rating !== b.rating) return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const ownedCount = cards.filter((card) => app.owned.has(card.id)).length;
  const total = cards.length;
  const percent = total === 0 ? 0 : Math.round((ownedCount / total) * 100);

  const managers = managerCards(app.cards).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const ownedManagers = managers.filter((card) =>
    app.owned.has(card.id)
  ).length;

  const items = cards.map(renderCard).join("");

  root.innerHTML = `
    <div class="collection-summary">
      <div class="collection-summary__stat">
        <span class="collection-summary__value">${ownedCount}</span>
        <span class="collection-summary__label">of ${total} collected</span>
      </div>
      <div class="collection-meter" role="img" aria-label="${ownedCount} of ${total} cards collected">
        <span class="collection-meter__fill" style="width: ${percent}%"></span>
      </div>
      <a class="collection-summary__link" href="./store.html">
        ${ownedCount < total ? "Open a pack" : "Open another pack"}
      </a>
    </div>

    <ul class="collection-grid">
      ${items}
    </ul>

    ${
      managers.length > 0
        ? `
          <section class="collection-section" aria-labelledby="managers-title">
            <header class="collection-section__head">
              <div>
                <p class="eyebrow">
                  <span class="eyebrow__dot" aria-hidden="true"></span>
                  Staff
                </p>
                <h2 class="collection-section__title" id="managers-title">
                  Managers
                </h2>
              </div>
              <p class="collection-section__text">
                ${ownedManagers} of ${managers.length} collected. Managers come only from club packages and do not count toward the player total.
              </p>
            </header>

            <ul class="collection-grid collection-grid--managers">
              ${managers.map(renderManagerCard).join("")}
            </ul>
          </section>
        `
        : ""
    }
  `;
}

function renderManagerCard(card) {
  const owned = app.owned.has(card.id);
  const alt = owned
    ? `${escapeHtml(card.name)}, manager of ${escapeHtml(card.club)}`
    : "";
  const image = cardImageUrl(card);

  if (!owned) {
    return `
      <li class="collection-card is-manager is-locked">
        <figure class="collection-card__figure">
          <div class="collection-card__frame">
            <img
              src="${image}"
              alt=""
              width="470"
              height="660"
              loading="lazy"
              aria-hidden="true"
            />
            <div class="collection-card__lock">
              ${LOCK}
              <span>Locked</span>
            </div>
          </div>
          <figcaption class="collection-card__caption">
            <span class="collection-card__name">${escapeHtml(card.name)}</span>
            <span class="collection-card__meta">Not collected</span>
          </figcaption>
        </figure>
      </li>
    `;
  }

  return `
    <li class="collection-card is-manager">
      <figure class="collection-card__figure">
        <div class="collection-card__frame">
          <img
            src="${image}"
            alt="${alt}"
            width="470"
            height="660"
            loading="lazy"
          />
          <span class="collection-card__tag">Manager</span>
        </div>
        <figcaption class="collection-card__caption">
          <span class="collection-card__name">${escapeHtml(card.name)}</span>
          <span class="collection-card__meta">
            ${escapeHtml(card.club)} · Manager
          </span>
        </figcaption>
      </figure>
    </li>
  `;
}

function renderCard(card) {
  const owned = app.owned.has(card.id);
  const isUnique = card.type === "unique";
  const image = cardImageUrl(card);

  if (!owned) {
    return `
      <li class="collection-card is-locked">
        <figure class="collection-card__figure">
          <div class="collection-card__frame">
            <img
              src="${image}"
              alt=""
              width="470"
              height="660"
              loading="lazy"
              aria-hidden="true"
            />
            <div class="collection-card__lock">
              ${LOCK}
              <span>Locked</span>
            </div>
          </div>
          <figcaption class="collection-card__caption">
            <span class="collection-card__name">${escapeHtml(card.name)}</span>
            <span class="collection-card__meta">Not collected</span>
          </figcaption>
        </figure>
      </li>
    `;
  }

  return `
    <li class="collection-card ${isUnique ? "is-unique" : ""}">
      <figure class="collection-card__figure">
        <div class="collection-card__frame">
          <img
            src="${image}"
            alt="${escapeHtml(card.name)}, ${escapeHtml(card.club)}, ${escapeHtml(card.position)}, rated ${card.rating}"
            width="470"
            height="660"
            loading="lazy"
          />
          ${isUnique ? `<span class="collection-card__tag">Unique</span>` : ""}
        </div>
        <figcaption class="collection-card__caption">
          <span class="collection-card__name">${escapeHtml(card.name)}</span>
          <span class="collection-card__meta">
            ${escapeHtml(card.club)} · ${escapeHtml(card.position)} · ${card.rating}
          </span>
        </figcaption>
      </figure>
    </li>
  `;
}

function renderLoading() {
  root.setAttribute("aria-busy", "true");
  root.innerHTML = `
    <div class="stage-card stage-card--loading" role="status">
      <p class="eyebrow">Loading the collection</p>
      <div class="loading-lights" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <p class="stage-card__text">Shuffling through the card pool.</p>
    </div>
  `;
}

function renderError() {
  root.removeAttribute("aria-busy");
  root.innerHTML = `
    <div class="stage-card stage-card--error" role="alert">
      <p class="eyebrow">Something went wrong</p>
      <h2 class="stage-card__title">The collection didn't load.</h2>
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
