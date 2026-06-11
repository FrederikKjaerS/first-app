import { describe, expect, it } from "vitest";
import { readJson, writeJson } from "./storage";

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    dump: () => data,
  };
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

describe("storage", () => {
  it("round-trips a value", () => {
    const storage = memoryStorage();
    writeJson("favs", ["a", "b"], storage);
    expect(readJson("favs", [], isStringArray, storage)).toEqual(["a", "b"]);
  });

  it("returns the fallback when nothing is stored", () => {
    expect(readJson("missing", ["fallback"], isStringArray, memoryStorage())).toEqual(
      ["fallback"],
    );
  });

  it("returns the fallback for corrupted JSON", () => {
    const storage = memoryStorage();
    storage.setItem("aftensmad:bad", "{not json");
    expect(readJson("bad", [], isStringArray, storage)).toEqual([]);
  });

  it("returns the fallback when validation fails", () => {
    const storage = memoryStorage();
    storage.setItem("aftensmad:wrong", JSON.stringify({ nope: 1 }));
    expect(readJson("wrong", ["safe"], isStringArray, storage)).toEqual(["safe"]);
  });

  it("namespaces keys to avoid clashing with other apps", () => {
    const storage = memoryStorage();
    writeJson("x", 1, storage);
    expect([...storage.dump().keys()]).toEqual(["aftensmad:x"]);
  });

  it("does nothing without a storage backend", () => {
    expect(() => writeJson("x", 1, null)).not.toThrow();
    expect(readJson("x", "fallback", (v): v is string => typeof v === "string", null)).toBe(
      "fallback",
    );
  });
});
