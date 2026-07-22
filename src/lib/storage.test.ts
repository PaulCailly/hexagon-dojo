import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  emptyProgress,
  loadProgress,
  saveProgress,
  resetProgress,
} from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty progress when nothing stored", () => {
    expect(loadProgress()).toEqual(emptyProgress());
  });

  it("round-trips a partial save merged over defaults", () => {
    saveProgress({ quizBest: 10, readChapters: [0, 2] });
    expect(loadProgress()).toEqual({
      ...emptyProgress(),
      quizBest: 10,
      readChapters: [0, 2],
    });
  });

  it("merges successive saves", () => {
    saveProgress({ quizBest: 5 });
    saveProgress({ drillBest: 8 });
    expect(loadProgress()).toMatchObject({ quizBest: 5, drillBest: 8 });
  });

  it("survives corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{nope");
    expect(loadProgress()).toEqual(emptyProgress());
  });

  it("survives setItem throwing (quota/private mode)", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    expect(() => saveProgress({ quizBest: 1 })).not.toThrow();
    spy.mockRestore();
  });

  it("reset clears stored progress", () => {
    saveProgress({ quizBest: 3 });
    resetProgress();
    expect(loadProgress()).toEqual(emptyProgress());
  });
});
