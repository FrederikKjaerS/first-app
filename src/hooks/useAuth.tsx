import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Profile = {
  readonly id: string;
  readonly username: string;
  readonly display_name: string | null;
};

type AuthApi = {
  readonly loading: boolean;
  readonly user: User | null;
  readonly profile: Profile | null;
  readonly signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  readonly signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  readonly signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthApi | null>(null);

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type EnsureResult =
  | { readonly profile: Profile }
  | { readonly profile: null; readonly deadSession: boolean };

async function ensureProfile(user: User): Promise<EnsureResult> {
  if (!supabase) return { profile: null, deadSession: false };
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return { profile: existing as Profile };

  const base =
    typeof user.user_metadata?.username === "string" &&
    USERNAME_RE.test(user.user_metadata.username)
      ? (user.user_metadata.username as string)
      : `kok${user.id.slice(0, 6)}`;

  // Retry with a suffix if the username was taken in the meantime.
  let deadSession = false;
  for (const candidate of [base, `${base}${user.id.slice(0, 4)}`]) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: user.id, username: candidate })
      .select("id, username, display_name")
      .single();
    if (!error && data) return { profile: data as Profile };
    // 23503: the auth user behind this session no longer exists.
    if (error?.code === "23503") deadSession = true;
  }
  return { profile: null, deadSession };
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [loading, setLoading] = useState(supabase !== null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    const apply = async (session: Session | null) => {
      const nextUser = session?.user ?? null;
      const result = nextUser
        ? await ensureProfile(nextUser)
        : { profile: null as Profile | null, deadSession: false };
      if (cancelled) return;
      if (result.profile === null && "deadSession" in result && result.deadSession) {
        // The account was deleted; drop the stale token instead of looping.
        void supabase?.auth.signOut();
        setUser(null);
        setProfile(null);
      } else {
        setUser(nextUser);
        setProfile(result.profile);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      if (!supabase)
        return { error: "Backend er ikke konfigureret", needsConfirmation: false };
      const cleaned = username.trim().toLowerCase();
      if (!USERNAME_RE.test(cleaned)) {
        return {
          error: "Brugernavn: 3-20 tegn, kun små bogstaver, tal og _",
          needsConfirmation: false,
        };
      }
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleaned)
        .maybeSingle();
      if (taken) return { error: "Brugernavnet er optaget", needsConfirmation: false };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: cleaned } },
      });
      if (error) return { error: error.message, needsConfirmation: false };
      return { error: null, needsConfirmation: !data.session };
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Backend er ikke konfigureret" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ loading, user, profile, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth skal bruges inden i AuthProvider");
  return ctx;
}
