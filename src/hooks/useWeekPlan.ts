import { useMemo } from "react";
import { DAY_KEYS, type DayKey, type WeekPlan } from "../types";
import { assignDay, clearDay, clearWeek, fillWeek, pruneWeek } from "../lib/week";
import { useStoredState } from "./useStoredState";

const isWeekPlan = (value: unknown): value is WeekPlan => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  return Object.entries(value).every(
    ([key, id]) =>
      DAY_KEYS.includes(key as DayKey) && typeof id === "string",
  );
};

export function useWeekPlan(validIds: ReadonlySet<string>) {
  const [storedPlan, setPlan] = useStoredState<WeekPlan>(
    "week-plan",
    {},
    isWeekPlan,
  );

  const plan = useMemo(
    () => pruneWeek(storedPlan, validIds),
    [storedPlan, validIds],
  );

  return {
    plan,
    assign: (day: DayKey, recipeId: string) =>
      setPlan((current) => assignDay(current, day, recipeId)),
    clear: (day: DayKey) => setPlan((current) => clearDay(current, day)),
    reset: () => setPlan(clearWeek()),
    fill: (recipeIds: readonly string[]) =>
      setPlan((current) => fillWeek(pruneWeek(current, validIds), recipeIds)),
  };
}

export type WeekPlanApi = ReturnType<typeof useWeekPlan>;
