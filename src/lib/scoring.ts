export function judgmentScore(
  issues: { correct: boolean }[],
  checked: Set<number>,
): number {
  return issues.filter((it, idx) => it.correct === checked.has(idx)).length;
}

export function quizVerdict(score: number): string {
  if (score >= 10)
    return "Interview-ready on the concepts. Move to the missions.";
  if (score >= 7)
    return "Solid base. Re-run it and read the explanations you missed.";
  return "Re-read the guide, then run the quiz again.";
}

export function drillVerdict(score: number, total: number): string {
  return score === total
    ? "Perfect classification. This drill is exactly what phase 1 feels like."
    : "Aim for a perfect run: classifying at a glance is the codebase-reading superpower.";
}

export function bestScore(prev: number | null, next: number): number {
  return prev === null ? next : Math.max(prev, next);
}
