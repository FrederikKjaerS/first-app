import { DAY_KEYS, type DayKey, type WeekPlan } from "../types";
import { shuffled } from "./random";

export function assignDay(
  plan: WeekPlan,
  day: DayKey,
  recipeId: string,
): WeekPlan {
  return { ...plan, [day]: recipeId };
}

export function clearDay(plan: WeekPlan, day: DayKey): WeekPlan {
  const { [day]: _removed, ...rest } = plan;
  return rest;
}

export function clearWeek(): WeekPlan {
  return {};
}

/**
 * Fills every empty day with a random recipe, avoiding repeats within the
 * week as long as the pool is large enough.
 */
export function fillWeek(
  plan: WeekPlan,
  recipeIds: readonly string[],
  rng: () => number = Math.random,
): WeekPlan {
  const used = new Set(Object.values(plan).filter(Boolean));
  const fresh = shuffled(
    recipeIds.filter((id) => !used.has(id)),
    rng,
  );
  let cursor = 0;
  return DAY_KEYS.reduce<WeekPlan>((next, day) => {
    if (next[day]) return next;
    const candidate = fresh[cursor] ?? shuffled(recipeIds, rng)[0];
    if (!candidate) return next;
    cursor += 1;
    return { ...next, [day]: candidate };
  }, plan);
}

/** Drops recipe ids that no longer exist (e.g. a deleted custom recipe). */
export function pruneWeek(
  plan: WeekPlan,
  validIds: ReadonlySet<string>,
): WeekPlan {
  return DAY_KEYS.reduce<WeekPlan>((next, day) => {
    const id = next[day];
    return id !== undefined && !validIds.has(id) ? clearDay(next, day) : next;
  }, plan);
}

/** Today's day key, mapping JS Sunday-first weekdays to a Monday-first week. */
export function todayKey(now: Date = new Date()): DayKey {
  const mondayFirst = (now.getDay() + 6) % 7;
  return DAY_KEYS[mondayFirst];
}
