import { loadState } from "./storage.js";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatCoins(value) {
  return numberFormat.format(Math.max(0, Math.floor(Number(value) || 0)));
}

export function refreshCoinDisplay({ bump = false } = {}) {
  const { coins } = loadState();
  const label = formatCoins(coins);

  document.querySelectorAll("[data-coin-balance]").forEach((element) => {
    const changed = element.textContent.trim() !== label;
    element.textContent = label;

    if (!changed || !bump) return;

    const chip = element.closest(".coin-chip");
    if (!chip) return;

    chip.classList.remove("is-bumping");
    void chip.offsetWidth;
    chip.classList.add("is-bumping");
    chip.addEventListener(
      "animationend",
      () => chip.classList.remove("is-bumping"),
      { once: true }
    );
  });

  return coins;
}

export function initSharedUI() {
  refreshCoinDisplay();
}
