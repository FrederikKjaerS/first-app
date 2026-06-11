import { DAY_KEYS, DAY_LABELS, type DayKey, type Recipe, type WeekPlan } from "../types";

type Props = {
  readonly recipe: Recipe;
  readonly index: number;
  readonly isFavorite: boolean;
  readonly isTried: boolean;
  readonly plan: WeekPlan;
  readonly onToggleFavorite: () => void;
  readonly onToggleTried: () => void;
  readonly onAssignDay: (day: DayKey) => void;
  readonly onClearDay: (day: DayKey) => void;
  readonly onRemove?: () => void;
};

export function RecipeCard({
  recipe,
  index,
  isFavorite,
  isTried,
  plan,
  onToggleFavorite,
  onToggleTried,
  onAssignDay,
  onClearDay,
  onRemove,
}: Props) {
  return (
    <li className="card" style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}>
      <a
        className="card-media"
        href={recipe.link}
        target="_blank"
        rel="noreferrer"
        aria-label={`Åbn opskriften på ${recipe.name}`}
      >
        {recipe.image ? (
          <img src={recipe.image} alt="" loading="lazy" />
        ) : (
          <span className="card-media-fallback" aria-hidden="true">
            {recipe.name.charAt(0)}
          </span>
        )}
        <span className="card-category">{recipe.category}</span>
        <span
          className={`card-status ${isTried ? "is-tried" : "is-new"}`}
          aria-hidden="true"
        >
          {isTried ? "✓ Afprøvet" : "Ny idé"}
        </span>
      </a>

      <div className="card-body">
        <div className="card-titlerow">
          <a className="card-title" href={recipe.link} target="_blank" rel="noreferrer">
            {recipe.name}
          </a>
          <button
            type="button"
            className={`heart ${isFavorite ? "is-fav" : ""}`}
            onClick={onToggleFavorite}
            aria-label={
              isFavorite
                ? `Fjern ${recipe.name} fra favoritter`
                : `Gem ${recipe.name} som favorit`
            }
            aria-pressed={isFavorite}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        <div className="card-days" aria-label={`Sæt ${recipe.name} på ugeplanen`}>
          {DAY_KEYS.map((day) => {
            const isPlanned = plan[day] === recipe.id;
            return (
              <button
                key={day}
                type="button"
                className={`daydot ${isPlanned ? "is-on" : ""}`}
                onClick={() => (isPlanned ? onClearDay(day) : onAssignDay(day))}
                title={
                  isPlanned
                    ? `Fjern ${recipe.name} fra ${DAY_LABELS[day].toLowerCase()}`
                    : `Sæt ${recipe.name} på ${DAY_LABELS[day].toLowerCase()}`
                }
                aria-label={
                  isPlanned
                    ? `Fjern fra ${DAY_LABELS[day]}`
                    : `Sæt på ${DAY_LABELS[day]}`
                }
                aria-pressed={isPlanned}
              >
                {DAY_LABELS[day].charAt(0)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={`card-tried ${isTried ? "is-tried" : ""}`}
          onClick={onToggleTried}
          aria-pressed={isTried}
        >
          {isTried ? "✓ Afprøvet og godkendt" : "Har du prøvet den? Godkend ✓"}
        </button>

        {onRemove && (
          <button type="button" className="card-remove" onClick={onRemove}>
            Slet egen opskrift
          </button>
        )}
      </div>
    </li>
  );
}
