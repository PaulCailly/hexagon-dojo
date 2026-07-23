import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_STORAGE_KEY,
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
    saveProgress({ quizBest: { s1: 10 }, readChapters: [0, 2] });
    expect(loadProgress()).toEqual({
      ...emptyProgress(),
      quizBest: { s1: 10 },
      readChapters: [0, 2],
    });
  });

  it("merges successive saves", () => {
    saveProgress({ quizBest: { s1: 5 } });
    saveProgress({ drillBest: { d1: 8 } });
    expect(loadProgress()).toMatchObject({
      quizBest: { s1: 5 },
      drillBest: { d1: 8 },
    });
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
    expect(() => saveProgress({ quizBest: { s1: 1 } })).not.toThrow();
    spy.mockRestore();
  });

  it("reset clears stored progress", () => {
    saveProgress({ quizBest: { s1: 3 } });
    resetProgress();
    expect(loadProgress()).toEqual(emptyProgress());
  });

  it("migrates v1 progress (scalar bests, single checklist) to v2", () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        readChapters: [0, 1],
        quizBest: 9,
        drillBest: 7,
        flippedCards: [3],
        testChecklist: [0, 2],
      }),
    );
    expect(loadProgress()).toEqual({
      ...emptyProgress(),
      readChapters: [0, 1],
      quizBest: { s1: 9 },
      drillBest: { d1: 7 },
      flippedCards: [3],
      testChecklists: { t1: [0, 2] },
    });
    // migration persists to v2 and clears v1
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("ignores a corrupt v1 payload", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, "{nope");
    expect(loadProgress()).toEqual(emptyProgress());
  });
});
