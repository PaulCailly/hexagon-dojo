# Hexagon Dojo Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Hexagon Dojo prototype as a production Vite+React+TS app on Vercel with a public gatekit-instrumented GitHub repo.

**Architecture:** Port the single-file prototype (`~/Downloads/hexagon-dojo/src/App.jsx`, 1265 lines — THE source of truth for all copy and visuals) into `content/` (typed data) + `components/` + `modules/` + a routed `App.tsx` shell, with a versioned localStorage layer and pure scoring helpers under test.

**Tech Stack:** Vite 5, React 18, TypeScript, Tailwind v4 (`@tailwindcss/vite`), React Router 7, Vitest + Testing Library, ESLint flat + Prettier, @fontsource, GitHub Actions, gatekit (report-only), Vercel.

## Global Constraints

- Prototype file `~/Downloads/hexagon-dojo/src/App.jsx` is copy-source: content strings are transplanted VERBATIM except the 8 de-brand edits in spec §"De-branding". No other copy changes.
- Visual output must match the prototype (same Tailwind classes unless a task states otherwise).
- No dynamic/interpolated Tailwind class names anywhere (`` `...${x}...` `` inside className is banned; static lookup maps only).
- `src/content/*.ts` contain data only — no JSX, no React imports.
- localStorage key: `hexagon-dojo:v1`. All storage access through `src/lib/storage.ts`.
- Node 22 (`nvm use 22` if default is 20.x — machine gotcha).
- Conventional commits; commit at the end of every task.

---

### Task 1: Scaffold — Vite + TS + Tailwind v4 + fonts + meta

**Files:**

- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/index.css`, `src/App.tsx` (placeholder), `public/favicon.svg`, `.gitignore`
- Copy prototype dir first: `cp -R ~/Downloads/hexagon-dojo ~/hexagon-dojo/prototype-reference` is NOT done — reference it in place; repo must not contain the prototype.

**Interfaces:**

- Produces: working `npm run dev` / `npm run build`; CSS custom props `--font-sans`, `--font-mono`; `.font-mono` utility from Tailwind.

- [ ] **Step 1: Scaffold**

```bash
cd ~/hexagon-dojo
npm create vite@latest . -- --template react-ts   # accept scaffolding into non-empty dir (docs/, .git)
npm i react-router@^7 @fontsource/space-grotesk @fontsource/jetbrains-mono
npm i -D @tailwindcss/vite tailwindcss
```

- [ ] **Step 2: Configs**

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`src/index.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Space Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

