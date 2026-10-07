export const SAVE_KEY = "palm-house-v5";
export const BACKUP_KEY = "palm-house-backup";
export function validSave(value) {
  return (
    !!value &&
    typeof value === "object" &&
    [1, 2, 3, 4, 5].includes(value.version) &&
    Array.isArray(value.levels) &&
    value.levels.length >= 4 &&
    value.levels.length <= 8 &&
    value.levels.every((n) => Number.isFinite(n) && n >= 0 && n <= 2) &&
    Number.isFinite(value.cash) &&
    value.cash >= 0 &&
    (value.upper === undefined || validSave(value.upper)) &&
    (value.rooftop === undefined || validSave(value.rooftop))
  );
}
export function parseSave(raw) {
  try {
    const v = JSON.parse(raw);
    return validSave(v) ? v : null;
  } catch {
    return null;
  }
}
export function loadSave(storage) {
  for (const key of [
    SAVE_KEY,
    BACKUP_KEY,
    "palm-house-v4",
    "palm-house-v3",
    "palm-house-v2",
    "palm-house-v1",
  ]) {
    const raw = storage.getItem(key),
      value = parseSave(raw);
    if (value) return { value, recovered: key === BACKUP_KEY };
  }
  return { value: null, recovered: false };
}
export class SaveConflictError extends Error {}
export function writeSave(storage, value, options = {}) {
  if (!validSave(value)) throw new Error("Invalid save");
  const previous = storage.getItem(SAVE_KEY);
  if (Object.hasOwn(options, "expectedRaw") && previous !== options.expectedRaw)
    throw new SaveConflictError("Hotel updated in another tab");
  if (parseSave(previous)) {
    try {
      if (!storage.getItem("palm-house-before-premium"))
        storage.setItem("palm-house-before-premium", previous);
      storage.setItem(BACKUP_KEY, previous);
    } catch {
      /* A full backup quota must not prevent replacing the current save. */
    }
  }
  const raw = JSON.stringify(value);
  storage.setItem(SAVE_KEY, raw);
  return raw;
}
