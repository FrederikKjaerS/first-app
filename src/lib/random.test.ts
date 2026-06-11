import { describe, expect, it } from "vitest";
import { pickRandom, pickRandomExcluding, shuffled } from "./random";

describe("pickRandom", () => {
  it("returns null for an empty pool", () => {
    expect(pickRandom([])).toBeNull();
  });

  it("returns the only item in a one-item pool", () => {
    expect(pickRandom(["x"])).toBe("x");
  });

  it("always returns an item from the pool", () => {
    const pool = ["a", "b", "c"];
    for (let i = 0; i < 50; i += 1) {
      expect(pool).toContain(pickRandom(pool));
    }
  });
});

describe("pickRandomExcluding", () => {
  it("never returns an excluded item when alternatives exist", () => {
    const pool = ["a", "b", "c"];
    for (let i = 0; i < 50; i += 1) {
      expect(pickRandomExcluding(pool, new Set(["a"]))).not.toBe("a");
    }
  });

  it("falls back to the full pool when everything is excluded", () => {
    expect(pickRandomExcluding(["a"], new Set(["a"]))).toBe("a");
  });

  it("returns null for an empty pool", () => {
    expect(pickRandomExcluding([], new Set())).toBeNull();
  });
});

describe("shuffled", () => {
  it("keeps all items and does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffled(input, () => 0.42);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
