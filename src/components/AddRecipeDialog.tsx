import { useEffect, useState, type FormEvent } from "react";
import type { Category, Recipe } from "../types";
import { CATEGORIES } from "../data/recipes";

type Props = {
  readonly existingIds: ReadonlySet<string>;
  readonly onAdd: (recipe: Recipe) => void;
  readonly onClose: () => void;
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export function AddRecipeDialog({ existingIds, onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Hovedret");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
  const [hasTried, setHasTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchFromLink = async () => {
    if (!isValidUrl(link.trim())) {
      setError("Indsæt et gyldigt link først, fx https://www.valdemarsro.dk/…");
      return;
    }
    setFetching(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/scrape?url=${encodeURIComponent(link.trim())}`,
      );
      const data: { title?: string | null; image?: string | null; error?: string } =
        await response.json();
      if (!response.ok) {
        setError(data.error ?? "Kunne ikke hente siden");
        return;
      }
      if (data.title && !name.trim()) setName(data.title);
      if (data.image) setImage(data.image);
      if (!data.title && !data.image) {
        setError("Siden havde hverken titel eller billede at hente.");
      }
    } catch {
      setError("Kunne ikke hente info fra linket lige nu.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Giv retten et navn (mindst 2 tegn).");
      return;
    }
    if (!isValidUrl(link.trim())) {
      setError("Linket skal være en gyldig adresse, fx https://www.valdemarsro.dk/…");
      return;
    }
    if (image.trim() && !isValidUrl(image.trim())) {
      setError("Billed-linket ser ikke ud til at være en gyldig adresse.");
      return;
    }

    const base = slugify(trimmedName) || "ret";
    const id = existingIds.has(base) ? `${base}-${Date.now()}` : base;

    onAdd({
      id,
      name: trimmedName,
      category,
      link: link.trim(),
      image: image.trim(),
      tried: hasTried,
      custom: true,
    });
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Tilføj ny opskrift">
      <div className="overlay-backdrop" onClick={onClose} />
      <form className="dialog" onSubmit={submit}>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Luk">
          ✕
        </button>
        <h2 className="dialog-title">Ny opskrift</h2>
        <p className="dialog-sub">
          Indsæt et link og lad os hente navn og billede — eller udfyld selv.
        </p>

        <label className="field">
          <span>Link til opskriften</span>
          <div className="field-link">
            <input
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://…"
              autoFocus
              required
            />
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={fetchFromLink}
              disabled={fetching}
            >
              {fetching ? "Henter…" : "✨ Hent info"}
            </button>
          </div>
        </label>

        <label className="field">
          <span>Navn</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Fx farmors frikadeller"
            required
          />
        </label>

        <label className="field">
          <span>Kategori</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Billede-link (valgfrit)</span>
          <input
            type="url"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="https://…/billede.jpg"
          />
        </label>

        <label className="field field-check">
          <input
            type="checkbox"
            checked={hasTried}
            onChange={(event) => setHasTried(event.target.checked)}
          />
          <span>Jeg har allerede prøvet og godkendt retten</span>
        </label>

        {error && (
          <p className="dialog-error" role="alert">
            {error}
          </p>
        )}

        <div className="dialog-actions">
          <button type="submit" className="btn btn-primary">
            Gem opskrift
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annullér
          </button>
        </div>
      </form>
    </div>
  );
}
