import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, type Profile } from "../hooks/useAuth";
import { cloudEnabled } from "../lib/supabase";
import { fetchFollowing, listProfiles, setFollow } from "../cloud/api";

type Props = {
  readonly onRequireAuth: () => void;
};

export function PeoplePage({ onRequireAuth }: Props) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<readonly Profile[]>([]);
  const [following, setFollowing] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cloudEnabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([listProfiles(), user ? fetchFollowing(user.id) : Promise.resolve([])])
      .then(([allProfiles, followees]) => {
        if (cancelled) return;
        setProfiles(allProfiles);
        setFollowing(new Set(followees));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const others = profiles.filter((p) => p.id !== user?.id);
    const filtered = q
      ? others.filter(
          (p) =>
            p.username.includes(q) ||
            (p.display_name ?? "").toLowerCase().includes(q),
        )
      : others;
    return [...filtered].sort((a, b) => {
      const aFollowed = following.has(a.id) ? 0 : 1;
      const bFollowed = following.has(b.id) ? 0 : 1;
      return aFollowed - bFollowed || a.username.localeCompare(b.username);
    });
  }, [profiles, query, user, following]);

  const toggleFollow = (profileId: string) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const willFollow = !following.has(profileId);
    setFollowing((current) => {
      const next = new Set(current);
      if (willFollow) next.add(profileId);
      else next.delete(profileId);
      return next;
    });
    setFollow(user.id, profileId, willFollow).catch(() => {
      setFollowing((current) => {
        const next = new Set(current);
        if (willFollow) next.delete(profileId);
        else next.add(profileId);
        return next;
      });
    });
  };

  if (!cloudEnabled) {
    return (
      <p className="empty">
        Fællesskabet kræver at backenden er sat op — kig i README'en.
      </p>
    );
  }

  return (
    <section className="people">
      <header className="people-head reveal">
        <div>
          <h1 className="planner-title">Folk</h1>
          <p className="planner-sub">
            Følg andre og lad dig inspirere af deres opskrifter og ugeplaner.
          </p>
        </div>
        <input
          type="search"
          className="search"
          placeholder="Søg efter brugernavn…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Søg efter brugere"
        />
      </header>

      {loading ? (
        <p className="empty">Henter folk…</p>
      ) : visible.length === 0 ? (
        <p className="empty">
          {query
            ? "Ingen brugere matcher søgningen."
            : "Her er stadig tomt — inviter nogen til at oprette en konto!"}
        </p>
      ) : (
        <ul className="people-list">
          {visible.map((p) => (
            <li key={p.id} className="people-card">
              <Link to={`/u/${p.username}`} className="people-identity">
                <span className="people-avatar" aria-hidden="true">
                  {(p.display_name ?? p.username).charAt(0).toUpperCase()}
                </span>
                <span>
                  <span className="people-name">{p.display_name ?? p.username}</span>
                  <span className="people-username">@{p.username}</span>
                </span>
              </Link>
              <button
                type="button"
                className={`btn btn-small ${following.has(p.id) ? "btn-outline" : "btn-primary"}`}
                onClick={() => toggleFollow(p.id)}
              >
                {following.has(p.id) ? "✓ Følger" : "+ Følg"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
