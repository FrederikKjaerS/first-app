import { useEffect, useMemo, useState } from "react";
import { DAY_LABELS, type DayKey, type Recipe } from "../types";
import { recipeImageSrc } from "../lib/image";

type Props = {
  readonly day: DayKey;
  readonly recipes: readonly Recipe[];
  readonly onSelect: (recipeId: string) => void;
  readonly onClose: () => void;
};

export function RecipeChooser({ day, recipes, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? recipes.filter((r) => r.name.toLowerCase().includes(q)) : recipes;
  }, [recipes, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`Vælg ret til ${DAY_LABELS[day]}`}>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="chooser">
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Luk">
          ✕
        </button>
        <h2 className="chooser-title">
          Hvad skal vi spise <em>{DAY_LABELS[day].toLowerCase()}</em>?
        </h2>
        <input
          type="search"
          className="search chooser-search"
          placeholder="Søg…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
          aria-label="Søg i opskrifter"
        />
        {visible.length === 0 ? (
          <p className="empty">Ingen retter matcher.</p>
        ) : (
          <ul className="chooser-list">
            {visible.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  className="chooser-item"
                  onClick={() => onSelect(recipe.id)}
                >
                  <img src={recipeImageSrc(recipe.image)} alt="" loading="lazy" />
                  <span>{recipe.name}</span>
                  <span className="chooser-item-cat">{recipe.category}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
