import { describe, expect, it } from "vitest";
import {
  archiveWeek,
  findLastEaten,
  isoWeekKey,
  planHasDays,
  removeWeek,
  weekLabel,
  weeksBetween,
} from "./history";

describe("isoWeekKey", () => {
  it("computes known ISO weeks", () => {
    expect(isoWeekKey(new Date(2026, 5, 11))).toBe("2026-W24");
    expect(isoWeekKey(new Date(2026, 0, 1))).toBe("2026-W01");
    // Dec 31 2025 is a Wednesday and belongs to 2026's first week
    expect(isoWeekKey(new Date(2025, 11, 31))).toBe("2026-W01");
    // Jan 1 2027 is a Friday and belongs to 2026's last week
    expect(isoWeekKey(new Date(2027, 0, 1))).toBe("2026-W53");
  });

  it("keeps Sunday in the same week as the preceding Monday", () => {
    expect(isoWeekKey(new Date(2026, 5, 8))).toBe("2026-W24"); // Monday
    expect(isoWeekKey(new Date(2026, 5, 14))).toBe("2026-W24"); // Sunday
    expect(isoWeekKey(new Date(2026, 5, 15))).toBe("2026-W25"); // next Monday
  });
});

describe("weekLabel", () => {
  it("formats a week key in Danish", () => {
    expect(weekLabel("2026-W04")).toBe("Uge 4 · 2026");
  });
});

describe("weeksBetween", () => {
  it("counts weeks within a year", () => {
    expect(weeksBetween("2026-W20", "2026-W24")).toBe(4);
  });
});

describe("archiveWeek", () => {
  it("prepends and replaces same-week entries without mutating", () => {
    const history = [{ week: "2026-W23", plan: { mandag: "a" } }];
    const next = archiveWeek(history, { week: "2026-W24", plan: { tirsdag: "b" } });
    expect(next.map((h) => h.week)).toEqual(["2026-W24", "2026-W23"]);
    expect(history).toHaveLength(1);

    const replaced = archiveWeek(next, { week: "2026-W24", plan: { onsdag: "c" } });
    expect(replaced).toHaveLength(2);
    expect(replaced[0].plan).toEqual({ onsdag: "c" });
  });

  it("keeps entries sorted newest first even when archiving an older week", () => {
    const history = [{ week: "2026-W23", plan: {} }];
    const next = archiveWeek(history, { week: "2026-W21", plan: {} });
    expect(next.map((h) => h.week)).toEqual(["2026-W23", "2026-W21"]);
  });

  it("caps the history length", () => {
    const history = Array.from({ length: 60 }, (_, i) => ({
      week: `2025-W${String(i + 1).padStart(2, "0")}`,
      plan: {},
    }));
    expect(archiveWeek(history, { week: "2026-W01", plan: {} })).toHaveLength(52);
  });
});

describe("removeWeek", () => {
  it("removes the matching entry", () => {
    const history = [
      { week: "2026-W24", plan: {} },
      { week: "2026-W23", plan: {} },
    ];
    expect(removeWeek(history, "2026-W23").map((h) => h.week)).toEqual([
      "2026-W24",
    ]);
  });
});

describe("planHasDays", () => {
  it("detects empty and non-empty plans", () => {
    expect(planHasDays({})).toBe(false);
    expect(planHasDays({ mandag: "a" })).toBe(true);
  });
});

describe("findLastEaten", () => {
  it("finds the most recent week containing the recipe", () => {
    const history = [
      { week: "2026-W23", plan: { mandag: "gyros" } },
      { week: "2026-W20", plan: { fredag: "gyros" } },
    ];
    expect(findLastEaten(history, "gyros")).toBe("2026-W23");
    expect(findLastEaten(history, "pizza")).toBeNull();
  });
});
