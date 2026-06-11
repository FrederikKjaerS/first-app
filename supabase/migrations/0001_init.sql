-- Aftensmad — initial schema
-- Profiles, recipes (curated defaults + user recipes), per-user recipe state,
-- week plans and follows. Everything is protected with row-level security.

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text
    check (display_name is null or char_length(display_name) <= 50),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are public"
  on public.profiles for select using (true);

create policy "users create their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---------------------------------------------------------------- recipes

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner uuid references public.profiles (id) on delete cascade, -- null = curated default
  slug text, -- stable key for curated defaults (used by local-data import)
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (category in ('Forret', 'Hovedret', 'Tilbehør', 'Dessert')),
  link text not null check (link ~ '^https?://'),
  image text not null default '' check (image = '' or image ~ '^(https?:)?/'),
  created_at timestamptz not null default now()
);

create unique index recipes_default_slug on public.recipes (slug) where owner is null;
create index recipes_owner_idx on public.recipes (owner);

alter table public.recipes enable row level security;

create policy "recipes are public"
  on public.recipes for select using (true);

create policy "users add their own recipes"
  on public.recipes for insert with check (auth.uid() = owner);

create policy "users update their own recipes"
  on public.recipes for update using (auth.uid() = owner);

create policy "users delete their own recipes"
  on public.recipes for delete using (auth.uid() = owner);

-- ----------------------------------------------------------- recipe_state
-- Per-user flags on any recipe (their own or a curated default).

create table public.recipe_state (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  favorite boolean not null default false,
  tried boolean not null default false,
  hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_state enable row level security;

create policy "users read their own state"
  on public.recipe_state for select using (auth.uid() = user_id);

create policy "users write their own state"
  on public.recipe_state for insert with check (auth.uid() = user_id);

create policy "users update their own state"
  on public.recipe_state for update using (auth.uid() = user_id);

create policy "users delete their own state"
  on public.recipe_state for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------- week_plans
-- One row per user per ISO week; past weeks double as the history.

create table public.week_plans (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week text not null check (week ~ '^\d{4}-W\d{2}$'),
  plan jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

alter table public.week_plans enable row level security;

create policy "week plans are public"
  on public.week_plans for select using (true);

create policy "users write their own week plans"
  on public.week_plans for insert with check (auth.uid() = user_id);

create policy "users update their own week plans"
  on public.week_plans for update using (auth.uid() = user_id);

create policy "users delete their own week plans"
  on public.week_plans for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------- follows

create table public.follows (
  follower uuid not null references public.profiles (id) on delete cascade,
  followee uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);

create index follows_followee_idx on public.follows (followee);

alter table public.follows enable row level security;

create policy "follows are public"
  on public.follows for select using (true);

create policy "users follow as themselves"
  on public.follows for insert with check (auth.uid() = follower);

create policy "users unfollow as themselves"
  on public.follows for delete using (auth.uid() = follower);
