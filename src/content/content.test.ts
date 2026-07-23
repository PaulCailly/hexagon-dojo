import { describe, expect, it } from "vitest";
import { QUIZ_SETS } from "./quiz";
import { REVIEWS } from "./reviews";
import { DRILL_OPTIONS, DRILL_COLORS, DRILL_SETS } from "./drill";
import { CARDS } from "./cards";
import { BOOK, BOOK_PARTS } from "./book";
import { TEST_MISSIONS } from "./testing";

describe("content integrity", () => {
  it("has the expected shapes and sizes", () => {
    expect(BOOK).toHaveLength(20);
    expect(QUIZ_SETS).toHaveLength(10);
    expect(QUIZ_SETS.reduce((n, s) => n + s.questions.length, 0)).toBe(120);
    expect(DRILL_SETS).toHaveLength(5);
    expect(
      DRILL_SETS.reduce((n, s) => n + s.items.length, 0),
    ).toBeGreaterThanOrEqual(55);
    expect(REVIEWS).toHaveLength(10);
    expect(TEST_MISSIONS).toHaveLength(5);
    expect(CARDS.length).toBeGreaterThanOrEqual(36);
  });

  it("book parts tile the chapter range contiguously", () => {
    expect(BOOK_PARTS[0].from).toBe(0);
    expect(BOOK_PARTS[BOOK_PARTS.length - 1].to).toBe(BOOK.length - 1);
    for (let i = 1; i < BOOK_PARTS.length; i++) {
      expect(BOOK_PARTS[i].from).toBe(BOOK_PARTS[i - 1].to + 1);
    }
  });

  it("every chapter ends on a takeaway block", () => {
    for (const ch of BOOK) {
      expect(ch.blocks[ch.blocks.length - 1].t).toBe("take");
    }
  });

  it("quiz sets have unique ids and valid, unique questions", () => {
    const ids = QUIZ_SETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const seen = new Set<string>();
    for (const set of QUIZ_SETS) {
      for (const q of set.questions) {
        expect(q.options).toHaveLength(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.why.length).toBeGreaterThan(10);
        expect(seen.has(q.q)).toBe(false);
        seen.add(q.q);
      }
    }
  });

  it("drill answers are valid options with colors, codes unique", () => {
    const seen = new Set<string>();
    for (const set of DRILL_SETS) {
      for (const d of set.items) {
        expect(DRILL_OPTIONS).toContain(d.answer);
        expect(DRILL_COLORS[d.answer]).toBeTruthy();
        expect(seen.has(d.code)).toBe(false);
        seen.add(d.code);
      }
    }
  });

  it("review missions mix real and fake issues", () => {
    for (const m of REVIEWS) {
      const real = m.issues.filter((i) => i.correct).length;
      expect(real).toBeGreaterThanOrEqual(3);
      expect(real).toBeLessThan(m.issues.length);
      expect(m.code.length).toBeGreaterThan(100);
      expect(m.fix.length).toBeGreaterThan(100);
    }
  });

  it("test missions have unique ids and complete checklists", () => {
    const ids = TEST_MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of TEST_MISSIONS) {
      expect(m.checklist.length).toBeGreaterThanOrEqual(5);
      expect(m.solution.length).toBeGreaterThan(200);
    }
  });

  it("cards have known colors and unique fronts", () => {
    const seen = new Set<string>();
    for (const c of CARDS) {
      expect(["cyan", "amber", "violet", "emerald", "slate"]).toContain(
        c.color,
      );
      expect(seen.has(c.q)).toBe(false);
      seen.add(c.q);
    }
  });

  it("is de-branded", () => {
    const all = JSON.stringify({
      QUIZ_SETS,
      REVIEWS,
      DRILL_SETS,
      CARDS,
      BOOK,
      TEST_MISSIONS,
    });
    expect(all).not.toMatch(/joko/i);
    expect(all).not.toMatch(/coderpad/i);
  });
});
