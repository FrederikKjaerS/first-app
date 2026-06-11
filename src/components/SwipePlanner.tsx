import { useEffect, useMemo, useRef, useState } from "react";
import { DAY_KEYS, DAY_LABELS, type DayKey, type Recipe } from "../types";
import type { WeekPlanApi } from "../hooks/useWeekPlan";
import { shuffled } from "../lib/random";
import { findLastEaten, weekLabel, weeksBetween } from "../lib/history";
import { recipeImageSrc } from "../lib/image";

type Props = {
  readonly recipes: readonly Recipe[];
  readonly tried: ReadonlySet<string>;
  readonly favorites: ReadonlySet<string>;
  readonly weekPlan: WeekPlanApi;
  readonly onShowWeek: () => void;
  readonly onClose: () => void;
};

type Action = { readonly kind: "yes" | "no"; readonly day: DayKey | null };
type Leaving = "left" | "right" | null;

const SWIPE_THRESHOLD = 90;
const FLY_OUT_MS = 240;

export function SwipePlanner({
  recipes,
  tried,
  favorites,
  weekPlan,
  onShowWeek,
  onClose,
}: Props) {
  const { plan, history, assign, clear } = weekPlan;
  const [onlyTried, setOnlyTried] = useState(false);
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [actions, setActions] = useState<readonly Action[]>([]);
  const [leaving, setLeaving] = useState<Leaving>(null);
  const [drag, setDrag] = useState<{ x: number; active: boolean }>({
    x: 0,
    active: false,
  });
  const dragStart = useRef(0);
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deck = useMemo(() => {
    const planned = new Set(Object.values(plan).filter(Boolean));
    const pool = recipes.filter(
      (r) => !planned.has(r.id) && (!onlyTried || tried.has(r.id)),
    );
    return shuffled(pool.length > 0 ? pool : recipes);
    // The deck is rebuilt per round, not per assignment — index handles progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, onlyTried, round]);

  const emptyDays = DAY_KEYS.filter((day) => !plan[day]);
  const targetDay = emptyDays[0] ?? null;
  const plannedIds = useMemo(
    () => new Set(Object.values(plan).filter(Boolean)),
    [plan],
  );

  // Skip cards that got planned through earlier right-swipes this round.
  let cursor = index;
  while (cursor < deck.length && plannedIds.has(deck[cursor].id)) cursor += 1;
  const current = cursor < deck.length ? deck[cursor] : null;
  const next = deck.slice(cursor + 1).find((r) => !plannedIds.has(r.id)) ?? null;

  const done = targetDay === null;
  const exhausted = !done && current === null;

  const commit = (kind: "yes" | "no") => {
    if (!current || !targetDay || leaving) return;
    setLeaving(kind === "yes" ? "right" : "left");
    flyTimer.current = setTimeout(() => {
      if (kind === "yes") assign(targetDay, current.id);
      setActions((a) => [...a, { kind, day: kind === "yes" ? targetDay : null }]);
      setIndex(cursor + 1);
      setLeaving(null);
      setDrag({ x: 0, active: false });
    }, FLY_OUT_MS);
  };

  const undo = () => {
    if (actions.length === 0 || leaving) return;
    const last = actions[actions.length - 1];
    if (last.kind === "yes" && last.day) clear(last.day);
    setActions((a) => a.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  };

  useEffect(
    () => () => {
      if (flyTimer.current) clearTimeout(flyTimer.current);
    },
    [],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") commit("yes");
      if (event.key === "ArrowLeft") commit("no");
      if (event.key === "Backspace") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onPointerDown = (event: React.PointerEvent) => {
    if (leaving) return;
    dragStart.current = event.clientX;
    setDrag({ x: 0, active: true });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.active || leaving) return;
    setDrag({ x: event.clientX - dragStart.current, active: true });
  };

  const onPointerUp = () => {
    if (!drag.active || leaving) return;
    if (drag.x > SWIPE_THRESHOLD) commit("yes");
    else if (drag.x < -SWIPE_THRESHOLD) commit("no");
    else setDrag({ x: 0, active: false });
  };

  const lastEatenWeek = current ? findLastEaten(history, current.id) : null;

  const cardStyle = leaving
    ? {
        transform: `translateX(${leaving === "right" ? 640 : -640}px) rotate(${leaving === "right" ? 24 : -24}deg)`,
        opacity: 0,
        transition: `transform ${FLY_OUT_MS}ms ease-in, opacity ${FLY_OUT_MS}ms ease-in`,
      }
    : {
        transform: `translateX(${drag.x}px) rotate(${drag.x / 18}deg)`,
        transition: drag.active ? "none" : "transform 0.25s ease",
      };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Swipe ugen">
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="swiper">
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Luk">
          ✕
        </button>

        <div className="swiper-progress" aria-label="Ugens fremgang">
          {DAY_KEYS.map((day) => {
            const filled = Boolean(plan[day]);
            const isTarget = day === targetDay;
            return (
              <span
                key={day}
                className={`swiper-day ${filled ? "is-filled" : ""} ${isTarget ? "is-target" : ""}`}
                title={DAY_LABELS[day]}
              >
                {filled ? "✓" : DAY_LABELS[day].charAt(0)}
              </span>
            );
          })}
        </div>

        {done ? (
          <div className="swiper-done">
            <p className="swiper-done-mark" aria-hidden="true">🎉</p>
            <h2 className="swiper-title">Ugen er klar!</h2>
            <ul className="swiper-summary">
              {DAY_KEYS.map((day) => {
                const recipe = recipes.find((r) => r.id === plan[day]);
                return recipe ? (
                  <li key={day}>
                    <span>{DAY_LABELS[day]}</span> {recipe.name}
                  </li>
                ) : null;
              })}
            </ul>
            <div className="swiper-done-actions">
              <button type="button" className="btn btn-primary btn-big" onClick={onShowWeek}>
                Se & justér ugeplanen →
              </button>
              <button type="button" className="btn btn-ghost" onClick={undo}>
                ↩ Fortryd sidste
              </button>
            </div>
          </div>
        ) : exhausted ? (
          <div className="swiper-done">
            <h2 className="swiper-title">Ikke flere retter i bunken</h2>
            <p className="swiper-empty-sub">
              Du har swipet dig igennem alle{onlyTried ? " afprøvede" : ""} retter.
            </p>
            <div className="swiper-done-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setIndex(0);
                  setActions([]);
                  setRound((r) => r + 1);
                }}
              >
                🔄 Bland bunken igen
              </button>
              {onlyTried && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setOnlyTried(false);
                    setIndex(0);
                    setRound((r) => r + 1);
                  }}
                >
                  Tag de nye idéer med
                </button>
              )}
            </div>
          </div>
        ) : (
          current &&
          targetDay && (
            <>
              <p className="swiper-kicker">
                Hvad skal I spise{" "}
                <strong>{DAY_LABELS[targetDay].toLowerCase()}</strong>?
              </p>

              <div className="swiper-stack">
                {next && (
                  <div className="swiper-card swiper-card-behind" aria-hidden="true">
                    <img src={recipeImageSrc(next.image)} alt="" />
                  </div>
                )}
                <div
                  className="swiper-card"
                  style={cardStyle}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <div className="swiper-media">
                    <img src={recipeImageSrc(current.image)} alt="" draggable={false} />
                    <span
                      className="swiper-verdict swiper-verdict-yes"
                      style={{ opacity: Math.max(0, Math.min(1, drag.x / 100)) }}
                    >
                      DEN!
                    </span>
                    <span
                      className="swiper-verdict swiper-verdict-no"
                      style={{ opacity: Math.max(0, Math.min(1, -drag.x / 100)) }}
                    >
                      NÆH
                    </span>
                  </div>
                  <div className="swiper-info">
                    <h2 className="swiper-name">{current.name}</h2>
                    <p className="swiper-meta">
                      <span className={tried.has(current.id) ? "swiper-tag-tried" : "swiper-tag-new"}>
                        {tried.has(current.id) ? "✓ Afprøvet" : "Ny idé"}
                      </span>
                      <span>{current.category}</span>
                      {favorites.has(current.id) && <span>♥ Favorit</span>}
                    </p>
                    {lastEatenWeek && (
                      <p className="swiper-lasteaten">
                        I fik den for {weeksBetween(lastEatenWeek, weekPlan.weekKey)}{" "}
                        uger siden ({weekLabel(lastEatenWeek)})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="swiper-controls">
                <button
                  type="button"
                  className="swiper-btn swiper-btn-no"
                  onClick={() => commit("no")}
                  aria-label="Spring retten over"
                >
                  ✕
                </button>
                <button
                  type="button"
                  className="swiper-btn swiper-btn-undo"
                  onClick={undo}
                  disabled={actions.length === 0}
                  aria-label="Fortryd sidste swipe"
                >
                  ↩
                </button>
                <button
                  type="button"
                  className="swiper-btn swiper-btn-yes"
                  onClick={() => commit("yes")}
                  aria-label={`Sæt retten på ${DAY_LABELS[targetDay]}`}
                >
                  ♥
                </button>
              </div>

              <label className="picker-favtoggle swiper-toggle">
                <input
                  type="checkbox"
                  checked={onlyTried}
                  onChange={(event) => {
                    setOnlyTried(event.target.checked);
                    setIndex(0);
                    setRound((r) => r + 1);
                  }}
                />
                Kun afprøvede retter
              </label>
            </>
          )
        )}
      </div>
    </div>
  );
}
