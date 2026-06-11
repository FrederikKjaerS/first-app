import { useState } from "react";
import {
  DAY_KEYS,
  DAY_LABELS,
  type Recipe,
  type WeekHistoryEntry,
} from "../types";
import { weekLabel } from "../lib/history";

type Props = {
  readonly history: readonly WeekHistoryEntry[];
  readonly recipesById: ReadonlyMap<string, Recipe>;
  readonly onReuse: (entry: WeekHistoryEntry) => void;
  readonly onDelete: (weekKey: string) => void;
};

export function WeekHistory({ history, recipesById, onReuse, onDelete }: Props) {
  const [expanded, setExpanded] = useState<string | null>(
    history[0]?.week ?? null,
  );

  if (history.length === 0) return null;

  return (
    <section className="history" aria-label="Tidligere uger">
      <h2 className="history-title">Tidligere uger</h2>
      <p className="history-sub">
        Ugeplanen arkiveres automatisk her, når en ny uge begynder.
      </p>
      <ul className="history-list">
        {history.map((entry) => {
          const isOpen = expanded === entry.week;
          const dishes = DAY_KEYS.flatMap((day) => {
            const id = entry.plan[day];
            const recipe = id ? recipesById.get(id) : undefined;
            return recipe ? [{ day, recipe }] : [];
          });
          return (
            <li key={entry.week} className={`history-week ${isOpen ? "is-open" : ""}`}>
              <button
                type="button"
                className="history-head"
                onClick={() => setExpanded(isOpen ? null : entry.week)}
                aria-expanded={isOpen}
              >
                <span className="history-week-label">{weekLabel(entry.week)}</span>
                <span className="history-count">{dishes.length} retter</span>
                <span className="history-chevron" aria-hidden="true">
                  {isOpen ? "▴" : "▾"}
                </span>
              </button>

              {isOpen && (
                <div className="history-body">
                  <ul className="history-days">
                    {dishes.map(({ day, recipe }) => (
                      <li key={day} className="history-day">
                        <span className="history-day-name">
                          {DAY_LABELS[day].slice(0, 3)}
                        </span>
                        <a href={recipe.link} target="_blank" rel="noreferrer">
                          {recipe.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div className="history-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => onReuse(entry)}
                    >
                      ↻ Brug ugen igen
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => onDelete(entry.week)}
                    >
                      Slet
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
