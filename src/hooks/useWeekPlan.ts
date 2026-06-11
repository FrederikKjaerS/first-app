import { useEffect, useMemo } from "react";
import {
  DAY_KEYS,
  type DayKey,
  type WeekHistoryEntry,
  type WeekPlan,
} from "../types";
import { assignDay, clearDay, clearWeek, fillWeek, pruneWeek } from "../lib/week";
import { archiveWeek, isoWeekKey, planHasDays, removeWeek } from "../lib/history";
import { useStoredState } from "./useStoredState";

const isWeekPlan = (value: unknown): value is WeekPlan => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  return Object.entries(value).every(
    ([key, id]) => DAY_KEYS.includes(key as DayKey) && typeof id === "string",
  );
};

type StoredPlan = { readonly week: string; readonly plan: WeekPlan };

/** Accepts the current {week, plan} shape and the legacy bare-plan shape. */
const isStoredPlan = (value: unknown): value is StoredPlan | WeekPlan => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const v = value as Record<string, unknown>;
  if (typeof v.week === "string" && isWeekPlan(v.plan)) return true;
  return isWeekPlan(value);
};

const isHistory = (value: unknown): value is WeekHistoryEntry[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as WeekHistoryEntry).week === "string" &&
      isWeekPlan((entry as WeekHistoryEntry).plan),
  );

const normalize = (
  value: StoredPlan | WeekPlan,
  fallbackWeek: string,
): StoredPlan =>
  "week" in value && typeof value.week === "string"
    ? (value as StoredPlan)
    : { week: fallbackWeek, plan: value as WeekPlan };

export function useWeekPlan(validIds: ReadonlySet<string>) {
  const currentWeek = isoWeekKey(new Date());
  const [stored, setStored] = useStoredState<StoredPlan | WeekPlan>(
    "week-plan",
    { week: currentWeek, plan: {} },
    isStoredPlan,
  );
  const [history, setHistory] = useStoredState<WeekHistoryEntry[]>(
    "week-history",
    [],
    isHistory,
  );

  const current = normalize(stored, currentWeek);

  // A new week has begun: archive last week's plan and start fresh.
  useEffect(() => {
    if (current.week === currentWeek) return;
    if (planHasDays(current.plan)) {
      setHistory((h) => [
        ...archiveWeek(h, { week: current.week, plan: current.plan }),
      ]);
    }
    setStored({ week: currentWeek, plan: {} });
  }, [current.week, current.plan, currentWeek, setHistory, setStored]);

  const plan = useMemo(
    () =>
      current.week === currentWeek ? pruneWeek(current.plan, validIds) : {},
    [current.week, current.plan, currentWeek, validIds],
  );

  const update = (nextPlan: (p: WeekPlan) => WeekPlan) =>
    setStored((value) => {
      const now = normalize(value, currentWeek);
      const base = now.week === currentWeek ? now.plan : {};
      return { week: currentWeek, plan: nextPlan(base) };
    });

  return {
    weekKey: currentWeek,
    plan,
    history,
    assign: (day: DayKey, recipeId: string) =>
      update((p) => assignDay(p, day, recipeId)),
    clear: (day: DayKey) => update((p) => clearDay(p, day)),
    reset: () => update(() => clearWeek()),
    fill: (recipeIds: readonly string[]) =>
      update((p) => fillWeek(pruneWeek(p, validIds), recipeIds)),
    reuseWeek: (entry: WeekHistoryEntry) =>
      update(() => pruneWeek(entry.plan, validIds)),
    deleteHistoryEntry: (weekKey: string) =>
      setHistory((h) => [...removeWeek(h, weekKey)]),
  };
}

export type WeekPlanApi = ReturnType<typeof useWeekPlan>;
