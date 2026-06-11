import { describe, expect, it } from "vitest";
import { isTried, toggleTried } from "./tried";

describe("isTried", () => {
  it("uses the baked-in flag when there is no override", () => {
    expect(isTried({ id: "a", tried: true }, new Set())).toBe(true);
    expect(isTried({ id: "b", tried: false }, new Set())).toBe(false);
    expect(isTried({ id: "c" }, new Set())).toBe(false);
  });

  it("flips the baked-in flag when an override exists", () => {
    expect(isTried({ id: "a", tried: true }, new Set(["a"]))).toBe(false);
    expect(isTried({ id: "b", tried: false }, new Set(["b"]))).toBe(true);
    expect(isTried({ id: "c" }, new Set(["c"]))).toBe(true);
  });
});

describe("toggleTried", () => {
  it("adds an id that is not overridden, without mutating", () => {
    const overrides = ["x"];
    expect(toggleTried(overrides, "y")).toEqual(["x", "y"]);
    expect(overrides).toEqual(["x"]);
  });

  it("removes an id that is already overridden", () => {
    expect(toggleTried(["x", "y"], "x")).toEqual(["y"]);
  });

  it("double toggle is a no-op", () => {
    expect(toggleTried(toggleTried([], "a"), "a")).toEqual([]);
  });
});
