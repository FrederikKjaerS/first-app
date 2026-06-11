import { describe, expect, it } from "vitest";
import { DAY_KEYS, type WeekPlan } from "../types";
import {
  assignDay,
  clearDay,
  clearWeek,
  fillWeek,
  pruneWeek,
  todayKey,
} from "./week";

const seededRng = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

describe("assignDay", () => {
  it("assigns a recipe without mutating the original plan", () => {
    const plan: WeekPlan = { mandag: "gyros" };
    const next = assignDay(plan, "tirsdag", "lasagne");
    expect(next).toEqual({ mandag: "gyros", tirsdag: "lasagne" });
    expect(plan).toEqual({ mandag: "gyros" });
  });

  it("overwrites an existing assignment", () => {
    expect(assignDay({ mandag: "gyros" }, "mandag", "pita")).toEqual({
      mandag: "pita",
    });
  });
});

describe("clearDay", () => {
  it("removes only the given day", () => {
    const plan: WeekPlan = { mandag: "gyros", fredag: "lasagne" };
    expect(clearDay(plan, "mandag")).toEqual({ fredag: "lasagne" });
    expect(plan.mandag).toBe("gyros");
  });
});

describe("clearWeek", () => {
  it("returns an empty plan", () => {
    expect(clearWeek()).toEqual({});
  });
});

describe("fillWeek", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("fills every empty day", () => {
    const filled = fillWeek({}, ids, seededRng(7));
    expect(DAY_KEYS.every((day) => typeof filled[day] === "string")).toBe(true);
  });

  it("keeps existing assignments", () => {
    const filled = fillWeek({ onsdag: "x" }, ids, seededRng(7));
    expect(filled.onsdag).toBe("x");
  });

  it("avoids repeats when the pool is large enough", () => {
    const filled = fillWeek({}, ids, seededRng(13));
    const values = DAY_KEYS.map((day) => filled[day]);
    expect(new Set(values).size).toBe(7);
  });

  it("still fills the week when the pool is smaller than seven", () => {
    const filled = fillWeek({}, ["a", "b"], seededRng(3));
    expect(DAY_KEYS.every((day) => filled[day] === "a" || filled[day] === "b")).toBe(
      true,
    );
  });

  it("returns the plan unchanged for an empty pool", () => {
    expect(fillWeek({ mandag: "a" }, [], seededRng(1))).toEqual({ mandag: "a" });
  });
});

describe("pruneWeek", () => {
  it("drops ids that no longer exist", () => {
    const plan: WeekPlan = { mandag: "findes", tirsdag: "slettet" };
    expect(pruneWeek(plan, new Set(["findes"]))).toEqual({ mandag: "findes" });
  });

  it("returns the same plan when everything is valid", () => {
    const plan: WeekPlan = { mandag: "a" };
    expect(pruneWeek(plan, new Set(["a"]))).toBe(plan);
  });
});

describe("todayKey", () => {
  it("maps Monday to mandag", () => {
    expect(todayKey(new Date("2026-06-08T12:00:00"))).toBe("mandag");
  });

  it("maps Sunday to soendag", () => {
    expect(todayKey(new Date("2026-06-14T12:00:00"))).toBe("soendag");
  });
});
