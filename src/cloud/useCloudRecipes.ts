import { useCallback, useEffect, useMemo, useState } from "react";
import type { Recipe } from "../types";
import type { RecipesApi } from "../dataApi";
import {
  deleteRecipe,
  fetchCollection,
  insertRecipe,
  rowToRecipe,
  upsertState,
  type RecipeRow,
  type StateRow,
} from "./api";

type Flags = Omit<StateRow, "recipe_id">;

const NO_FLAGS: Flags = { favorite: false, tried: false, hidden: false };

export function useCloudRecipes(userId: string): RecipesApi & {
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
} {
  const [rows, setRows] = useState<readonly RecipeRow[]>([]);
  const [flags, setFlags] = useState<ReadonlyMap<string, Flags>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCollection(userId)
      .then(({ recipes, state }) => {
        if (cancelled) return;
        setRows(recipes);
        setFlags(
          new Map(
            state.map(({ recipe_id, ...rest }) => [recipe_id, rest as Flags]),
          ),
        );
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ukendt fejl");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  const recipes = useMemo<readonly Recipe[]>(
    () =>
      rows
        .filter((row) => !(flags.get(row.id) ?? NO_FLAGS).hidden)
        .map((row) => rowToRecipe(row, userId))
        .sort((a, b) => a.name.localeCompare(b.name, "da")),
    [rows, flags, userId],
  );

  const favorites = useMemo(
    () =>
      new Set(
        [...flags.entries()].filter(([, f]) => f.favorite).map(([id]) => id),
      ),
    [flags],
  );

  const tried = useMemo(
    () =>
      new Set([...flags.entries()].filter(([, f]) => f.tried).map(([id]) => id)),
    [flags],
  );

  const patchFlags = useCallback(
    (recipeId: string, patch: Partial<Flags>) => {
      const current = flags.get(recipeId) ?? NO_FLAGS;
      const next = { ...current, ...patch };
      setFlags((m) => new Map([...m, [recipeId, next]]));
      upsertState(userId, recipeId, patch, current).catch(() => {
        setFlags((m) => new Map([...m, [recipeId, current]])); // roll back
        setError("Kunne ikke gemme ændringen — prøv igen");
      });
    },
    [flags, userId],
  );

  const addRecipe = useCallback(
    (recipe: Recipe) => {
      insertRecipe(userId, recipe)
        .then((row) => {
          setRows((r) => [...r, row]);
          if (recipe.tried) patchFlags(row.id, { tried: true });
        })
        .catch(() => setError("Kunne ikke gemme opskriften — prøv igen"));
    },
    [userId, patchFlags],
  );

  const removeRecipe = useCallback(
    (id: string) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (row.owner === userId) {
        setRows((r) => r.filter((x) => x.id !== id));
        deleteRecipe(id).catch(() => {
          setRows((r) => [...r, row]);
          setError("Kunne ikke slette opskriften — prøv igen");
        });
      } else {
        patchFlags(id, { hidden: true }); // curated defaults are hidden, not deleted
      }
    },
    [rows, userId, patchFlags],
  );

  return {
    recipes,
    favorites,
    tried,
    addRecipe,
    removeRecipe,
    toggleFavorite: (id) => patchFlags(id, { favorite: !favorites.has(id) }),
    toggleTried: (id) => patchFlags(id, { tried: !tried.has(id) }),
    loading,
    error,
    refresh: () => setReloadToken((t) => t + 1),
  };
}
