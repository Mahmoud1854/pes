import { loadState, updateState } from "./storage.js";
import { dateKey, getDailyQuestions, humanDate, tomorrowLabel } from "./dates.js";
import { loadQuestions } from "./questions.js";
import { initSharedUI, refreshCoinDisplay } from "./ui.js";

const COINS_PER_CORRECT = 150;
const DAILY_QUESTION_COUNT = 4;
const ARROW = `<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const root = document.querySelector("[data-trivia-root]");
const dateLabel = document.querySelector("[data-date]");

const app = {
  questions: [],
  daily: [],
  state: loadState(),
  today: dateKey(),
};

const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => escapeMap[character]);
}

function optionLetter(index) {
  return String.fromCharCode(65 + index);
}

if (dateLabel) dateLabel.textContent = humanDate();

initSharedUI();
boot();

async function boot() {
  renderLoading();

  try {
    app.questions = await loadQuestions();
    app.today = dateKey();
    ensureDailySet();
    renderTrivia();
  } catch (error) {
    console.error("Trivia could not start.", error);
    renderError();
  }
}

function ensureDailySet() {
  const state = loadState();
  const stored = state.trivia;
  const idsAreCurrent =
    stored.date === app.today &&
    stored.questionIds.length === DAILY_QUESTION_COUNT &&
    stored.questionIds.every((id) =>
      app.questions.some((question) => question.id === id)
    );

  if (!idsAreCurrent) {
    const questionIds = getDailyQuestions(
      app.questions,
      new Date(),
      DAILY_QUESTION_COUNT
    ).map((question) => question.id);

    app.state = updateState((next) => {
      next.trivia = {
        date: app.today,
        questionIds,
        answers: [],
        completed: false,
      };
      return next;
    });
  } else if (
    stored.answers.length >= DAILY_QUESTION_COUNT &&
    !stored.completed
  ) {
    app.state = updateState((next) => {
      next.trivia.completed = true;
      return next;
    });
  } else {
    app.state = state;
  }

  app.daily = app.state.trivia.questionIds
    .map((id) => app.questions.find((question) => question.id === id))
    .filter(Boolean);
}

function renderTrivia({ focus = false } = {}) {
  root.removeAttribute("aria-busy");

  if (
    app.state.trivia.completed ||
    app.state.trivia.answers.length >= app.daily.length
  ) {
    renderSummary({ focus });
    return;
  }

  renderQuestion({ focus });
}

function renderQuestion({ focus = false } = {}) {
  const answeredCount = app.state.trivia.answers.length;
  const question = app.daily[answeredCount];

  if (!question) {
    renderSummary({ focus });
    return;
  }

  const questionNumber = answeredCount + 1;
  const options = question.options
    .map((option, index) => {
      return `
        <button class="option" type="button" data-choice="${index}">
          <span class="option__key" aria-hidden="true">${optionLetter(index)}</span>
          <span class="option__text">${escapeHtml(option)}</span>
        </button>
      `;
    })
    .join("");

  root.innerHTML = `
    <article class="question-card" aria-labelledby="question-title">
      <div class="question-card__meta">
        <span class="question-card__count">Question ${questionNumber} of ${app.daily.length}</span>
        ${progressMarkup(answeredCount)}
      </div>
      <h2 class="question-card__question" id="question-title" tabindex="-1">${escapeHtml(question.question)}</h2>
      <div class="options" role="group" aria-label="Answer choices">
        ${options}
      </div>
      <div class="feedback" data-feedback hidden tabindex="-1"></div>
      <button class="btn btn--primary btn--wide" type="button" data-next hidden>
        <span data-next-label>Next question</span>
        ${ARROW}
      </button>
    </article>
  `;

  root.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      handleAnswer(question, Number(button.dataset.choice));
    });
  });

  if (focus) {
    root.querySelector("#question-title")?.focus();
  }
}

function handleAnswer(question, choice) {
  const stored = loadState();

  if (
    stored.trivia.date !== app.today ||
    stored.trivia.completed ||
    stored.trivia.answers.some((answer) => answer.questionId === question.id)
  ) {
    app.state = stored;
    renderTrivia();
    return;
  }

  const correct = choice === question.answer;

  app.state = updateState((next) => {
    if (next.trivia.date !== app.today) return next;
    if (
      next.trivia.answers.some((answer) => answer.questionId === question.id)
    ) {
      return next;
    }

    next.trivia.answers.push({
      questionId: question.id,
      choice,
      correct,
    });

    if (correct) next.coins += COINS_PER_CORRECT;
    if (next.trivia.answers.length >= app.daily.length) {
      next.trivia.completed = true;
    }

    return next;
  });

  refreshCoinDisplay({ bump: correct });
  renderAnswered(question, choice, correct);
}

function renderAnswered(question, choice, correct) {
  const answeredCount = app.state.trivia.answers.length;
  const questionNumber = answeredCount;
  const completed = app.state.trivia.completed;

  const options = question.options
    .map((option, index) => {
      let className = "option";
      if (index === question.answer) className += " is-correct";
      if (index === choice && !correct) className += " is-wrong";
      if (index !== question.answer && index !== choice) {
        className += " is-muted";
      }

      return `
        <button class="${className}" type="button" disabled>
          <span class="option__key" aria-hidden="true">${optionLetter(index)}</span>
          <span class="option__text">${escapeHtml(option)}</span>
        </button>
      `;
    })
    .join("");

  const nextLabel = completed ? "See today's result" : "Next question";
  const feedbackTitle = correct ? "Correct" : "Not this time";
  const feedbackText = correct
    ? `+${COINS_PER_CORRECT} coins added to your balance.`
    : `The answer was ${optionLetter(question.answer)}. ${escapeHtml(
        question.options[question.answer]
      )}.`;

  root.innerHTML = `
    <article class="question-card" aria-labelledby="question-title">
      <div class="question-card__meta">
        <span class="question-card__count">Question ${questionNumber} of ${app.daily.length}</span>
        ${progressMarkup(answeredCount)}
      </div>
      <h2 class="question-card__question" id="question-title" tabindex="-1">${escapeHtml(question.question)}</h2>
      <div class="options" role="group" aria-label="Answer choices">
        ${options}
      </div>
      <div class="feedback" data-feedback data-tone="${correct ? "correct" : "wrong"}" tabindex="-1">
        <span class="feedback__icon" aria-hidden="true">${correct ? "✓" : "✕"}</span>
        <div>
          <p class="feedback__title">${feedbackTitle}</p>
          <p class="feedback__text">${feedbackText}</p>
        </div>
      </div>
      <button class="btn btn--primary btn--wide" type="button" data-next>
        <span>${nextLabel}</span>
        ${ARROW}
      </button>
    </article>
  `;

  root.querySelector("[data-next]")?.addEventListener("click", () => {
    renderTrivia({ focus: true });
  });

  root.querySelector("[data-feedback]")?.focus();
}

function renderSummary({ focus = false } = {}) {
  const answers = app.state.trivia.answers;
  const correctCount = answers.filter((answer) => answer.correct).length;
  const earned = correctCount * COINS_PER_CORRECT;
  const answeredAll = answers.length >= app.daily.length;
  const title = answeredAll
    ? `${correctCount} of ${app.daily.length} correct.`
    : "Set in progress.";
  const lede =
    earned > 0
      ? `You banked <strong>+${earned} coins</strong> today.`
      : "No coins today. The next set is already lined up.";

  const results = app.daily
    .map((question, index) => {
      const answer = answers.find((item) => item.questionId === question.id);
      const isCorrect = Boolean(answer?.correct);
      const missing = !answer;

      return `
        <li class="review__item">
          <span class="review__mark ${isCorrect ? "is-correct" : "is-wrong"}" aria-hidden="true">
            ${isCorrect ? "✓" : "✕"}
          </span>
          <div class="review__body">
            <p class="review__question">${index + 1}. ${escapeHtml(question.question)}</p>
            <p class="review__answer">
              ${
                missing
                  ? "Not answered."
                  : isCorrect
                    ? `Your answer: ${escapeHtml(question.options[answer.choice])}`
                    : `Correct answer: ${escapeHtml(question.options[question.answer])}`
              }
            </p>
          </div>
        </li>
      `;
    })
    .join("");

  root.innerHTML = `
    <article class="result-card" aria-labelledby="result-title">
      <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true"></span>Set complete</p>
      <h2 class="result-card__title" id="result-title" tabindex="-1">${title}</h2>
      <p class="result-card__lede">${lede}</p>

      <div class="result-coins">
        <span class="result-coins__label">Coins earned today</span>
        <span class="result-coins__value">+${earned}</span>
      </div>

      <p class="result-card__next">Next set unlocks ${escapeHtml(tomorrowLabel())}.</p>
      <a class="btn btn--primary btn--wide" href="./index.html">
        <span>Back home</span>
        ${ARROW}
      </a>

      <details class="review">
        <summary class="review__summary">Review answers</summary>
        <ol class="review__list">${results}</ol>
      </details>
    </article>
  `;

  refreshCoinDisplay();

  if (focus) {
    root.querySelector("#result-title")?.focus();
  }
}

function progressMarkup(answeredCount) {
  const lights = app.daily
    .map((_, index) => {
      const className =
        index < answeredCount
          ? "floodlight is-done"
          : index === answeredCount
            ? "floodlight is-current"
            : "floodlight";
      return `<span class="${className}"></span>`;
    })
    .join("");

  return `
    <div class="floodlights" role="img" aria-label="${answeredCount} of ${app.daily.length} answered">
      ${lights}
    </div>
  `;
}

function renderLoading() {
  root.setAttribute("aria-busy", "true");
  root.innerHTML = `
    <div class="stage-card stage-card--loading" role="status">
      <p class="eyebrow">Loading today's set</p>
      <div class="loading-lights" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <p class="stage-card__text">Getting the questions ready.</p>
    </div>
  `;
}

function renderError() {
  root.removeAttribute("aria-busy");
  root.innerHTML = `
    <div class="stage-card stage-card--error" role="alert">
      <p class="eyebrow">Something went wrong</p>
      <h2 class="stage-card__title">Today's questions didn't load.</h2>
      <p class="stage-card__text">
        Check that the <code>data</code> folder is published with the site, then refresh the page.
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
