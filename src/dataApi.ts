import type { DayKey, Recipe, WeekHistoryEntry, WeekPlan } from "./types";

/**
 * The storage-agnostic contracts the UI is built against. Guest mode
 * implements them with localStorage, signed-in mode with Supabase.
 */
export type RecipesApi = {
  readonly recipes: readonly Recipe[];
  readonly favorites: ReadonlySet<string>;
  readonly tried: ReadonlySet<string>;
  readonly addRecipe: (recipe: Recipe) => void;
  readonly removeRecipe: (id: string) => void;
  readonly toggleFavorite: (id: string) => void;
  readonly toggleTried: (id: string) => void;
};

export type WeekPlanApi = {
  readonly weekKey: string;
  readonly plan: WeekPlan;
  readonly history: readonly WeekHistoryEntry[];
  readonly assign: (day: DayKey, recipeId: string) => void;
  readonly clear: (day: DayKey) => void;
  readonly reset: () => void;
  readonly fill: (recipeIds: readonly string[]) => void;
  readonly reuseWeek: (entry: WeekHistoryEntry) => void;
  readonly deleteHistoryEntry: (weekKey: string) => void;
};
