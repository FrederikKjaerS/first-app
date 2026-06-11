import rawRecipes from "./recipes.json";
import type { Category, Recipe } from "../types";

export const CATEGORIES: readonly Category[] = [
  "Forret",
  "Hovedret",
  "Tilbehør",
  "Dessert",
];

const isCategory = (value: unknown): value is Category =>
  CATEGORIES.includes(value as Category);

export const isRecipe = (value: unknown): value is Recipe => {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.name === "string" &&
    r.name.length > 0 &&
    isCategory(r.category) &&
    typeof r.link === "string" &&
    typeof r.image === "string" &&
    (r.tried === undefined || typeof r.tried === "boolean")
  );
};

export const isRecipeList = (value: unknown): value is Recipe[] =>
  Array.isArray(value) && value.every(isRecipe);

export const BASE_RECIPES: readonly Recipe[] = (rawRecipes as unknown[]).filter(
  isRecipe,
);
