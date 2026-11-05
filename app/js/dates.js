const DAY_MS = 86400000;

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayIndex(date = new Date()) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
  );
}

export function getDailyQuestions(questions, date = new Date(), count = 4) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const total = questions.length;
  const start = ((dayIndex(date) * count) % total + total) % total;

  return Array.from({ length: Math.min(count, total) }, (_, offset) => {
    return questions[(start + offset) % total];
  });
}

export function isThursday(date = new Date()) {
  return date.getDay() === 4;
}

export function humanDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function tomorrowLabel(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(tomorrow);
}
