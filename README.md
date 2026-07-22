# hexagon-dojo

Interactive dojo for hexagonal architecture — ports, adapters and dependency injection, trained through a book, quizzes, code-review missions, drills and talk tracks.

[![CI](https://github.com/PaulCailly/hexagon-dojo/actions/workflows/ci.yml/badge.svg)](https://github.com/PaulCailly/hexagon-dojo/actions/workflows/ci.yml) [![quality gate](https://github.com/PaulCailly/hexagon-dojo/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/PaulCailly/hexagon-dojo/actions/workflows/quality-gate.yml) [![compliance gate](https://github.com/PaulCailly/hexagon-dojo/actions/workflows/compliance-gate.yml/badge.svg)](https://github.com/PaulCailly/hexagon-dojo/actions/workflows/compliance-gate.yml) [![deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://hexagon-dojo.vercel.app) [![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

Hexagon Dojo turns the ports & adapters pattern into a training loop: read the theory, test the concepts, review realistic PRs, classify code at a glance, write tests without mocks, and rehearse the vocabulary — all in the browser, no account, progress saved locally.

![Hexagon Dojo — The Book](docs/screenshot.png)

## Modules

- **The Book** — 12 chapters from "Why Boundaries Exist" to interview phrasing, with per-chapter deep links and read tracking
- **Concepts** — 12-question quiz with per-answer explanations and a persistent best score
- **Code review** — 2 missions: spot the real problems in a PR, then compare with the fixed code
- **Classify** — 10-item speed drill: Port / Adapter / Use case / Composition root
- **Testing** — write a mock-free test suite, self-grade against a checklist and model answer
- **Talk tracks** — filterable flashcards: system design, product mindset, AI collaboration, English phrasing

## Stack

Vite + React 18 + TypeScript · Tailwind CSS v4 · React Router 7 · Vitest + Testing Library · self-hosted fonts (`@fontsource`) · zero runtime dependencies beyond React — no backend, no analytics, progress lives in `localStorage`.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # vitest (scoring logic, storage, routing smoke tests)
npm run lint       # eslint
npm run build      # type-check + production bundle
```

Content is code: every chapter, question and card lives in `src/content/*.ts`. Editing content is a PR.

## Quality gates

This repo runs [gatekit](https://github.com/PaulCailly/gatekit) in report mode — code-health and privacy/compliance gates post a sticky report on every PR (current: health 98/100, compliance 100/100). Policy is owned in `scripts/health/config.mjs` and `scripts/compliance/*.mjs`; engines sync via `npx gatekit update`.

## Deployment

Deployed on Vercel via git integration: every PR gets a preview URL, `main` deploys to production. `vercel.json` rewrites all routes to `index.html` so deep links (e.g. `/book/7`) work.

## Roadmap

- **Mock interviewer** — AI-driven follow-up questions via a Vercel `/api` function
- **Accounts / cross-device sync** — `localStorage` is enough for v1
- **Content CMS** — for now, `src/content/` is the source of truth

## License

[MIT](./LICENSE)
