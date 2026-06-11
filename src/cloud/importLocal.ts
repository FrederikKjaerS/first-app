import { readJson, writeJson } from "../lib/storage";
import { isRecipeList } from "../data/recipes";
import { DAY_KEYS, type WeekHistoryEntry, type WeekPlan } from "../types";
import {
  fetchDefaultSlugMap,
  insertRecipe,
  saveWeekPlan,
  upsertState,
} from "./api";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

const isHistory = (value: unknown): value is WeekHistoryEntry[] =>
  Array.isArray(value);

const isAnyObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function hasLocalData(): boolean {
  if (readJson("imported-to-cloud", false, (v): v is boolean => typeof v === "boolean"))
    return false;
  return (
    readJson("favorites", [], isStringArray).length > 0 ||
    readJson("tried-overrides", [], isStringArray).length > 0 ||
    readJson("custom-recipes", [], isRecipeList).length > 0 ||
    readJson("week-history", [], isHistory).length > 0 ||
    Object.keys(readJson("week-plan", {}, isAnyObject)).length > 0
  );
}

/**
 * Moves guest-mode localStorage data into the signed-in account.
 * Local slug-ids are remapped to database uuids; unknown ids are dropped.
 */
export async function importLocalData(userId: string): Promise<number> {
  const slugToId = await fetchDefaultSlugMap();
  let moved = 0;

  // 1. Own recipes first, extending the id map as we go.
  const customRecipes = readJson("custom-recipes", [], isRecipeList);
  for (const recipe of customRecipes) {
    try {
      const row = await insertRecipe(userId, recipe);
      slugToId.set(recipe.id, row.id);
      if (recipe.tried) {
        await upsertState(userId, row.id, { tried: true }, {
          favorite: false,
          tried: false,
          hidden: false,
        });
      }
      moved += 1;
    } catch {
      // Skip recipes that fail validation server-side; keep importing.
    }
  }

  // 2. Favorites and tried-marks on default recipes.
  const favorites = new Set(readJson("favorites", [], isStringArray));
  const triedOverrides = new Set(readJson("tried-overrides", [], isStringArray));
  const flagged = new Set([...favorites, ...triedOverrides]);
  for (const slug of flagged) {
    const id = slugToId.get(slug);
    if (!id) continue;
    try {
      await upsertState(
        userId,
        id,
        { favorite: favorites.has(slug), tried: triedOverrides.has(slug) },
        { favorite: false, tried: false, hidden: false },
      );
      moved += 1;
    } catch {
      // ignore and continue
    }
  }

  // 3. Week plans: current week + history, with ids remapped.
  const remapPlan = (plan: WeekPlan): WeekPlan =>
    DAY_KEYS.reduce<WeekPlan>((next, day) => {
      const slug = plan[day];
      const id = slug ? slugToId.get(slug) : undefined;
      return id ? { ...next, [day]: id } : next;
    }, {});

  const storedPlan = readJson("week-plan", {}, isAnyObject);
  const currentEntry =
    typeof storedPlan.week === "string" && isAnyObject(storedPlan.plan)
      ? { week: storedPlan.week, plan: storedPlan.plan as WeekPlan }
      : null;
  const historyEntries = readJson("week-history", [], isHistory);

  for (const entry of [currentEntry, ...historyEntries]) {
    if (!entry || typeof entry.week !== "string") continue;
    const remapped = remapPlan(entry.plan ?? {});
    if (Object.keys(remapped).length === 0) continue;
    try {
      await saveWeekPlan(userId, entry.week, remapped);
      moved += 1;
    } catch {
      // ignore and continue
    }
  }

  writeJson("imported-to-cloud", true);
  return moved;
}
