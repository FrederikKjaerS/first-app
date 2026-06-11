import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

type Props = {
  readonly onClose: () => void;
};

type Mode = "login" | "signup";

export function AuthDialog({ onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const result = await signUp(email.trim(), password, username);
        if (result.error) {
          setError(result.error);
        } else if (result.needsConfirmation) {
          setConfirmationSent(true);
        } else {
          onClose();
        }
      } else {
        const result = await signIn(email.trim(), password);
        if (result.error) setError("Forkert email eller adgangskode");
        else onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Log ind eller opret konto">
      <div className="overlay-backdrop" onClick={onClose} />
      <form className="dialog" onSubmit={submit}>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Luk">
          ✕
        </button>

        {confirmationSent ? (
          <>
            <h2 className="dialog-title">Tjek din mail 📬</h2>
            <p className="dialog-sub">
              Vi har sendt et bekræftelseslink til <strong>{email}</strong>.
              Klik på det, og log derefter ind.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setConfirmationSent(false);
                  setMode("login");
                }}
              >
                Til log ind
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="dialog-title">
              {mode === "login" ? "Velkommen tilbage" : "Opret en konto"}
            </h2>
            <p className="dialog-sub">
              {mode === "login"
                ? "Log ind for at se dine opskrifter og din ugeplan."
                : "Få din egen samling — du starter med over 100 retter."}
            </p>

            {mode === "signup" && (
              <label className="field">
                <span>Brugernavn</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  placeholder="fx frederik_k"
                  pattern="[a-z0-9_]{3,20}"
                  title="3-20 tegn: små bogstaver, tal og _"
                  required
                  autoFocus
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="dig@eksempel.dk"
                required
                autoFocus={mode === "login"}
              />
            </label>

            <label className="field">
              <span>Adgangskode</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mindst 6 tegn"
                minLength={6}
                required
              />
            </label>

            {error && (
              <p className="dialog-error" role="alert">
                {error}
              </p>
            )}

            <div className="dialog-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Et øjeblik…" : mode === "login" ? "Log ind" : "Opret konto"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                }}
              >
                {mode === "login" ? "Ny her? Opret konto" : "Har du en konto? Log ind"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
