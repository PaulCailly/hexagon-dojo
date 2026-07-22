# Hexagon Dojo — production design

Date: 2026-07-22. Status: approved (brainstorm w/ Paul).
Source of truth for behavior/visuals: prototype at `~/Downloads/hexagon-dojo` (Vite+React, single 1265-line `App.jsx`).

## Goal

Ship the prototype as a production web app: public GitHub repo (`PaulCailly/hexagon-dojo`), gatekit installed (report-only), gatekit-style README with badges, Vercel deploy via git pushes (preview on PR, prod on main).

## Decisions (from brainstorm)

| Topic      | Decision                                                             |
| ---------- | -------------------------------------------------------------------- |
| Visibility | Public repo, **de-branded** content (Joko/CoderPad refs generalized) |
| Tailwind   | v4 via `@tailwindcss/vite` plugin, CSS-first config                  |
| Language   | TypeScript (TSX modules, typed content)                              |
| gatekit    | Report-only mode                                                     |

## Stack

Vite 5 + React 18 + TypeScript, Tailwind v4, React Router 7 (library mode: `BrowserRouter`/`Routes`), Vitest + @testing-library/react + jsdom, ESLint flat config + Prettier, `@fontsource/space-grotesk` + `@fontsource/jetbrains-mono` (self-hosted, no Google CDN).

## Layout

```
src/
  content/          # data only, no JSX; typed via src/content/types.ts
    book.ts  quiz.ts  reviews.ts  drill.ts  testing.ts  cards.ts
  components/       # Hex, Code, Tag, ErrorBoundary
  modules/          # BookModule, QuizModule, ReviewModule, DrillModule, TestModule, CardsModule
  lib/
    storage.ts      # versioned localStorage wrapper
  App.tsx           # shell: header, nav, routes, footer
  main.tsx
  index.css         # @import "tailwindcss"; @theme fonts
```

Routes: `/book/:chapter?`, `/quiz`, `/review`, `/drill`, `/testing`, `/cards`; `/` redirects to `/book`. `*` → redirect `/book`. ErrorBoundary wraps the routed outlet. Header nav uses `NavLink`s; book chapter navigator drives `/book/:n` (1-based in URL).

## Dynamic Tailwind class fix

Single occurrence: `hover:border-${c}-600` in DrillModule (prototype L744). Replace with static map:
`{ cyan: "hover:border-cyan-600", amber: "hover:border-amber-600", violet: "hover:border-violet-600", emerald: "hover:border-emerald-600" }`.
Audit confirms no other template-interpolated classes; `Tag` and `DRILL_COLORS` maps are already static strings.

## De-branding (content edits — flagged per brief §4)

Copy is otherwise final. Only these strings change:

1. `index.html` title: `Hexagon Dojo - Joko interview prep` → `Hexagon Dojo — ports, adapters & dependency injection trainer`
2. Header subtitle: `90-min CoderPad prep · ports, adapters, DI · in English` → `ports, adapters, dependency injection`
3. Logo hex letter `J` → `H`
4. Card (Product mindset): `Why does this architecture matter for a product like Joko specifically?` → `…for a product built on third-party integrations?`; answer `Joko lives on third-party integrations:` → `Such a product lives on third-party integrations:`
5. Glossary chapter closing frame: `And one closing frame for the product engineering phase, in your own situation's words: a product built on merchant APIs…` → drop the personal framing, keep the generic product sentence.
6. CoderPad mentions generalized: quiz/cards/book `on CoderPad` → `in a live coding interview`; `the interview codebase on CoderPad` → `an interview codebase`; source comment header ditto.
7. Footer "5 interview phases" text: keep (generic).
8. Quiz Q11 why `This is the answer they want to hear.` and interview-voice copy: keep — generic interview framing is the app's premise.

## Persistence

`src/lib/storage.ts`: key `hexagon-dojo:v1`, single JSON object, `load()`/`save(partial)`/`reset()`, try/catch around parse + setItem (quota/private mode → no-op). Shape:

```ts
{ readChapters: number[], quizBest: number | null, drillBest: number | null,
  flippedCards: number[], testChecklist: number[] }
```

- Book: `read` Set hydrated from `readChapters`.
- Quiz: `quizBest` (header badge + end screen), updated on completion.
- Drill: `drillBest` same pattern (new: prototype didn't track drill best — brief §2.3 requires it).
- Cards: flipped persists ("flipped/reviewed").
- Testing: checklist persists.
- Review missions: ephemeral (not in brief's persistence list).
- Footer: "Reset progress" button → `reset()` + state reload.

## Quality

- **Tests (Vitest):** quiz scoring, drill scoring, review judgment counting (extract pure helpers where trivial), storage module (roundtrip, corrupt JSON, quota throw), render smoke test per module + App routing smoke.
- **CI (GitHub Actions):** on PR + main: install → lint → prettier check → vitest → build. Plus gatekit report-only workflow.
- **A11y:** focus-visible rings on all interactive elements, `aria-pressed` on toggle buttons (issue checkboxes, card flips, checklist), `aria-expanded` on card flips / model-answer toggle, `aria-current` on nav + chapter hexes, contrast check on slate palette (bump `text-slate-500` on dark bg where failing), `prefers-reduced-motion` → `window.scrollTo` without smooth behavior.
- **Mobile:** code blocks `overflow-x-auto` (already), drill grid `grid-cols-1 min-[360px]:grid-cols-2`, header nav horizontal scroll (already).

## Deploy

- `vercel.json`: SPA rewrite all → `/index.html` (explicit, not preset-reliant).
- Public repo `PaulCailly/hexagon-dojo`, Vercel git integration, framework preset Vite. No env vars.
- README: gatekit-style with badges (CI, gatekit gate, Vercel deploy, license), screenshot, module overview, dev/test/deploy sections, backlog (§2.6: AI interviewer via `/api`, accounts, CMS).
- Post-deploy: Lighthouse on prod URL, bar = 90+ perf/a11y/best-practices.

## Acceptance criteria

Per brief §3, unchanged; de-branding edits above are the flagged exception to "content copy is final".

## Out of scope

Mock interviewer mode, accounts/sync, CMS (backlog in README).
