import { cardImageUrl, escapeHtml } from "./cards.js";

const ARROW = `<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CLOSE = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>`;

let active = null;

export function showReveal({
  card,
  isNew = true,
  sourceLabel,
  actions = [],
  hint = "",
  onClose,
  returnFocus,
}) {
  closeReveal({ restoreFocus: false });

  if (!card) return null;

  const trigger = document.activeElement;
  const isUnique = card.type === "unique";
  const typeLabel = sourceLabel ?? (isUnique ? "Unique" : "Basic");

  const actionsHtml = actions
    .map((action, index) => {
      const tag = action.href ? "a" : "button";
      const attributes = action.href
        ? `href="${escapeHtml(action.href)}"`
        : `type="button" ${action.disabled ? "disabled" : ""}`;

      return `
        <${tag}
          class="btn btn--${action.kind ?? "primary"} btn--wide"
          ${attributes}
          data-reveal-action="${index}"
        >
          <span>${escapeHtml(action.label)}</span>
          ${action.arrow ? ARROW : ""}
        </${tag}>
      `;
    })
    .join("");

  const reveal = document.createElement("div");
  reveal.className = "reveal";
  reveal.innerHTML = `
    <div class="reveal__scrim" data-reveal-close></div>
    <div
      class="reveal__box"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-title"
      aria-describedby="reveal-status"
    >
      <button class="reveal__close" type="button" data-reveal-close aria-label="Close reveal">
        ${CLOSE}
      </button>

      <p class="eyebrow reveal__eyebrow">
        <span class="eyebrow__dot" aria-hidden="true"></span>
        ${isNew ? "New card" : "Duplicate"}
        <span class="eyebrow__separator" aria-hidden="true">/</span>
        ${escapeHtml(typeLabel)}
      </p>

      <div class="reveal__card-shell ${isUnique ? "is-unique" : ""}">
        <div class="reveal__card" data-reveal-card>
          <div class="reveal__face reveal__face--back card-back">
            <span class="card-back__ring"></span>
            <span class="card-back__mark">FF</span>
            <span class="card-back__label">Friends pack</span>
          </div>
          <div class="reveal__face reveal__face--front">
            <img
              src="${cardImageUrl(card)}"
              alt="${escapeHtml(card.name)}, ${escapeHtml(card.club)}, ${escapeHtml(card.position)}, rated ${card.rating}"
              width="470"
              height="660"
            />
          </div>
        </div>
      </div>

      <div class="reveal__info">
        <h2 class="reveal__name" id="reveal-title">${escapeHtml(card.name)}</h2>
        <p class="reveal__meta">
          ${escapeHtml(card.club)} · ${escapeHtml(card.position)} · <strong>${card.rating}</strong>
        </p>
        <p
          class="reveal__status ${isNew ? "is-new" : "is-duplicate"}"
          id="reveal-status"
        >
          ${
            isNew
              ? "Added to your collection."
              : "You already own this card. Duplicates do nothing."
          }
        </p>
      </div>

      <div class="reveal__actions">
        ${actionsHtml}
        ${hint ? `<p class="reveal__hint">${escapeHtml(hint)}</p>` : ""}
      </div>
    </div>
  `;

  document.body.appendChild(reveal);
  active = { reveal, trigger, returnFocus, onClose };

  reveal.querySelector("[data-reveal-close]")?.focus();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      reveal.querySelector("[data-reveal-card]")?.classList.add("is-flipped");
    });
  });

  window.setTimeout(() => reveal.classList.add("is-revealed"), 620);

  reveal.querySelectorAll("[data-reveal-close]").forEach((element) => {
    element.addEventListener("click", () => closeReveal());
  });

  reveal.querySelectorAll("[data-reveal-action]").forEach((element) => {
    const action = actions[Number(element.dataset.revealAction)];
    if (action?.onClick) element.addEventListener("click", action.onClick);
  });

  document.addEventListener("keydown", handleKeydown);
  reveal.addEventListener("keydown", trapFocus);

  return reveal;
}

export function closeReveal({ restoreFocus = true } = {}) {
  if (!active) return;

  const { reveal, trigger, returnFocus, onClose } = active;
  active = null;

  document.removeEventListener("keydown", handleKeydown);
  reveal.remove();

  if (typeof onClose === "function") onClose();

  if (restoreFocus) {
    const target =
      (typeof returnFocus === "function" ? returnFocus() : returnFocus) ??
      trigger;

    if (target?.isConnected) target.focus();
  }
}

function handleKeydown(event) {
  if (event.key !== "Escape" || !active) return;

  event.preventDefault();
  closeReveal();
}

function trapFocus(event) {
  if (event.key !== "Tab" || !active) return;

  const focusable = [
    ...active.reveal.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ),
  ].filter((element) => element.offsetParent !== null);

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
