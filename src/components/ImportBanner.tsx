import { useState } from "react";
import { hasLocalData, importLocalData } from "../cloud/importLocal";

type Props = {
  readonly userId: string;
  readonly onImported: () => void;
};

export function ImportBanner({ userId, onImported }: Props) {
  const [visible, setVisible] = useState(() => hasLocalData());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  if (!visible) return null;

  const run = async () => {
    setBusy(true);
    try {
      const moved = await importLocalData(userId);
      setResult(moved);
      onImported();
      setTimeout(() => setVisible(false), 4000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="import-banner" role="status">
      {result !== null ? (
        <span>✓ {result} ting flyttet til din konto — velbekomme!</span>
      ) : (
        <>
          <span>
            Du har lokale data fra gæstetilstand (favoritter, ugeplaner eller egne
            opskrifter). Vil du flytte dem til din konto?
          </span>
          <span className="import-banner-actions">
            <button type="button" className="btn btn-primary btn-small" onClick={run} disabled={busy}>
              {busy ? "Flytter…" : "Flyt mine data"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => setVisible(false)}
            >
              Ikke nu
            </button>
          </span>
        </>
      )}
    </div>
  );
}
