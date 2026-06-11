import { useMemo } from "react";
import { DAY_KEYS, DAY_LABELS, type DayKey, type Recipe } from "../types";
import type { WeekPlanApi } from "../dataApi";
import { todayKey } from "../lib/week";
import { pickRandomExcluding } from "../lib/random";
import { recipeImageSrc } from "../lib/image";
import { useStoredState } from "../hooks/useStoredState";
import { WeekHistory } from "./WeekHistory";
import { weekLabel } from "../lib/history";

type Props = {
  readonly recipes: readonly Recipe[];
  readonly tried: ReadonlySet<string>;
  readonly weekPlan: WeekPlanApi;
  readonly onChooseDay: (day: DayKey) => void;
  readonly onSpin: () => void;
  readonly onSwipe: () => void;
};

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

export function WeekPlanner({
  recipes,
  tried,
  weekPlan,
  onChooseDay,
  onSpin,
  onSwipe,
}: Props) {
  const { plan, assign, clear, reset, fill, history } = weekPlan;
  const [onlyTried, setOnlyTried] = useStoredState(
    "planner-only-tried",
    true,
    isBoolean,
  );
  const today = todayKey();
  const recipeById = useMemo(
    () => new Map(recipes.map((r) => [r.id, r])),
    [recipes],
  );
  const poolIds = useMemo(() => {
    const pool = onlyTried ? recipes.filter((r) => tried.has(r.id)) : recipes;
    return (pool.length > 0 ? pool : recipes).map((r) => r.id);
  }, [recipes, tried, onlyTried]);
  const plannedCount = DAY_KEYS.filter((day) => plan[day]).length;

  const shuffleDay = (day: DayKey) => {
    const used = new Set(
      Object.values(plan).filter((id): id is string => Boolean(id)),
    );
    const next = pickRandomExcluding(poolIds, used);
    if (next) assign(day, next);
  };

  return (
    <section className="planner">
      <header className="planner-head reveal">
        <div>
          <h1 className="planner-title">Ugens plan</h1>
          <p className="planner-sub">
            {weekLabel(weekPlan.weekKey)} ·{" "}
            {plannedCount === 7
              ? "hele ugen er på plads — flot klaret!"
              : `${plannedCount} af 7 aftener planlagt`}
          </p>
        </div>
        <div className="planner-actions">
          <button type="button" className="btn btn-primary" onClick={onSwipe}>
            🔥 Swipe ugen
          </button>
          <button type="button" className="btn btn-outline" onClick={() => fill(poolIds)}>
            🎲 Udfyld ugen
          </button>
          <button type="button" className="btn btn-ghost" onClick={onSpin}>
            Træk én ret
          </button>
          {plannedCount > 0 && (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Ryd ugen
            </button>
          )}
          <label className="planner-toggle">
            <input
              type="checkbox"
              checked={onlyTried}
              onChange={(event) => setOnlyTried(event.target.checked)}
            />
            Kun afprøvede retter
          </label>
        </div>
      </header>

      <ol className="week">
        {DAY_KEYS.map((day, index) => {
          const plannedId = plan[day];
          const recipe = plannedId ? recipeById.get(plannedId) : undefined;
          return (
            <li
              key={day}
              className={`day ${day === today ? "is-today" : ""} ${recipe ? "has-recipe" : ""}`}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="day-head">
                <span className="day-name">{DAY_LABELS[day]}</span>
                {day === today && <span className="day-today">i dag</span>}
              </div>

              {recipe ? (
                <div className="day-recipe">
                  <a
                    className="day-media"
                    href={recipe.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Åbn opskriften på ${recipe.name}`}
                  >
                    <img src={recipeImageSrc(recipe.image)} alt="" loading="lazy" />
                  </a>
                  <a className="day-recipe-name" href={recipe.link} target="_blank" rel="noreferrer">
                    {recipe.name}
                  </a>
                  <div className="day-tools">
                    <button
                      type="button"
                      className="day-tool"
                      onClick={() => shuffleDay(day)}
                      title="Byt til en tilfældig ret"
                      aria-label={`Byt retten ${DAY_LABELS[day]}`}
                    >
                      🎲
                    </button>
                    <button
                      type="button"
                      className="day-tool"
                      onClick={() => onChooseDay(day)}
                      title="Vælg en bestemt ret"
                      aria-label={`Vælg ret til ${DAY_LABELS[day]}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="day-tool"
                      onClick={() => clear(day)}
                      title="Fjern retten"
                      aria-label={`Fjern retten fra ${DAY_LABELS[day]}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="day-empty">
                  <button type="button" className="day-pick" onClick={() => onChooseDay(day)}>
                    + Vælg ret
                  </button>
                  <button
                    type="button"
                    className="day-pick day-pick-dice"
                    onClick={() => shuffleDay(day)}
                    title="Tilfældig ret"
                    aria-label={`Tilfældig ret til ${DAY_LABELS[day]}`}
                  >
                    🎲
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <WeekHistory
        history={history}
        recipesById={recipeById}
        onReuse={weekPlan.reuseWeek}
        onDelete={weekPlan.deleteHistoryEntry}
      />
    </section>
  );
}
