const QUESTIONS_URL = new URL("../data/questions.json", import.meta.url);

function isValidQuestion(question) {
  return (
    question &&
    Number.isInteger(question.id) &&
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === "string") &&
    Number.isInteger(question.answer) &&
    question.answer >= 0 &&
    question.answer < 4
  );
}

export async function loadQuestions() {
  let response;

  try {
    response = await fetch(QUESTIONS_URL);
  } catch (error) {
    throw new Error(
      "The questions file could not be loaded. Serve the project from a local web server.",
      { cause: error }
    );
  }

  if (!response.ok) {
    throw new Error(`The questions file returned ${response.status}.`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("The questions file is not a list.");
  }

  const questions = data.filter(isValidQuestion);
  if (questions.length < 3) {
    throw new Error("There are not enough valid questions in the file.");
  }

  return questions;
}
