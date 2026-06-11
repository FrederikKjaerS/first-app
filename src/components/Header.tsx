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
    <>
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

      {/* App-like bottom navigation, shown on phones only (see responsive.css) */}
      <nav className="tabbar" aria-label="Mobilnavigation">
        <NavLink to="/" end className={({ isActive }) => `tabbar-item ${isActive ? "is-active" : ""}`}>
          <span className="tabbar-icon" aria-hidden="true">🍳</span>
          Retter
        </NavLink>
        <NavLink to="/uge" className={({ isActive }) => `tabbar-item ${isActive ? "is-active" : ""}`}>
          <span className="tabbar-icon" aria-hidden="true">🗓️</span>
          Ugeplan
        </NavLink>
        {cloudEnabled && (
          <NavLink to="/folk" className={({ isActive }) => `tabbar-item ${isActive ? "is-active" : ""}`}>
            <span className="tabbar-icon" aria-hidden="true">👥</span>
            Folk
          </NavLink>
        )}
        <button type="button" className="tabbar-item" onClick={onAddRecipe}>
          <span className="tabbar-icon" aria-hidden="true">➕</span>
          Ny ret
        </button>
        {cloudEnabled &&
          (user && profile ? (
            <NavLink
              to={`/u/${profile.username}`}
              className={({ isActive }) => `tabbar-item ${isActive ? "is-active" : ""}`}
            >
              <span className="tabbar-icon" aria-hidden="true">👤</span>
              Profil
            </NavLink>
          ) : (
            <button type="button" className="tabbar-item" onClick={onAuth}>
              <span className="tabbar-icon" aria-hidden="true">👤</span>
              Log ind
            </button>
          ))}
      </nav>
    </>
  );
}
