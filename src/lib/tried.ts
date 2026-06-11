import type { Recipe } from "../types";

/**
 * Tried-status is the recipe's baked-in flag, flipped when the user has
 * toggled it: overrides hold the ids whose status differs from the data file.
 * This lets the user both approve new dishes and un-approve old ones without
 * touching the underlying data.
 */
export function isTried(
  recipe: Pick<Recipe, "id" | "tried">,
  overrides: ReadonlySet<string>,
): boolean {
  const base = recipe.tried === true;
  return overrides.has(recipe.id) ? !base : base;
}

export function toggleTried(
  overrides: readonly string[],
  id: string,
): readonly string[] {
  return overrides.includes(id)
    ? overrides.filter((o) => o !== id)
    : [...overrides, id];
}
