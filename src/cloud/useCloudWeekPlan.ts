import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayKey, WeekHistoryEntry, WeekPlan } from "../types";
import type { WeekPlanApi } from "../dataApi";
import { assignDay, clearDay, fillWeek, pruneWeek } from "../lib/week";
import { isoWeekKey } from "../lib/history";
import { deleteWeekPlan, fetchWeekPlans, saveWeekPlan } from "./api";

export function useCloudWeekPlan(
  userId: string,
  validIds: ReadonlySet<string>,
): WeekPlanApi & { readonly loading: boolean } {
  const weekKey = isoWeekKey(new Date());
  const [weeks, setWeeks] = useState<readonly { week: string; plan: WeekPlan }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWeekPlans(userId)
      .then((rows) => {
        if (!cancelled) setWeeks(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const currentRaw = useMemo(
    () => weeks.find((w) => w.week === weekKey)?.plan ?? {},
    [weeks, weekKey],
  );

  const plan = useMemo(
    () => pruneWeek(currentRaw, validIds),
    [currentRaw, validIds],
  );

  const history = useMemo<readonly WeekHistoryEntry[]>(
    () =>
      weeks
        .filter((w) => w.week !== weekKey && Object.keys(w.plan).length > 0)
        .map((w) => ({ week: w.week, plan: w.plan })),
    [weeks, weekKey],
  );

  const persist = useCallback(
    (nextPlan: WeekPlan) => {
      setWeeks((current) => {
        const rest = current.filter((w) => w.week !== weekKey);
        return [{ week: weekKey, plan: nextPlan }, ...rest].sort((a, b) =>
          b.week.localeCompare(a.week),
        );
      });
      saveWeekPlan(userId, weekKey, nextPlan).catch(() => {});
    },
    [userId, weekKey],
  );

  return {
    weekKey,
    plan,
    history,
    assign: (day: DayKey, recipeId: string) =>
      persist(assignDay(plan, day, recipeId)),
    clear: (day: DayKey) => persist(clearDay(plan, day)),
    reset: () => persist({}),
    fill: (recipeIds) => persist(fillWeek(plan, recipeIds)),
    reuseWeek: (entry) => persist(pruneWeek(entry.plan, validIds)),
    deleteHistoryEntry: (week: string) => {
      setWeeks((current) => current.filter((w) => w.week !== week));
      deleteWeekPlan(userId, week).catch(() => {});
    },
    loading,
  };
}
