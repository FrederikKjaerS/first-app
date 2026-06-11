export type View = "retter" | "uge";

type Props = {
  readonly view: View;
  readonly onViewChange: (view: View) => void;
  readonly onAddRecipe: () => void;
};

export function Header({ view, onViewChange, onAddRecipe }: Props) {
  return (
    <header className="header">
      <button
        type="button"
        className="wordmark"
        onClick={() => onViewChange("retter")}
        aria-label="Gå til forsiden"
      >
        <span className="wordmark-pan" aria-hidden="true">
          🍳
        </span>
        Aftensmad
      </button>

      <nav className="nav" aria-label="Hovednavigation">
        <button
          type="button"
          className={`nav-tab ${view === "retter" ? "is-active" : ""}`}
          onClick={() => onViewChange("retter")}
        >
          Opskrifter
        </button>
        <button
          type="button"
          className={`nav-tab ${view === "uge" ? "is-active" : ""}`}
          onClick={() => onViewChange("uge")}
        >
          Ugeplan
        </button>
      </nav>

      <button type="button" className="btn btn-outline header-add" onClick={onAddRecipe}>
        + Ny opskrift
      </button>
    </header>
  );
}
