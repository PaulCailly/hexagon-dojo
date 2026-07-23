export interface Progress {
  readChapters: number[];
  quizBest: Record<string, number>;
  drillBest: Record<string, number>;
  flippedCards: number[];
  testChecklists: Record<string, number[]>;
}

export const STORAGE_KEY = "hexagon-dojo:v2";
export const LEGACY_STORAGE_KEY = "hexagon-dojo:v1";

interface LegacyProgress {
  readChapters?: number[];
  quizBest?: number | null;
  drillBest?: number | null;
  flippedCards?: number[];
  testChecklist?: number[];
}

export const emptyProgress = (): Progress => ({
  readChapters: [],
  quizBest: {},
  drillBest: {},
  flippedCards: [],
  testChecklists: {},
});

function migrateLegacy(): Progress | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const v1 = JSON.parse(raw) as LegacyProgress;
    const migrated: Progress = {
      ...emptyProgress(),
      readChapters: v1.readChapters ?? [],
      flippedCards: v1.flippedCards ?? [],
    };
    if (typeof v1.quizBest === "number") migrated.quizBest.s1 = v1.quizBest;
    if (typeof v1.drillBest === "number") migrated.drillBest.d1 = v1.drillBest;
    if (v1.testChecklist?.length) migrated.testChecklists.t1 = v1.testChecklist;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  } catch {
    return null;
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacy() ?? emptyProgress();
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
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
