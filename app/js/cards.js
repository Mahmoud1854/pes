const CARDS_URL = new URL("../data/cards.json", import.meta.url);
const ASSET_BASE = new URL("../", import.meta.url);

function isValidCard(card) {
  return (
    card &&
    Number.isInteger(card.id) &&
    typeof card.name === "string" &&
    typeof card.club === "string" &&
    typeof card.position === "string" &&
    Number.isFinite(card.rating) &&
    (card.type === "unique" || card.type === "basic") &&
    typeof card.image === "string"
  );
}

export async function loadCards() {
  let response;

  try {
    response = await fetch(CARDS_URL);
  } catch (error) {
    throw new Error(
      "The cards file could not be loaded. Serve the project from a local web server.",
      { cause: error }
    );
  }

  if (!response.ok) {
    throw new Error(`The cards file returned ${response.status}.`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("The cards file is not a list.");
  }

  const cards = data.filter(isValidCard);
  if (cards.length === 0) {
    throw new Error("There are no valid cards in the file.");
  }

  return cards;
}

export function cardImageUrl(card) {
  return new URL(card.image, ASSET_BASE).href;
}

export function uniqueCards(cards) {
  return cards.filter((card) => card.type === "unique");
}

export function basicCards(cards) {
  return cards.filter((card) => card.type === "basic");
}

export function pickPackCard(cards, random = Math.random) {
  const unique = uniqueCards(cards);
  const basic = basicCards(cards);
  const wantUnique = random() < 0.2;

  const pool =
    wantUnique && unique.length > 0
      ? unique
      : basic.length > 0
        ? basic
        : unique;

  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)] ?? null;
}

const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => escapeMap[character]);
}
