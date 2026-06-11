const PREFIX = "aftensmad:";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const defaultStorage = (): StorageLike | null =>
  typeof window === "undefined" ? null : window.localStorage;

export function readJson<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
  storage: StorageLike | null = defaultStorage(),
): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(
  key: string,
  value: unknown,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the app keeps working from memory.
  }
}
