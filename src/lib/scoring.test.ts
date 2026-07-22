import { describe, expect, it } from "vitest";
import { judgmentScore, quizVerdict, drillVerdict, bestScore } from "./scoring";

describe("judgmentScore", () => {
  const issues = [{ correct: true }, { correct: false }, { correct: true }];

  it("counts matching judgments (checked real + unchecked fake)", () => {
    expect(judgmentScore(issues, new Set([0, 2]))).toBe(3);
  });

  it("penalizes checked fakes and missed reals", () => {
    expect(judgmentScore(issues, new Set([1]))).toBe(0);
  });

  it("empty selection scores the false issues only", () => {
    expect(judgmentScore(issues, new Set())).toBe(1);
  });
});

describe("verdicts", () => {
  it("quiz tiers at 10 and 7", () => {
    expect(quizVerdict(10)).toMatch(/Interview-ready/);
    expect(quizVerdict(7)).toMatch(/Solid base/);
    expect(quizVerdict(6)).toMatch(/Re-read the guide/);
  });

  it("drill tiers at perfect", () => {
    expect(drillVerdict(10, 10)).toMatch(/Perfect classification/);
    expect(drillVerdict(9, 10)).toMatch(/Aim for a perfect run/);
  });
});

describe("bestScore", () => {
  it("takes first score when no previous", () => {
    expect(bestScore(null, 7)).toBe(7);
  });

  it("keeps the max", () => {
    expect(bestScore(9, 7)).toBe(9);
    expect(bestScore(7, 9)).toBe(9);
  });
});
