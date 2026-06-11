import { useCallback, useState } from "react";
import { readJson, writeJson } from "../lib/storage";

/**
 * useState backed by localStorage. The validator guards against stale or
 * corrupted stored data from older versions of the app.
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): readonly [T, (next: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readJson(key, fallback, validate));

  const setAndPersist = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof next === "function" ? (next as (c: T) => T)(current) : next;
        writeJson(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, setAndPersist] as const;
}
