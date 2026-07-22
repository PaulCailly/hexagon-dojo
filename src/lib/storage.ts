export interface Progress {
  readChapters: number[];
  quizBest: number | null;
  drillBest: number | null;
  flippedCards: number[];
  testChecklist: number[];
}

export const STORAGE_KEY = "hexagon-dojo:v1";

export const emptyProgress = (): Progress => ({
  readChapters: [],
  quizBest: null,
  drillBest: null,
  flippedCards: [],
  testChecklist: [],
});

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...emptyProgress(), ...parsed };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(patch: Partial<Progress>): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...loadProgress(), ...patch }),
    );
  } catch {
    // storage unavailable (quota, private mode) — progress is best-effort
  }
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
