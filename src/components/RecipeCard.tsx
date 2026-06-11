import { DAY_KEYS, DAY_LABELS, type DayKey, type Recipe, type WeekPlan } from "../types";

type Props = {
  readonly recipe: Recipe;
  readonly index: number;
  readonly isFavorite: boolean;
  readonly plan: WeekPlan;
  readonly onToggleFavorite: () => void;
  readonly onAssignDay: (day: DayKey) => void;
  readonly onClearDay: (day: DayKey) => void;
  readonly onRemove?: () => void;
};

export function RecipeCard({
  recipe,
  index,
  isFavorite,
  plan,
  onToggleFavorite,
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

        {onRemove && (
          <button type="button" className="card-remove" onClick={onRemove}>
            Slet egen opskrift
          </button>
        )}
      </div>
    </li>
  );
}
