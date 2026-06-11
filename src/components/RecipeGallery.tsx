import { useMemo, useState } from "react";
import type { RecipesApi } from "../dataApi";
import type { Category, DayKey, WeekPlan } from "../types";
import { CATEGORIES } from "../data/recipes";
import { RecipeCard } from "./RecipeCard";

type Props = {
  readonly recipesApi: RecipesApi;
  readonly plan: WeekPlan;
  readonly onAssignDay: (day: DayKey, recipeId: string) => void;
  readonly onClearDay: (day: DayKey) => void;
};

type CategoryFilter = Category | "alle" | "favoritter" | "afproevede" | "nye";

export function RecipeGallery({ recipesApi, plan, onAssignDay, onClearDay }: Props) {
  const { recipes, favorites, tried, toggleFavorite, toggleTried, removeRecipe } =
    recipesApi;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("alle");

  const activeCategories = useMemo(
    () => CATEGORIES.filter((c) => recipes.some((r) => r.category === c)),
    [recipes],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (q && !recipe.name.toLowerCase().includes(q)) return false;
      if (filter === "alle") return true;
      if (filter === "favoritter") return favorites.has(recipe.id);
      if (filter === "afproevede") return tried.has(recipe.id);
      if (filter === "nye") return !tried.has(recipe.id);
      return recipe.category === filter;
    });
  }, [recipes, query, filter, favorites, tried]);

  return (
    <section className="gallery" id="opskrifter">
      <div className="filterbar reveal d5">
        <input
          type="search"
          className="search"
          placeholder="Søg efter en ret…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Søg i opskrifter"
        />
        <div className="chips" role="group" aria-label="Filtrér efter kategori">
          <FilterChip
            label="Alle"
            active={filter === "alle"}
            onClick={() => setFilter("alle")}
          />
          <FilterChip
            label={`✓ Afprøvede (${tried.size})`}
            active={filter === "afproevede"}
            onClick={() => setFilter("afproevede")}
          />
          <FilterChip
            label={`Nye idéer (${recipes.length - tried.size})`}
            active={filter === "nye"}
            onClick={() => setFilter("nye")}
          />
          {activeCategories.map((category) => (
            <FilterChip
              key={category}
              label={category}
              active={filter === category}
              onClick={() => setFilter(category)}
            />
          ))}
          <FilterChip
            label={`♥ Favoritter${favorites.size > 0 ? ` (${favorites.size})` : ""}`}
            active={filter === "favoritter"}
            onClick={() => setFilter("favoritter")}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty">
          {filter === "favoritter" && favorites.size === 0
            ? "Ingen favoritter endnu — tryk på hjertet på en ret for at gemme den her."
            : "Ingen retter matcher — prøv en anden søgning."}
        </p>
      ) : (
        <ul className="grid">
          {visible.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              index={index}
              isFavorite={favorites.has(recipe.id)}
              isTried={tried.has(recipe.id)}
              plan={plan}
              onToggleFavorite={() => toggleFavorite(recipe.id)}
              onToggleTried={() => toggleTried(recipe.id)}
              onAssignDay={(day) => onAssignDay(day, recipe.id)}
              onClearDay={onClearDay}
              onRemove={recipe.custom ? () => removeRecipe(recipe.id) : undefined}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`chip ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