body {
  font-family: var(--font-sans);
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

`index.html` (full file — note de-brand edit #1 and meta/og per brief §2.1):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#020617" />
    <title>Hexagon Dojo — ports, adapters & dependency injection trainer</title>
    <meta
      name="description"
      content="Interactive dojo for hexagonal architecture: a 12-chapter book, quizzes, code-review missions, classification drills, testing missions and interview talk tracks."
    />
    <meta property="og:title" content="Hexagon Dojo" />
    <meta
      property="og:description"
      content="Train ports, adapters and dependency injection: book, quiz, code review missions, drills and talk tracks."
    />
    <meta property="og:type" content="website" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="25,3 75,3 100,50 75,97 25,97 0,50" fill="#0e7490"/>
  <text x="50" y="66" font-size="48" font-weight="bold" text-anchor="middle" fill="#e2e8f0" font-family="monospace">H</text>
</svg>
```

`src/App.tsx` placeholder: `export default function App() { return <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">hexagon dojo</div>; }`. Delete scaffold leftovers: `src/App.css`, `src/assets/`, `public/vite.svg`.

- [ ] **Step 3: Verify**

Run: `npm run build && npm run dev -- --port 5199 &` → build clean, page renders dark with mono font, no console errors, no CDN requests. Kill dev server.

- [ ] **Step 4: Commit** — `chore: scaffold vite+ts+tailwind4, self-hosted fonts, meta/favicon`

---

### Task 2: Storage module (TDD)

**Files:**

- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`
- Modify: `package.json` (vitest), Create: `vitest.config.ts` (or merge into vite config — use separate `vitest.config.ts` extending vite config).

**Interfaces:**

- Produces:

```ts
export interface Progress {
  readChapters: number[];
  quizBest: number | null;
  drillBest: number | null;
  flippedCards: number[];
  testChecklist: number[];
}
export const STORAGE_KEY = "hexagon-dojo:v1";
export const emptyProgress: () => Progress;
export function loadProgress(): Progress; // corrupt/missing → emptyProgress()
export function saveProgress(patch: Partial<Progress>): void; // merge + persist, swallows quota errors
export function resetProgress(): void; // removeItem, swallows errors
```

- [ ] **Step 1: Install test stack**

```bash
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

`vitest.config.ts`:

```ts
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
  }),
);
```

`src/test/setup.ts`: `import "@testing-library/jest-dom/vitest";`
Add scripts: `"test": "vitest run", "test:watch": "vitest"`.

- [ ] **Step 2: Failing tests** — `src/lib/storage.test.ts`:

```ts
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
```

- [ ] **Step 3: Run** `npx vitest run src/lib` → FAIL (module missing).
- [ ] **Step 4: Implement** `src/lib/storage.ts`:

```ts
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
```

- [ ] **Step 5: Run** `npx vitest run src/lib` → 6 PASS.
- [ ] **Step 6: Commit** — `feat: versioned localStorage progress module`

---

### Task 3: Content modules (typed, de-branded)

**Files:**

- Create: `src/content/types.ts`, `src/content/book.ts`, `src/content/quiz.ts`, `src/content/reviews.ts`, `src/content/drill.ts`, `src/content/testing.ts`, `src/content/cards.ts`, `src/content/content.test.ts`

**Interfaces:**

- Produces (consumed by all modules):

```ts
// types.ts
export type TagColor = "cyan" | "amber" | "violet" | "emerald" | "slate";
export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}
export interface ReviewIssue {
  text: string;
  correct: boolean;
  why: string;
}
export interface ReviewMission {
  title: string;
  intro: string;
  code: string;
  issues: ReviewIssue[];
  fix: string;
}
export interface DrillItem {
  code: string;
  answer: DrillAnswer;
  why: string;
}
export type DrillAnswer = "Port" | "Adapter" | "Use case" | "Composition root";
export interface TalkCard {
  cat: string;
  color: TagColor;
  q: string;
  a: string;
}
export type BookBlock =
  | { t: "p"; c: string }
  | { t: "code"; c: string }
  | { t: "take"; c: string }
  | { t: "li"; c: string[] };
export interface BookChapter {
  title: string;
  blocks: BookBlock[];
}
```

- Exports: `QUIZ: QuizQuestion[]` (quiz.ts), `REVIEWS: ReviewMission[]` (reviews.ts), `DRILL: DrillItem[]`, `DRILL_OPTIONS: DrillAnswer[]`, `DRILL_COLORS: Record<DrillAnswer, TagColor>` (drill.ts), `TEST_CHECKLIST: string[]`, `TEST_SOLUTION: string` (testing.ts), `CARDS: TalkCard[]` (cards.ts), `BOOK: BookChapter[]` (book.ts).

- [ ] **Step 1: Transplant data.** Copy constants verbatim from prototype: `QUIZ` L49-182, `REVIEWS` L184-324, `DRILL`/`DRILL_OPTIONS`/`DRILL_COLORS` L326-345, `TEST_CHECKLIST`/`TEST_SOLUTION` L347-406, `CARDS` L408-481, `BOOK` L914-1070. Apply ONLY spec de-brand edits #4 (Joko card), #5 (glossary closing frame), #6 (CoderPad → live coding interview: card "First 5 minutes…", book ch7 "interview codebase on CoderPad", quiz — grep all files for `CoderPad` and `Joko` after transplant). Add types.

- [ ] **Step 2: Content integrity test** — `src/content/content.test.ts`:

```ts
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

  it("is de-branded", async () => {
    const all = JSON.stringify({ QUIZ, REVIEWS, DRILL, CARDS, BOOK });
    expect(all).not.toMatch(/joko/i);
    expect(all).not.toMatch(/coderpad/i);
  });
});
```

Note: BOOK is 12 chapters and CARDS is 12 cards in the prototype — verify counts during transplant; if prototype differs, the prototype wins and the test adjusts.

- [ ] **Step 3: Run** `npx vitest run src/content` → PASS. `npx tsc --noEmit` → clean.
- [ ] **Step 4: Commit** — `feat: typed content modules (book, quiz, reviews, drill, testing, cards), de-branded`

---

### Task 4: Shared components + scoring helpers (TDD on helpers)

**Files:**

- Create: `src/components/Hex.tsx`, `src/components/Code.tsx`, `src/components/Tag.tsx`, `src/components/ErrorBoundary.tsx`, `src/lib/scoring.ts`, `src/lib/scoring.test.ts`

**Interfaces:**

- Produces:

```ts
// Hex: ({ children, className?, style? }) — prototype L11-22 verbatim, typed (React.CSSProperties)
// Code: ({ children }) — prototype L24-28 verbatim
// Tag: ({ color, children }: { color: TagColor | string, children }) — prototype L30-45 verbatim
// ErrorBoundary: class component, catches render errors, shows reload UI
// scoring.ts:
export function judgmentScore(
  issues: { correct: boolean }[],
  checked: Set<number>,
): number;
export function quizVerdict(score: number, total: number): string; // the 3 end-screen strings, prototype L517-521
export function drillVerdict(score: number, total: number): string; // prototype L710-714
export function bestScore(prev: number | null, next: number): number; // max, null-safe
```

- [ ] **Step 1: Failing tests** — `src/lib/scoring.test.ts`:

```ts
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
    expect(quizVerdict(10, 12)).toMatch(/Interview-ready/);
    expect(quizVerdict(7, 12)).toMatch(/Solid base/);
    expect(quizVerdict(6, 12)).toMatch(/Re-read the guide/);
  });
  it("drill tiers at perfect", () => {
    expect(drillVerdict(10, 10)).toMatch(/Perfect classification/);
    expect(drillVerdict(9, 10)).toMatch(/Aim for a perfect run/);
  });
});

describe("bestScore", () => {
  it("takes first score when no previous", () =>
    expect(bestScore(null, 7)).toBe(7));
  it("keeps the max", () => {
    expect(bestScore(9, 7)).toBe(9);
    expect(bestScore(7, 9)).toBe(9);
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `src/lib/scoring.ts` (verdict strings copied verbatim from prototype L517-521 / L710-714):

```ts
export function judgmentScore(
  issues: { correct: boolean }[],
  checked: Set<number>,
): number {
  return issues.filter((it, idx) => it.correct === checked.has(idx)).length;
}

export function quizVerdict(score: number, _total: number): string {
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
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Components.** Port Hex/Code/Tag verbatim from prototype L11-45 into typed TSX. `ErrorBoundary.tsx`:

```tsx
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-center py-16">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Something broke in this module.
          </p>
          <p className="text-sm text-slate-400 mb-6 font-mono">
            {this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.assign("/");
            }}
            className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium"
          >
            Back to the dojo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 6: Commit** — `feat: shared components (Hex, Code, Tag, ErrorBoundary) and tested scoring helpers`

---

### Task 5: Modules — port all six from the prototype

**Files:**

- Create: `src/modules/BookModule.tsx`, `src/modules/QuizModule.tsx`, `src/modules/ReviewModule.tsx`, `src/modules/DrillModule.tsx`, `src/modules/TestModule.tsx`, `src/modules/CardsModule.tsx`

**Interfaces:**

- Consumes: content exports (Task 3), Hex/Code/Tag (Task 4), scoring helpers (Task 4), storage (Task 2).
- Produces: default-export React components, no props except noted. `BookModule` reads `useParams().chapter` (1-based string) and navigates via `useNavigate`. `QuizModule` takes `{ onBest(score: number): void }`.

Port each module from the prototype (Quiz L485-584, Review L586-679, Drill L681-781, Test L783-845, Cards L847-908, Book L1072-1180) with these exact transformations — everything else stays byte-identical:

1. **All modules:** replace inline scoring/verdict expressions with Task 4 helpers (`judgmentScore` in Review, `quizVerdict`/`drillVerdict` in end screens).
2. **DrillModule:** replace `` cls = `border-slate-700 bg-slate-900 text-slate-200 hover:border-${c}-600` `` (prototype L744) with static map:

```ts
const HOVER_BORDER: Record<TagColor, string> = {
  cyan: "hover:border-cyan-600",
  amber: "hover:border-amber-600",
  violet: "hover:border-violet-600",
  emerald: "hover:border-emerald-600",
  slate: "hover:border-slate-600",
};
```

and grid `grid-cols-2` → `grid-cols-1 min-[360px]:grid-cols-2` (mobile pass). On finish: `saveProgress({ drillBest: bestScore(loadProgress().drillBest, score) })`. 3. **QuizModule:** on completion call `onBest(score)` (parent persists + updates header badge). 4. **BookModule:** chapter from route — `const ch = Math.min(Math.max((Number(useParams().chapter) || 1) - 1, 0), BOOK.length - 1)`; hex navigator + prev/next buttons call `navigate(\`/book/\${n + 1}\`)`; `read`initialized from`loadProgress().readChapters`, `markAndGo`persists`saveProgress({ readChapters: [...next] })`; scroll respects reduced motion:

```ts
const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
```

Hex chapter buttons get `aria-label={\`Chapter \${idx + 1}: \${c.title}\`}`and`aria-current={idx === ch ? "page" : undefined}`.
5. **CardsModule:** `flipped`initialized from`loadProgress().flippedCards`, persisted on flip; card button gets `aria-expanded={isFlipped}`; filter buttons get `aria-pressed={filter === c}`.
6. **TestModule:** `checks`initialized from`loadProgress().testChecklist`, persisted on toggle; checklist buttons `aria-pressed`, model-answer button `aria-expanded`.
7. **ReviewModule:** issue buttons get `aria-pressed={checked.has(idx)}`(pre-reveal),`disabled`-like behavior stays as-is post-reveal.
8. **All interactive elements:** ensure visible focus: add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400`to button class strings (replace the one`focus:outline-none`in BookModule hex buttons with the focus-visible ring). Contrast:`text-slate-500`on`bg-slate-950`fails AA for the "tap to reveal" hint and header sub — bump those to`text-slate-400`.

- [ ] **Step 1:** Port QuizModule + DrillModule (transformations 1-3, 8).
- [ ] **Step 2:** Port ReviewModule + TestModule + CardsModule (1, 5-8).
- [ ] **Step 3:** Port BookModule (4, 8).
- [ ] **Step 4:** `npx tsc --noEmit` → clean. (Render coverage lands with routing in Task 6.)
- [ ] **Step 5: Commit** — `feat: port all six modules with persistence, a11y and static hover classes`

---

### Task 6: App shell, routing, footer reset + smoke tests

**Files:**

- Modify: `src/App.tsx` (replace placeholder)
- Create: `src/App.test.tsx`

**Interfaces:**

- Consumes: all modules, ErrorBoundary, storage.
- Produces: routed app. Header/nav/footer from prototype L1193-1263 with `NavLink`s.

- [ ] **Step 1: App shell** — port header (de-brand edits #2 header subtitle → `ports, adapters, dependency injection`, #3 logo `J` → `H`), nav becomes `NavLink`s (active style = prototype active classes, plus `aria-current` comes free), main becomes:

```tsx
<main className="max-w-3xl mx-auto px-4 py-6 pb-16">
  <ErrorBoundary>
    <Routes>
      <Route path="/" element={<Navigate to="/book" replace />} />
      <Route path="/book/:chapter?" element={<BookModule />} />
      <Route path="/quiz" element={<QuizModule onBest={handleQuizBest} />} />
      <Route path="/review" element={<ReviewModule />} />
      <Route path="/drill" element={<DrillModule />} />
      <Route path="/testing" element={<TestModule />} />
      <Route path="/cards" element={<CardsModule />} />
      <Route path="*" element={<Navigate to="/book" replace />} />
    </Routes>
  </ErrorBoundary>
</main>
```

`quizBest` state initialized `loadProgress().quizBest`; `handleQuizBest = (s) => { const b = bestScore(quizBest, s); setQuizBest(b); saveProgress({ quizBest: b }); }`. Module ids/labels from prototype `MODULES` L1184-1191, mapped to paths (`test` id → `/testing` path per spec). Footer: prototype footer text + a `Reset progress` button (`resetProgress()` then `window.location.assign("/book")`), styled `text-xs text-slate-400 underline hover:text-slate-200`.

- [ ] **Step 2: Smoke tests** — `src/App.test.tsx`:

```tsx
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App";

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe("App routing", () => {
  beforeEach(() => localStorage.clear());

  it("redirects / to the book", () => {
    at("/");
    expect(screen.getByText("Why Boundaries Exist")).toBeInTheDocument();
  });

  it("renders a deep-linked chapter", () => {
    at("/book/7");
    expect(screen.getByText("The Composition Root")).toBeInTheDocument();
  });

  it("renders the quiz", () => {
    at("/quiz");
    expect(screen.getByText("What is a port?")).toBeInTheDocument();
  });

  it("renders review, drill, testing, cards", () => {
    at("/review");
    expect(
      screen.getByText(/Mission 1: the entangled use case/),
    ).toBeInTheDocument();
    at("/drill");
    expect(screen.getByText(/Where does this line belong/)).toBeInTheDocument();
    at("/testing");
    expect(
      screen.getByText(/test redeemReward without mocking/),
    ).toBeInTheDocument();
    at("/cards");
    expect(screen.getAllByText("System design").length).toBeGreaterThan(0);
  });

  it("quiz answer flow scores and advances", async () => {
    const user = userEvent.setup();
    at("/quiz");
    await user.click(
      screen.getByText(
        "An interface defined by the inner logic that expresses a need",
      ),
    );
    expect(screen.getByText(/Why:/)).toBeInTheDocument();
    await user.click(screen.getByText("Next"));
    expect(screen.getByText(/Question 2 \/ 12/)).toBeInTheDocument();
  });

  it("persists and resets progress", async () => {
    const user = userEvent.setup();
    at("/book/1");
    await user.click(
      screen.getByRole("button", { name: /Coupling and the Direction/ }),
    );
    expect(
      JSON.parse(localStorage.getItem("hexagon-dojo:v1")!)?.readChapters,
    ).toContain(0);
    await user.click(screen.getByRole("button", { name: /Reset progress/ }));
  });
});
```

(Adjust the reset assertion if jsdom `window.location.assign` needs stubbing: `vi.spyOn(window.location, ...)` is not writable in jsdom — instead have the reset button call a `onReset` that does `resetProgress()` + `navigate("/book")` via useNavigate, which is testable and better SPA behavior. Use the navigate version.)

- [ ] **Step 3: Run** `npm test` → all green. `npm run build` → clean. Manual: `npm run dev`, click through all modules, back/forward works.
- [ ] **Step 4: Commit** — `feat: routed app shell with error boundary, quiz-best badge and progress reset`

---

### Task 7: Lint, format, CI

**Files:**

- Create: `eslint.config.js` (scaffold likely provided one — extend it), `.prettierrc.json`, `.prettierignore`, `.github/workflows/ci.yml`
- Modify: `package.json` scripts

- [ ] **Step 1:**

```bash
npm i -D prettier eslint-config-prettier
```

`.prettierrc.json`: `{}` (defaults). `.prettierignore`: `dist\ncoverage\n`. Append `eslint-config-prettier` last in `eslint.config.js` exports. Scripts: `"lint": "eslint .", "format": "prettier --write .", "format:check": "prettier --check ."`. Run `npm run format` once.

- [ ] **Step 2:** `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm test
      - run: npm run build
```

- [ ] **Step 3:** `npm run lint && npm run format:check && npm test && npm run build` → all pass locally.
- [ ] **Step 4: Commit** — `chore: eslint+prettier and CI workflow`

---

### Task 8: gatekit (report-only) + README + LICENSE

**Files:**

- Create: `gatekit.json` + vendored gate files (CLI-managed), `README.md`, `LICENSE`, `vercel.json`

- [ ] **Step 1: gatekit install.** Follow current gatekit docs (repo `PaulCailly/gatekit`, docs on GitHub Pages). Expected shape: `npx` the CLI init with report-only mode, which writes `gatekit.json` + `.github/workflows/gatekit.yml`. Check `npx gatekit@latest --help` first; if npm publish still pending, install from GitHub: `npx github:PaulCailly/gatekit init --report-only`. Known gotchas: needs node 22; health gate needs TypeScript (we have it).
- [ ] **Step 2: `vercel.json`:**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 3: `LICENSE`:** MIT, `Copyright (c) 2026 Paul Cailly`.
- [ ] **Step 4: `README.md`** — mirror the gatekit README structure (badges row → pitch → screenshot → features → quickstart → development → deployment → roadmap). Badges: CI workflow badge, gatekit gate badge (per gatekit README convention), Vercel deploy badge/link, MIT badge. Features section = the six modules, one line each. Development: `npm i && npm run dev`, `npm test`, `npm run lint`. Deployment: Vercel git integration, SPA rewrite note. Roadmap: mock interviewer via `/api` Vercel functions, accounts/sync, content CMS (from brief §2.6). Add screenshot: capture `dist` preview later — placeholder image path `docs/screenshot.png`, captured in Task 9.
- [ ] **Step 5:** `npm test && npm run build` still green. Commit — `chore: gatekit report-only, README with badges, MIT license, SPA rewrites`

---

### Task 9: GitHub repo + Vercel deploy + verification

**Files:** none new (screenshot `docs/screenshot.png`).

- [ ] **Step 1: Repo.**

```bash
cd ~/hexagon-dojo
gh repo create PaulCailly/hexagon-dojo --public --source . --push \
  --description "Interactive dojo for hexagonal architecture: book, quiz, code-review missions, drills and talk tracks"
```

- [ ] **Step 2: Vercel.** Use Vercel MCP/CLI: `vercel link` (create project `hexagon-dojo` under Paul's account, framework preset Vite), then connect git: `vercel git connect`. Push to main triggers prod deploy. NO CLI-created duplicate projects (backresto lesson): one project, git-integrated.
- [ ] **Step 3: Verify deployment.** Prod URL loads; deep link `https://<prod>/quiz` returns 200 (SPA rewrite); no console errors; fonts self-hosted (network tab: no googleapis/cdn.tailwindcss.com).
- [ ] **Step 4: Screenshot** — capture book page via browser tools → `docs/screenshot.png`, reference in README, commit+push (`docs: add screenshot`).
- [ ] **Step 5: Preview flow.** Open a trivial PR (e.g. README touch-up) → CI green + gatekit report comment + Vercel preview URL appear → merge.
- [ ] **Step 6: Lighthouse.** `npx lighthouse <prod-url> --preset=desktop --quiet --chrome-flags="--headless"` → assert ≥90 performance, accessibility, best-practices. Fix and redeploy if under bar.
- [ ] **Step 7: Keyboard run-through** (acceptance §3): tab through full quiz + one book chapter using only keyboard in real browser.

---

## Self-review notes

- Spec coverage: build/styling (T1), structure+routing+boundary (T5/T6), persistence+reset (T2/T5/T6), quality (T4 helpers tests, T6 smoke, T7 CI, a11y/mobile folded into T5/T6), deploy (T8/T9), de-brand edits mapped: #1 T1, #2/#3 T6, #4-#6 T3. Dynamic class fix T5. ✓
- Prototype line refs are exact against the read copy (1265 lines). ✓
- Types consistent: `Progress`, `TagColor`, scoring signatures used identically across T2/T4/T5/T6. ✓
