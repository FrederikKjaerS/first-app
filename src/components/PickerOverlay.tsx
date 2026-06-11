import { useEffect, useMemo, useRef, useState } from "react";
import { DAY_KEYS, DAY_LABELS, type DayKey, type Recipe } from "../types";
import { pickRandomExcluding, shuffled } from "../lib/random";
import { recipeImageSrc } from "../lib/image";

type Props = {
  readonly recipes: readonly Recipe[];
  readonly favorites: ReadonlySet<string>;
  readonly onAssignDay: (day: DayKey, recipeId: string) => void;
  readonly onClose: () => void;
};

type Phase = "spinning" | "settled";

const SPIN_START_MS = 65;
const SPIN_GROWTH = 1.16;
const SPIN_END_MS = 420;

export function PickerOverlay({ recipes, favorites, onAssignDay, onClose }: Props) {
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [phase, setPhase] = useState<Phase>("spinning");
  const [current, setCurrent] = useState<Recipe | null>(null);
  const [round, setRound] = useState(0);
  const [plannedDay, setPlannedDay] = useState<DayKey | null>(null);
  const previousPick = useRef<Recipe | null>(null);

  const pool = useMemo(() => {
    const filtered = onlyFavorites
      ? recipes.filter((r) => favorites.has(r.id))
      : recipes;
    return filtered.length > 0 ? filtered : recipes;
  }, [recipes, favorites, onlyFavorites]);

  useEffect(() => {
    if (pool.length === 0) return;
    setPhase("spinning");
    setPlannedDay(null);

    const sequence = shuffled(pool);
    let index = 0;
    let delay = SPIN_START_MS;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setCurrent(sequence[index % sequence.length]);
      index += 1;
      delay *= SPIN_GROWTH;
      if (delay < SPIN_END_MS) {
        timer = setTimeout(tick, delay);
      } else {
        const excluded = new Set(
          previousPick.current ? [previousPick.current] : [],
        );
        const final = pickRandomExcluding(pool, excluded);
        if (final) {
          previousPick.current = final;
          setCurrent(final);
        }
        setPhase("settled");
      }
    };

    timer = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pool, round]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!current) return null;

  const settled = phase === "settled";

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Træk en ret">
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="picker">
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Luk">
          ✕
        </button>

        <p className="picker-kicker">
          {settled ? "Skæbnen har talt" : "Trækker en ret…"}
        </p>

        <div className={`picker-card ${settled ? "is-settled" : "is-spinning"}`}>
          <div className="picker-media">
            <img src={recipeImageSrc(current.image)} alt="" key={current.id} />
          </div>
          <h2 className="picker-name">{current.name}</h2>
        </div>

        {settled ? (
          <div className="picker-actions">
            <a
              className="btn btn-primary btn-big"
              href={current.link}
              target="_blank"
              rel="noreferrer"
            >
              Den tager vi! Åbn opskriften →
            </a>
            <button
              type="button"
              className="btn btn-outline btn-big"
              onClick={() => setRound((r) => r + 1)}
            >
              🎲 Træk igen
            </button>

            <div className="picker-plan">
              <span className="picker-plan-label">…eller sæt den på ugeplanen:</span>
              <div className="picker-plan-days">
                {DAY_KEYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`daydot daydot-big ${plannedDay === day ? "is-on" : ""}`}
                    onClick={() => {
                      onAssignDay(day, current.id);
                      setPlannedDay(day);
                    }}
                    aria-label={`Sæt på ${DAY_LABELS[day]}`}
                  >
                    {DAY_LABELS[day].charAt(0)}
                  </button>
                ))}
              </div>
              {plannedDay && (
                <p className="picker-plan-confirm" role="status">
                  ✓ {current.name} står nu på {DAY_LABELS[plannedDay].toLowerCase()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="picker-wait">trommehvirvel…</p>
        )}

        {favorites.size > 0 && (
          <label className="picker-favtoggle">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(event) => setOnlyFavorites(event.target.checked)}
            />
            Træk kun blandt favoritter
          </label>
        )}
      </div>
    </div>
  );
}
