const PACKAGES_URL = new URL("../data/packages.json", import.meta.url);

function isValidPackage(pack) {
  if (
    !pack ||
    typeof pack.id !== "string" ||
    typeof pack.name !== "string" ||
    !Number.isFinite(pack.price) ||
    (pack.kind !== "random" && pack.kind !== "bundle") ||
    typeof pack.oneTime !== "boolean"
  ) {
    return false;
  }

  if (pack.kind === "bundle") {
    if (!Array.isArray(pack.cardIds)) return false;
    if (pack.managerId !== null && !Number.isInteger(pack.managerId)) {
      return false;
    }
  }

  if (pack.kind === "random") {
    if (pack.club !== undefined && typeof pack.club !== "string") {
      return false;
    }
    if (
      pack.cardIds !== undefined &&
      (!Array.isArray(pack.cardIds) ||
        !pack.cardIds.every((id) => Number.isInteger(id)))
    ) {
      return false;
    }
  }

  return true;
}

export async function loadPackages() {
  let response;

  try {
    response = await fetch(PACKAGES_URL);
  } catch (error) {
    throw new Error(
      "The packages file could not be loaded. Serve the project from a local web server.",
      { cause: error }
    );
  }

  if (!response.ok) {
    throw new Error(`The packages file returned ${response.status}.`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("The packages file is not a list.");
  }

  const packages = data.filter(isValidPackage);
  if (packages.length === 0) {
    throw new Error("There are no valid packages in the file.");
  }

  return packages;
}
