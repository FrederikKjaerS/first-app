export function pickRandom<T>(
  pool: readonly T[],
  rng: () => number = Math.random,
): T | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

export function pickRandomExcluding<T>(
  pool: readonly T[],
  excluded: ReadonlySet<T>,
  rng: () => number = Math.random,
): T | null {
  const available = pool.filter((item) => !excluded.has(item));
  return pickRandom(available.length > 0 ? available : pool, rng);
}

export function shuffled<T>(
  items: readonly T[],
  rng: () => number = Math.random,
): readonly T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
