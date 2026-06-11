import { supabase } from "../lib/supabase";
import type { Category, Recipe, WeekPlan } from "../types";
import type { Profile } from "../hooks/useAuth";

export type RecipeRow = {
  readonly id: string;
  readonly owner: string | null;
  readonly slug: string | null;
  readonly name: string;
  readonly category: Category;
  readonly link: string;
  readonly image: string;
};

export type StateRow = {
  readonly recipe_id: string;
  readonly favorite: boolean;
  readonly tried: boolean;
  readonly hidden: boolean;
};

const db = () => {
  if (!supabase) throw new Error("Supabase er ikke konfigureret");
  return supabase;
};

export function rowToRecipe(row: RecipeRow, userId: string | null): Recipe {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    link: row.link,
    image: row.image,
    custom: row.owner !== null && row.owner === userId,
  };
}

/** The user's collection: curated defaults + their own recipes. */
export async function fetchCollection(userId: string): Promise<{
  recipes: RecipeRow[];
  state: StateRow[];
}> {
  const [recipesRes, stateRes] = await Promise.all([
    db()
      .from("recipes")
      .select("id, owner, slug, name, category, link, image")
      .or(`owner.is.null,owner.eq.${userId}`),
    db()
      .from("recipe_state")
      .select("recipe_id, favorite, tried, hidden")
      .eq("user_id", userId),
  ]);
  if (recipesRes.error) throw recipesRes.error;
  if (stateRes.error) throw stateRes.error;
  return {
    recipes: (recipesRes.data ?? []) as RecipeRow[],
    state: (stateRes.data ?? []) as StateRow[],
  };
}

export async function insertRecipe(
  userId: string,
  recipe: Pick<Recipe, "name" | "category" | "link" | "image">,
): Promise<RecipeRow> {
  const { data, error } = await db()
    .from("recipes")
    .insert({
      owner: userId,
      name: recipe.name,
      category: recipe.category,
      link: recipe.link,
      image: recipe.image,
    })
    .select("id, owner, slug, name, category, link, image")
    .single();
  if (error) throw error;
  return data as RecipeRow;
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const { error } = await db().from("recipes").delete().eq("id", recipeId);
  if (error) throw error;
}

export async function upsertState(
  userId: string,
  recipeId: string,
  patch: Partial<Pick<StateRow, "favorite" | "tried" | "hidden">>,
  current: Omit<StateRow, "recipe_id">,
): Promise<void> {
  const { error } = await db()
    .from("recipe_state")
    .upsert({
      user_id: userId,
      recipe_id: recipeId,
      ...current,
      ...patch,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

// ------------------------------------------------------------- week plans

export async function fetchWeekPlans(userId: string): Promise<
  { week: string; plan: WeekPlan }[]
> {
  const { data, error } = await db()
    .from("week_plans")
    .select("week, plan")
    .eq("user_id", userId)
    .order("week", { ascending: false })
    .limit(53);
  if (error) throw error;
  return (data ?? []) as { week: string; plan: WeekPlan }[];
}

export async function saveWeekPlan(
  userId: string,
  week: string,
  plan: WeekPlan,
): Promise<void> {
  const { error } = await db().from("week_plans").upsert({
    user_id: userId,
    week,
    plan,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteWeekPlan(userId: string, week: string): Promise<void> {
  const { error } = await db()
    .from("week_plans")
    .delete()
    .eq("user_id", userId)
    .eq("week", week);
  if (error) throw error;
}

// ----------------------------------------------------------------- social

export async function listProfiles(limit = 100): Promise<Profile[]> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, username, display_name")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function fetchFollowing(userId: string): Promise<string[]> {
  const { data, error } = await db()
    .from("follows")
    .select("followee")
    .eq("follower", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.followee as string);
}

export async function setFollow(
  followerId: string,
  followeeId: string,
  follow: boolean,
): Promise<void> {
  if (follow) {
    const { error } = await db()
      .from("follows")
      .insert({ follower: followerId, followee: followeeId });
    if (error && error.code !== "23505") throw error; // ignore double-follow
  } else {
    const { error } = await db()
      .from("follows")
      .delete()
      .eq("follower", followerId)
      .eq("followee", followeeId);
    if (error) throw error;
  }
}

/** Public profile data: their recipes and current/recent week plans. */
export async function fetchPublicProfileData(profileId: string): Promise<{
  recipes: RecipeRow[];
  weeks: { week: string; plan: WeekPlan }[];
}> {
  const [recipesRes, weeksRes] = await Promise.all([
    db()
      .from("recipes")
      .select("id, owner, slug, name, category, link, image")
      .eq("owner", profileId)
      .order("created_at", { ascending: false }),
    db()
      .from("week_plans")
      .select("week, plan")
      .eq("user_id", profileId)
      .order("week", { ascending: false })
      .limit(4),
  ]);
  if (recipesRes.error) throw recipesRes.error;
  if (weeksRes.error) throw weeksRes.error;
  return {
    recipes: (recipesRes.data ?? []) as RecipeRow[],
    weeks: (weeksRes.data ?? []) as { week: string; plan: WeekPlan }[],
  };
}

/** Resolves arbitrary recipe ids (e.g. from someone else's plan) to rows. */
export async function fetchRecipesByIds(ids: readonly string[]): Promise<RecipeRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db()
    .from("recipes")
    .select("id, owner, slug, name, category, link, image")
    .in("id", [...new Set(ids)]);
  if (error) throw error;
  return (data ?? []) as RecipeRow[];
}

/** Maps default-recipe slugs to their database ids (for local-data import). */
export async function fetchDefaultSlugMap(): Promise<Map<string, string>> {
  const { data, error } = await db()
    .from("recipes")
    .select("id, slug")
    .is("owner", null);
  if (error) throw error;
  return new Map(
    (data ?? [])
      .filter((row) => typeof row.slug === "string")
      .map((row) => [row.slug as string, row.id as string]),
  );
}
