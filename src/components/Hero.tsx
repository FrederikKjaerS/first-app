type Props = {
  readonly triedCount: number;
  readonly newCount: number;
  readonly onSpin: () => void;
  readonly onSwipe: () => void;
  readonly onPlanWeek: () => void;
};

export function Hero({ triedCount, newCount, onSpin, onSwipe, onPlanWeek }: Props) {
  return (
    <section className="hero">
      <p className="hero-kicker reveal">
        Frederiks private kogebog · {triedCount} afprøvede retter · {newCount} nye
        idéer
      </p>
      <h1 className="hero-title">
        <span className="reveal d1">Hvad skal vi</span>
        <span className="hero-title-accent reveal d2">
          spise i aften<span className="hero-q">?</span>
        </span>
      </h1>
      <p className="hero-sub reveal d3">
        Alle yndlingsretterne samlet ét sted. Lad skæbnen vælge,
        eller læg ugens plan på under et minut.
      </p>
      <div className="hero-actions reveal d4">
        <button type="button" className="btn btn-primary btn-big" onClick={onSwipe}>
          <span aria-hidden="true">🔥</span> Swipe ugen
        </button>
        <button type="button" className="btn btn-outline btn-big" onClick={onSpin}>
          <span className="dice" aria-hidden="true">🎲</span> Træk en ret
        </button>
        <button type="button" className="btn btn-outline btn-big" onClick={onPlanWeek}>
          Planlæg ugen →
        </button>
      </div>
      <div className="hero-rule" aria-hidden="true">
        <span>✦</span>
      </div>
    </section>
  );
}
