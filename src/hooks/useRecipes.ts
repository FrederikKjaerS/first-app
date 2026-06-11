import { useMemo } from "react";
import { BASE_RECIPES, isRecipeList } from "../data/recipes";
import type { Recipe } from "../types";
import { useStoredState } from "./useStoredState";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

export function useRecipes() {
  const [customRecipes, setCustomRecipes] = useStoredState<Recipe[]>(
    "custom-recipes",
    [],
    isRecipeList,
  );
  const [favoriteIds, setFavoriteIds] = useStoredState<string[]>(
    "favorites",
    [],
    isStringArray,
  );

  const recipes = useMemo<readonly Recipe[]>(
    () =>
      [...BASE_RECIPES, ...customRecipes.map((r) => ({ ...r, custom: true }))].sort(
        (a, b) => a.name.localeCompare(b.name, "da"),
      ),
    [customRecipes],
  );

  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const addRecipe = (recipe: Recipe) =>
    setCustomRecipes((current) => [...current, recipe]);

  const removeRecipe = (id: string) =>
    setCustomRecipes((current) => current.filter((r) => r.id !== id));

  const toggleFavorite = (id: string) =>
    setFavoriteIds((current) =>
      current.includes(id)
        ? current.filter((f) => f !== id)
        : [...current, id],
    );

  return { recipes, favorites, addRecipe, removeRecipe, toggleFavorite };
}

export type RecipesApi = ReturnType<typeof useRecipes>;
