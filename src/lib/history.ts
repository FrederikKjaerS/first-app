import type { WeekHistoryEntry, WeekPlan } from "../types";

export const HISTORY_CAP = 52;

/** ISO-8601 week key, e.g. "2026-W24". Weeks start Monday. */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // the Thursday decides the week's year
  const year = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week =
    1 +
    Math.round(
      ((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function weekLabel(weekKey: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return weekKey;
  return `Uge ${Number(match[2])} · ${match[1]}`;
}

/** Approximate whole weeks between two week keys (b - a). */
export function weeksBetween(a: string, b: string): number {
  const parse = (key: string): number => {
    const match = /^(\d{4})-W(\d{2})$/.exec(key);
    if (!match) return 0;
    return Number(match[1]) * 52 + Number(match[2]);
  };
  return parse(b) - parse(a);
}

/** Adds a finished week, replacing any same-week entry, newest first. */
export function archiveWeek(
  history: readonly WeekHistoryEntry[],
  entry: WeekHistoryEntry,
  cap: number = HISTORY_CAP,
): readonly WeekHistoryEntry[] {
  return [entry, ...history.filter((h) => h.week !== entry.week)]
    .sort((a, b) => b.week.localeCompare(a.week))
    .slice(0, cap);
}

export function removeWeek(
  history: readonly WeekHistoryEntry[],
  weekKey: string,
): readonly WeekHistoryEntry[] {
  return history.filter((h) => h.week !== weekKey);
}

export function planHasDays(plan: WeekPlan): boolean {
  return Object.values(plan).some(Boolean);
}

/** Most recent archived week containing the recipe, or null. */
export function findLastEaten(
  history: readonly WeekHistoryEntry[],
  recipeId: string,
): string | null {
  const entry = history.find((h) => Object.values(h.plan).includes(recipeId));
  return entry ? entry.week : null;
}
