import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { cloudEnabled } from "../lib/supabase";

type Props = {
  readonly onAddRecipe: () => void;
  readonly onAuth: () => void;
};

export function Header({ onAddRecipe, onAuth }: Props) {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="header">
      <Link to="/" className="wordmark" aria-label="Gå til forsiden">
        <span className="wordmark-pan" aria-hidden="true">
          🍳
        </span>
        Aftensmad
      </Link>

      <nav className="nav" aria-label="Hovednavigation">
        <NavLink to="/" end className={({ isActive }) => `nav-tab ${isActive ? "is-active" : ""}`}>
          Opskrifter
        </NavLink>
        <NavLink to="/uge" className={({ isActive }) => `nav-tab ${isActive ? "is-active" : ""}`}>
          Ugeplan
        </NavLink>
        {cloudEnabled && (
          <NavLink to="/folk" className={({ isActive }) => `nav-tab ${isActive ? "is-active" : ""}`}>
            Folk
          </NavLink>
        )}
      </nav>

      <div className="header-side">
        <button type="button" className="btn btn-outline header-add" onClick={onAddRecipe}>
          + Ny opskrift
        </button>
        {cloudEnabled &&
          (user && profile ? (
            <span className="header-user">
              <Link to={`/u/${profile.username}`} className="header-username">
                @{profile.username}
              </Link>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => void signOut()}>
                Log ud
              </button>
            </span>
          ) : (
            <button type="button" className="btn btn-primary header-login" onClick={onAuth}>
              Log ind
            </button>
          ))}
      </div>
    </header>
  );
}
