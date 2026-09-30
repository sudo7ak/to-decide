# Decision Copilot

A local-first personal decision-support app. Write a question you're
weighing, and Google Gemini analyzes it through a mental model of your
choice — Eisenhower Matrix, SWOT, BCG Box, Johari Window, and 48 others
— rendered as a chart. Every run is kept, so you can compare past
analyses side by side.

All your questions and analyses live in your browser (IndexedDB) —
nothing is stored server-side. The only server-side piece is a
stateless route that proxies your prompt to Gemini and validates the
response.

## Features

- **52 mental models** across four categories: decision-making,
  knowing yourself, knowing others, improving others. Browse them all
  in the [Model Library](/models), each with a worked example.
- **Ask a question**, pick a model, get a real Gemini-generated
  analysis rendered through one of 6 chart types (2×2 quadrant, radar,
  matrix table, ranked list, flow diagram, narrative).
- **Model recommendations** — on first viewing a question, Gemini
  suggests which models are the best fit and badges/sorts them to the
  top.
- **Full history** — re-analyze as many times as you like; nothing is
  overwritten, every run stays browsable.
- **Local-first** — works offline except for generating a new
  analysis. No account, no login.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes) on
  [`adapter-cloudflare`](https://svelte.dev/docs/kit/adapter-cloudflare)
- [Dexie](https://dexie.org/) (IndexedDB) for local-first storage
- [d3-scale](https://d3js.org/d3-scale) for the chart renderers, [Tailwind CSS](https://tailwindcss.com/) for styling
- [Google Gemini](https://ai.google.dev/) (`gemini-3.1-flash-lite`) for analysis + model recommendations, via a stateless SvelteKit server route
- [@cfworker/json-schema](https://github.com/cfworker/cfworker/tree/main/packages/json-schema) for validating LLM output against each model's JSON Schema (Workers-compatible)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB) for tests

## Getting started

### Prerequisites

- Node.js
- A [Gemini API key](https://aistudio.google.com/apikey)

### Setup

```sh
npm install
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set your key:

```
GEMINI_API_KEY=your-gemini-api-key-here
```

`.dev.vars` is gitignored — never commit it. `@sveltejs/adapter-cloudflare`
picks it up automatically under plain `vite dev`, no extra tooling needed.

### Run it

```sh
npm run dev
```

Open the printed local URL, write a question, pick a model, hit
Analyze.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the test suite (Vitest) |
| `npm run check` | Type-check (`svelte-check`) |

## Project structure

```
src/
├── lib/
│   ├── charts/            # 6 chart renderers + shared registry
│   ├── db/                # Dexie schema, seed-models.json (the 52-model catalog), seeding
│   ├── server/
│   │   ├── llm/           # LlmProvider interface + GeminiProvider
│   │   ├── catalog.ts     # the 52-model catalog, read server-side
│   │   ├── rateLimit.ts   # Cloudflare rate-limit binding for the LLM routes
│   │   ├── requestBody.ts # JSON body parsing + question-text validation
│   │   └── validation.ts  # JSON-Schema validation of LLM output
│   ├── stores/             # questions / models / analyses — plain async fns over Dexie
│   └── types.ts
└── routes/
    ├── +page.svelte                     # home — ask a question
    ├── models/                          # model library (browse + worked examples)
    ├── question/[id]/                   # a question's model picker
    │   └── [slug]/                      # Analyze / history / chart for one model
    └── api/
        ├── analyze/                     # POST { slug, questionText }
        └── recommend-models/            # POST { questionText }
```

### API routes

Both routes spend the project's Gemini quota, so neither takes anything
from the caller beyond a model slug and the question text:

- The prompt template and output JSON Schema come from the server's own
  copy of `seed-models.json` (`$lib/server/catalog`), never from the
  request body — otherwise the analyze route would be an open proxy to
  Gemini for anyone who found the URL.
- `questionText` is capped at 1000 characters; a malformed body, an
  unknown slug, or unusable question text answers `400`.
- Both are rate-limited per client IP by the `RATE_LIMITER` binding
  (20 requests/minute, see `wrangler.jsonc`). The binding only exists on
  the deployed Worker; under `vite dev` there is no limit.

## Testing

```sh
npm run test
```

No real Gemini calls happen in tests — `fetch`/`LlmProvider` are
mocked throughout, and Dexie is backed by `fake-indexeddb`.

## Deployment

Built for Cloudflare Workers/Pages via `adapter-cloudflare`. Set
`GEMINI_API_KEY` as an environment variable/secret in your Cloudflare
project — locally this is `.dev.vars`, in production it's the
Cloudflare dashboard (or `wrangler secret put`).

```sh
npm run build
```
