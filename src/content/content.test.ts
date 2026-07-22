import { describe, expect, it } from "vitest";
import { QUIZ } from "./quiz";
import { REVIEWS } from "./reviews";
import { DRILL, DRILL_OPTIONS, DRILL_COLORS } from "./drill";
import { CARDS } from "./cards";
import { BOOK } from "./book";
import { TEST_CHECKLIST } from "./testing";

describe("content integrity", () => {
  it("has the expected shapes and sizes", () => {
    expect(QUIZ).toHaveLength(12);
    expect(REVIEWS).toHaveLength(2);
    expect(DRILL).toHaveLength(10);
    expect(BOOK).toHaveLength(12);
    expect(CARDS).toHaveLength(12);
    expect(TEST_CHECKLIST).toHaveLength(5);
  });

  it("quiz answers index into options", () => {
    for (const q of QUIZ) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
  });

  it("drill answers are valid options with colors", () => {
    for (const d of DRILL) {
      expect(DRILL_OPTIONS).toContain(d.answer);
      expect(DRILL_COLORS[d.answer]).toBeTruthy();
    }
  });

  it("is de-branded", () => {
    const all = JSON.stringify({ QUIZ, REVIEWS, DRILL, CARDS, BOOK });
    expect(all).not.toMatch(/joko/i);
    expect(all).not.toMatch(/coderpad/i);
  });
});
