// Fetches a recipe page and returns its title + image so users can add a
// recipe just by pasting a link (ønskeskyen-style).

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 600_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AftensmadBot/1.0; +https://aftensmad.app)";

const BLOCKED_HOSTS =
  /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1)/i;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const meta = (html: string, property: string): string | null => {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match) return match[1];
  }
  return null;
};

const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

export default async (req: Request): Promise<Response> => {
  const target = new URL(req.url).searchParams.get("url");
  if (!target) return json(400, { error: "Mangler url-parameter" });

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return json(400, { error: "Ugyldig adresse" });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return json(400, { error: "Kun http(s)-links understøttes" });
  }
  if (BLOCKED_HOSTS.test(url.hostname)) {
    return json(400, { error: "Adressen kan ikke hentes" });
  }

  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!response.ok) {
      return json(422, { error: `Siden svarede med ${response.status}` });
    }

    const reader = response.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      let received = 0;
      while (received < MAX_BODY_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
      }
      await reader.cancel().catch(() => {});
    }

    const ogTitle =
      meta(html, "og:title") ?? /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1];
    const ogImage = meta(html, "og:image");

    const title = ogTitle ? decodeEntities(ogTitle.trim()).slice(0, 120) : null;
    let image: string | null = null;
    if (ogImage) {
      try {
        image = new URL(decodeEntities(ogImage), url).toString();
      } catch {
        image = null;
      }
    }

    return json(200, { title, image, site: url.hostname.replace(/^www\./, "") });
  } catch {
    return json(422, { error: "Kunne ikke hente siden" });
  }
};

export const config = { path: "/api/scrape" };
