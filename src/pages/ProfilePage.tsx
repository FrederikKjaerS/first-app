import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DAY_KEYS, DAY_LABELS, type WeekPlan } from "../types";
import { useAuth, type Profile } from "../hooks/useAuth";
import { cloudEnabled } from "../lib/supabase";
import { isoWeekKey, weekLabel } from "../lib/history";
import { recipeImageSrc } from "../lib/image";
import {
  fetchFollowing,
  fetchPublicProfileData,
  fetchRecipesByIds,
  getProfileByUsername,
  setFollow,
  type RecipeRow,
} from "../cloud/api";

type Props = {
  readonly onRequireAuth: () => void;
};

type ProfileData = {
  readonly profile: Profile;
  readonly recipes: readonly RecipeRow[];
  readonly weeks: readonly { week: string; plan: WeekPlan }[];
  readonly names: ReadonlyMap<string, RecipeRow>;
};

export function ProfilePage({ onRequireAuth }: Props) {
  const { username = "" } = useParams();
  const { user, signOut } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [missing, setMissing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!cloudEnabled) return;
    let cancelled = false;
    setData(null);
    setMissing(false);

    (async () => {
      const profile = await getProfileByUsername(username.toLowerCase());
      if (!profile) {
        if (!cancelled) setMissing(true);
        return;
      }
      const { recipes, weeks } = await fetchPublicProfileData(profile.id);
      const planIds = weeks.flatMap((w) => Object.values(w.plan)).filter(Boolean);
      const planRows = await fetchRecipesByIds(planIds as string[]);
      const names = new Map<string, RecipeRow>(
        [...recipes, ...planRows].map((row) => [row.id, row]),
      );
      if (user) {
        const followees = await fetchFollowing(user.id);
        if (!cancelled) setIsFollowing(followees.includes(profile.id));
      }
      if (!cancelled) setData({ profile, recipes, weeks, names });
    })().catch(() => {
      if (!cancelled) setMissing(true);
    });

    return () => {
      cancelled = true;
    };
  }, [username, user]);

  const currentWeek = isoWeekKey(new Date());
  const isOwn = user !== null && data !== null && user.id === data.profile.id;

  const thisWeek = useMemo(
    () => data?.weeks.find((w) => w.week === currentWeek) ?? null,
    [data, currentWeek],
  );
  const pastWeeks = useMemo(
    () => (data?.weeks ?? []).filter((w) => w.week !== currentWeek).slice(0, 3),
    [data, currentWeek],
  );

  if (!cloudEnabled) {
    return <p className="empty">Profiler kræver at backenden er sat op.</p>;
  }
  if (missing) {
    return <p className="empty">Brugeren @{username} findes ikke.</p>;
  }
  if (!data) {
    return <p className="empty">Henter profil…</p>;
  }

  const { profile, recipes, names } = data;

  const toggleFollow = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const willFollow = !isFollowing;
    setIsFollowing(willFollow);
    setFollow(user.id, profile.id, willFollow).catch(() => setIsFollowing(!willFollow));
  };

  const renderWeek = (week: string, plan: WeekPlan) => (
    <div key={week} className="profile-week">
      <h3 className="profile-week-title">
        {week === currentWeek ? `Denne uge (${weekLabel(week)})` : weekLabel(week)}
      </h3>
      <ul className="history-days">
        {DAY_KEYS.flatMap((day) => {
          const id = plan[day];
          const recipe = id ? names.get(id) : undefined;
          return recipe
            ? [
                <li key={day} className="history-day">
                  <span className="history-day-name">{DAY_LABELS[day].slice(0, 3)}</span>
                  <a href={recipe.link} target="_blank" rel="noreferrer">
                    {recipe.name}
                  </a>
                </li>,
              ]
            : [];
        })}
      </ul>
    </div>
  );

  return (
    <section className="profile">
      <header className="profile-head reveal">
        <span className="people-avatar people-avatar-big" aria-hidden="true">
          {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="planner-title">{profile.display_name ?? profile.username}</h1>
          <p className="planner-sub">
            @{profile.username} · {recipes.length} egne opskrifter
          </p>
        </div>
        <div className="profile-actions">
          {isOwn ? (
            <button type="button" className="btn btn-outline" onClick={() => void signOut()}>
              Log ud
            </button>
          ) : (
            <button
              type="button"
              className={`btn ${isFollowing ? "btn-outline" : "btn-primary"}`}
              onClick={toggleFollow}
            >
              {isFollowing ? "✓ Følger" : "+ Følg"}
            </button>
          )}
        </div>
      </header>

      {thisWeek && Object.keys(thisWeek.plan).length > 0 && renderWeek(thisWeek.week, thisWeek.plan)}
      {pastWeeks.map((w) => renderWeek(w.week, w.plan))}

      <h2 className="history-title profile-recipes-title">
        {isOwn ? "Dine egne opskrifter" : "Egne opskrifter"}
      </h2>
      {recipes.length === 0 ? (
        <p className="empty">Ingen egne opskrifter endnu — kun standardsamlingen.</p>
      ) : (
        <ul className="grid profile-grid">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="card">
              <a
                className="card-media"
                href={recipe.link}
                target="_blank"
                rel="noreferrer"
                aria-label={`Åbn opskriften på ${recipe.name}`}
              >
                <img src={recipeImageSrc(recipe.image)} alt="" loading="lazy" />
                <span className="card-category">{recipe.category}</span>
              </a>
              <div className="card-body">
                <a className="card-title" href={recipe.link} target="_blank" rel="noreferrer">
                  {recipe.name}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
